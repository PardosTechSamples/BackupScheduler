/* 150 Balatro Jokers for Ante Run */
/** All 150 Balatro Jokers — data + effect hooks for Ante Run. */
const JOKER_DEFS = [
  {
    id: "joker",
    name: "Joker",
    rarity: "common", // common | uncommon | rare | legendary
    cost: 2,
    desc: "+4 Mult",
    // Optional hooks used by the engine:
    // apply(ctx, joker, state) - after cards scored
    // onCard(card, ctx, joker, state) - when a scoring card is scored
    // onHeld(card, ctx, joker, state) - for cards held in hand after play
    // retrigger(card, ctx, joker, state) -> extra score count (number)
    // onBlindSelect(state, joker)
    // endRound(state, joker)
    // onDiscard(state, joker, discardedCards)
    // onPlay(state, joker, evaled, playedCards) - when hand is played (before scoring)
    // sell(state, joker) - when sold
    // passive: { fourFingers, splash, shortcut, pareidolia, smeared, creditDebt, freeReroll, ... }
    apply(ctx) { ctx.mult += 4; ctx.log("+4 Mult"); }
  },
  {
    id: "greedy",
    name: "Greedy Joker",
    rarity: "common",
    cost: 5,
    desc: "Played cards with Diamond suit give +3 Mult when scored",
    onCard(card, ctx, joker, state) { if (cardHasSuit(card, "diamonds", state) && !card.debuffed) addMult(ctx, 3, "Diamond +3 Mult"); }
  },
  {
    id: "lusty",
    name: "Lusty Joker",
    rarity: "common",
    cost: 5,
    desc: "Played cards with Heart suit give +3 Mult when scored",
    onCard(card, ctx, joker, state) { if (cardHasSuit(card, "hearts", state) && !card.debuffed) addMult(ctx, 3, "Heart +3 Mult"); }
  },
  {
    id: "wrathful",
    name: "Wrathful Joker",
    rarity: "common",
    cost: 5,
    desc: "Played cards with Spade suit give +3 Mult when scored",
    onCard(card, ctx, joker, state) { if (cardHasSuit(card, "spades", state) && !card.debuffed) addMult(ctx, 3, "Spade +3 Mult"); }
  },
  {
    id: "gluttonous",
    name: "Gluttonous Joker",
    rarity: "common",
    cost: 5,
    desc: "Played cards with Club suit give +3 Mult when scored",
    onCard(card, ctx, joker, state) { if (cardHasSuit(card, "clubs", state) && !card.debuffed) addMult(ctx, 3, "Club +3 Mult"); }
  },
  {
    id: "jolly",
    name: "Jolly Joker",
    rarity: "common",
    cost: 3,
    desc: "+8 Mult if played hand contains a Pair",
    apply(ctx) { if (handContains(ctx.handName, "Pair")) addMult(ctx, 8, "+8 Mult (Pair)"); }
  },
  {
    id: "zany",
    name: "Zany Joker",
    rarity: "common",
    cost: 4,
    desc: "+12 Mult if played hand contains a Three of a Kind",
    apply(ctx) { if (handContains(ctx.handName, "Three of a Kind")) addMult(ctx, 12, "+12 Mult (Three of a Kind)"); }
  },
  {
    id: "mad",
    name: "Mad Joker",
    rarity: "common",
    cost: 4,
    desc: "+10 Mult if played hand contains a Two Pair",
    apply(ctx) { if (handContains(ctx.handName, "Two Pair")) addMult(ctx, 10, "+10 Mult (Two Pair)"); }
  },
  {
    id: "crazy",
    name: "Crazy Joker",
    rarity: "common",
    cost: 4,
    desc: "+12 Mult if played hand contains a Straight",
    apply(ctx) { if (handContains(ctx.handName, "Straight")) addMult(ctx, 12, "+12 Mult (Straight)"); }
  },
  {
    id: "droll",
    name: "Droll Joker",
    rarity: "common",
    cost: 4,
    desc: "+10 Mult if played hand contains a Flush",
    apply(ctx) { if (handContains(ctx.handName, "Flush")) addMult(ctx, 10, "+10 Mult (Flush)"); }
  },
  {
    id: "sly",
    name: "Sly Joker",
    rarity: "common",
    cost: 3,
    desc: "+50 Chips if played hand contains a Pair",
    apply(ctx) { if (handContains(ctx.handName, "Pair")) addChips(ctx, 50, "+50 Chips (Pair)"); }
  },
  {
    id: "wily",
    name: "Wily Joker",
    rarity: "common",
    cost: 4,
    desc: "+100 Chips if played hand contains a Three of a Kind",
    apply(ctx) { if (handContains(ctx.handName, "Three of a Kind")) addChips(ctx, 100, "+100 Chips (Three of a Kind)"); }
  },
  {
    id: "clever",
    name: "Clever Joker",
    rarity: "common",
    cost: 4,
    desc: "+80 Chips if played hand contains a Two Pair",
    apply(ctx) { if (handContains(ctx.handName, "Two Pair")) addChips(ctx, 80, "+80 Chips (Two Pair)"); }
  },
  {
    id: "devious",
    name: "Devious Joker",
    rarity: "common",
    cost: 4,
    desc: "+100 Chips if played hand contains a Straight",
    apply(ctx) { if (handContains(ctx.handName, "Straight")) addChips(ctx, 100, "+100 Chips (Straight)"); }
  },
  {
    id: "crafty",
    name: "Crafty Joker",
    rarity: "common",
    cost: 4,
    desc: "+80 Chips if played hand contains a Flush",
    apply(ctx) { if (handContains(ctx.handName, "Flush")) addChips(ctx, 80, "+80 Chips (Flush)"); }
  },
  {
    id: "half-joker",
    name: "Half Joker",
    rarity: "common",
    cost: 5,
    desc: "+20 Mult if played hand contains 3 or fewer cards",
    apply(ctx) { if ((ctx.playedCount || playedCards(ctx).length) <= 3) addMult(ctx, 20, "+20 Mult (3 or fewer cards)"); }
  },
  {
    id: "joker-stencil",
    name: "Joker Stencil",
    rarity: "uncommon",
    cost: 8,
    desc: "X1 Mult for each empty Joker slot. Joker Stencil included",
    apply(ctx, joker, state) {
      const s = stateOf(ctx, state);
      const max = s.maxJokers || ctx.maxJokers || 5;
      const count = s.jokers ? s.jokers.length : (ctx.jokerCount || 1);
      const x = Math.max(1, max - count + 1);
      multMult(ctx, x, `x${x} Mult (Joker Stencil)`);
    }
  },
  {
    id: "four-fingers",
    name: "Four Fingers",
    rarity: "uncommon",
    cost: 7,
    desc: "All Flushes and Straights can be made with 4 cards",
    passive: { fourFingers: true },
    apply: noop
  },
  {
    id: "mime",
    name: "Mime",
    rarity: "uncommon",
    cost: 5,
    desc: "Retrigger all card held in hand abilities",
    retrigger(card, ctx) { return heldCards(ctx).includes(card) ? 1 : 0; }
  },
  {
    id: "credit-card",
    name: "Credit Card",
    rarity: "common",
    cost: 1,
    desc: "Go up to -$20 in debt",
    passive: { creditDebt: 20 },
    apply: noop
  },
  {
    id: "ceremonial-dagger",
    name: "Ceremonial Dagger",
    rarity: "uncommon",
    cost: 6,
    desc: "When Blind is selected, destroy Joker to the right and permanently add double its sell value to this Mult",
    onBlindSelect(state, joker) {
      const index = jokerIndex(state, joker);
      joker.mult = joker.mult || 0;
      if (index < 0 || !state.jokers || index >= state.jokers.length - 1) return;
      const victim = state.jokers.splice(index + 1, 1)[0];
      joker.mult += 2 * sellValue(victim);
    },
    apply(ctx, joker) { if (joker.mult) addMult(ctx, joker.mult, `+${joker.mult} Mult (Ceremonial Dagger)`); }
  },
  {
    id: "banner",
    name: "Banner",
    rarity: "common",
    cost: 5,
    desc: "+30 Chips for each remaining discard",
    apply(ctx) {
      const chips = 30 * (ctx.discardsLeft || 0);
      if (chips) addChips(ctx, chips, `+${chips} Chips (discards)`);
    }
  },
  {
    id: "mystic-summit",
    name: "Mystic Summit",
    rarity: "common",
    cost: 5,
    desc: "+15 Mult when 0 discards remaining",
    apply(ctx) { if ((ctx.discardsLeft || 0) === 0) addMult(ctx, 15, "+15 Mult (no discards)"); }
  },
  {
    id: "marble-joker",
    name: "Marble Joker",
    rarity: "uncommon",
    cost: 6,
    desc: "Adds one Stone card to deck when Blind is selected",
    onBlindSelect(state) { addPlayingCard(state, { rank: "A", suit: randSuit(), enhancement: "stone", stone: true }); },
    apply: noop
  },
  {
    id: "loyalty-card",
    name: "Loyalty Card",
    rarity: "uncommon",
    cost: 5,
    desc: "X4 Mult every 6 hands played",
    onPlay(state, joker) { joker.counter = (joker.counter || 0) + 1; },
    apply(ctx, joker) {
      if ((joker.counter || 0) >= 6) {
        multMult(ctx, 4, "x4 Mult (Loyalty Card)");
        joker.counter = 0;
      }
    }
  },
  {
    id: "eight-ball",
    name: "8 Ball",
    rarity: "common",
    cost: 5,
    desc: "1 in 4 chance for each played 8 to create a Tarot card when scored",
    onCard(card, ctx, joker, state) {
      if (!card.debuffed && card.rank === "8" && chance(1, 4, state)) addConsumable(stateOf(ctx, state), "tarot", "Random Tarot");
    }
  },
  {
    id: "misprint",
    name: "Misprint",
    rarity: "common",
    cost: 4,
    desc: "+0 to +23 Mult",
    apply(ctx) {
      const mult = randInt(0, 23);
      addMult(ctx, mult, `+${mult} Mult (Misprint)`);
    }
  },
  {
    id: "dusk",
    name: "Dusk",
    rarity: "uncommon",
    cost: 5,
    desc: "Retrigger all played cards in final hand of round",
    retrigger(card, ctx, joker, state) { return (stateOf(ctx, state).handsLeft || ctx.handsLeft || 0) === 1 ? 1 : 0; }
  },
  {
    id: "raised-fist",
    name: "Raised Fist",
    rarity: "common",
    cost: 5,
    desc: "Adds double the rank of lowest ranked card held in hand to Mult",
    apply(ctx) {
      const held = heldCards(ctx).slice().sort((a, b) => rankValue(a) - rankValue(b));
      if (!held.length) return;
      const mult = 2 * rankValue(held[0]);
      addMult(ctx, mult, `+${mult} Mult (Raised Fist)`);
    }
  },
  {
    id: "chaos-the-clown",
    name: "Chaos the Clown",
    rarity: "common",
    cost: 4,
    desc: "1 free Reroll per shop",
    passive: { freeReroll: true },
    apply: noop
  },
  {
    id: "fibonacci",
    name: "Fibonacci",
    rarity: "uncommon",
    cost: 8,
    desc: "Each played Ace, 2, 3, 5, or 8 gives +8 Mult when scored",
    onCard(card, ctx) { if (!card.debuffed && ["A", "2", "3", "5", "8"].includes(card.rank)) addMult(ctx, 8, "Fibonacci +8 Mult"); }
  },
  {
    id: "steel-joker",
    name: "Steel Joker",
    rarity: "uncommon",
    cost: 7,
    desc: "Gives X0.2 Mult for each Steel card in your full deck",
    apply(ctx, joker, state) {
      const count = allKnownCards(ctx, state).filter((c) => c.enhancement === "steel" || c.steel).length;
      const x = 1 + 0.2 * count;
      if (x !== 1) multMult(ctx, x, `x${fmtNum(x)} Mult (Steel cards)`);
    }
  },
  {
    id: "scary-face",
    name: "Scary Face",
    rarity: "common",
    cost: 4,
    desc: "Played face cards give +30 Chips when scored",
    onCard(card, ctx, joker, state) { if (cardIsFace(card, state) && !card.debuffed) addChips(ctx, 30, "Face +30 Chips"); }
  },
  {
    id: "abstract-joker",
    name: "Abstract Joker",
    rarity: "common",
    cost: 4,
    desc: "+3 Mult for each Joker card",
    apply(ctx, joker, state) {
      const count = stateOf(ctx, state).jokers ? stateOf(ctx, state).jokers.length : (ctx.jokerCount || 0);
      addMult(ctx, 3 * count, `+${3 * count} Mult (Jokers)`);
    }
  },
  {
    id: "delayed-gratification",
    name: "Delayed Gratification",
    rarity: "common",
    cost: 4,
    desc: "Earn $2 per discard if no discards are used by end of round",
    onDiscard(state, joker) { joker.discarded = true; },
    endRound(state, joker) {
      if (!joker.discarded) addMoney(state, null, 2 * (state.discardsLeft || 0));
      joker.discarded = false;
    },
    apply: noop
  },
  {
    id: "hack",
    name: "Hack",
    rarity: "uncommon",
    cost: 6,
    desc: "Retrigger each played 2, 3, 4, or 5",
    retrigger(card) { return ["2", "3", "4", "5"].includes(card.rank) && !card.debuffed ? 1 : 0; }
  },
  {
    id: "pareidolia",
    name: "Pareidolia",
    rarity: "uncommon",
    cost: 5,
    desc: "All cards are considered face cards",
    passive: { pareidolia: true },
    onBlindSelect(state) { ensureFlags(state).pareidolia = true; },
    apply: noop
  },
  {
    id: "gros-michel",
    name: "Gros Michel",
    rarity: "common",
    cost: 5,
    desc: "+15 Mult. 1 in 6 chance this card is destroyed at end of round",
    apply(ctx) { addMult(ctx, 15, "+15 Mult (Gros Michel)"); },
    endRound(state, joker) {
      if (chance(1, 6, state)) {
        removeJoker(state, joker);
        state.grosExtinct = true;
      }
    }
  },
  {
    id: "even-steven",
    name: "Even Steven",
    rarity: "common",
    cost: 4,
    desc: "Played cards with even rank give +4 Mult when scored",
    onCard(card, ctx) { if (!card.debuffed && ["2", "4", "6", "8", "10"].includes(card.rank)) addMult(ctx, 4, "Even +4 Mult"); }
  },
  {
    id: "odd-todd",
    name: "Odd Todd",
    rarity: "common",
    cost: 4,
    desc: "Played cards with odd rank give +31 Chips when scored",
    onCard(card, ctx) { if (!card.debuffed && ["A", "3", "5", "7", "9"].includes(card.rank)) addChips(ctx, 31, "Odd +31 Chips"); }
  },
  {
    id: "scholar",
    name: "Scholar",
    rarity: "common",
    cost: 4,
    desc: "Played Aces give +20 Chips and +4 Mult when scored",
    onCard(card, ctx) { if (!card.debuffed && card.rank === "A") { addChips(ctx, 20, "Ace +20 Chips"); addMult(ctx, 4, "Ace +4 Mult"); } }
  },
  {
    id: "business-card",
    name: "Business Card",
    rarity: "common",
    cost: 4,
    desc: "Played face cards have a 1 in 2 chance to give $2 when scored",
    onCard(card, ctx, joker, state) { if (!card.debuffed && cardIsFace(card, state) && chance(1, 2, state)) addMoney(stateOf(ctx, state), ctx, 2); }
  },
  {
    id: "supernova",
    name: "Supernova",
    rarity: "common",
    cost: 5,
    desc: "Adds the number of times poker hand has been played this run to Mult",
    apply(ctx) {
      const mult = (ctx.handPlays && ctx.handPlays[ctx.handName]) || 0;
      addMult(ctx, mult, `+${mult} Mult (Supernova)`);
    }
  },
  {
    id: "ride-the-bus",
    name: "Ride the Bus",
    rarity: "common",
    cost: 6,
    desc: "+1 Mult per consecutive hand played without a scoring face card",
    apply(ctx, joker, state) {
      const hadFace = scoringCards(ctx).some((c) => cardIsFace(c, state) && !c.debuffed);
      joker.mult = hadFace ? 0 : (joker.mult || 0) + 1;
      if (joker.mult) addMult(ctx, joker.mult, `+${joker.mult} Mult (Ride the Bus)`);
    }
  },
  {
    id: "space-joker",
    name: "Space Joker",
    rarity: "uncommon",
    cost: 5,
    desc: "1 in 4 chance to upgrade level of played poker hand",
    onPlay(state, joker, evaled) { if (evaled && evaled.name && chance(1, 4, state)) levelHand(state, evaled.name, 1); },
    apply: noop
  },
  {
    id: "egg",
    name: "Egg",
    rarity: "common",
    cost: 4,
    desc: "Gains $3 of sell value at end of round",
    endRound(state, joker) { joker.extraSell = (joker.extraSell || 0) + 3; },
    apply: noop
  },
  {
    id: "burglar",
    name: "Burglar",
    rarity: "uncommon",
    cost: 6,
    desc: "When Blind is selected, gain +3 Hands and lose all discards",
    onBlindSelect(state) {
      state.handsLeft = (state.handsLeft || 0) + 3;
      state.discardsLeft = 0;
    },
    apply: noop
  },
  {
    id: "blackboard",
    name: "Blackboard",
    rarity: "uncommon",
    cost: 6,
    desc: "X3 Mult if all cards held in hand are Spades or Clubs",
    apply(ctx, joker, state) {
      const held = heldCards(ctx);
      if (held.length && held.every((c) => cardHasSuit(c, "spades", state) || cardHasSuit(c, "clubs", state))) multMult(ctx, 3, "x3 Mult (Blackboard)");
    }
  },
  {
    id: "runner",
    name: "Runner",
    rarity: "common",
    cost: 5,
    desc: "Gains +15 Chips if played hand contains a Straight",
    apply(ctx, joker) {
      if (handContains(ctx.handName, "Straight")) joker.chips = (joker.chips || 0) + 15;
      if (joker.chips) addChips(ctx, joker.chips, `+${joker.chips} Chips (Runner)`);
    }
  },
  {
    id: "ice-cream",
    name: "Ice Cream",
    rarity: "common",
    cost: 5,
    desc: "+100 Chips. Loses 5 Chips for every hand played",
    apply(ctx, joker) {
      joker.chips = joker.chips ?? 100;
      addChips(ctx, Math.max(0, joker.chips), `+${Math.max(0, joker.chips)} Chips (Ice Cream)`);
      joker.chips = Math.max(0, joker.chips - 5);
    }
  },
  {
    id: "dna",
    name: "DNA",
    rarity: "rare",
    cost: 8,
    desc: "If first hand of round has only 1 card, add a permanent copy to deck and draw it to hand",
    onPlay(state, joker, evaled, played) {
      if ((state.handsLeft || 0) === (state.startingHands || 4) && played && played.length === 1) {
        const copy = cloneCard(played[0]);
        addPlayingCard(state, copy);
        if (state.hand) state.hand.push(cloneCard(played[0]));
      }
    },
    apply: noop
  },
  {
    id: "splash",
    name: "Splash",
    rarity: "common",
    cost: 3,
    desc: "Every played card counts in scoring",
    passive: { splash: true },
    apply: noop
  },
  {
    id: "blue-joker",
    name: "Blue Joker",
    rarity: "common",
    cost: 5,
    desc: "+2 Chips for each remaining card in deck",
    apply(ctx, joker, state) {
      const deckLeft = ctx.deckLeft ?? (stateOf(ctx, state).deck ? stateOf(ctx, state).deck.length : 0);
      addChips(ctx, 2 * deckLeft, `+${2 * deckLeft} Chips (deck)`);
    }
  },
  {
    id: "sixth-sense",
    name: "Sixth Sense",
    rarity: "uncommon",
    cost: 6,
    desc: "If first hand of round is a single 6, destroy it and create a Spectral card",
    onPlay(state, joker, evaled, played) {
      if ((state.handsLeft || 0) === (state.startingHands || 4) && played && played.length === 1 && played[0].rank === "6") {
        destroyPlayedCard(state, played[0]);
        addConsumable(state, "spectral", "Random Spectral");
      }
    },
    apply: noop
  },
  {
    id: "constellation",
    name: "Constellation",
    rarity: "uncommon",
    cost: 6,
    desc: "Gains X0.1 Mult every time a Planet card is used",
    onPlanetUse(state, joker) { joker.xmult = (joker.xmult ?? 1) + 0.1; },
    apply(ctx, joker) {
      joker.xmult = joker.xmult ?? 1;
      if (joker.xmult !== 1) multMult(ctx, joker.xmult, `x${fmtNum(joker.xmult)} Mult (Constellation)`);
    }
  },
  {
    id: "hiker",
    name: "Hiker",
    rarity: "uncommon",
    cost: 5,
    desc: "Every played card permanently gains +5 Chips when scored",
    onCard(card, ctx) {
      if (card.debuffed) return;
      card.bonusChips = (card.bonusChips || 0) + 5;
      addChips(ctx, card.bonusChips, `+${card.bonusChips} Chips (Hiker card)`);
    }
  },
  {
    id: "faceless-joker",
    name: "Faceless Joker",
    rarity: "uncommon",
    cost: 4,
    desc: "Earn $5 if 3 or more face cards are discarded at the same time",
    onDiscard(state, joker, discarded) { if ((discarded || []).filter((c) => cardIsFace(c, state)).length >= 3) addMoney(state, null, 5); },
    apply: noop
  },
  {
    id: "green-joker",
    name: "Green Joker",
    rarity: "common",
    cost: 4,
    desc: "+1 Mult per hand played. -1 Mult per discard",
    onPlay(state, joker) { joker.mult = (joker.mult || 0) + 1; },
    onDiscard(state, joker) { joker.mult = Math.max(0, (joker.mult || 0) - 1); },
    apply(ctx, joker) { if (joker.mult) addMult(ctx, joker.mult, `+${joker.mult} Mult (Green Joker)`); }
  },
  {
    id: "superposition",
    name: "Superposition",
    rarity: "common",
    cost: 4,
    desc: "Create a Tarot card if poker hand contains an Ace and a Straight",
    onPlay(state, joker, evaled, played) { if (handContains(evaled && evaled.name, "Straight") && (played || []).some((c) => c.rank === "A")) addConsumable(state, "tarot", "Random Tarot"); },
    apply: noop
  },
  {
    id: "to-do-list",
    name: "To Do List",
    rarity: "common",
    cost: 4,
    desc: "Earn $4 if played poker hand is the listed hand. Hand changes at end of round",
    onPlay(state, joker, evaled) {
      joker.hand = joker.hand || randomHandName();
      if (evaled && evaled.name === joker.hand) addMoney(state, null, 4);
    },
    endRound(state, joker) { joker.hand = randomHandName(); },
    apply: noop
  },
  {
    id: "cavendish",
    name: "Cavendish",
    rarity: "common",
    cost: 4,
    desc: "X3 Mult. 1 in 1000 chance this card is destroyed at end of round",
    unlock(state) { return !state || state.grosExtinct; },
    apply(ctx) { multMult(ctx, 3, "x3 Mult (Cavendish)"); },
    endRound(state, joker) { if (chance(1, 1000, state)) removeJoker(state, joker); }
  },
  {
    id: "card-sharp",
    name: "Card Sharp",
    rarity: "uncommon",
    cost: 6,
    desc: "X3 Mult if played poker hand has already been played this round",
    apply(ctx, joker, state) {
      const s = stateOf(ctx, state);
      const roundPlays = s.roundHandPlays || ctx.roundHandPlays || ctx.handPlays || {};
      if ((roundPlays[ctx.handName] || 0) > 0) multMult(ctx, 3, "x3 Mult (repeat hand)");
    }
  },
  {
    id: "red-card",
    name: "Red Card",
    rarity: "common",
    cost: 5,
    desc: "Gains +3 Mult when any Booster Pack is skipped",
    onBoosterSkip(state, joker) { joker.mult = (joker.mult || 0) + 3; },
    apply(ctx, joker) { if (joker.mult) addMult(ctx, joker.mult, `+${joker.mult} Mult (Red Card)`); }
  },
  {
    id: "madness",
    name: "Madness",
    rarity: "uncommon",
    cost: 7,
    desc: "When Blind is selected, gains X0.5 Mult and destroys a random Joker",
    onBlindSelect(state, joker) {
      joker.xmult = (joker.xmult ?? 1) + 0.5;
      const others = (state.jokers || []).filter((j) => j !== joker && j.uid !== joker.uid && !j.eternal);
      if (others.length) removeJoker(state, randomChoice(others));
    },
    apply(ctx, joker) {
      joker.xmult = joker.xmult ?? 1;
      if (joker.xmult !== 1) multMult(ctx, joker.xmult, `x${fmtNum(joker.xmult)} Mult (Madness)`);
    }
  },
  {
    id: "square-joker",
    name: "Square Joker",
    rarity: "common",
    cost: 4,
    desc: "Gains +4 Chips if played hand has exactly 4 cards",
    apply(ctx, joker) {
      if ((ctx.playedCount || playedCards(ctx).length) === 4) joker.chips = (joker.chips || 0) + 4;
      if (joker.chips) addChips(ctx, joker.chips, `+${joker.chips} Chips (Square Joker)`);
    }
  },
  {
    id: "seance",
    name: "Seance",
    rarity: "uncommon",
    cost: 6,
    desc: "If played hand is a Straight Flush, create a Spectral card",
    onPlay(state, joker, evaled) { if (evaled && (evaled.name === "Straight Flush" || evaled.name === "Royal Flush")) addConsumable(state, "spectral", "Random Spectral"); },
    apply: noop
  },
  {
    id: "riff-raff",
    name: "Riff-raff",
    rarity: "common",
    cost: 6,
    desc: "When Blind is selected, create 2 Common Jokers",
    onBlindSelect(state) {
      createJoker(state, "common");
      createJoker(state, "common");
    },
    apply: noop
  },
  {
    id: "vampire",
    name: "Vampire",
    rarity: "uncommon",
    cost: 7,
    desc: "Gains X0.1 Mult per scoring Enhanced card. Removes card Enhancement",
    apply(ctx, joker) {
      joker.xmult = joker.xmult ?? 1;
      for (const card of scoringCards(ctx)) {
        if (card.enhancement && card.enhancement !== "stone") {
          joker.xmult += 0.1;
          delete card.enhancement;
        }
      }
      multMult(ctx, joker.xmult, `x${fmtNum(joker.xmult)} Mult (Vampire)`);
    }
  },
  {
    id: "shortcut",
    name: "Shortcut",
    rarity: "uncommon",
    cost: 7,
    desc: "Allows Straights to be made with gaps of 1 rank",
    passive: { shortcut: true },
    apply: noop
  },
  {
    id: "hologram",
    name: "Hologram",
    rarity: "uncommon",
    cost: 7,
    desc: "Gains X0.25 Mult every time a playing card is added to your deck",
    onCardAdded(state, joker) { joker.xmult = (joker.xmult ?? 1) + 0.25; },
    apply(ctx, joker) {
      joker.xmult = joker.xmult ?? 1;
      if (joker.xmult !== 1) multMult(ctx, joker.xmult, `x${fmtNum(joker.xmult)} Mult (Hologram)`);
    }
  },
  {
    id: "vagabond",
    name: "Vagabond",
    rarity: "rare",
    cost: 8,
    desc: "Create a Tarot card if hand is played with $4 or less",
    onPlay(state) { if ((state.money || 0) <= 4) addConsumable(state, "tarot", "Random Tarot"); },
    apply: noop
  },
  {
    id: "baron",
    name: "Baron",
    rarity: "rare",
    cost: 8,
    desc: "Each King held in hand gives X1.5 Mult",
    onHeld(card, ctx) { if (card.rank === "K" && !card.debuffed) multMult(ctx, 1.5, "King held x1.5 Mult"); }
  },
  {
    id: "cloud-9",
    name: "Cloud 9",
    rarity: "uncommon",
    cost: 7,
    desc: "Earn $1 for each 9 in your full deck at end of round",
    endRound(state) { addMoney(state, null, allKnownCards(null, state).filter((c) => c.rank === "9").length); },
    apply: noop
  },
  {
    id: "rocket",
    name: "Rocket",
    rarity: "uncommon",
    cost: 6,
    desc: "Earn $1 at end of round. Payout increases by $2 when Boss Blind is defeated",
    endRound(state, joker) {
      joker.payout = joker.payout ?? 1;
      addMoney(state, null, joker.payout);
      if (state.blind && state.blind.kind === "boss") joker.payout += 2;
    },
    apply: noop
  },
  {
    id: "obelisk",
    name: "Obelisk",
    rarity: "rare",
    cost: 8,
    desc: "Gains X0.2 Mult per consecutive hand played without playing your most played poker hand",
    apply(ctx, joker) {
      const plays = ctx.handPlays || {};
      const max = Math.max(0, ...Object.values(plays));
      if ((plays[ctx.handName] || 0) >= max && max > 0) joker.xmult = 1;
      else joker.xmult = (joker.xmult ?? 1) + 0.2;
      if ((joker.xmult ?? 1) !== 1) multMult(ctx, joker.xmult, `x${fmtNum(joker.xmult)} Mult (Obelisk)`);
    }
  },
  {
    id: "midas-mask",
    name: "Midas Mask",
    rarity: "uncommon",
    cost: 7,
    desc: "All played face cards become Gold cards when scored",
    onCard(card, ctx, joker, state) { if (!card.debuffed && cardIsFace(card, state)) card.enhancement = "gold"; }
  },
  {
    id: "luchador",
    name: "Luchador",
    rarity: "uncommon",
    cost: 5,
    desc: "Sell this card to disable the current Boss Blind",
    sell(state) { ensureFlags(state).bossDisabled = true; if (state.boss) state.boss.disabled = true; },
    apply: noop
  },
  {
    id: "photograph",
    name: "Photograph",
    rarity: "common",
    cost: 5,
    desc: "First played face card gives X2 Mult when scored",
    onCard(card, ctx, joker, state) {
      if (!ctx._photographUsed && !card.debuffed && cardIsFace(card, state)) {
        ctx._photographUsed = true;
        multMult(ctx, 2, "Photograph x2 Mult");
      }
    }
  },
  {
    id: "gift-card",
    name: "Gift Card",
    rarity: "uncommon",
    cost: 6,
    desc: "Add $1 of sell value to every Joker and Consumable at end of round",
    endRound(state) {
      for (const item of [...(state.jokers || []), ...(state.consumables || [])]) item.extraSell = (item.extraSell || 0) + 1;
    },
    apply: noop
  },
  {
    id: "turtle-bean",
    name: "Turtle Bean",
    rarity: "uncommon",
    cost: 6,
    desc: "+5 hand size. Reduces by 1 every round",
    onBlindSelect(state, joker) {
      joker.handSize = joker.handSize ?? 5;
      state.handSizeBonus = (state.handSizeBonus || 0) + joker.handSize;
    },
    endRound(state, joker) {
      joker.handSize = (joker.handSize ?? 5) - 1;
      if (joker.handSize <= 0) removeJoker(state, joker);
    },
    apply: noop
  },
  {
    id: "erosion",
    name: "Erosion",
    rarity: "uncommon",
    cost: 6,
    desc: "+4 Mult for each card below 52 in your full deck",
    apply(ctx, joker, state) {
      const missing = Math.max(0, 52 - allKnownCards(ctx, state).length);
      addMult(ctx, 4 * missing, `+${4 * missing} Mult (Erosion)`);
    }
  },
  {
    id: "reserved-parking",
    name: "Reserved Parking",
    rarity: "common",
    cost: 6,
    desc: "Each face card held in hand has a 1 in 2 chance to give $1",
    onHeld(card, ctx, joker, state) { if (cardIsFace(card, state) && chance(1, 2, state)) addMoney(stateOf(ctx, state), ctx, 1); }
  },
  {
    id: "mail-in-rebate",
    name: "Mail-In Rebate",
    rarity: "common",
    cost: 5,
    desc: "Earn $5 for each discarded card of a random rank. Rank changes every round",
    onDiscard(state, joker, discarded) {
      joker.rank = joker.rank || randomRank();
      addMoney(state, null, 5 * (discarded || []).filter((c) => c.rank === joker.rank).length);
    },
    endRound(state, joker) { joker.rank = randomRank(); },
    apply: noop
  },
  {
    id: "to-the-moon",
    name: "To the Moon",
    rarity: "uncommon",
    cost: 5,
    desc: "Earn an extra $1 of interest for every $5 you have at end of round",
    passive: { interestBonus: 1 },
    endRound(state) { addMoney(state, null, Math.floor(Math.max(0, state.money || 0) / 5)); },
    apply: noop
  },
  {
    id: "hallucination",
    name: "Hallucination",
    rarity: "common",
    cost: 4,
    desc: "1 in 2 chance to create a Tarot card when any Booster Pack is opened",
    onBoosterOpen(state) { if (chance(1, 2, state)) addConsumable(state, "tarot", "Random Tarot"); },
    apply: noop
  },
  {
    id: "fortune-teller",
    name: "Fortune Teller",
    rarity: "common",
    cost: 6,
    desc: "+1 Mult per Tarot card used this run",
    onTarotUse(state, joker) { joker.mult = (joker.mult || 0) + 1; },
    apply(ctx, joker, state) {
      const mult = joker.mult ?? (stateOf(ctx, state).tarotsUsed || 0);
      if (mult) addMult(ctx, mult, `+${mult} Mult (Fortune Teller)`);
    }
  },
  {
    id: "juggler",
    name: "Juggler",
    rarity: "common",
    cost: 4,
    desc: "+1 hand size",
    passive: { handSize: 1 },
    onBlindSelect(state) { state.handSizeBonus = (state.handSizeBonus || 0) + 1; },
    apply: noop
  },
  {
    id: "drunkard",
    name: "Drunkard",
    rarity: "common",
    cost: 4,
    desc: "+1 discard each round",
    passive: { discards: 1 },
    onBlindSelect(state) { state.discardsLeft = (state.discardsLeft || 0) + 1; },
    apply: noop
  },
  {
    id: "stone-joker",
    name: "Stone Joker",
    rarity: "uncommon",
    cost: 6,
    desc: "+25 Chips for each Stone card in your full deck",
    apply(ctx, joker, state) {
      const count = allKnownCards(ctx, state).filter((c) => c.enhancement === "stone" || c.stone).length;
      addChips(ctx, 25 * count, `+${25 * count} Chips (Stone cards)`);
    }
  },
  {
    id: "golden-joker",
    name: "Golden Joker",
    rarity: "common",
    cost: 6,
    desc: "Earn $4 at end of round",
    endRound(state) { addMoney(state, null, 4); },
    apply: noop
  },
  {
    id: "lucky-cat",
    name: "Lucky Cat",
    rarity: "uncommon",
    cost: 6,
    desc: "Gains X0.25 Mult every time a Lucky card successfully triggers",
    onLuckyTrigger(state, joker) { joker.xmult = (joker.xmult ?? 1) + 0.25; },
    apply(ctx, joker) {
      joker.xmult = joker.xmult ?? 1;
      if (joker.xmult !== 1) multMult(ctx, joker.xmult, `x${fmtNum(joker.xmult)} Mult (Lucky Cat)`);
    }
  },
  {
    id: "baseball-card",
    name: "Baseball Card",
    rarity: "rare",
    cost: 8,
    desc: "Uncommon Jokers each give X1.5 Mult",
    apply(ctx, joker, state) {
      for (const j of stateOf(ctx, state).jokers || []) {
        if (j !== joker && j.rarity === "uncommon") multMult(ctx, 1.5, "Uncommon Joker x1.5 Mult");
      }
    }
  },
  {
    id: "bull",
    name: "Bull",
    rarity: "uncommon",
    cost: 6,
    desc: "+2 Chips for each $1 you have",
    apply(ctx, joker, state) {
      const money = ctx.money ?? stateOf(ctx, state).money ?? 0;
      addChips(ctx, 2 * money, `+${2 * money} Chips (money)`);
    }
  },
  {
    id: "diet-cola",
    name: "Diet Cola",
    rarity: "uncommon",
    cost: 6,
    desc: "Sell this card to create a Double Tag",
    sell(state) { addTag(state, "double"); },
    apply: noop
  },
  {
    id: "trading-card",
    name: "Trading Card",
    rarity: "uncommon",
    cost: 6,
    desc: "If first discard of round has only 1 card, destroy it and earn $3",
    onDiscard(state, joker, discarded) {
      if (!joker.usedThisRound && discarded && discarded.length === 1) {
        joker.usedThisRound = true;
        destroyPlayedCard(state, discarded[0]);
        addMoney(state, null, 3);
      }
    },
    endRound(state, joker) { joker.usedThisRound = false; },
    apply: noop
  },
  {
    id: "flash-card",
    name: "Flash Card",
    rarity: "uncommon",
    cost: 5,
    desc: "Gains +2 Mult per reroll in the shop",
    onReroll(state, joker) { joker.mult = (joker.mult || 0) + 2; },
    apply(ctx, joker) { if (joker.mult) addMult(ctx, joker.mult, `+${joker.mult} Mult (Flash Card)`); }
  },
  {
    id: "popcorn",
    name: "Popcorn",
    rarity: "common",
    cost: 5,
    desc: "+20 Mult. Loses 4 Mult every round",
    apply(ctx, joker) {
      joker.mult = joker.mult ?? 20;
      addMult(ctx, Math.max(0, joker.mult), `+${Math.max(0, joker.mult)} Mult (Popcorn)`);
    },
    endRound(state, joker) {
      joker.mult = Math.max(0, (joker.mult ?? 20) - 4);
      if (joker.mult <= 0) removeJoker(state, joker);
    }
  },
  {
    id: "spare-trousers",
    name: "Spare Trousers",
    rarity: "uncommon",
    cost: 6,
    desc: "Gains +2 Mult if played hand contains Two Pair",
    apply(ctx, joker) {
      if (handContains(ctx.handName, "Two Pair")) joker.mult = (joker.mult || 0) + 2;
      if (joker.mult) addMult(ctx, joker.mult, `+${joker.mult} Mult (Spare Trousers)`);
    }
  },
  {
    id: "ancient-joker",
    name: "Ancient Joker",
    rarity: "rare",
    cost: 8,
    desc: "Each played card with a random suit gives X1.5 Mult. Suit changes every round",
    onCard(card, ctx, joker, state) {
      joker.suit = joker.suit || randSuit();
      if (!card.debuffed && cardHasSuit(card, joker.suit, state)) multMult(ctx, 1.5, `${suitName(joker.suit)} x1.5 Mult`);
    },
    endRound(state, joker) { joker.suit = randSuit(); }
  },
  {
    id: "ramen",
    name: "Ramen",
    rarity: "uncommon",
    cost: 6,
    desc: "X2 Mult. Loses X0.01 Mult per card discarded",
    onDiscard(state, joker, discarded) { joker.xmult = Math.max(1, (joker.xmult ?? 2) - 0.01 * ((discarded && discarded.length) || 0)); },
    apply(ctx, joker) {
      joker.xmult = joker.xmult ?? 2;
      multMult(ctx, joker.xmult, `x${fmtNum(joker.xmult)} Mult (Ramen)`);
    }
  },
  {
    id: "walkie-talkie",
    name: "Walkie Talkie",
    rarity: "common",
    cost: 4,
    desc: "Played 10s and 4s give +10 Chips and +4 Mult when scored",
    onCard(card, ctx) {
      if (!card.debuffed && (card.rank === "10" || card.rank === "4")) {
        addChips(ctx, 10, "10/4 +10 Chips");
        addMult(ctx, 4, "10/4 +4 Mult");
      }
    }
  },
  {
    id: "seltzer",
    name: "Seltzer",
    rarity: "uncommon",
    cost: 6,
    desc: "Retrigger all cards played for the next 10 hands",
    onPlay(state, joker) {
      joker.counter = joker.counter ?? 10;
      joker.counter -= 1;
      if (joker.counter < 0) removeJoker(state, joker);
    },
    retrigger(card, ctx, joker) { joker.counter = joker.counter ?? 10; return joker.counter >= 0 ? 1 : 0; }
  },
  {
    id: "castle",
    name: "Castle",
    rarity: "uncommon",
    cost: 6,
    desc: "Gains +3 Chips per discarded card of a random suit. Suit changes every round",
    onDiscard(state, joker, discarded) {
      joker.suit = joker.suit || randSuit();
      joker.chips = (joker.chips || 0) + 3 * (discarded || []).filter((c) => cardHasSuit(c, joker.suit, state)).length;
    },
    endRound(state, joker) { joker.suit = randSuit(); },
    apply(ctx, joker) { if (joker.chips) addChips(ctx, joker.chips, `+${joker.chips} Chips (Castle)`); }
  },
  {
    id: "smiley-face",
    name: "Smiley Face",
    rarity: "common",
    cost: 4,
    desc: "Played face cards give +5 Mult when scored",
    onCard(card, ctx, joker, state) { if (!card.debuffed && cardIsFace(card, state)) addMult(ctx, 5, "Face +5 Mult"); }
  },
  {
    id: "campfire",
    name: "Campfire",
    rarity: "rare",
    cost: 9,
    desc: "Gains X0.25 Mult for each card sold. Resets when Boss Blind is defeated",
    onSellCard(state, joker) { joker.xmult = (joker.xmult ?? 1) + 0.25; },
    apply(ctx, joker) {
      joker.xmult = joker.xmult ?? 1;
      if (joker.xmult !== 1) multMult(ctx, joker.xmult, `x${fmtNum(joker.xmult)} Mult (Campfire)`);
    },
    endRound(state, joker) { if (state.blind && state.blind.kind === "boss") joker.xmult = 1; }
  },
  {
    id: "golden-ticket",
    name: "Golden Ticket",
    rarity: "common",
    cost: 5,
    desc: "Played Gold cards earn $4 when scored",
    onCard(card, ctx, joker, state) { if (!card.debuffed && (card.enhancement === "gold" || card.gold)) addMoney(stateOf(ctx, state), ctx, 4); }
  },
  {
    id: "mr-bones",
    name: "Mr. Bones",
    rarity: "uncommon",
    cost: 5,
    desc: "Prevents Death if chips scored are at least 25% of required chips. Self destructs",
    onLose(state, joker) {
      if ((state.score || 0) >= 0.25 * (state.target || 0)) {
        state.phase = "cashOut";
        removeJoker(state, joker);
        return true;
      }
      return false;
    },
    apply: noop
  },
  {
    id: "acrobat",
    name: "Acrobat",
    rarity: "uncommon",
    cost: 6,
    desc: "X3 Mult on final hand of round",
    apply(ctx, joker, state) { if ((stateOf(ctx, state).handsLeft || ctx.handsLeft || 0) === 1) multMult(ctx, 3, "x3 Mult (Acrobat)"); }
  },
  {
    id: "sock-and-buskin",
    name: "Sock and Buskin",
    rarity: "uncommon",
    cost: 6,
    desc: "Retrigger all played face cards",
    retrigger(card, ctx, joker, state) { return cardIsFace(card, state) && !card.debuffed ? 1 : 0; }
  },
  {
    id: "swashbuckler",
    name: "Swashbuckler",
    rarity: "common",
    cost: 4,
    desc: "Adds the sell value of all other owned Jokers to Mult",
    apply(ctx, joker, state) {
      const mult = (stateOf(ctx, state).jokers || []).filter((j) => j !== joker && j.uid !== joker.uid).reduce((sum, j) => sum + sellValue(j), 0);
      if (mult) addMult(ctx, mult, `+${mult} Mult (Swashbuckler)`);
    }
  },
  {
    id: "troubadour",
    name: "Troubadour",
    rarity: "uncommon",
    cost: 6,
    desc: "+2 hand size, -1 hand each round",
    passive: { handSize: 2, hands: -1 },
    onBlindSelect(state) {
      state.handSizeBonus = (state.handSizeBonus || 0) + 2;
      state.handsLeft = Math.max(0, (state.handsLeft || 0) - 1);
    },
    apply: noop
  },
  {
    id: "certificate",
    name: "Certificate",
    rarity: "uncommon",
    cost: 6,
    desc: "When round begins, add a random playing card with a random seal to your hand",
    onBlindSelect(state) {
      const card = { rank: randomRank(), suit: randSuit(), seal: randomChoice(["red", "blue", "gold", "purple"]) };
      if (state.hand) state.hand.push(card);
    },
    apply: noop
  },
  {
    id: "smeared-joker",
    name: "Smeared Joker",
    rarity: "uncommon",
    cost: 7,
    desc: "Hearts and Diamonds count as the same suit; Clubs and Spades count as the same suit",
    passive: { smeared: true },
    onBlindSelect(state) { ensureFlags(state).smeared = true; },
    apply: noop
  },
  {
    id: "throwback",
    name: "Throwback",
    rarity: "uncommon",
    cost: 6,
    desc: "Gains X0.25 Mult for each Blind skipped this run",
    onBlindSkip(state, joker) { joker.xmult = (joker.xmult ?? 1) + 0.25; },
    apply(ctx, joker, state) {
      joker.xmult = joker.xmult ?? (1 + 0.25 * (stateOf(ctx, state).blindsSkipped || 0));
      if (joker.xmult !== 1) multMult(ctx, joker.xmult, `x${fmtNum(joker.xmult)} Mult (Throwback)`);
    }
  },
  {
    id: "hanging-chad",
    name: "Hanging Chad",
    rarity: "common",
    cost: 4,
    desc: "Retrigger first played card used in scoring 2 additional times",
    retrigger(card, ctx) { return scoringCards(ctx)[0] === card ? 2 : 0; }
  },
  {
    id: "rough-gem",
    name: "Rough Gem",
    rarity: "common",
    cost: 7,
    desc: "Played Diamonds earn $1 when scored",
    onCard(card, ctx, joker, state) { if (!card.debuffed && cardHasSuit(card, "diamonds", state)) addMoney(stateOf(ctx, state), ctx, 1); }
  },
  {
    id: "bloodstone",
    name: "Bloodstone",
    rarity: "uncommon",
    cost: 7,
    desc: "Played Hearts have a 1 in 2 chance to give X1.5 Mult when scored",
    onCard(card, ctx, joker, state) { if (!card.debuffed && cardHasSuit(card, "hearts", state) && chance(1, 2, state)) multMult(ctx, 1.5, "Heart x1.5 Mult"); }
  },
  {
    id: "arrowhead",
    name: "Arrowhead",
    rarity: "uncommon",
    cost: 7,
    desc: "Played Spades give +50 Chips when scored",
    onCard(card, ctx, joker, state) { if (!card.debuffed && cardHasSuit(card, "spades", state)) addChips(ctx, 50, "Spade +50 Chips"); }
  },
  {
    id: "onyx-agate",
    name: "Onyx Agate",
    rarity: "uncommon",
    cost: 7,
    desc: "Played Clubs give +7 Mult when scored",
    onCard(card, ctx, joker, state) { if (!card.debuffed && cardHasSuit(card, "clubs", state)) addMult(ctx, 7, "Club +7 Mult"); }
  },
  {
    id: "glass-joker",
    name: "Glass Joker",
    rarity: "uncommon",
    cost: 6,
    desc: "Gains X0.75 Mult for every Glass card that is destroyed",
    onGlassDestroyed(state, joker) { joker.xmult = (joker.xmult ?? 1) + 0.75; },
    apply(ctx, joker) {
      joker.xmult = joker.xmult ?? 1;
      if (joker.xmult !== 1) multMult(ctx, joker.xmult, `x${fmtNum(joker.xmult)} Mult (Glass Joker)`);
    }
  },
  {
    id: "showman",
    name: "Showman",
    rarity: "uncommon",
    cost: 5,
    desc: "Joker, Tarot, Planet, and Spectral cards may appear multiple times",
    passive: { allowDuplicates: true },
    apply: noop
  },
  {
    id: "flower-pot",
    name: "Flower Pot",
    rarity: "uncommon",
    cost: 6,
    desc: "X3 Mult if scoring hand contains a Diamond, Club, Heart, and Spade card",
    apply(ctx, joker, state) {
      const cards = scoringCards(ctx);
      if (["diamonds", "clubs", "hearts", "spades"].every((suit) => cards.some((c) => cardHasSuit(c, suit, state)))) multMult(ctx, 3, "x3 Mult (Flower Pot)");
    }
  },
  {
    id: "blueprint",
    name: "Blueprint",
    rarity: "rare",
    cost: 10,
    desc: "Copies ability of Joker to the right",
    copy: "right",
    apply: noop
  },
  {
    id: "wee-joker",
    name: "Wee Joker",
    rarity: "rare",
    cost: 8,
    desc: "Gains +8 Chips when each played 2 is scored",
    onCard(card, ctx, joker) {
      if (!card.debuffed && card.rank === "2") joker.chips = (joker.chips || 0) + 8;
    },
    apply(ctx, joker) { if (joker.chips) addChips(ctx, joker.chips, `+${joker.chips} Chips (Wee Joker)`); }
  },
  {
    id: "merry-andy",
    name: "Merry Andy",
    rarity: "uncommon",
    cost: 7,
    desc: "+3 discards each round, -1 hand size",
    passive: { discards: 3, handSize: -1 },
    onBlindSelect(state) {
      state.discardsLeft = (state.discardsLeft || 0) + 3;
      state.handSizeBonus = (state.handSizeBonus || 0) - 1;
    },
    apply: noop
  },
  {
    id: "oops-all-6s",
    name: "Oops! All 6s",
    rarity: "uncommon",
    cost: 4,
    desc: "Doubles all listed probabilities",
    passive: { doubleProbabilities: true },
    apply: noop
  },
  {
    id: "the-idol",
    name: "The Idol",
    rarity: "uncommon",
    cost: 6,
    desc: "Each played card of a random rank and suit gives X2 Mult when scored. Card changes every round",
    onCard(card, ctx, joker, state) {
      joker.rank = joker.rank || randomRank();
      joker.suit = joker.suit || randSuit();
      if (!card.debuffed && card.rank === joker.rank && cardHasSuit(card, joker.suit, state)) multMult(ctx, 2, `${joker.rank} ${suitName(joker.suit)} x2 Mult`);
    },
    endRound(state, joker) { joker.rank = randomRank(); joker.suit = randSuit(); }
  },
  {
    id: "seeing-double",
    name: "Seeing Double",
    rarity: "uncommon",
    cost: 6,
    desc: "X2 Mult if played hand has a scoring Club card and any scoring card of another suit",
    apply(ctx, joker, state) {
      const cards = scoringCards(ctx);
      const hasClub = cards.some((c) => cardHasSuit(c, "clubs", state));
      const hasOther = cards.some((c) => !cardHasSuit(c, "clubs", state));
      if (hasClub && hasOther) multMult(ctx, 2, "x2 Mult (Seeing Double)");
    }
  },
  {
    id: "matador",
    name: "Matador",
    rarity: "uncommon",
    cost: 7,
    desc: "Earn $8 if played hand triggers the Boss Blind ability",
    onBossTrigger(state) { addMoney(state, null, 8); },
    apply(ctx, joker, state) { if (stateOf(ctx, state).bossTriggered) addMoney(stateOf(ctx, state), ctx, 8); }
  },
  {
    id: "hit-the-road",
    name: "Hit the Road",
    rarity: "rare",
    cost: 8,
    desc: "Gains X0.5 Mult for every Jack discarded this round",
    onDiscard(state, joker, discarded) { joker.xmult = (joker.xmult ?? 1) + 0.5 * (discarded || []).filter((c) => c.rank === "J").length; },
    apply(ctx, joker) {
      joker.xmult = joker.xmult ?? 1;
      if (joker.xmult !== 1) multMult(ctx, joker.xmult, `x${fmtNum(joker.xmult)} Mult (Hit the Road)`);
    },
    endRound(state, joker) { joker.xmult = 1; }
  },
  {
    id: "the-duo",
    name: "The Duo",
    rarity: "rare",
    cost: 8,
    desc: "X2 Mult if played hand contains a Pair",
    apply(ctx) { if (handContains(ctx.handName, "Pair")) multMult(ctx, 2, "x2 Mult (Pair)"); }
  },
  {
    id: "the-trio",
    name: "The Trio",
    rarity: "rare",
    cost: 8,
    desc: "X3 Mult if played hand contains a Three of a Kind",
    apply(ctx) { if (handContains(ctx.handName, "Three of a Kind")) multMult(ctx, 3, "x3 Mult (Three of a Kind)"); }
  },
  {
    id: "the-family",
    name: "The Family",
    rarity: "rare",
    cost: 8,
    desc: "X4 Mult if played hand contains a Four of a Kind",
    apply(ctx) { if (handContains(ctx.handName, "Four of a Kind")) multMult(ctx, 4, "x4 Mult (Four of a Kind)"); }
  },
  {
    id: "the-order",
    name: "The Order",
    rarity: "rare",
    cost: 8,
    desc: "X3 Mult if played hand contains a Straight",
    apply(ctx) { if (handContains(ctx.handName, "Straight")) multMult(ctx, 3, "x3 Mult (Straight)"); }
  },
  {
    id: "the-tribe",
    name: "The Tribe",
    rarity: "rare",
    cost: 8,
    desc: "X2 Mult if played hand contains a Flush",
    apply(ctx) { if (handContains(ctx.handName, "Flush")) multMult(ctx, 2, "x2 Mult (Flush)"); }
  },
  {
    id: "stuntman",
    name: "Stuntman",
    rarity: "rare",
    cost: 7,
    desc: "+250 Chips, -2 hand size",
    passive: { handSize: -2 },
    onBlindSelect(state) { state.handSizeBonus = (state.handSizeBonus || 0) - 2; },
    apply(ctx) { addChips(ctx, 250, "+250 Chips (Stuntman)"); }
  },
  {
    id: "invisible-joker",
    name: "Invisible Joker",
    rarity: "rare",
    cost: 8,
    desc: "After 2 rounds, sell this card to duplicate a random Joker",
    endRound(state, joker) { joker.rounds = (joker.rounds || 0) + 1; },
    sell(state, joker) {
      if ((joker.rounds || 0) < 2) return;
      const others = (state.jokers || []).filter((j) => j !== joker && j.uid !== joker.uid);
      if (others.length) state.jokers.push({ ...randomChoice(others), uid: makeUid() });
    },
    apply: noop
  },
  {
    id: "brainstorm",
    name: "Brainstorm",
    rarity: "rare",
    cost: 10,
    desc: "Copies ability of leftmost Joker",
    copy: "leftmost",
    apply: noop
  },
  {
    id: "satellite",
    name: "Satellite",
    rarity: "uncommon",
    cost: 6,
    desc: "Earn $1 at end of round per unique Planet card used this run",
    endRound(state) {
      const used = state.planetsUsedUnique || state.planetsUsed || [];
      addMoney(state, null, Array.isArray(used) ? new Set(used).size : Object.keys(used).length);
    },
    apply: noop
  },
  {
    id: "shoot-the-moon",
    name: "Shoot the Moon",
    rarity: "common",
    cost: 5,
    desc: "Each Queen held in hand gives +13 Mult",
    onHeld(card, ctx) { if (card.rank === "Q" && !card.debuffed) addMult(ctx, 13, "Queen held +13 Mult"); }
  },
  {
    id: "drivers-license",
    name: "Driver's License",
    rarity: "rare",
    cost: 7,
    desc: "X3 Mult if you have at least 16 Enhanced cards in your full deck",
    apply(ctx, joker, state) {
      const enhanced = allKnownCards(ctx, state).filter((c) => c.enhancement || c.seal || c.edition).length;
      if (enhanced >= 16) multMult(ctx, 3, "x3 Mult (Driver's License)");
    }
  },
  {
    id: "cartomancer",
    name: "Cartomancer",
    rarity: "uncommon",
    cost: 6,
    desc: "Create a Tarot card when Blind is selected",
    onBlindSelect(state) { addConsumable(state, "tarot", "Random Tarot"); },
    apply: noop
  },
  {
    id: "astronomer",
    name: "Astronomer",
    rarity: "uncommon",
    cost: 8,
    desc: "All Planet cards and Celestial Packs in the shop are free",
    passive: { freePlanets: true, freeCelestialPacks: true },
    apply: noop
  },
  {
    id: "burnt-joker",
    name: "Burnt Joker",
    rarity: "uncommon",
    cost: 8,
    desc: "Upgrade the level of the first discarded poker hand each round",
    onDiscard(state, joker, discarded) {
      if (joker.usedThisRound || !discarded || !discarded.length || typeof evaluateHand !== "function") return;
      joker.usedThisRound = true;
      levelHand(state, evaluateHand(discarded).name, 1);
    },
    endRound(state, joker) { joker.usedThisRound = false; },
    apply: noop
  },
  {
    id: "bootstraps",
    name: "Bootstraps",
    rarity: "uncommon",
    cost: 7,
    desc: "+2 Mult for every $5 you have",
    apply(ctx, joker, state) {
      const money = ctx.money ?? stateOf(ctx, state).money ?? 0;
      const mult = 2 * Math.floor(Math.max(0, money) / 5);
      if (mult) addMult(ctx, mult, `+${mult} Mult (Bootstraps)`);
    }
  },
  {
    id: "canio",
    name: "Canio",
    rarity: "legendary",
    cost: 20,
    desc: "Gains X1 Mult when a face card is destroyed",
    onCardDestroyed(state, joker, card) { if (cardIsFace(card, state)) joker.xmult = (joker.xmult ?? 1) + 1; },
    apply(ctx, joker) {
      joker.xmult = joker.xmult ?? 1;
      if (joker.xmult !== 1) multMult(ctx, joker.xmult, `x${fmtNum(joker.xmult)} Mult (Canio)`);
    }
  },
  {
    id: "triboulet",
    name: "Triboulet",
    rarity: "legendary",
    cost: 20,
    desc: "Played Kings and Queens each give X2 Mult when scored",
    onCard(card, ctx) { if (!card.debuffed && (card.rank === "K" || card.rank === "Q")) multMult(ctx, 2, "King/Queen x2 Mult"); }
  },
  {
    id: "yorick",
    name: "Yorick",
    rarity: "legendary",
    cost: 20,
    desc: "Gains X1 Mult for every 23 cards discarded",
    onDiscard(state, joker, discarded) {
      joker.counter = (joker.counter || 0) + ((discarded && discarded.length) || 0);
      while (joker.counter >= 23) {
        joker.counter -= 23;
        joker.xmult = (joker.xmult ?? 1) + 1;
      }
    },
    apply(ctx, joker) {
      joker.xmult = joker.xmult ?? 1;
      if (joker.xmult !== 1) multMult(ctx, joker.xmult, `x${fmtNum(joker.xmult)} Mult (Yorick)`);
    }
  },
  {
    id: "chicot",
    name: "Chicot",
    rarity: "legendary",
    cost: 20,
    desc: "Disables effect of every Boss Blind",
    passive: { disableBossBlind: true },
    onBlindSelect(state) { ensureFlags(state).bossDisabled = true; if (state.boss) state.boss.disabled = true; },
    apply: noop
  },
  {
    id: "perkeo",
    name: "Perkeo",
    rarity: "legendary",
    cost: 20,
    desc: "Creates a Negative copy of 1 random Consumable card in your possession at end of shop",
    onShopLeave(state) {
      if (!state.consumables || !state.consumables.length) return;
      state.consumables.push({ ...randomChoice(state.consumables), negative: true, edition: "negative", uid: makeUid() });
    },
    apply: noop
  }
];

