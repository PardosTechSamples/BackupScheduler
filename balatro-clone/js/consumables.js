/* All Balatro consumables: 22 Tarot, 12 Planet, 18 Spectral */

const PLANET_CARDS = [
  { id: "pluto", name: "Pluto", hand: "High Card", cost: 3, desc: "Level up High Card" },
  { id: "mercury", name: "Mercury", hand: "Pair", cost: 3, desc: "Level up Pair" },
  { id: "uranus", name: "Uranus", hand: "Two Pair", cost: 3, desc: "Level up Two Pair" },
  { id: "venus", name: "Venus", hand: "Three of a Kind", cost: 3, desc: "Level up Three of a Kind" },
  { id: "saturn", name: "Saturn", hand: "Straight", cost: 3, desc: "Level up Straight" },
  { id: "jupiter", name: "Jupiter", hand: "Flush", cost: 3, desc: "Level up Flush" },
  { id: "earth", name: "Earth", hand: "Full House", cost: 3, desc: "Level up Full House" },
  { id: "mars", name: "Mars", hand: "Four of a Kind", cost: 3, desc: "Level up Four of a Kind" },
  { id: "neptune", name: "Neptune", hand: "Straight Flush", cost: 3, desc: "Level up Straight Flush" },
  { id: "planet-x", name: "Planet X", hand: "Five of a Kind", cost: 3, desc: "Level up Five of a Kind", secret: true },
  { id: "ceres", name: "Ceres", hand: "Flush House", cost: 3, desc: "Level up Flush House", secret: true },
  { id: "eris", name: "Eris", hand: "Flush Five", cost: 3, desc: "Level up Flush Five", secret: true }
];

const TAROT_CARDS = [
  { id: "the-fool", name: "The Fool", cost: 3, desc: "Creates the last Tarot or Planet used this run", select: 0 },
  { id: "the-magician", name: "The Magician", cost: 3, desc: "Enhance 2 cards to Lucky", select: 2 },
  { id: "the-high-priestess", name: "The High Priestess", cost: 3, desc: "Create up to 2 random Planet cards", select: 0 },
  { id: "the-empress", name: "The Empress", cost: 3, desc: "Enhance 2 cards to Mult", select: 2 },
  { id: "the-emperor", name: "The Emperor", cost: 3, desc: "Create up to 2 random Tarot cards", select: 0 },
  { id: "the-hierophant", name: "The Hierophant", cost: 3, desc: "Enhance 2 cards to Bonus", select: 2 },
  { id: "the-lovers", name: "The Lovers", cost: 3, desc: "Enhance 1 card to Wild", select: 1 },
  { id: "the-chariot", name: "The Chariot", cost: 3, desc: "Enhance 1 card to Steel", select: 1 },
  { id: "justice", name: "Justice", cost: 3, desc: "Enhance 1 card to Glass", select: 1 },
  { id: "the-hermit", name: "The Hermit", cost: 3, desc: "Double money (max +$20)", select: 0 },
  { id: "the-wheel-of-fortune", name: "The Wheel of Fortune", cost: 3, desc: "1 in 4 chance to edition a random Joker", select: 0 },
  { id: "strength", name: "Strength", cost: 3, desc: "Increase rank of up to 2 cards by 1", select: 2 },
  { id: "the-hanged-man", name: "The Hanged Man", cost: 3, desc: "Destroy up to 2 selected cards", select: 2 },
  { id: "death", name: "Death", cost: 3, desc: "Convert left selected card into right card", select: 2 },
  { id: "temperance", name: "Temperance", cost: 3, desc: "Gain total sell value of Jokers (max $50)", select: 0 },
  { id: "the-devil", name: "The Devil", cost: 3, desc: "Enhance 1 card to Gold", select: 1 },
  { id: "the-tower", name: "The Tower", cost: 3, desc: "Enhance 1 card to Stone", select: 1 },
  { id: "the-star", name: "The Star", cost: 3, desc: "Convert up to 3 cards to Diamonds", select: 3 },
  { id: "the-moon", name: "The Moon", cost: 3, desc: "Convert up to 3 cards to Clubs", select: 3 },
  { id: "the-sun", name: "The Sun", cost: 3, desc: "Convert up to 3 cards to Hearts", select: 3 },
  { id: "judgement", name: "Judgement", cost: 3, desc: "Create a random Joker", select: 0 },
  { id: "the-world", name: "The World", cost: 3, desc: "Convert up to 3 cards to Spades", select: 3 }
];

