/* Card modifiers: enhancements, seals, editions */

const ENHANCEMENTS = {
  bonus: { name: "Bonus", desc: "+30 Chips when scored" },
  mult: { name: "Mult", desc: "+4 Mult when scored" },
  wild: { name: "Wild", desc: "Counts as any suit" },
  glass: { name: "Glass", desc: "×2 Mult when scored · 1 in 4 chance to destroy" },
  steel: { name: "Steel", desc: "×1.5 Mult while held in hand" },
  stone: { name: "Stone", desc: "+50 Chips · no rank or suit" },
  gold: { name: "Gold", desc: "Earn $3 if held in hand at end of round" },
  lucky: { name: "Lucky", desc: "1 in 5 +20 Mult · 1 in 15 earn $20" }
};

const SEALS = {
  gold: { name: "Gold Seal", desc: "Earn $3 when this card is scored" },
  red: { name: "Red Seal", desc: "Retrigger this card 1 time" },
  blue: { name: "Blue Seal", desc: "Creates the Planet card of last poker hand if held at end of round" },
  purple: { name: "Purple Seal", desc: "Creates a Tarot card when discarded" }
};

const EDITIONS = {
  foil: { name: "Foil", desc: "+50 Chips", costAdd: 2 },
  holographic: { name: "Holographic", desc: "+10 Mult", costAdd: 3 },
  polychrome: { name: "Polychrome", desc: "×1.5 Mult", costAdd: 5 },
  negative: { name: "Negative", desc: "+1 Joker / Consumable slot", costAdd: 5 }
};

const ENHANCEMENT_KEYS = Object.keys(ENHANCEMENTS);
const SEAL_KEYS = Object.keys(SEALS);
const PLAYING_EDITIONS = ["foil", "holographic", "polychrome"];

function randomEnhancement() {
  return ENHANCEMENT_KEYS[Math.floor(Math.random() * ENHANCEMENT_KEYS.length)];
}

function randomSeal() {
  return SEAL_KEYS[Math.floor(Math.random() * SEAL_KEYS.length)];
}

function randomPlayingEdition() {
  return PLAYING_EDITIONS[Math.floor(Math.random() * PLAYING_EDITIONS.length)];
}

function applyEnhancementEffects(card, ctx, state) {
  if (!card.enhancement || card.debuffed) return;
  switch (card.enhancement) {
    case "bonus":
      ctx.chips += 30; ctx.log("Bonus +30 Chips"); break;
    case "mult":
      ctx.mult += 4; ctx.log("Mult Card +4 Mult"); break;
    case "glass":
      ctx.mult *= 2; ctx.log("Glass ×2 Mult");
      if (chance(1, 4, state)) {
        ctx._destroyCards = ctx._destroyCards || [];
        ctx._destroyCards.push(card);
        ctx.log("Glass shattered!");
      }
      break;
    case "stone":
      ctx.chips += 50; ctx.log("Stone +50 Chips"); break;
    case "lucky": {
      if (chance(1, 5, state)) {
        ctx.mult += 20; ctx.log("Lucky +20 Mult");
        for (const j of state.jokers || []) {
          const def = getJokerDef(j.id);
          if (def && def.onLuckyTrigger) def.onLuckyTrigger(state, j);
          if (j.id === "lucky-cat") {
            j.xmult = (j.xmult || 1) + 0.25;
          }
        }
      }
      if (chance(1, 15, state)) {
        state.money = (state.money || 0) + 20;
        ctx.log("Lucky +$20");
      }
      break;
    }
    default: break;
  }
}

function applyEditionOnScore(card, ctx) {
  if (!card.edition || card.debuffed) return;
  if (card.edition === "foil") { ctx.chips += 50; ctx.log("Foil +50 Chips"); }
  if (card.edition === "holographic") { ctx.mult += 10; ctx.log("Holo +10 Mult"); }
  if (card.edition === "polychrome") { ctx.mult *= 1.5; ctx.log("Polychrome ×1.5"); }
}

function applyJokerEdition(joker, ctx) {
  if (!joker.edition) return;
  if (joker.edition === "foil") { ctx.chips += 50; ctx.log(`${joker.name} Foil +50`); }
  if (joker.edition === "holographic") { ctx.mult += 10; ctx.log(`${joker.name} Holo +10`); }
  if (joker.edition === "polychrome") { ctx.mult *= 1.5; ctx.log(`${joker.name} Poly ×1.5`); }
}

function applySteelHeld(card, ctx) {
  if (card.enhancement === "steel" && !card.debuffed) {
    ctx.mult *= 1.5;
    ctx.log("Steel ×1.5 Mult");
  }
}

function cardDisplayLabel(card) {
  const bits = [];
  if (card.enhancement) bits.push(ENHANCEMENTS[card.enhancement]?.name || card.enhancement);
  if (card.seal) bits.push(SEALS[card.seal]?.name || card.seal);
  if (card.edition) bits.push(EDITIONS[card.edition]?.name || card.edition);
  return bits.join(" · ");
}
