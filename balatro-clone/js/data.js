/* Balatro-inspired rule data — hand values, antes, and jokers from community wiki. */

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

/** Level-1 base chips × mult and per-level upgrades (planet card values). */
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

/** White Stake base chip requirements by ante. */
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

const JOKER_POOL = [
  { id: "joker", name: "Joker", rarity: "common", cost: 2, desc: "+4 Mult",
    apply: (ctx) => { ctx.mult += 4; ctx.log("+4 Mult"); } },
  { id: "greedy", name: "Greedy Joker", rarity: "common", cost: 5, desc: "Played cards with Diamond suit give +3 Mult when scored",
    onCard: (card, ctx) => { if (card.suit === "diamonds" && !card.debuffed) { ctx.mult += 3; ctx.log("Diamond +3 Mult"); } } },
  { id: "lusty", name: "Lusty Joker", rarity: "common", cost: 5, desc: "Played cards with Heart suit give +3 Mult when scored",
    onCard: (card, ctx) => { if (card.suit === "hearts" && !card.debuffed) { ctx.mult += 3; ctx.log("Heart +3 Mult"); } } },
  { id: "wrathful", name: "Wrathful Joker", rarity: "common", cost: 5, desc: "Played cards with Spade suit give +3 Mult when scored",
    onCard: (card, ctx) => { if (card.suit === "spades" && !card.debuffed) { ctx.mult += 3; ctx.log("Spade +3 Mult"); } } },
  { id: "gluttonous", name: "Gluttonous Joker", rarity: "common", cost: 5, desc: "Played cards with Club suit give +3 Mult when scored",
    onCard: (card, ctx) => { if (card.suit === "clubs" && !card.debuffed) { ctx.mult += 3; ctx.log("Club +3 Mult"); } } },
  { id: "jolly", name: "Jolly Joker", rarity: "common", cost: 3, desc: "+8 Mult if played hand contains a Pair",
    apply: (ctx) => { if (handContains(ctx.handName, "Pair")) { ctx.mult += 8; ctx.log("+8 Mult (Pair)"); } } },
  { id: "zany", name: "Zany Joker", rarity: "common", cost: 4, desc: "+12 Mult if played hand contains a Three of a Kind",
    apply: (ctx) => { if (handContains(ctx.handName, "Three of a Kind")) { ctx.mult += 12; ctx.log("+12 Mult (3oak)"); } } },
  { id: "mad", name: "Mad Joker", rarity: "common", cost: 4, desc: "+10 Mult if played hand contains a Two Pair",
    apply: (ctx) => { if (handContains(ctx.handName, "Two Pair")) { ctx.mult += 10; ctx.log("+10 Mult (Two Pair)"); } } },
  { id: "crazy", name: "Crazy Joker", rarity: "common", cost: 4, desc: "+12 Mult if played hand contains a Straight",
    apply: (ctx) => { if (handContains(ctx.handName, "Straight")) { ctx.mult += 12; ctx.log("+12 Mult (Straight)"); } } },
  { id: "droll", name: "Droll Joker", rarity: "common", cost: 4, desc: "+10 Mult if played hand contains a Flush",
    apply: (ctx) => { if (handContains(ctx.handName, "Flush")) { ctx.mult += 10; ctx.log("+10 Mult (Flush)"); } } },
  { id: "sly", name: "Sly Joker", rarity: "common", cost: 3, desc: "+50 Chips if played hand contains a Pair",
    apply: (ctx) => { if (handContains(ctx.handName, "Pair")) { ctx.chips += 50; ctx.log("+50 Chips (Pair)"); } } },
  { id: "wily", name: "Wily Joker", rarity: "common", cost: 4, desc: "+100 Chips if played hand contains a Three of a Kind",
    apply: (ctx) => { if (handContains(ctx.handName, "Three of a Kind")) { ctx.chips += 100; ctx.log("+100 Chips (3oak)"); } } },
  { id: "clever", name: "Clever Joker", rarity: "common", cost: 4, desc: "+80 Chips if played hand contains a Two Pair",
    apply: (ctx) => { if (handContains(ctx.handName, "Two Pair")) { ctx.chips += 80; ctx.log("+80 Chips (Two Pair)"); } } },
  { id: "devious", name: "Devious Joker", rarity: "common", cost: 4, desc: "+100 Chips if played hand contains a Straight",
    apply: (ctx) => { if (handContains(ctx.handName, "Straight")) { ctx.chips += 100; ctx.log("+100 Chips (Straight)"); } } },
  { id: "crafty", name: "Crafty Joker", rarity: "common", cost: 4, desc: "+80 Chips if played hand contains a Flush",
    apply: (ctx) => { if (handContains(ctx.handName, "Flush")) { ctx.chips += 80; ctx.log("+80 Chips (Flush)"); } } },
  { id: "half", name: "Half Joker", rarity: "common", cost: 5, desc: "+20 Mult if played hand has 3 or fewer cards",
    apply: (ctx) => { if (ctx.playedCount <= 3) { ctx.mult += 20; ctx.log("+20 Mult (≤3 cards)"); } } },
  { id: "banner", name: "Banner", rarity: "common", cost: 5, desc: "+30 Chips for each remaining discard",
    apply: (ctx) => { const n = ctx.discardsLeft * 30; if (n) { ctx.chips += n; ctx.log(`+${n} Chips (discards)`); } } },
  { id: "scary", name: "Scary Face", rarity: "common", cost: 4, desc: "Played face cards give +30 Chips when scored",
    onCard: (card, ctx) => { if (isFace(card) && !card.debuffed) { ctx.chips += 30; ctx.log("Face +30 Chips"); } } },
  { id: "abstract", name: "Abstract Joker", rarity: "common", cost: 4, desc: "+3 Mult for each Joker card",
    apply: (ctx) => { const n = ctx.jokerCount * 3; ctx.mult += n; ctx.log(`+${n} Mult (jokers)`); } },
  { id: "blue", name: "Blue Joker", rarity: "common", cost: 5, desc: "+2 Chips for each remaining card in deck",
    apply: (ctx) => { const n = ctx.deckLeft * 2; ctx.chips += n; ctx.log(`+${n} Chips (deck)`); } },
  { id: "even", name: "Even Steven", rarity: "common", cost: 4, desc: "Played cards with even rank give +4 Mult when scored",
    onCard: (card, ctx) => {
      if (!card.debuffed && ["2", "4", "6", "8", "10"].includes(card.rank)) { ctx.mult += 4; ctx.log("Even +4 Mult"); }
    } },
  { id: "odd", name: "Odd Todd", rarity: "common", cost: 4, desc: "Played cards with odd rank give +31 Chips when scored",
    onCard: (card, ctx) => {
      if (!card.debuffed && ["A", "3", "5", "7", "9"].includes(card.rank)) { ctx.chips += 31; ctx.log("Odd +31 Chips"); }
    } },
  { id: "scholar", name: "Scholar", rarity: "common", cost: 4, desc: "Played Aces give +20 Chips and +4 Mult when scored",
    onCard: (card, ctx) => { if (card.rank === "A" && !card.debuffed) { ctx.chips += 20; ctx.mult += 4; ctx.log("Ace +20 Chips +4 Mult"); } } },
  { id: "smiley", name: "Smiley Face", rarity: "common", cost: 4, desc: "Played face cards give +5 Mult when scored",
    onCard: (card, ctx) => { if (isFace(card) && !card.debuffed) { ctx.mult += 5; ctx.log("Face +5 Mult"); } } },
  { id: "fibonacci", name: "Fibonacci", rarity: "uncommon", cost: 8, desc: "Each played Ace, 2, 3, 5, or 8 gives +8 Mult when scored",
    onCard: (card, ctx) => {
      if (!card.debuffed && ["A", "2", "3", "5", "8"].includes(card.rank)) { ctx.mult += 8; ctx.log("Fib +8 Mult"); }
    } },
  { id: "supernova", name: "Supernova", rarity: "common", cost: 5, desc: "Adds the number of times poker hand has been played this run to Mult",
    apply: (ctx) => { const n = ctx.handPlays[ctx.handName] || 0; ctx.mult += n; ctx.log(`+${n} Mult (plays)`); } },
  { id: "photograph", name: "Photograph", rarity: "common", cost: 5, desc: "First played face card gives ×2 Mult when scored",
    onCard: (card, ctx) => {
      if (isFace(card) && !card.debuffed && !ctx._photoUsed) {
        ctx._photoUsed = true; ctx.mult *= 2; ctx.log("Photo ×2 Mult");
      }
    } },
  { id: "duo", name: "The Duo", rarity: "rare", cost: 8, desc: "×2 Mult if played hand contains a Pair",
    apply: (ctx) => { if (handContains(ctx.handName, "Pair")) { ctx.mult *= 2; ctx.log("×2 Mult (Pair)"); } } },
  { id: "trio", name: "The Trio", rarity: "rare", cost: 8, desc: "×3 Mult if played hand contains a Three of a Kind",
    apply: (ctx) => { if (handContains(ctx.handName, "Three of a Kind")) { ctx.mult *= 3; ctx.log("×3 Mult (3oak)"); } } },
  { id: "family", name: "The Family", rarity: "rare", cost: 8, desc: "×4 Mult if played hand contains a Four of a Kind",
    apply: (ctx) => { if (handContains(ctx.handName, "Four of a Kind")) { ctx.mult *= 4; ctx.log("×4 Mult (4oak)"); } } },
  { id: "order", name: "The Order", rarity: "rare", cost: 8, desc: "×3 Mult if played hand contains a Straight",
    apply: (ctx) => { if (handContains(ctx.handName, "Straight")) { ctx.mult *= 3; ctx.log("×3 Mult (Straight)"); } } },
  { id: "tribe", name: "The Tribe", rarity: "rare", cost: 8, desc: "×2 Mult if played hand contains a Flush",
    apply: (ctx) => { if (handContains(ctx.handName, "Flush")) { ctx.mult *= 2; ctx.log("×2 Mult (Flush)"); } } },
  { id: "gros", name: "Gros Michel", rarity: "common", cost: 5, desc: "×15 Mult — 1 in 6 chance this card is destroyed at end of round",
    apply: (ctx) => { ctx.mult *= 15; ctx.log("×15 Mult"); },
    endRound: (state, joker) => {
      if (Math.random() < 1 / 6) {
        state.jokers = state.jokers.filter((j) => j.uid !== joker.uid);
        state.message = "Gros Michel went extinct!";
        state.grosExtinct = true;
      }
    } },
  { id: "cavendish", name: "Cavendish", rarity: "common", cost: 4, desc: "×3 Mult — 1 in 1000 chance this card is destroyed at end of round",
    apply: (ctx) => { ctx.mult *= 3; ctx.log("×3 Mult"); },
    unlock: (state) => state.grosExtinct,
    endRound: (state, joker) => {
      if (Math.random() < 1 / 1000) {
        state.jokers = state.jokers.filter((j) => j.uid !== joker.uid);
        state.message = "Cavendish went extinct!";
      }
    } },
  { id: "ice", name: "Ice Cream", rarity: "common", cost: 5, desc: "+100 Chips — −5 Chips for every hand played this run",
    apply: (ctx, joker) => {
      const chips = Math.max(0, 100 - 5 * (joker.handsPlayed || 0));
      ctx.chips += chips; ctx.log(`+${chips} Chips (Ice Cream)`);
      joker.handsPlayed = (joker.handsPlayed || 0) + 1;
    } },
  { id: "popcorn", name: "Popcorn", rarity: "common", cost: 5, desc: "+20 Mult — −4 Mult per round played",
    apply: (ctx, joker) => {
      const m = Math.max(0, 20 - 4 * (joker.rounds || 0));
      ctx.mult += m; ctx.log(`+${m} Mult (Popcorn)`);
    },
    endRound: (state, joker) => { joker.rounds = (joker.rounds || 0) + 1; } },
  { id: "runner", name: "Runner", rarity: "common", cost: 5, desc: "Gains +15 Chips when Straight is played",
    apply: (ctx, joker) => {
      if (handContains(ctx.handName, "Straight")) joker.chips = (joker.chips || 0) + 15;
      const c = joker.chips || 0;
      if (c) { ctx.chips += c; ctx.log(`+${c} Chips (Runner)`); }
    } },
  { id: "bus", name: "Ride the Bus", rarity: "common", cost: 6, desc: "+1 Mult per consecutive hand without a scoring face card",
    apply: (ctx, joker) => {
      const hadFace = ctx.scoringCards.some((c) => isFace(c) && !c.debuffed);
      if (hadFace) joker.streak = 0;
      else joker.streak = (joker.streak || 0) + 1;
      const m = joker.streak || 0;
      if (m) { ctx.mult += m; ctx.log(`+${m} Mult (Bus)`); }
    } }
];