const SPECTRAL_CARDS = [
  { id: "familiar", name: "Familiar", cost: 4, desc: "Destroy 1 random hand card; add 3 Enhanced face cards", select: 0 },
  { id: "grim", name: "Grim", cost: 4, desc: "Destroy 1 random hand card; add 2 Enhanced Aces", select: 0 },
  { id: "incantation", name: "Incantation", cost: 4, desc: "Destroy 1 random hand card; add 4 Enhanced numbered cards", select: 0 },
  { id: "talisman", name: "Talisman", cost: 4, desc: "Add Gold Seal to 1 selected card", select: 1 },
  { id: "aura", name: "Aura", cost: 4, desc: "Add Foil/Holo/Polychrome to 1 selected card", select: 1 },
  { id: "wraith", name: "Wraith", cost: 4, desc: "Create a random Rare Joker; set money to $0", select: 0 },
  { id: "sigil", name: "Sigil", cost: 4, desc: "Convert all cards in hand to one random suit", select: 0 },
  { id: "ouija", name: "Ouija", cost: 4, desc: "Convert all cards in hand to one random rank; −1 hand size", select: 0 },
  { id: "ectoplasm", name: "Ectoplasm", cost: 4, desc: "Add Negative to a random Joker; −1 hand size", select: 0 },
  { id: "immolate", name: "Immolate", cost: 4, desc: "Destroy 5 random hand cards; gain $20", select: 0 },
  { id: "ankh", name: "Ankh", cost: 4, desc: "Copy a random Joker; destroy all others", select: 0 },
  { id: "deja-vu", name: "Deja Vu", cost: 4, desc: "Add Red Seal to 1 selected card", select: 1 },
  { id: "hex", name: "Hex", cost: 4, desc: "Polychrome a random Joker; destroy all others", select: 0 },
  { id: "trance", name: "Trance", cost: 4, desc: "Add Blue Seal to 1 selected card", select: 1 },
  { id: "medium", name: "Medium", cost: 4, desc: "Add Purple Seal to 1 selected card", select: 1 },
  { id: "cryptid", name: "Cryptid", cost: 4, desc: "Create 2 copies of 1 selected card", select: 1 },
  { id: "the-soul", name: "The Soul", cost: 4, desc: "Create a Legendary Joker", select: 0, soul: true },
  { id: "black-hole", name: "Black Hole", cost: 4, desc: "Upgrade every poker hand by 1 level", select: 0 }
];

function getPlanet(id) { return PLANET_CARDS.find((c) => c.id === id); }
function getTarot(id) { return TAROT_CARDS.find((c) => c.id === id); }
function getSpectral(id) { return SPECTRAL_CARDS.find((c) => c.id === id); }

function getConsumableDef(item) {
  if (!item) return null;
  if (item.type === "planet") return getPlanet(item.id);
  if (item.type === "tarot") return getTarot(item.id);
  if (item.type === "spectral") return getSpectral(item.id);
  return getPlanet(item.id) || getTarot(item.id) || getSpectral(item.id);
}

function shopPlanets(state) {
  return PLANET_CARDS.filter((p) => !p.secret || (state.secretHands && state.secretHands[p.hand]));
}

function randomPlanet(state) {
  const pool = shopPlanets(state);
  return pool[Math.floor(Math.random() * pool.length)];
}

function randomTarot() {
  return TAROT_CARDS[Math.floor(Math.random() * TAROT_CARDS.length)];
}

function randomSpectral(allowSoul) {
  const pool = allowSoul ? SPECTRAL_CARDS : SPECTRAL_CARDS.filter((s) => !s.soul);
  return pool[Math.floor(Math.random() * pool.length)];
}

function makeConsumable(type, def) {
  return {
    uid: uid(),
    type,
    id: def.id,
    name: def.name,
    cost: def.cost,
    desc: def.desc,
    hand: def.hand,
    select: def.select || 0
  };
}

