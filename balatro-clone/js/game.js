/* Core run state, blinds, shop, scoring, consumables */

var uidCounter = 1;
function uid() { return uidCounter++; }

function blankLevels() {
  const levels = {};
  for (const name of Object.keys(HAND_DEFS)) levels[name] = 1;
  return levels;
}

function createState() {
  return {
    phase: "title",
    ante: 1,
    blindIndex: 0,
    money: 4,
    handsLeft: 4,
    discardsLeft: 3,
    handSize: 8,
    handSizeBonus: 0,
    maxJokers: 5,
    maxConsumables: 2,
    deck: [],
    discardPile: [],
    hand: [],
    selected: new Set(),
    jokers: [],
    consumables: [],
    levels: blankLevels(),
    handPlays: {},
    roundHandPlays: {},
    score: 0,
    target: 0,
    blind: null,
    boss: null,
    playedThisAnte: new Set(),
    mouthType: null,
    eyePlayed: new Set(),
    shop: [],
    shopReroll: 5,
    freeRerolls: 0,
    message: "",
    lastScore: null,
    grosExtinct: false,
    totalHandsPlayed: 0,
    handsThisRound: 0,
    discardsThisRound: 0,
    firstDiscardDone: false,
    burntUsed: false,
    animating: false,
    flags: {},
    secretHands: {},
    lastConsumable: null,
    tarotsUsed: 0,
    planetsUsed: 0,
    uniquePlanets: new Set(),
    blindsSkipped: 0,
    startingDeckSize: 52,
    tags: [],
    usingConsumable: null
  };
}

var state = createState();

function refreshPassiveFlags() {
  const flags = {
    fourFingers: false,
    splash: false,
    shortcut: false,
    pareidolia: false,
    smeared: false,
    doubleProbabilities: false,
    showman: false,
    astronomer: false,
    creditDebt: false,
    bossDisabled: false,
    freeReroll: false
  };
  for (const j of state.jokers) {
    const def = getJokerDef(j.id);
    if (!def || !def.passive) continue;
    Object.assign(flags, def.passive);
  }
  if (state.jokers.some((j) => j.id === "chicot")) flags.bossDisabled = true;
  state.flags = flags;
}

function effectiveHandSize() {
  let size = 8 + (state.handSizeBonus || 0);
  for (const j of state.jokers) {
    if (j.id === "juggler") size += 1;
    if (j.id === "troubadour") size += 2;
    if (j.id === "turtle-bean") size += Math.max(0, 5 - (j.rounds || 0));
    if (j.id === "merry-andy") size -= 1;
    if (j.id === "stuntman") size -= 2;
  }
  if (state.boss && state.blind && state.blind.kind === "boss" && state.boss.id === "manacle" && !state.flags.bossDisabled) size -= 1;
  return Math.max(1, size);
}

function baseHandsDiscards() {
  let hands = 4;
  let discards = 3;
  for (const j of state.jokers) {
    if (j.id === "drunkard") discards += 1;
    if (j.id === "merry-andy") discards += 3;
    if (j.id === "troubadour") hands -= 1;
  }
  return { hands, discards };
}

function baseChipsForAnte(ante) {
  if (ANTE_BASE[ante]) return ANTE_BASE[ante];
  const a8 = ANTE_BASE[8];
  const n = ante - 8;
  const factor = Math.pow(1.6 + (0.75 * n) / (1 + 0.2 * n), n);
  const raw = a8 * factor;
  const exp = Math.floor(Math.log10(raw)) - 1;
  return Math.max(a8, Math.round(raw / Math.pow(10, exp)) * Math.pow(10, exp));
}

function pickBoss(ante) {
  const pool = BOSS_BLINDS.filter((b) => b.minAnte <= ante);
  return pool[Math.floor(Math.random() * pool.length)];
}

function blindTarget(ante, kind, boss) {
  const base = baseChipsForAnte(ante);
  let mult = BLIND_TYPES[kind].mult;
  if (kind === "boss" && boss && boss.scoreMult) mult = boss.scoreMult;
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
  if (state.blindIndex === 2) state.boss = pickBoss(state.ante);
}

