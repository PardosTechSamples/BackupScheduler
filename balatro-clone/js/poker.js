/* Poker hand evaluation with Wild / Stone / Four Fingers / Shortcut / Splash / Smeared */

function createDeck() {
  const deck = [];
  let id = 0;
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(makePlayingCard(rank, suit, id++));
    }
  }
  return shuffle(deck);
}

function makePlayingCard(rank, suit, id) {
  return {
    id: id != null ? id : uid(),
    rank,
    suit,
    debuffed: false,
    enhancement: null,
    seal: null,
    edition: null,
    bonusChips: 0
  };
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function effectiveSuits(card, state) {
  if (card.enhancement === "stone") return [];
  if (card.enhancement === "wild") return SUITS.slice();
  if (state && state.flags && state.flags.smeared) {
    if (card.suit === "hearts" || card.suit === "diamonds") return ["hearts", "diamonds"];
    return ["clubs", "spades"];
  }
  return [card.suit];
}

function cardRankValue(card) {
  if (!card || card.enhancement === "stone") return null;
  return RANK_VALUE[card.rank];
}

function isStraightValues(values, minLen, shortcut) {
  const uniq = [...new Set(values.filter((v) => v != null))].sort((a, b) => a - b);
  if (uniq.length < minLen) return false;

  function check(list) {
    for (let start = 0; start <= list.length - minLen; start++) {
      const slice = list.slice(start, start + minLen);
      let ok = true;
      for (let i = 1; i < slice.length; i++) {
        const gap = slice[i] - slice[i - 1];
        if (shortcut) {
          if (gap < 1 || gap > 2) { ok = false; break; }
        } else if (gap !== 1) { ok = false; break; }
      }
      if (ok) return slice;
    }
    return false;
  }

  const normal = check(uniq);
  if (normal) return normal;

  // Wheel A-2-3-4-5
  if (uniq.includes(14)) {
    const low = uniq.filter((v) => v !== 14).concat([1]).sort((a, b) => a - b);
    const wheel = check(low);
    if (wheel && wheel[0] === 1) {
      return wheel.map((v) => (v === 1 ? 14 : v));
    }
  }
  return false;
}

function canFlush(cards, state, minLen) {
  const nonStone = cards.filter((c) => c.enhancement !== "stone");
  if (nonStone.length < minLen) return false;
  for (const suit of SUITS) {
    let count = 0;
    for (const c of nonStone) {
      if (effectiveSuits(c, state).includes(suit)) count++;
    }
    if (count >= minLen) return suit;
  }
  return false;
}

function rankCounts(cards) {
  const counts = {};
  for (const c of cards) {
    if (c.enhancement === "stone") continue;
    counts[c.rank] = (counts[c.rank] || 0) + 1;
  }
  return counts;
}

/**
 * Evaluate played cards with optional passive flags from state.
 */
function evaluateHand(cards, state) {
  if (!cards.length) return { name: "High Card", scoringCards: [] };

  const flags = (state && state.flags) || {};
  const flushLen = flags.fourFingers ? 4 : 5;
  const straightLen = flags.fourFingers ? 4 : 5;
  const splash = !!flags.splash;

  const n = cards.length;
  const counts = rankCounts(cards);
  const byCount = Object.entries(counts).sort((a, b) => b[1] - a[1] || RANK_VALUE[b[0]] - RANK_VALUE[a[0]]);
  const values = cards.map((c) => cardRankValue(c)).filter((v) => v != null);
  const flushSuit = n >= flushLen ? canFlush(cards, state, flushLen) : false;
  const straightVals = n >= straightLen ? isStraightValues(values, straightLen, flags.shortcut) : false;
  const isStraight = !!straightVals;
  const freqs = byCount.map(([, c]) => c);
  const allSameSuitFlush = !!flushSuit;

  const withSplash = (scoring) => (splash ? cards.slice() : scoring);

  // Flush Five
  if (n >= 5 && freqs[0] === 5 && allSameSuitFlush) {
    return { name: "Flush Five", scoringCards: withSplash(cards.slice()) };
  }
  // Five of a Kind
  if (freqs[0] === 5) {
    return { name: "Five of a Kind", scoringCards: withSplash(cards.filter((c) => c.enhancement !== "stone" || splash)) };
  }
  // Flush House
  if (n >= 5 && allSameSuitFlush && freqs[0] === 3 && freqs[1] === 2) {
    return { name: "Flush House", scoringCards: withSplash(cards.slice()) };
  }
  // Royal / Straight Flush
  if (flushSuit && isStraight && n >= straightLen) {
    const royal = [14, 13, 12, 11, 10].every((v) => values.includes(v)) && straightLen >= 5;
    const name = royal ? "Royal Flush" : "Straight Flush";
    return { name, scoringCards: withSplash(cards.slice()) };
  }
  // Four of a Kind
  if (freqs[0] === 4) {
    const rank = byCount[0][0];
    let scoring = cards.filter((c) => c.rank === rank);
    if (splash) scoring = cards.slice();
    return { name: "Four of a Kind", scoringCards: scoring };
  }
  // Full House
  if (freqs[0] === 3 && freqs[1] === 2) {
    return { name: "Full House", scoringCards: withSplash(cards.filter((c) => c.enhancement !== "stone" || splash)) };
  }
  // Flush
  if (flushSuit) {
    const scoring = cards.filter((c) => effectiveSuits(c, state).includes(flushSuit)).slice(0, Math.max(flushLen, 5));
    return { name: "Flush", scoringCards: withSplash(scoring) };
  }
  // Straight
  if (isStraight) {
    const needed = new Set(straightVals);
    const scoring = [];
    const used = new Set();
    for (const c of cards) {
      const v = cardRankValue(c);
      if (v == null) continue;
      if (needed.has(v) && !used.has(v)) {
        scoring.push(c);
        used.add(v);
      }
    }
    return { name: "Straight", scoringCards: withSplash(scoring.slice(0, straightLen)) };
  }
  // Three of a Kind
  if (freqs[0] === 3) {
    const rank = byCount[0][0];
    let scoring = cards.filter((c) => c.rank === rank);
    if (splash) scoring = cards.slice();
    return { name: "Three of a Kind", scoringCards: scoring };
  }
  // Two Pair
  if (freqs[0] === 2 && freqs[1] === 2) {
    const r1 = byCount[0][0];
    const r2 = byCount[1][0];
    let scoring = cards.filter((c) => c.rank === r1 || c.rank === r2);
    if (splash) scoring = cards.slice();
    return { name: "Two Pair", scoringCards: scoring };
  }
  // Pair
  if (freqs[0] === 2) {
    const rank = byCount[0][0];
    let scoring = cards.filter((c) => c.rank === rank);
    if (splash) scoring = cards.slice();
    return { name: "Pair", scoringCards: scoring };
  }
  // High Card — stones can still score via splash / stone chips handled in scoring
  const ranked = cards.filter((c) => c.enhancement !== "stone")
    .slice()
    .sort((a, b) => RANK_VALUE[b.rank] - RANK_VALUE[a.rank]);
  const best = ranked[0];
  if (splash) return { name: "High Card", scoringCards: cards.slice() };
  if (best) return { name: "High Card", scoringCards: [best] };
  // only stones
  return { name: "High Card", scoringCards: cards.slice(0, 1) };
}

function handLevelStats(handName, levels) {
  const def = HAND_DEFS[handName];
  const lvl = levels[handName] || 1;
  const chips = def.chips + (lvl - 1) * def.upChips;
  const mult = def.mult + (lvl - 1) * def.upMult;
  return { chips, mult, level: lvl };
}