function roomForConsumable(state) {
  return (state.consumables || []).length < (state.maxConsumables || 2);
}

function pushConsumable(state, item) {
  if (!roomForConsumable(state)) return false;
  state.consumables.push(item);
  return true;
}

function enhanceSelected(cards, enhancement) {
  for (const c of cards) c.enhancement = enhancement;
}

function convertSuit(cards, suit) {
  for (const c of cards) {
    if (c.enhancement === "stone") continue;
    c.suit = suit;
  }
}

const NEXT_RANK = { A: "2", "2": "3", "3": "4", "4": "5", "5": "6", "6": "7", "7": "8", "8": "9", "9": "10", "10": "J", J: "Q", Q: "K", K: "A" };

function usePlanet(state, item) {
  const def = getPlanet(item.id);
  if (!def) return false;
  state.levels[def.hand] = (state.levels[def.hand] || 1) + 1;
  if (def.hand === "Straight Flush") state.levels["Royal Flush"] = state.levels["Straight Flush"];
  state.lastConsumable = { type: "planet", id: def.id };
  state.tarotsUsed = state.tarotsUsed || 0;
  state.planetsUsed = (state.planetsUsed || 0) + 1;
  state.uniquePlanets = state.uniquePlanets || new Set();
  state.uniquePlanets.add(def.id);
  for (const j of state.jokers) {
    const jd = getJokerDef(j.id);
    if (jd && jd.onPlanetUsed) jd.onPlanetUsed(state, j);
    if (j.id === "constellation") j.xmult = (j.xmult || 1) + 0.1;
  }
  state.message = `${def.name}: ${def.hand} → Level ${state.levels[def.hand]}`;
  return true;
}

function useTarot(state, item, selectedCards) {
  const def = getTarot(item.id);
  if (!def) return false;
  const need = def.select || 0;
  if (need && selectedCards.length < 1) {
    state.message = `Select ${need} card(s) for ${def.name}.`;
    return false;
  }
  const cards = selectedCards.slice(0, need || selectedCards.length);

  switch (def.id) {
    case "the-fool": {
      const last = state.lastConsumable;
      if (!last || last.id === "the-fool") { state.message = "No previous Tarot/Planet."; return false; }
      const src = last.type === "planet" ? getPlanet(last.id) : getTarot(last.id);
      if (!src || !roomForConsumable(state)) { state.message = "No room / invalid Fool target."; return false; }
      pushConsumable(state, makeConsumable(last.type, src));
      break;
    }
    case "the-magician": enhanceSelected(cards.slice(0, 2), "lucky"); break;
    case "the-high-priestess":
      for (let i = 0; i < 2 && roomForConsumable(state); i++) pushConsumable(state, makeConsumable("planet", randomPlanet(state)));
      break;
    case "the-empress": enhanceSelected(cards.slice(0, 2), "mult"); break;
    case "the-emperor":
      for (let i = 0; i < 2 && roomForConsumable(state); i++) pushConsumable(state, makeConsumable("tarot", randomTarot()));
      break;
    case "the-hierophant": enhanceSelected(cards.slice(0, 2), "bonus"); break;
    case "the-lovers": if (cards[0]) cards[0].enhancement = "wild"; break;
    case "the-chariot": if (cards[0]) cards[0].enhancement = "steel"; break;
    case "justice": if (cards[0]) cards[0].enhancement = "glass"; break;
    case "the-hermit": {
      const gain = Math.min(20, state.money);
      state.money += gain;
      break;
    }
    case "the-wheel-of-fortune": {
      if (chance(1, 4, state) && state.jokers.length) {
        const j = state.jokers[Math.floor(Math.random() * state.jokers.length)];
        const eds = ["foil", "holographic", "polychrome"];
        j.edition = eds[Math.floor(Math.random() * eds.length)];
        state.message = `Wheel: ${j.name} became ${j.edition}!`;
      } else state.message = "Wheel of Fortune failed.";
      break;
    }
    case "strength":
      for (const c of cards.slice(0, 2)) {
        if (c.enhancement === "stone") continue;
        c.rank = NEXT_RANK[c.rank] || c.rank;
      }
      break;
    case "the-hanged-man":
      for (const c of cards.slice(0, 2)) destroyPlayingCard(state, c);
      break;
    case "death":
      if (cards.length >= 2) {
        const left = cards[0];
        const right = cards[1];
        left.rank = right.rank;
        left.suit = right.suit;
        left.enhancement = right.enhancement;
        left.seal = right.seal;
        left.edition = right.edition;
        left.bonusChips = right.bonusChips || 0;
      }
      break;
    case "temperance": {
      const total = Math.min(50, state.jokers.reduce((s, j) => s + Math.floor(j.cost / 2) + (j.extraSell || 0), 0));
      state.money += total;
      break;
    }
    case "the-devil": if (cards[0]) cards[0].enhancement = "gold"; break;
    case "the-tower": if (cards[0]) cards[0].enhancement = "stone"; break;
    case "the-star": convertSuit(cards.slice(0, 3), "diamonds"); break;
    case "the-moon": convertSuit(cards.slice(0, 3), "clubs"); break;
    case "the-sun": convertSuit(cards.slice(0, 3), "hearts"); break;
    case "the-world": convertSuit(cards.slice(0, 3), "spades"); break;
    case "judgement": {
      if (state.jokers.length >= effectiveMaxJokers(state)) { state.message = "No Joker room."; return false; }
      const j = randomShopJoker();
      if (j) state.jokers.push({ uid: uid(), ...j });
      break;
    }
    default: break;
  }

  state.lastConsumable = { type: "tarot", id: def.id };
  state.tarotsUsed = (state.tarotsUsed || 0) + 1;
  for (const j of state.jokers) {
    if (j.id === "fortune-teller") j.mult = (j.mult || 0) + 1;
  }
  if (!state.message || state.message.indexOf("Wheel") < 0) state.message = `Used ${def.name}.`;
  return true;
}

