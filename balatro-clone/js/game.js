/* Core run state, blinds, shop, and scoring loop. */

var uidCounter = 1;
function uid() { return uidCounter++; }

function blankLevels() {
  const levels = {};
  for (const name of Object.keys(HAND_DEFS)) levels[name] = 1;
  return levels;
}

function createState() {
  return {
    phase: "title", // title | blindSelect | playing | scoreAnim | cashOut | shop | won | lost
    ante: 1,
    blindIndex: 0, // 0 small, 1 big, 2 boss
    money: 4,
    handsLeft: 4,
    discardsLeft: 3,
    handSize: 8,
    maxJokers: 5,
    deck: [],
    discardPile: [],
    hand: [],
    selected: new Set(),
    jokers: [],
    levels: blankLevels(),
    handPlays: {},
    score: 0,
    target: 0,
    blind: null,
    boss: null,
    playedThisAnte: new Set(),
    mouthType: null,
    eyePlayed: new Set(),
    shop: [],
    shopReroll: 5,
    message: "",
    lastScore: null,
    grosExtinct: false,
    totalHandsPlayed: 0,
    animating: false
  };
}

var state = createState();

function baseChipsForAnte(ante) {
  if (ANTE_BASE[ante]) return ANTE_BASE[ante];
  // Endless approximation for ante > 8
  const a8 = ANTE_BASE[8];
  const n = ante - 8;
  const factor = Math.pow(1.6 + (0.75 * n) / (1 + 0.2 * n), n);
  return Math.max(a8, Math.round(a8 * factor / Math.pow(10, Math.floor(Math.log10(a8 * factor)) - 1)) * Math.pow(10, Math.floor(Math.log10(a8 * factor)) - 1));
}

function pickBoss(ante) {
  const pool = BOSS_BLINDS.filter((b) => b.minAnte <= ante);
  return pool[Math.floor(Math.random() * pool.length)];
}

function blindTarget(ante, kind, boss) {
  const base = baseChipsForAnte(ante);
  let mult = BLIND_TYPES[kind].mult;
  if (kind === "boss" && boss) {
    if (boss.scoreMult) mult = boss.scoreMult;
  }
  return Math.floor(base * mult);
}

function startRun() {
  state = createState();
  state.phase = "blindSelect";
  state.deck = createDeck();
  state.message = "Choose a Blind to begin Ante 1.";
  prepareBlindChoices();
  render();
}

function prepareBlindChoices() {
  if (state.blindIndex === 2) {
    state.boss = pickBoss(state.ante);
  }
}

function selectBlind(kind) {
  // Choosing Big while Small is still available skips Small (Balatro-style).
  if (kind === "big" && state.blindIndex === 0) state.blindIndex = 1;
  const boss = kind === "boss" ? (state.boss || pickBoss(state.ante)) : null;
  state.boss = boss;
  state.blind = {
    kind,
    name: kind === "boss" ? boss.name : BLIND_TYPES[kind].name,
    desc: kind === "boss" ? boss.desc : "No special effects.",
    reward: BLIND_TYPES[kind].reward,
    color: BLIND_TYPES[kind].color
  };
  state.target = blindTarget(state.ante, kind, boss);
  state.score = 0;
  state.handsLeft = boss && boss.hands ? boss.hands : 4;
  state.discardsLeft = boss && boss.id === "water" ? 0 : 3;
  state.handSize = boss && boss.id === "manacle" ? 7 : 8;
  state.mouthType = null;
  state.eyePlayed = new Set();
  state.selected = new Set();
  state.phase = "playing";
  reshuffleAll();
  drawToHandSize();
  applyBossDebuffs();
  state.message = `Beat ${state.blind.name} — score ${fmt(state.target)} chips.`;
  render();
}

function skipBlind() {
  if (state.blindIndex >= 2) return;
  state.money += 5; // simplified skip tag: $5
  state.message = "Blind skipped — gained $5 Tag.";
  advanceBlind();
}

function reshuffleAll() {
  state.deck = shuffle([...state.deck, ...state.discardPile, ...state.hand]);
  state.discardPile = [];
  state.hand = [];
}