function getJokerDef(id) {
  return JOKER_DEFS.find((j) => j.id === id);
}

function jokersByRarity(rarity) {
  return JOKER_DEFS.filter((j) => j.rarity === rarity);
}

this.JOKER_DEFS = JOKER_DEFS;
this.getJokerDef = getJokerDef;
this.jokersByRarity = jokersByRarity;

function noop() {}

function stateOf(ctx, state) {
  return state || (ctx && ctx.state) || {};
}

function logJ(ctx, msg) {
  if (ctx && typeof ctx.log === "function") ctx.log(msg);
}

function addChips(ctx, amount, msg) {
  ctx.chips += amount;
  logJ(ctx, msg || `+${amount} Chips`);
}

function addMult(ctx, amount, msg) {
  ctx.mult += amount;
  logJ(ctx, msg || `+${amount} Mult`);
}

function multMult(ctx, amount, msg) {
  ctx.mult *= amount;
  logJ(ctx, msg || `x${fmtNum(amount)} Mult`);
}

function cardIsFace(card, state) {
  return isFace(card) || (state && state.flags && state.flags.pareidolia);
}

function ensureFlags(state) {
  state.flags = state.flags || {};
  return state.flags;
}

function cardHasSuit(card, suit, state) {
  if (!card) return false;
  if (card.suit === suit) return true;
  const smeared = state && state.flags && state.flags.smeared;
  if (!smeared) return false;
  const red = ["hearts", "diamonds"];
  const black = ["clubs", "spades"];
  return (red.includes(card.suit) && red.includes(suit)) || (black.includes(card.suit) && black.includes(suit));
}