function selectBlind(kind) {
  if (kind === "big" && state.blindIndex === 0) state.blindIndex = 1;
  refreshPassiveFlags();
  const boss = kind === "boss" ? (state.boss || pickBoss(state.ante)) : null;
  state.boss = boss;
  const disabled = state.flags.bossDisabled && kind === "boss";
  state.blind = {
    kind,
    name: kind === "boss" ? boss.name : BLIND_TYPES[kind].name,
    desc: kind === "boss" ? (disabled ? "Disabled by Chicot." : boss.desc) : "No special effects.",
    reward: BLIND_TYPES[kind].reward,
    color: BLIND_TYPES[kind].color
  };
  state.target = blindTarget(state.ante, kind, boss);
  state.score = 0;
  const bd = baseHandsDiscards();
  state.handsLeft = boss && boss.hands && !disabled ? boss.hands : bd.hands;
  state.discardsLeft = boss && boss.id === "water" && !disabled ? 0 : bd.discards;
  state.handSize = effectiveHandSize();
  state.mouthType = null;
  state.eyePlayed = new Set();
  state.roundHandPlays = {};
  state.handsThisRound = 0;
  state.discardsThisRound = 0;
  state.firstDiscardDone = false;
  state.burntUsed = false;
  state.selected = new Set();
  state.usingConsumable = null;
  state.phase = "playing";

  // onBlindSelect jokers
  for (const j of [...state.jokers]) {
    const def = getJokerDef(j.id);
    if (def && def.onBlindSelect) def.onBlindSelect(state, j);
  }
  // Burglar etc may have changed hands
  if (state.jokers.some((j) => j.id === "burglar")) {
    state.handsLeft += 3;
    state.discardsLeft = 0;
  }

  reshuffleAll();
  drawToHandSize();
  applyBossDebuffs();

  for (const j of state.jokers) {
    const def = getJokerDef(j.id);
    if (def && def.onRoundStart) def.onRoundStart(state, j);
    if (j.id === "certificate") {
      const c = makePlayingCard(RANKS[Math.floor(Math.random() * 13)], SUITS[Math.floor(Math.random() * 4)]);
      c.seal = randomSeal();
      state.hand.push(c);
      state.deck.push({ ...c });
    }
  }

  state.message = `Beat ${state.blind.name} — score ${fmt(state.target)} chips.`;
  render();
}

function skipBlind() {
  if (state.blindIndex >= 2) return;
  state.money += 5;
  state.blindsSkipped = (state.blindsSkipped || 0) + 1;
  for (const j of state.jokers) {
    if (j.id === "throwback") j.xmult = 1 + 0.25 * state.blindsSkipped;
  }
  state.message = "Blind skipped — gained $5 Tag.";
  advanceBlind();
}

function reshuffleAll() {
  state.deck = shuffle([...state.deck, ...state.discardPile, ...state.hand]);
  state.discardPile = [];
  state.hand = [];
}

function drawToHandSize() {
  const size = effectiveHandSize();
  state.handSize = size;
  while (state.hand.length < size && state.deck.length) state.hand.push(state.deck.pop());
  if (state.hand.length < size && state.discardPile.length) {
    state.deck = shuffle(state.discardPile);
    state.discardPile = [];
    while (state.hand.length < size && state.deck.length) state.hand.push(state.deck.pop());
  }
}

function applyBossDebuffs() {
  refreshPassiveFlags();
  const boss = state.boss;
  const off = !boss || state.blind.kind !== "boss" || state.flags.bossDisabled;
  for (const c of [...state.hand, ...state.deck, ...state.discardPile]) {
    c.debuffed = false;
    if (off) continue;
    if (boss.id === "club" && effectiveSuits(c, state).includes("clubs")) c.debuffed = true;
    if (boss.id === "goad" && effectiveSuits(c, state).includes("spades")) c.debuffed = true;
    if (boss.id === "window" && effectiveSuits(c, state).includes("diamonds")) c.debuffed = true;
    if (boss.id === "head" && effectiveSuits(c, state).includes("hearts")) c.debuffed = true;
    if (boss.id === "plant" && (isFace(c) || state.flags.pareidolia)) c.debuffed = true;
    if (boss.id === "pillar" && state.playedThisAnte.has(c.id)) c.debuffed = true;
  }
}