function drawToHandSize() {
  while (state.hand.length < state.handSize && state.deck.length) {
    state.hand.push(state.deck.pop());
  }
  if (state.hand.length < state.handSize && state.discardPile.length) {
    state.deck = shuffle(state.discardPile);
    state.discardPile = [];
    while (state.hand.length < state.handSize && state.deck.length) {
      state.hand.push(state.deck.pop());
    }
  }
}

function applyBossDebuffs() {
  const boss = state.boss;
  if (!boss || state.blind.kind !== "boss") {
    for (const c of state.hand) c.debuffed = false;
    return;
  }
  for (const c of [...state.hand, ...state.deck, ...state.discardPile]) {
    c.debuffed = false;
    if (boss.id === "club" && c.suit === "clubs") c.debuffed = true;
    if (boss.id === "goad" && c.suit === "spades") c.debuffed = true;
    if (boss.id === "window" && c.suit === "diamonds") c.debuffed = true;
    if (boss.id === "head" && c.suit === "hearts") c.debuffed = true;
    if (boss.id === "plant" && isFace(c)) c.debuffed = true;
    if (boss.id === "pillar" && state.playedThisAnte.has(c.id)) c.debuffed = true;
  }
}

function toggleSelect(cardId) {
  if (state.phase !== "playing" || state.animating) return;
  if (state.selected.has(cardId)) state.selected.delete(cardId);
  else {
    if (state.selected.size >= 5) return;
    state.selected.add(cardId);
  }
  render();
}

function selectedCards() {
  return state.hand.filter((c) => state.selected.has(c.id));
}

function previewHand() {
  const cards = selectedCards();
  if (!cards.length) return null;
  return evaluateHand(cards);
}

function discardSelected() {
  if (state.phase !== "playing" || state.animating) return;
  if (state.discardsLeft <= 0) { state.message = "No discards left."; render(); return; }
  const cards = selectedCards();
  if (!cards.length) return;
  state.discardsLeft--;
  state.hand = state.hand.filter((c) => !state.selected.has(c.id));
  state.discardPile.push(...cards);
  state.selected.clear();
  drawToHandSize();
  applyBossDebuffs();
  state.message = `Discarded ${cards.length} card(s).`;
  render();
}

function playHand() {
  if (state.phase !== "playing" || state.animating) return;
  if (state.handsLeft <= 0) return;
  const cards = selectedCards();
  if (!cards.length) { state.message = "Select 1–5 cards to play."; render(); return; }

  const boss = state.boss;
  if (boss && state.blind.kind === "boss") {
    if (boss.id === "psychic" && cards.length !== 5) {
      state.message = "The Psychic: must play 5 cards.";
      render();
      return;
    }
  }

  const evaled = evaluateHand(cards);
  if (boss && state.blind.kind === "boss") {
    if (boss.id === "mouth") {
      if (state.mouthType && state.mouthType !== evaled.name) {
        state.message = `The Mouth: only ${state.mouthType} allowed.`;
        render();
        return;
      }
      state.mouthType = evaled.name;
    }
    if (boss.id === "eye") {
      if (state.eyePlayed.has(evaled.name)) {
        state.message = "The Eye: no repeat hand types.";
        render();
        return;
      }
      state.eyePlayed.add(evaled.name);
    }
    if (boss.id === "arm") {
      state.levels[evaled.name] = Math.max(1, (state.levels[evaled.name] || 1) - 1);
    }
  }

  // Track played cards this ante for The Pillar
  for (const c of cards) state.playedThisAnte.add(c.id);

  const result = scorePlayedHand(cards, evaled);
  state.handsLeft--;
  state.totalHandsPlayed++;
  state.handPlays[evaled.name] = (state.handPlays[evaled.name] || 0) + 1;
  state.score += result.score;
  state.lastScore = result;
  state.animating = true;
  state.phase = "scoreAnim";
  state.message = `${evaled.name}: ${fmt(result.chips)} × ${fmt(result.mult)} = ${fmt(result.score)}`;

  // Remove played cards
  state.hand = state.hand.filter((c) => !state.selected.has(c.id));
  state.discardPile.push(...cards);
  state.selected.clear();

  // The Hook
  if (boss && boss.id === "hook" && state.hand.length) {
    const n = Math.min(2, state.hand.length);
    for (let i = 0; i < n; i++) {
      const idx = Math.floor(Math.random() * state.hand.length);
      state.discardPile.push(state.hand.splice(idx, 1)[0]);
    }
  }

  render();

  setTimeout(() => {
    state.animating = false;
    finishHandResolution();
  }, 900);
}