function scoringCards(ctx) {
  return (ctx && ctx.scoringCards) || [];
}

function playedCards(ctx) {
  return (ctx && (ctx.playedCards || ctx.cards)) || scoringCards(ctx);
}

function heldCards(ctx) {
  return (ctx && ctx.heldCards) || [];
}

function rankValue(card) {
  if (!card) return 0;
  if (typeof RANK_VALUE !== "undefined" && RANK_VALUE[card.rank] != null) return RANK_VALUE[card.rank];
  if (card.rank === "A") return 14;
  if (card.rank === "K") return 13;
  if (card.rank === "Q") return 12;
  if (card.rank === "J") return 11;
  return Number(card.rank) || 0;
}

function randSuit() {
  const suits = typeof SUITS !== "undefined" ? SUITS : ["hearts", "diamonds", "clubs", "spades"];
  return randomChoice(suits);
}

function randomRank() {
  const ranks = typeof RANKS !== "undefined" ? RANKS : ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  return randomChoice(ranks);
}

function suitName(suit) {
  return suit.charAt(0).toUpperCase() + suit.slice(1);
}

function randomHandName() {
  const names = typeof HAND_DEFS !== "undefined" ? Object.keys(HAND_DEFS) : [
    "High Card", "Pair", "Two Pair", "Three of a Kind", "Straight", "Flush",
    "Full House", "Four of a Kind", "Straight Flush"
  ];
  return randomChoice(names);
}