function useSpectral(state, item, selectedCards) {
  const def = getSpectral(item.id);
  if (!def) return false;
  const need = def.select || 0;
  if (need && selectedCards.length < 1) {
    state.message = `Select ${need} card(s) for ${def.name}.`;
    return false;
  }
  const cards = selectedCards.slice(0, need || 1);

  switch (def.id) {
    case "familiar": {
      if (!state.hand.length) return false;
      destroyPlayingCard(state, state.hand[Math.floor(Math.random() * state.hand.length)]);
      for (let i = 0; i < 3; i++) {
        const c = makeEnhancedCard(["J", "Q", "K"][i % 3], SUITS[i % 4]);
        state.hand.push(c);
        addPlayingCard(state, c);
      }
      break;
    }
    case "grim": {
      if (!state.hand.length) return false;
      destroyPlayingCard(state, state.hand[Math.floor(Math.random() * state.hand.length)]);
      for (let i = 0; i < 2; i++) {
        const c = makeEnhancedCard("A", SUITS[i % 4]);
        state.hand.push(c);
        addPlayingCard(state, c);
      }
      break;
    }
    case "incantation": {
      if (!state.hand.length) return false;
      destroyPlayingCard(state, state.hand[Math.floor(Math.random() * state.hand.length)]);
      const nums = ["2", "3", "4", "5", "6", "7", "8", "9", "10"];
      for (let i = 0; i < 4; i++) {
        const c = makeEnhancedCard(nums[Math.floor(Math.random() * nums.length)], SUITS[i % 4]);
        state.hand.push(c);
        addPlayingCard(state, c);
      }
      break;
    }
    case "talisman": if (cards[0]) cards[0].seal = "gold"; break;
    case "aura": if (cards[0]) cards[0].edition = randomPlayingEdition(); break;
    case "wraith": {
      if (state.jokers.length >= effectiveMaxJokers(state)) { state.message = "No Joker room."; return false; }
      const rares = JOKER_DEFS.filter((j) => j.rarity === "rare");
      const pick = rares[Math.floor(Math.random() * rares.length)];
      state.jokers.push({ uid: uid(), id: pick.id, name: pick.name, rarity: pick.rarity, cost: pick.cost, desc: pick.desc });
      state.money = 0;
      break;
    }
    case "sigil": {
      const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
      for (const c of state.hand) if (c.enhancement !== "stone") c.suit = suit;
      break;
    }
    case "ouija": {
      const rank = RANKS[Math.floor(Math.random() * RANKS.length)];
      for (const c of state.hand) if (c.enhancement !== "stone") c.rank = rank;
      state.handSizeBonus = (state.handSizeBonus || 0) - 1;
      break;
    }
    case "ectoplasm": {
      if (!state.jokers.length) return false;
      const j = state.jokers[Math.floor(Math.random() * state.jokers.length)];
      j.edition = "negative";
      state.maxJokers = (state.maxJokers || 5) + 1;
      state.handSizeBonus = (state.handSizeBonus || 0) - 1;
      state.ectoplasmUses = (state.ectoplasmUses || 0) + 1;
      break;
    }
    case "immolate": {
      for (let i = 0; i < 5 && state.hand.length; i++) {
        const idx = Math.floor(Math.random() * state.hand.length);
        destroyPlayingCard(state, state.hand[idx]);
      }
      state.money += 20;
      break;
    }
    case "ankh": {
      if (!state.jokers.length) return false;
      const keep = state.jokers[Math.floor(Math.random() * state.jokers.length)];
      const copy = { ...keep, uid: uid(), edition: keep.edition === "negative" ? null : keep.edition };
      state.jokers = [keep, copy];
      break;
    }
    case "deja-vu": if (cards[0]) cards[0].seal = "red"; break;
    case "hex": {
      if (!state.jokers.length) return false;
      const keep = state.jokers[Math.floor(Math.random() * state.jokers.length)];
      keep.edition = "polychrome";
      state.jokers = [keep];
      break;
    }
    case "trance": if (cards[0]) cards[0].seal = "blue"; break;
    case "medium": if (cards[0]) cards[0].seal = "purple"; break;
    case "cryptid":
      if (cards[0]) {
        for (let i = 0; i < 2; i++) {
          const copy = { ...cards[0], id: uid(), uid: undefined };
          state.hand.push(copy);
          addPlayingCard(state, copy);
        }
      }
      break;
    case "the-soul": {
      if (state.jokers.length >= effectiveMaxJokers(state)) { state.message = "No Joker room."; return false; }
      const legs = JOKER_DEFS.filter((j) => j.rarity === "legendary");
      const pick = legs[Math.floor(Math.random() * legs.length)];
      state.jokers.push({ uid: uid(), id: pick.id, name: pick.name, rarity: pick.rarity, cost: pick.cost, desc: pick.desc });
      break;
    }
    case "black-hole":
      for (const name of Object.keys(HAND_DEFS)) state.levels[name] = (state.levels[name] || 1) + 1;
      break;
    default: break;
  }

  state.message = `Used ${def.name}.`;
  return true;
}