function scorePlayedHand(playedCards, evaled) {
  const logs = [];
  let { chips, mult, level } = handLevelStats(evaled.name, state.levels);

  if (state.boss && state.blind.kind === "boss" && state.boss.id === "flint") {
    chips = Math.ceil(chips / 2);
    mult = Math.max(1, Math.ceil(mult / 2));
    logs.push("Flint: base halved");
  }

  const scoringCards = evaled.scoringCards;
  const ctx = {
    chips,
    mult,
    handName: evaled.name,
    scoringCards,
    playedCount: playedCards.length,
    discardsLeft: state.discardsLeft,
    jokerCount: state.jokers.length,
    deckLeft: state.deck.length,
    handPlays: state.handPlays,
    log: (m) => logs.push(m),
    _photoUsed: false
  };

  // Score cards left-to-right in play selection order
  const playOrder = playedCards.filter((c) => scoringCards.some((s) => s.id === c.id));
  for (const card of playOrder) {
    if (card.debuffed) {
      logs.push(`${card.rank}${SUIT_SYMBOL[card.suit]} debuffed`);
      continue;
    }
    const cv = CHIP_VALUE[card.rank];
    ctx.chips += cv;
    logs.push(`${card.rank}${SUIT_SYMBOL[card.suit]} +${cv} Chips`);
    for (const j of state.jokers) {
      const def = JOKER_POOL.find((x) => x.id === j.id);
      if (def && def.onCard) def.onCard(card, ctx, j);
    }
  }

  // Independent joker applies (left to right)
  for (const j of state.jokers) {
    const def = JOKER_POOL.find((x) => x.id === j.id);
    if (def && def.apply) def.apply(ctx, j);
  }

  const score = Math.floor(ctx.chips * ctx.mult);
  return {
    handName: evaled.name,
    level,
    chips: ctx.chips,
    mult: ctx.mult,
    score,
    logs
  };
}

function finishHandResolution() {
  if (state.score >= state.target) {
    cashOut();
    return;
  }
  if (state.handsLeft <= 0) {
    state.phase = "lost";
    state.message = `Game Over — needed ${fmt(state.target)}, scored ${fmt(state.score)}.`;
    render();
    return;
  }
  drawToHandSize();
  applyBossDebuffs();
  state.phase = "playing";
  state.message = `Need ${fmt(state.target - state.score)} more chips.`;
  render();
}

function interestEarned() {
  return Math.min(5, Math.floor(state.money / 5));
}

function cashOut() {
  const reward = state.blind.reward;
  const interest = interestEarned();
  const leftoverHands = state.handsLeft;
  const earned = reward + interest + leftoverHands;
  state.money += earned;
  state.message = `Blind cleared! +$${reward} reward, +$${interest} interest, +$${leftoverHands} unused hands.`;

  // End-of-round joker effects
  for (const j of [...state.jokers]) {
    const def = JOKER_POOL.find((x) => x.id === j.id);
    if (def && def.endRound) def.endRound(state, j);
  }

  if (state.ante >= 8 && state.blindIndex === 2) {
    state.phase = "won";
    state.message = `You beat Ante 8! Final cash $${state.money}. ` + state.message;
    render();
    return;
  }

  state.phase = "cashOut";
  render();
}

function goToShop() {
  generateShop();
  state.phase = "shop";
  state.message = "Welcome to the Shop.";
  render();
}