function randomChoice(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function chance(num, den, state) {
  const flags = state && state.flags;
  const n = flags && flags.doubleProbabilities ? num * 2 : num;
  return Math.random() < n / den;
}

function addMoney(state, ctx, amount) {
  if (state) state.money = (state.money || 0) + amount;
  if (ctx) ctx.money = (ctx.money || 0) + amount;
}

function addConsumable(state, type, name) {
  if (!state) return;
  state.consumables = state.consumables || [];
  const max = state.maxConsumables || 2;
  if (state.consumables.length >= max) return;
  state.consumables.push({ uid: makeUid(), type, id: String(name || type).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), name: name || type });
}

function createJoker(state, rarity) {
  if (!state) return;
  state.jokers = state.jokers || [];
  if (state.maxJokers && state.jokers.length >= state.maxJokers) return;
  const pool = JOKER_DEFS.filter((j) => j.rarity === rarity && j.rarity !== "legendary");
  if (!pool.length) return;
  const def = randomChoice(pool);
  state.jokers.push({ uid: makeUid(), id: def.id, name: def.name, rarity: def.rarity, cost: def.cost, desc: def.desc });
}

function addPlayingCard(state, card) {
  if (!state) return;
  const copy = cloneCard(card);
  copy.id = copy.id ?? makeUid();
  if (state.deck) state.deck.push(copy);
  if (state.jokers) {
    for (const joker of state.jokers) {
      const def = getJokerDef(joker.id);
      if (def && def.onCardAdded) def.onCardAdded(state, joker, copy);
    }
  }
}