function makeEnhancedCard(rank, suit) {
  return {
    id: uid(),
    rank,
    suit,
    debuffed: false,
    enhancement: randomEnhancement(),
    seal: null,
    edition: null,
    bonusChips: 0
  };
}

function destroyPlayingCard(state, card) {
  if (!card) return;
  state.hand = state.hand.filter((c) => c.id !== card.id);
  state.deck = state.deck.filter((c) => c.id !== card.id);
  state.discardPile = state.discardPile.filter((c) => c.id !== card.id);
  if (typeof destroyPlayedCard === "function") destroyPlayedCard(state, card);
  else {
    for (const j of state.jokers || []) {
      const def = getJokerDef(j.id);
      if (def && def.onCardDestroyed) def.onCardDestroyed(state, j, card);
      if (card.enhancement === "glass" && j.id === "glass-joker") j.xmult = (j.xmult || 1) + 0.75;
      if (isFace(card) && j.id === "canio") j.xmult = (j.xmult || 1) + 1;
    }
  }
}

function effectiveMaxJokers(state) {
  return state.maxJokers || 5;
}

function useConsumable(state, uidVal, selectedCards) {
  const item = state.consumables.find((c) => c.uid === uidVal);
  if (!item) return false;
  let ok = false;
  if (item.type === "planet") ok = usePlanet(state, item);
  else if (item.type === "tarot") ok = useTarot(state, item, selectedCards || []);
  else if (item.type === "spectral") ok = useSpectral(state, item, selectedCards || []);
  if (ok) state.consumables = state.consumables.filter((c) => c.uid !== uidVal);
  return ok;
}