function generateShop() {
  const items = [];
  // 2 jokers
  for (let i = 0; i < 2; i++) {
    const j = randomShopJoker();
    if (j) items.push({ type: "joker", ...j, uid: uid() });
  }
  // 1 planet
  const p = PLANET_CARDS[Math.floor(Math.random() * PLANET_CARDS.length)];
  items.push({ type: "planet", ...p, uid: uid() });
  // sometimes a second planet or joker
  if (Math.random() < 0.5) {
    const j = randomShopJoker();
    if (j) items.push({ type: "joker", ...j, uid: uid() });
  } else {
    const p2 = PLANET_CARDS[Math.floor(Math.random() * PLANET_CARDS.length)];
    items.push({ type: "planet", ...p2, uid: uid() });
  }
  state.shop = items;
}

function randomShopJoker() {
  const unlocked = JOKER_POOL.filter((j) => !j.unlock || j.unlock(state));
  // Weight: common more often
  const bag = [];
  for (const j of unlocked) {
    const w = j.rarity === "rare" ? 1 : j.rarity === "uncommon" ? 3 : 8;
    for (let i = 0; i < w; i++) bag.push(j);
  }
  if (!bag.length) return null;
  const pick = bag[Math.floor(Math.random() * bag.length)];
  // Don't duplicate owned too often — still allow
  return { id: pick.id, name: pick.name, rarity: pick.rarity, cost: pick.cost, desc: pick.desc };
}

function buyShopItem(uidVal) {
  const item = state.shop.find((x) => x.uid === uidVal);
  if (!item) return;
  if (state.money < item.cost) { state.message = "Not enough money."; render(); return; }
  if (item.type === "joker") {
    if (state.jokers.length >= state.maxJokers) { state.message = "Joker slots full (max 5)."; render(); return; }
    state.money -= item.cost;
    state.jokers.push({
      uid: uid(),
      id: item.id,
      name: item.name,
      rarity: item.rarity,
      cost: item.cost,
      desc: item.desc,
      handsPlayed: 0,
      rounds: 0,
      chips: 0,
      streak: 0
    });
    state.shop = state.shop.filter((x) => x.uid !== uidVal);
    state.message = `Bought ${item.name}.`;
  } else if (item.type === "planet") {
    state.money -= item.cost;
    state.levels[item.hand] = (state.levels[item.hand] || 1) + 1;
    // Royal Flush shares Straight Flush level visually — bump both if Neptune
    if (item.hand === "Straight Flush") {
      state.levels["Royal Flush"] = state.levels["Straight Flush"];
    }
    state.shop = state.shop.filter((x) => x.uid !== uidVal);
    state.message = `${item.name}: ${item.hand} is now Level ${state.levels[item.hand]}.`;
  }
  render();
}

function sellJoker(jUid) {
  const idx = state.jokers.findIndex((j) => j.uid === jUid);
  if (idx < 0) return;
  const j = state.jokers[idx];
  const value = Math.floor(j.cost / 2);
  state.money += value;
  state.jokers.splice(idx, 1);
  state.message = `Sold ${j.name} for $${value}.`;
  render();
}

function moveJoker(jUid, dir) {
  const idx = state.jokers.findIndex((j) => j.uid === jUid);
  if (idx < 0) return;
  const swap = idx + dir;
  if (swap < 0 || swap >= state.jokers.length) return;
  [state.jokers[idx], state.jokers[swap]] = [state.jokers[swap], state.jokers[idx]];
  render();
}

function rerollShop() {
  if (state.money < state.shopReroll) { state.message = "Not enough money to reroll."; render(); return; }
  state.money -= state.shopReroll;
  generateShop();
  state.message = "Shop rerolled.";
  render();
}

function leaveShop() {
  advanceBlind();
}

function advanceBlind() {
  state.blindIndex++;
  if (state.blindIndex > 2) {
    state.blindIndex = 0;
    state.ante++;
    state.playedThisAnte = new Set();
    if (state.ante > 8) {
      state.phase = "won";
      state.message = "You cleared Ante 8 — run complete!";
      render();
      return;
    }
  }
  prepareBlindChoices();
  state.phase = "blindSelect";
  state.message = `Ante ${state.ante} — choose your Blind.`;
  render();
}

function fmt(n) {
  if (n == null || Number.isNaN(n)) return "0";
  if (Math.abs(n) >= 1e9) return n.toExponential(2);
  return Math.floor(n).toLocaleString("en-US");
}
