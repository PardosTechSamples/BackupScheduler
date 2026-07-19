/* Poker hand evaluation — Balatro-style precedence and scoring card selection. */

function createDeck() {
  const deck = [];
  let id = 0;
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ id: id++, rank, suit, debuffed: false });
    }
  }
  return shuffle(deck);
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function rankCounts(cards) {
  const counts = {};
  for (const c of cards) {
    counts[c.rank] = (counts[c.rank] || 0) + 1;
  }
  return counts;
}

function suitCounts(cards) {
  const counts = {};
  for (const c of cards) {
    counts[c.suit] = (counts[c.suit] || 0) + 1;
  }
  return counts;
}

function isStraightRanks(values) {
  const uniq = [...new Set(values)].sort((a, b) => a - b);
  if (uniq.length < 5) return false;
  // Check any 5 consecutive among unique values (for 5-card hands uniq.length === 5)
  for (let start = 0; start <= uniq.length - 5; start++) {
    const slice = uniq.slice(start, start + 5);
    let ok = true;
    for (let i = 1; i < 5; i++) {
      if (slice[i] !== slice[0] + i) { ok = false; break; }
    }
    if (ok) return slice;
  }
  // Wheel: A-2-3-4-5
  if (uniq.includes(14)) {
    const low = uniq.filter((v) => v !== 14).concat([1]).sort((a, b) => a - b);
    for (let start = 0; start <= low.length - 5; start++) {
      const slice = low.slice(start, start + 5);
      let ok = true;
      for (let i = 1; i < 5; i++) {
        if (slice[i] !== slice[0] + i) { ok = false; break; }
      }
      if (ok && slice[0] === 1) return [14, 2, 3, 4, 5];
    }
  }
  return false;
}

function isFlush(cards) {
  if (cards.length < 5) return false;
  const sc = suitCounts(cards);
  return Object.values(sc).some((n) => n >= 5);
}

function flushSuit(cards) {
  const sc = suitCounts(cards);
  return Object.keys(sc).find((s) => sc[s] >= 5);
}

/**
 * Evaluate up to 5 played cards. Returns { name, scoringCards }.
 * Scoring cards are only those relevant to the hand type (Balatro rule).
 */
function evaluateHand(cards) {
  if (!cards.length) return { name: "High Card", scoringCards: [] };

  const n = cards.length;
  const counts = rankCounts(cards);
  const byCount = Object.entries(counts).sort((a, b) => b[1] - a[1] || RANK_VALUE[b[0]] - RANK_VALUE[a[0]]);
  const values = cards.map((c) => RANK_VALUE[c.rank]);
  const flush = n >= 5 && isFlush(cards);
  const straightVals = n >= 5 ? isStraightRanks(values) : false;
  const isStraight = !!straightVals;
  const freqs = byCount.map(([, c]) => c);

  // Flush Five
  if (n === 5 && flush && freqs[0] === 5) {
    return { name: "Flush Five", scoringCards: cards.slice() };
  }
  // Five of a Kind
  if (freqs[0] === 5) {
    return { name: "Five of a Kind", scoringCards: cards.slice() };
  }
  // Flush House
  if (n === 5 && flush && freqs[0] === 3 && freqs[1] === 2) {
    return { name: "Flush House", scoringCards: cards.slice() };
  }
  // Royal / Straight Flush
  if (n === 5 && flush && isStraight) {
    const royal = [14, 13, 12, 11, 10].every((v) => values.includes(v));
    return { name: royal ? "Royal Flush" : "Straight Flush", scoringCards: cards.slice() };
  }
  // Four of a Kind
  if (freqs[0] === 4) {
    const rank = byCount[0][0];
    return { name: "Four of a Kind", scoringCards: cards.filter((c) => c.rank === rank) };
  }
  // Full House
  if (freqs[0] === 3 && freqs[1] === 2) {
    return { name: "Full House", scoringCards: cards.slice() };
  }
  // Flush
  if (flush) {
    const suit = flushSuit(cards);
    const scoring = cards.filter((c) => c.suit === suit).slice(0, 5);
    return { name: "Flush", scoringCards: scoring };
  }
  // Straight
  if (isStraight) {
    const needed = new Set(straightVals);
    const scoring = [];
    const used = new Set();
    for (const c of cards) {
      const v = RANK_VALUE[c.rank];
      const wheelA = needed.has(14) && needed.has(2) && c.rank === "A";
      const key = wheelA ? 14 : v;
      if (needed.has(key) && !used.has(key)) {
        scoring.push(c);
        used.add(key);
      }
    }
    // Prefer actual consecutive cards from play order for scoring
    return { name: "Straight", scoringCards: scoring.slice(0, 5) };
  }
  // Three of a Kind
  if (freqs[0] === 3) {
    const rank = byCount[0][0];
    return { name: "Three of a Kind", scoringCards: cards.filter((c) => c.rank === rank) };
  }
  // Two Pair
  if (freqs[0] === 2 && freqs[1] === 2) {
    const r1 = byCount[0][0];
    const r2 = byCount[1][0];
    return { name: "Two Pair", scoringCards: cards.filter((c) => c.rank === r1 || c.rank === r2) };
  }
  // Pair
  if (freqs[0] === 2) {
    const rank = byCount[0][0];
    return { name: "Pair", scoringCards: cards.filter((c) => c.rank === rank) };
  }
  // High Card — only highest card scores
  const best = cards.slice().sort((a, b) => RANK_VALUE[b.rank] - RANK_VALUE[a.rank])[0];
  return { name: "High Card", scoringCards: best ? [best] : [] };
}

function handLevelStats(handName, levels) {
  const def = HAND_DEFS[handName];
  const lvl = levels[handName] || 1;
  const chips = def.chips + (lvl - 1) * def.upChips;
  const mult = def.mult + (lvl - 1) * def.upMult;
  return { chips, mult, level: lvl };
}