function cloneCard(card) {
  return { ...card, id: makeUid() };
}

function destroyPlayedCard(state, card) {
  if (!state || !card) return;
  for (const zone of ["hand", "deck", "discardPile"]) {
    if (Array.isArray(state[zone])) state[zone] = state[zone].filter((c) => c !== card && c.id !== card.id);
  }
  if (state.jokers) {
    for (const joker of state.jokers) {
      const def = getJokerDef(joker.id);
      if (def && def.onCardDestroyed) def.onCardDestroyed(state, joker, card);
      if (def && def.onGlassDestroyed && (card.enhancement === "glass" || card.glass)) def.onGlassDestroyed(state, joker, card);
    }
  }
}

function allKnownCards(ctx, state) {
  const s = stateOf(ctx, state);
  return [
    ...(s.deck || []),
    ...(s.hand || []),
    ...(s.discardPile || []),
    ...(ctx && ctx.deck ? ctx.deck : [])
  ];
}

function levelHand(state, handName, amount) {
  if (!state || !handName) return;
  state.levels = state.levels || {};
  state.levels[handName] = (state.levels[handName] || 1) + amount;
}

function sellValue(item) {
  return Math.floor((item.cost || 0) / 2) + (item.extraSell || 0);
}

function jokerIndex(state, joker) {
  return (state.jokers || []).findIndex((j) => j === joker || j.uid === joker.uid);
}

function removeJoker(state, joker) {
  if (!state || !state.jokers) return;
  state.jokers = state.jokers.filter((j) => j !== joker && j.uid !== joker.uid);
}

function addTag(state, tag) {
  if (!state) return;
  state.tags = state.tags || [];
  state.tags.push(tag);
}

function makeUid() {
  if (typeof uid === "function") return uid();
  return Math.floor(Math.random() * 1000000000);
}

function fmtNum(n) {
  return Math.round(n * 100) / 100;
}