const PLANET_CARDS = [
  { id: "pluto", name: "Pluto", hand: "High Card", cost: 3 },
  { id: "mercury", name: "Mercury", hand: "Pair", cost: 3 },
  { id: "uranus", name: "Uranus", hand: "Two Pair", cost: 3 },
  { id: "venus", name: "Venus", hand: "Three of a Kind", cost: 3 },
  { id: "saturn", name: "Saturn", hand: "Straight", cost: 3 },
  { id: "jupiter", name: "Jupiter", hand: "Flush", cost: 3 },
  { id: "earth", name: "Earth", hand: "Full House", cost: 3 },
  { id: "mars", name: "Mars", hand: "Four of a Kind", cost: 3 },
  { id: "neptune", name: "Neptune", hand: "Straight Flush", cost: 3 }
];

function isFace(card) {
  return ["J", "Q", "K"].includes(card.rank);
}

/** Does this scored hand type also "contain" a lower hand type (Balatro contains rules)? */
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
  overview: `This is a fan-made HTML tribute to Balatro's poker-roguelike loop.
Score = Chips × Mult. Beat blinds across 8 Antes to win the run.
Between blinds, visit the Shop to buy Jokers and Planet cards.`,
  scoring: `1. Identify the poker hand — that sets base Chips and Mult (Level 1 values from the rulebook).
2. Score relevant cards left-to-right: each adds its chip value (2–10 face value, J/Q/K = 10, A = 11).
3. Trigger Jokers left-to-right (+Chips, +Mult, then ×Mult).
4. Final score = Chips × Mult.

Tip: put additive (+Mult / +Chips) Jokers to the left of multiplicative (×Mult) Jokers.`,
  blinds: `Each Ante has Small Blind (1× base), Big Blind (1.5×), and Boss Blind (usually 2×).
You start with 4 hands and 3 discards per blind. Hands cost a hand; discards refresh your draw.
Boss Blinds add a special rule. Clear Ante 8's Boss to win.`,
  economy: `Beat a blind to earn cash (+ interest: $1 per $5 held, max $5).
Shop: buy Jokers (max 5) and Planet cards that level up a poker hand.
Reroll the shop for $5. Sell Jokers for half their cost (rounded down).`,
  hands: Object.entries(HAND_DEFS).map(([name, h]) =>
    `${name}: ${h.chips} × ${h.mult}  (level-up +${h.upChips} chips / +${h.upMult} mult)`
  ).join("\n")
};
