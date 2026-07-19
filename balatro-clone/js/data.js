/* Core constants and helpers for Ante Run */

const SUITS = ["hearts", "diamonds", "clubs", "spades"];
const SUIT_SYMBOL = { hearts: "♥", diamonds: "♦", clubs: "♣", spades: "♠" };
const SUIT_COLOR = { hearts: "red", diamonds: "red", clubs: "black", spades: "black" };
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

const RANK_VALUE = {
  A: 14, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7,
  "8": 8, "9": 9, "10": 10, J: 11, Q: 12, K: 13
};

const CHIP_VALUE = {
  A: 11, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7,
  "8": 8, "9": 9, "10": 10, J: 10, Q: 10, K: 10
};

const HAND_DEFS = {
  "High Card":       { chips: 5,   mult: 1,  upChips: 10, upMult: 1, order: 1 },
  "Pair":            { chips: 10,  mult: 2,  upChips: 15, upMult: 1, order: 2 },
  "Two Pair":        { chips: 20,  mult: 2,  upChips: 20, upMult: 1, order: 3 },
  "Three of a Kind": { chips: 30,  mult: 3,  upChips: 20, upMult: 2, order: 4 },
  "Straight":        { chips: 30,  mult: 4,  upChips: 30, upMult: 3, order: 5 },
  "Flush":           { chips: 35,  mult: 4,  upChips: 15, upMult: 2, order: 6 },
  "Full House":      { chips: 40,  mult: 4,  upChips: 25, upMult: 2, order: 7 },
  "Four of a Kind":  { chips: 60,  mult: 7,  upChips: 30, upMult: 3, order: 8 },
  "Straight Flush":  { chips: 100, mult: 8,  upChips: 40, upMult: 4, order: 9 },
  "Royal Flush":     { chips: 100, mult: 8,  upChips: 40, upMult: 4, order: 10 },
  "Five of a Kind":  { chips: 120, mult: 12, upChips: 35, upMult: 3, order: 11 },
  "Flush House":     { chips: 140, mult: 14, upChips: 40, upMult: 4, order: 12 },
  "Flush Five":      { chips: 160, mult: 16, upChips: 50, upMult: 3, order: 13 }
};

const ANTE_BASE = {
  1: 300, 2: 800, 3: 2000, 4: 5000,
  5: 11000, 6: 20000, 7: 35000, 8: 50000
};

const BLIND_TYPES = {
  small: { name: "Small Blind", mult: 1, reward: 3, color: "#3d9b6a" },
  big:   { name: "Big Blind",   mult: 1.5, reward: 4, color: "#d4a017" },
  boss:  { name: "Boss Blind",  mult: 2, reward: 5, color: "#c44b4b" }
};

const BOSS_BLINDS = [
  { id: "hook", name: "The Hook", desc: "Discards 2 random cards held in hand after every played hand.", minAnte: 1 },
  { id: "club", name: "The Club", desc: "All Club cards are debuffed.", minAnte: 1 },
  { id: "goad", name: "The Goad", desc: "All Spade cards are debuffed.", minAnte: 1 },
  { id: "window", name: "The Window", desc: "All Diamond cards are debuffed.", minAnte: 1 },
  { id: "head", name: "The Head", desc: "All Heart cards are debuffed.", minAnte: 1 },
  { id: "psychic", name: "The Psychic", desc: "Must play 5 cards.", minAnte: 1 },
  { id: "manacle", name: "The Manacle", desc: "-1 Hand Size.", minAnte: 1 },
  { id: "pillar", name: "The Pillar", desc: "Cards played previously this Ante are debuffed.", minAnte: 1 },
  { id: "wall", name: "The Wall", desc: "Extra large blind (4× base chips).", minAnte: 2, scoreMult: 4 },
  { id: "arm", name: "The Arm", desc: "Decrease level of played poker hand by 1 (min Level 1).", minAnte: 2 },
  { id: "water", name: "The Water", desc: "Start with 0 discards.", minAnte: 2 },
  { id: "flint", name: "The Flint", desc: "Base Chips and Mult are halved.", minAnte: 2 },
  { id: "needle", name: "The Needle", desc: "Play only 1 hand. Score requirement is 1× base.", minAnte: 2, scoreMult: 1, hands: 1 },
  { id: "mouth", name: "The Mouth", desc: "Only one hand type can be played this round.", minAnte: 2 },
  { id: "eye", name: "The Eye", desc: "No repeat hand types this round.", minAnte: 3 },
  { id: "plant", name: "The Plant", desc: "All face cards are debuffed.", minAnte: 4 }
];

function isFace(card) {
  return card && ["J", "Q", "K"].includes(card.rank);
}

function chance(num, den, st) {
  const flags = st && st.flags;
  const n = flags && flags.doubleProbabilities ? num * 2 : num;
  return Math.random() < n / den;
}

function handContains(handName, target) {
  const map = {
    "High Card": ["High Card"],
    "Pair": ["High Card", "Pair"],
    "Two Pair": ["High Card", "Pair", "Two Pair"],
    "Three of a Kind": ["High Card", "Pair", "Three of a Kind"],
    "Straight": ["High Card", "Straight"],
    "Flush": ["High Card", "Flush"],
    "Full House": ["High Card", "Pair", "Two Pair", "Three of a Kind", "Full House"],
    "Four of a Kind": ["High Card", "Pair", "Three of a Kind", "Four of a Kind"],
    "Straight Flush": ["High Card", "Straight", "Flush", "Straight Flush"],
    "Royal Flush": ["High Card", "Straight", "Flush", "Straight Flush", "Royal Flush"],
    "Five of a Kind": ["High Card", "Pair", "Three of a Kind", "Four of a Kind", "Five of a Kind"],
    "Flush House": ["High Card", "Pair", "Two Pair", "Three of a Kind", "Full House", "Flush", "Flush House"],
    "Flush Five": ["High Card", "Pair", "Three of a Kind", "Four of a Kind", "Five of a Kind", "Flush", "Flush Five"]
  };
  return (map[handName] || []).includes(target);
}

const RULEBOOK = {
  overview: `Ante Run is a fan-made HTML tribute to Balatro.
Play poker hands (Chips × Mult), collect all 150 Jokers, and use Tarot, Planet, and Spectral cards.`,
  scoring: `1. Poker hand sets base Chips and Mult.
2. Score relevant cards left-to-right (enhancements, seals, editions).
3. Trigger Jokers left-to-right. Put +Mult before ×Mult.
4. Score = Chips × Mult.`,
  cards: `Playing cards can gain Enhancements (Bonus, Mult, Wild, Glass, Steel, Stone, Gold, Lucky),
Seals (Gold, Red, Blue, Purple), and Editions (Foil, Holo, Polychrome).
Consumables: 22 Tarot · 12 Planet · 18 Spectral. Hold up to 2 (unless Negative).`,
  blinds: `Each Ante: Small (1×), Big (1.5×), Boss (usually 2×). Clear Ante 8 Boss to win.`,
  economy: `Rewards + interest ($1 per $5, max $5) + unused hands. Shop sells Jokers, consumables, and packs.`,
  hands: Object.entries(HAND_DEFS).map(([name, h]) =>
    `${name}: ${h.chips} × ${h.mult}  (+${h.upChips} / +${h.upMult} per level)`
  ).join("\n")
};