function toggleSelect(cardId) {
  if (state.animating) return;
  if (state.phase !== "playing" && state.phase !== "shop") return;
  if (state.selected.has(cardId)) state.selected.delete(cardId);
  else {
    const max = state.usingConsumable ? (getConsumableDef(state.usingConsumable)?.select || 5) : 5;
    if (state.selected.size >= max) return;
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
  refreshPassiveFlags();
  return evaluateHand(cards, state);
}

function discardSelected() {
  if (state.phase !== "playing" || state.animating) return;
  if (state.discardsLeft <= 0) { state.message = "No discards left."; render(); return; }
  const cards = selectedCards();
  if (!cards.length) return;

  // Burnt Joker — first discard
  if (!state.burntUsed && state.jokers.some((j) => j.id === "burnt-joker")) {
    const ev = evaluateHand(cards, state);
    state.levels[ev.name] = (state.levels[ev.name] || 1) + 1;
    state.burntUsed = true;
    state.message = `Burnt Joker: ${ev.name} leveled!`;
  }

  // Trading Card
  if (!state.firstDiscardDone && cards.length === 1 && state.jokers.some((j) => j.id === "trading-card")) {
    destroyPlayingCard(state, cards[0]);
    state.money += 3;
    state.message = "Trading Card: destroyed for $3.";
  }

  // Faceless / Mail / Hit the Road / Ramen / Yorick / Purple seals
  const faces = cards.filter((c) => isFace(c) || state.flags.pareidolia).length;
  if (faces >= 3 && state.jokers.some((j) => j.id === "faceless-joker")) state.money += 5;

  for (const j of state.jokers) {
    const def = getJokerDef(j.id);
    if (def && def.onDiscard) def.onDiscard(state, j, cards);
    if (j.id === "mail-in-rebate") {
      j.rank = j.rank || RANKS[Math.floor(Math.random() * 13)];
      const n = cards.filter((c) => c.rank === j.rank).length;
      state.money += 5 * n;
    }
    if (j.id === "hit-the-road") {
      const jacks = cards.filter((c) => c.rank === "J").length;
      j.xmult = (j.xmult || 1) + 0.5 * jacks;
    }
    if (j.id === "ramen") {
      j.xmult = Math.max(1, (j.xmult || 2) - 0.01 * cards.length);
    }
    if (j.id === "yorick") {
      j.counter = (j.counter || 0) + cards.length;
      while (j.counter >= 23) { j.counter -= 23; j.xmult = (j.xmult || 1) + 1; }
    }
    if (j.id === "green-joker") j.mult = Math.max(0, (j.mult || 0) - 1);
    if (j.id === "castle") {
      j.suit = j.suit || SUITS[Math.floor(Math.random() * 4)];
      const n = cards.filter((c) => effectiveSuits(c, state).includes(j.suit)).length;
      j.chips = (j.chips || 0) + 3 * n;
    }
  }

  for (const c of cards) {
    if (c.seal === "purple" && roomForConsumable(state)) {
      pushConsumable(state, makeConsumable("tarot", randomTarot()));
    }
  }

  state.discardsLeft--;
  state.discardsThisRound++;
  state.firstDiscardDone = true;
  state.hand = state.hand.filter((c) => !state.selected.has(c.id));
  state.discardPile.push(...cards);
  state.selected.clear();
  drawToHandSize();
  applyBossDebuffs();
  if (!state.message.startsWith("Burnt") && !state.message.startsWith("Trading")) {
    state.message = `Discarded ${cards.length} card(s).`;
  }
  render();
}

function resolveJokerHooks(hookName, ...args) {
  for (const j of [...state.jokers]) {
    const def = getJokerDef(j.id);
    if (!def) continue;
    let fn = def[hookName];
    // Blueprint / Brainstorm copy
    if (def.copy === "right") {
      const idx = state.jokers.indexOf(j);
      const right = state.jokers[idx + 1];
      if (right) {
        const rd = getJokerDef(right.id);
        if (rd && rd[hookName] && !rd.copy) fn = rd[hookName].bind(rd);
        else fn = null;
      }
    } else if (def.copy === "leftmost") {
      const left = state.jokers[0];
      if (left && left !== j) {
        const ld = getJokerDef(left.id);
        if (ld && ld[hookName] && !ld.copy) fn = ld[hookName].bind(ld);
        else fn = null;
      }
    }
    if (typeof fn === "function") fn(...args);
  }
}

function playHand() {
  if (state.phase !== "playing" || state.animating) return;
  if (state.handsLeft <= 0) return;
  const cards = selectedCards();
  if (!cards.length) { state.message = "Select 1–5 cards to play."; render(); return; }

  refreshPassiveFlags();
  const boss = state.boss;
  const bossOn = boss && state.blind.kind === "boss" && !state.flags.bossDisabled;

  if (bossOn && boss.id === "psychic" && cards.length !== 5) {
    state.message = "The Psychic: must play 5 cards.";
    render();
    return;
  }

  const evaled = evaluateHand(cards, state);
  if (evaled.name === "Five of a Kind" || evaled.name === "Flush House" || evaled.name === "Flush Five") {
    state.secretHands[evaled.name] = true;
  }

  if (bossOn) {
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

  for (const c of cards) state.playedThisAnte.add(c.id);

  // onPlay hooks (DNA, Sixth Sense, Space Joker, etc.)
  for (const j of state.jokers) {
    const def = getJokerDef(j.id);
    if (def && def.onPlay) def.onPlay(state, j, evaled, cards);
    if (j.id === "dna" && state.handsThisRound === 0 && cards.length === 1) {
      const copy = { ...cards[0], id: uid() };
      state.deck.push(copy);
      state.hand.push({ ...copy, id: uid() });
      if (typeof addPlayingCard === "function") { /* hologram */ }
      for (const jj of state.jokers) if (jj.id === "hologram") jj.xmult = (jj.xmult || 1) + 0.25;
    }
    if (j.id === "sixth-sense" && state.handsThisRound === 0 && cards.length === 1 && cards[0].rank === "6") {
      destroyPlayingCard(state, cards[0]);
      if (roomForConsumable(state)) pushConsumable(state, makeConsumable("spectral", randomSpectral(false)));
    }
    if (j.id === "space-joker" && chance(1, 4, state)) {
      state.levels[evaled.name] = (state.levels[evaled.name] || 1) + 1;
    }
    if (j.id === "midas-mask") {
      for (const c of cards) if (isFace(c) || state.flags.pareidolia) c.enhancement = "gold";
    }
  }

  const result = scorePlayedHand(cards, evaled);
  state.handsLeft--;
  state.handsThisRound++;
  state.totalHandsPlayed++;
  state.handPlays[evaled.name] = (state.handPlays[evaled.name] || 0) + 1;
  state.roundHandPlays[evaled.name] = (state.roundHandPlays[evaled.name] || 0) + 1;
  state.score += result.score;
  state.lastScore = result;
  state.animating = true;
  state.phase = "scoreAnim";
  state.message = `${evaled.name}: ${fmt(result.chips)} × ${fmt(result.mult)} = ${fmt(result.score)}`;

  // destroy glass etc.
  if (result.destroyIds) {
    for (const id of result.destroyIds) {
      const card = cards.find((c) => c.id === id) || state.hand.find((c) => c.id === id);
      if (card) destroyPlayingCard(state, card);
    }
  }

  state.hand = state.hand.filter((c) => !state.selected.has(c.id));
  // don't re-add destroyed
  const destroyed = new Set(result.destroyIds || []);
  state.discardPile.push(...cards.filter((c) => !destroyed.has(c.id)));
  state.selected.clear();

  if (bossOn && boss.id === "hook" && state.hand.length) {
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

function scoreOneCard(card, ctx, jokersResolved) {
  if (card.debuffed) {
    ctx.log(`${card.rank}${SUIT_SYMBOL[card.suit] || ""} debuffed`);
    return;
  }

  if (card.enhancement === "stone") {
    // stone chips applied in enhancement
  } else {
    const cv = CHIP_VALUE[card.rank] + (card.bonusChips || 0);
    ctx.chips += cv;
    ctx.log(`${card.rank}${SUIT_SYMBOL[card.suit]} +${cv}`);
  }

  applyEnhancementEffects(card, ctx, state);
  applyEditionOnScore(card, ctx);

  if (card.seal === "gold") {
    state.money += 3;
    ctx.log("Gold Seal +$3");
  }

  // Hiker permanent chips
  for (const j of state.jokers) {
    if (j.id === "hiker") card.bonusChips = (card.bonusChips || 0) + 5;
  }

  for (const j of jokersResolved) {
    const def = j._def;
    if (def && def.onCard) def.onCard(card, ctx, j, state);
  }
}

function buildResolvedJokers() {
  refreshPassiveFlags();
  const resolved = [];
  for (let i = 0; i < state.jokers.length; i++) {
    const j = state.jokers[i];
    let def = getJokerDef(j.id);
    if (def && def.copy === "right") {
      const right = state.jokers[i + 1];
      def = right ? getJokerDef(right.id) : null;
      if (def && def.copy) def = null;
    } else if (def && def.copy === "leftmost") {
      const left = state.jokers[0];
      def = left && left !== j ? getJokerDef(left.id) : null;
      if (def && def.copy) def = null;
    }
    resolved.push(Object.assign({}, j, { _def: def }));
  }
  return resolved;
}

function scorePlayedHand(playedCardsList, evaled) {
  const logs = [];
  let { chips, mult, level } = handLevelStats(evaled.name, state.levels);

  if (state.boss && state.blind.kind === "boss" && state.boss.id === "flint" && !state.flags.bossDisabled) {
    chips = Math.ceil(chips / 2);
    mult = Math.max(1, Math.ceil(mult / 2));
    logs.push("Flint: base halved");
  }

  const scoring = evaled.scoringCards;
  const held = state.hand.filter((c) => !playedCardsList.some((p) => p.id === c.id));
  const ctx = {
    chips,
    mult,
    handName: evaled.name,
    scoringCards: scoring,
    playedCards: playedCardsList,
    playedCount: playedCardsList.length,
    discardsLeft: state.discardsLeft,
    handsLeft: state.handsLeft,
    jokerCount: state.jokers.length,
    deckLeft: state.deck.length,
    handPlays: state.handPlays,
    roundHandPlays: state.roundHandPlays,
    heldCards: held,
    money: state.money,
    state,
    log: (m) => logs.push(m),
    _photoUsed: false,
    _destroyCards: []
  };

  const jokersResolved = buildResolvedJokers();

  // Score cards in play order with retriggers
  const playOrder = playedCardsList.filter((c) => scoring.some((s) => s.id === c.id));
  // also include stones that splash might have added — already in scoring

  for (let idx = 0; idx < playOrder.length; idx++) {
    const card = playOrder[idx];
    let times = 1;
    if (card.seal === "red") times += 1;
    for (const j of jokersResolved) {
      const def = j._def;
      if (!def) continue;
      if (def.retrigger) times += def.retrigger(card, ctx, j, state) || 0;
      if (j.id === "hanging-chad" && idx === 0) times += 2;
      if (j.id === "hack" && ["2", "3", "4", "5"].includes(card.rank)) times += 1;
      if (j.id === "sock-and-buskin" && (isFace(card) || state.flags.pareidolia)) times += 1;
      if (j.id === "dusk" && state.handsLeft === 1) times += 1;
      if (j.id === "seltzer" && (j.counter == null || j.counter > 0)) times += 1;
    }
    for (let t = 0; t < times; t++) scoreOneCard(card, ctx, jokersResolved);
  }

  // Held-in-hand abilities (steel, baron, mime, etc.)
  const mime = state.jokers.some((j) => j.id === "mime");
  for (const card of held) {
    let times = mime ? 2 : 1;
    for (let t = 0; t < times; t++) {
      applySteelHeld(card, ctx);
      for (const j of jokersResolved) {
        const def = j._def;
        if (def && def.onHeld) def.onHeld(card, ctx, j, state);
      }
      // Shoot the Moon / Raised Fist / Reserved Parking simplified in onHeld of defs
      if (card.rank === "Q" && state.jokers.some((x) => x.id === "shoot-the-moon")) {
        ctx.mult += 13; ctx.log("Queen +13 Mult");
      }
      if ((isFace(card) || state.flags.pareidolia) && state.jokers.some((x) => x.id === "reserved-parking")) {
        if (chance(1, 2, state)) { state.money += 1; ctx.log("Parking +$1"); }
      }
      if (card.rank === "K" && state.jokers.some((x) => x.id === "baron")) {
        ctx.mult *= 1.5; ctx.log("Baron ×1.5");
      }
    }
  }

  // Raised Fist — double lowest held rank
  if (state.jokers.some((j) => j.id === "raised-fist") && held.length) {
    const lowest = held.filter((c) => c.enhancement !== "stone")
      .sort((a, b) => RANK_VALUE[a.rank] - RANK_VALUE[b.rank])[0];
    if (lowest) {
      const add = 2 * (CHIP_VALUE[lowest.rank] || 0);
      ctx.mult += add;
      ctx.log(`Raised Fist +${add} Mult`);
    }
  }

  // Independent applies + editions on jokers
  for (const j of jokersResolved) {
    applyJokerEdition(j, ctx);
    const def = j._def;
    if (def && def.apply) def.apply(ctx, j, state);
  }

  // Baseball Card — uncommon jokers each ×1.5
  if (state.jokers.some((j) => j.id === "baseball-card")) {
    const n = state.jokers.filter((j) => j.rarity === "uncommon").length;
    for (let i = 0; i < n; i++) { ctx.mult *= 1.5; logs.push("Baseball ×1.5"); }
  }

  // Seltzer countdown
  for (const j of state.jokers) {
    if (j.id === "seltzer") j.counter = (j.counter == null ? 10 : j.counter) - 1;
    if (j.id === "green-joker") j.mult = (j.mult || 0) + 1;
  }

  const score = Math.floor(ctx.chips * ctx.mult);
  return {
    handName: evaled.name,
    level,
    chips: ctx.chips,
    mult: ctx.mult,
    score,
    logs,
    destroyIds: (ctx._destroyCards || []).map((c) => c.id)
  };
}

function finishHandResolution() {
  if (state.score >= state.target) {
    cashOut();
    return;
  }
  if (state.handsLeft <= 0) {
    // Mr. Bones
    const bones = state.jokers.find((j) => j.id === "mr-bones");
    if (bones && state.score >= state.target * 0.25) {
      state.jokers = state.jokers.filter((j) => j.uid !== bones.uid);
      state.message = "Mr. Bones saved you!";
      cashOut();
      return;
    }
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
  let interest = Math.min(5, Math.floor(state.money / 5));
  if (state.jokers.some((j) => j.id === "to-the-moon")) {
    interest += Math.floor(state.money / 5);
  }
  return interest;
}

function cashOut() {
  const reward = state.blind.reward;
  const interest = interestEarned();
  const leftoverHands = state.handsLeft;
  let earned = reward + interest + leftoverHands;

  // Gold cards held
  for (const c of state.hand) {
    if (c.enhancement === "gold") earned += 3;
    if (c.seal === "blue" && state.lastScore) {
      const planet = PLANET_CARDS.find((p) => p.hand === state.lastScore.handName);
      if (planet && roomForConsumable(state)) pushConsumable(state, makeConsumable("planet", planet));
    }
  }

  for (const j of state.jokers) {
    if (j.id === "golden-joker") earned += 4;
    if (j.id === "cloud-9") {
      const n = [...state.deck, ...state.hand, ...state.discardPile].filter((c) => c.rank === "9").length;
      earned += n;
    }
    if (j.id === "rocket") {
      j.payout = j.payout || 1;
      earned += j.payout;
      if (state.blind.kind === "boss") j.payout += 2;
    }
    if (j.id === "satellite") earned += (state.uniquePlanets && state.uniquePlanets.size) || 0;
    if (j.id === "delayed-gratification" && state.discardsThisRound === 0) earned += 2 * state.discardsLeft;
    if (j.id === "egg") j.extraSell = (j.extraSell || 0) + 3;
    if (j.id === "gift-card") {
      for (const jj of state.jokers) jj.extraSell = (jj.extraSell || 0) + 1;
      for (const c of state.consumables) c.extraSell = (c.extraSell || 0) + 1;
    }
    if (j.id === "invisible-joker") j.rounds = (j.rounds || 0) + 1;
    if (j.id === "turtle-bean") {
      j.rounds = (j.rounds || 0) + 1;
      if (j.rounds >= 5) state.jokers = state.jokers.filter((x) => x.uid !== j.uid);
    }
    if (j.id === "campfire" && state.blind.kind === "boss") j.xmult = 1;
  }

  state.money += earned;
  state.message = `Blind cleared! +$${reward} reward, +$${interest} interest, +$${leftoverHands} unused hands.`;

  for (const j of [...state.jokers]) {
    const def = getJokerDef(j.id);
    if (def && def.endRound) def.endRound(state, j);
  }

  if (state.ante >= 8 && state.blindIndex === 2) {
    state.phase = "won";
    state.message = `You beat Ante 8! Final cash $${state.money}.`;
    render();
    return;
  }

  state.phase = "cashOut";
  render();
}

function goToShop() {
  state.freeRerolls = state.jokers.some((j) => j.id === "chaos-the-clown") ? 1 : 0;
  generateShop();
  state.phase = "shop";
  state.message = "Welcome to the Shop.";
  state.selected.clear();
  // show hand from? shop doesn't have hand — keep deck intact
  render();
}

function generateShop() {
  const items = [];
  for (let i = 0; i < 2; i++) {
    const j = randomShopJoker();
    if (j) items.push({ type: "joker", ...j, uid: uid(), cost: shopCost(j) });
  }
  // consumables
  const roll = Math.random();
  if (roll < 0.45) {
    const p = randomPlanet(state);
    items.push({ ...makeConsumable("planet", p), cost: planetCost(p) });
  } else if (roll < 0.8) {
    const t = randomTarot();
    items.push({ ...makeConsumable("tarot", t), cost: t.cost });
  } else {
    const s = randomSpectral(Math.random() < 0.05);
    items.push({ ...makeConsumable("spectral", s), cost: s.cost });
  }
  // pack
  items.push({
    type: "pack",
    id: "arcana-pack",
    name: "Arcana Pack",
    desc: "Choose 1 of 3 Tarot cards",
    cost: 4,
    uid: uid(),
    packType: "tarot"
  });
  if (Math.random() < 0.5) {
    items.push({
      type: "pack",
      id: "celestial-pack",
      name: "Celestial Pack",
      desc: "Choose 1 of 3 Planet cards",
      cost: state.flags.astronomer ? 0 : 4,
      uid: uid(),
      packType: "planet"
    });
  }
  if (Math.random() < 0.35) {
    items.push({
      type: "pack",
      id: "spectral-pack",
      name: "Spectral Pack",
      desc: "Choose 1 of 2 Spectral cards",
      cost: 6,
      uid: uid(),
      packType: "spectral"
    });
  }
  if (Math.random() < 0.3) {
    items.push({
      type: "pack",
      id: "buffoon-pack",
      name: "Buffoon Pack",
      desc: "Choose 1 of 2 Jokers",
      cost: 6,
      uid: uid(),
      packType: "joker"
    });
  }
  state.shop = items;
}

function shopCost(j) {
  let c = j.cost || 4;
  if (j.edition === "foil") c += 2;
  if (j.edition === "holographic") c += 3;
  if (j.edition === "polychrome") c += 5;
  if (j.edition === "negative") c += 5;
  return c;
}

function planetCost(p) {
  return state.flags.astronomer ? 0 : (p.cost || 3);
}

function randomShopJoker() {
  refreshPassiveFlags();
  const owned = new Set(state.jokers.map((j) => j.id));
  let pool = JOKER_DEFS.filter((j) => j.rarity !== "legendary");
  if (!state.flags.showman) pool = pool.filter((j) => !owned.has(j.id));
  // cavendish only after gros extinct
  if (!state.grosExtinct) pool = pool.filter((j) => j.id !== "cavendish");
  const bag = [];
  for (const j of pool) {
    const w = j.rarity === "rare" ? 1 : j.rarity === "uncommon" ? 3 : 8;
    for (let i = 0; i < w; i++) bag.push(j);
  }
  if (!bag.length) return null;
  const pick = bag[Math.floor(Math.random() * bag.length)];
  const edition = Math.random() < 0.08 ? PLAYING_EDITIONS[Math.floor(Math.random() * 3)] : null;
  return { id: pick.id, name: pick.name, rarity: pick.rarity, cost: pick.cost, desc: pick.desc, edition };
}

function buyShopItem(uidVal) {
  const item = state.shop.find((x) => x.uid === uidVal);
  if (!item) return;
  const cost = item.cost || 0;
  const debtLimit = state.flags.creditDebt || state.jokers.some((j) => j.id === "credit-card") ? -20 : 0;
  if (state.money - cost < debtLimit) { state.message = "Not enough money."; render(); return; }

  if (item.type === "joker") {
    if (state.jokers.length >= effectiveMaxJokers(state) && item.edition !== "negative") {
      state.message = "Joker slots full.";
      render();
      return;
    }
    state.money -= cost;
    if (item.edition === "negative") state.maxJokers += 1;
    state.jokers.push({
      uid: uid(),
      id: item.id,
      name: item.name,
      rarity: item.rarity,
      cost: item.cost,
      desc: item.desc,
      edition: item.edition || null
    });
    state.shop = state.shop.filter((x) => x.uid !== uidVal);
    state.message = `Bought ${item.name}.`;
  } else if (item.type === "planet" || item.type === "tarot" || item.type === "spectral") {
    if (!roomForConsumable(state)) { state.message = "Consumable slots full."; render(); return; }
    state.money -= cost;
    state.consumables.push({ ...item, uid: uid() });
    state.shop = state.shop.filter((x) => x.uid !== uidVal);
    state.message = `Bought ${item.name}.`;
  } else if (item.type === "pack") {
    state.money -= cost;
    openPack(item);
    state.shop = state.shop.filter((x) => x.uid !== uidVal);
    for (const j of state.jokers) {
      if (j.id === "hallucination" && chance(1, 2, state) && roomForConsumable(state)) {
        pushConsumable(state, makeConsumable("tarot", randomTarot()));
      }
    }
    return;
  }
  refreshPassiveFlags();
  render();
}

function openPack(pack) {
  const choices = [];
  if (pack.packType === "tarot") {
    for (let i = 0; i < 3; i++) choices.push(makeConsumable("tarot", randomTarot()));
  } else if (pack.packType === "planet") {
    for (let i = 0; i < 3; i++) choices.push(makeConsumable("planet", randomPlanet(state)));
  } else if (pack.packType === "spectral") {
    for (let i = 0; i < 2; i++) choices.push(makeConsumable("spectral", randomSpectral(Math.random() < 0.08)));
  } else if (pack.packType === "joker") {
    for (let i = 0; i < 2; i++) {
      const j = randomShopJoker();
      if (j) choices.push({ type: "joker", ...j, uid: uid() });
    }
  }
  state.packChoices = choices;
  state.phase = "pack";
  state.message = `${pack.name}: pick one.`;
  render();
}

function pickPackChoice(uidVal) {
  const item = (state.packChoices || []).find((c) => c.uid === uidVal);
  if (!item) return;
  if (item.type === "joker") {
    if (state.jokers.length >= effectiveMaxJokers(state)) { state.message = "No Joker room."; render(); return; }
    state.jokers.push({ uid: uid(), id: item.id, name: item.name, rarity: item.rarity, cost: item.cost, desc: item.desc, edition: item.edition });
  } else {
    if (!roomForConsumable(state)) { state.message = "No consumable room."; render(); return; }
    state.consumables.push({ ...item, uid: uid() });
  }
  state.packChoices = null;
  state.phase = "shop";
  state.message = `Took ${item.name}.`;
  render();
}

function skipPack() {
  for (const j of state.jokers) {
    if (j.id === "red-card") j.mult = (j.mult || 0) + 3;
  }
  state.packChoices = null;
  state.phase = "shop";
  state.message = "Skipped pack.";
  render();
}

function sellJoker(jUid) {
  const idx = state.jokers.findIndex((j) => j.uid === jUid);
  if (idx < 0) return;
  const j = state.jokers[idx];
  const def = getJokerDef(j.id);
  if (def && def.sell) def.sell(state, j);
  if (j.id === "luchador" && state.phase === "playing") {
    state.flags.bossDisabled = true;
    state.message = "Luchador disabled the Boss Blind!";
  }
  if (j.id === "diet-cola") {
    state.tags.push("double");
    state.money += 10; // simplified Double Tag value
  }
  if (j.id === "invisible-joker" && (j.rounds || 0) >= 2 && state.jokers.length > 1) {
    const others = state.jokers.filter((x) => x.uid !== j.uid);
    const pick = others[Math.floor(Math.random() * others.length)];
    state.jokers.push({ ...pick, uid: uid(), edition: pick.edition === "negative" ? null : pick.edition });
  }
  const value = Math.floor(j.cost / 2) + (j.extraSell || 0);
  state.money += value;
  state.jokers.splice(idx, 1);
  for (const jj of state.jokers) {
    if (jj.id === "campfire") jj.xmult = (jj.xmult || 1) + 0.25;
  }
  if (!state.message.includes("Luchador")) state.message = `Sold ${j.name} for $${value}.`;
  refreshPassiveFlags();
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
  if (state.freeRerolls > 0) state.freeRerolls--;
  else {
    if (state.money < state.shopReroll) { state.message = "Not enough money to reroll."; render(); return; }
    state.money -= state.shopReroll;
  }
  for (const j of state.jokers) {
    if (j.id === "flash-card") j.mult = (j.mult || 0) + 2;
  }
  generateShop();
  state.message = "Shop rerolled.";
  render();
}

function leaveShop() {
  for (const j of state.jokers) {
    const def = getJokerDef(j.id);
    if (def && def.onShopLeave) def.onShopLeave(state, j);
  }
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

function tryUseConsumable(uidVal) {
  const item = state.consumables.find((c) => c.uid === uidVal);
  if (!item) return;
  const def = getConsumableDef(item);
  if (!def) return;

  // Planets always usable
  if (item.type === "planet") {
    if (useConsumable(state, uidVal, [])) render();
    return;
  }

  // Needs selection — only during playing with cards in hand
  if ((def.select || 0) > 0) {
    if (state.phase !== "playing") {
      state.message = "Use this during a blind (select cards in hand).";
      render();
      return;
    }
    if (state.usingConsumable && state.usingConsumable.uid === uidVal) {
      // confirm
      const cards = selectedCards();
      if (useConsumable(state, uidVal, cards)) {
        state.usingConsumable = null;
        state.selected.clear();
        applyBossDebuffs();
      }
      render();
      return;
    }
    state.usingConsumable = item;
    state.selected.clear();
    state.message = `Select up to ${def.select} card(s), then tap ${item.name} again.`;
    render();
    return;
  }

  if (state.phase !== "playing" && state.phase !== "shop" && state.phase !== "cashOut") {
    state.message = "Cannot use that now.";
    render();
    return;
  }
  if (useConsumable(state, uidVal, [])) {
    applyBossDebuffs();
    render();
  }
}

function fmt(n) {
  if (n == null || Number.isNaN(n)) return "0";
  if (Math.abs(n) >= 1e9) return Number(n).toExponential(2);
  return Math.floor(n).toLocaleString("en-US");
}
