/* DOM rendering and event wiring */

const stage = document.getElementById("stage");
const topStats = document.getElementById("top-stats");
const logbar = document.getElementById("logbar");
const rulesModal = document.getElementById("rules-modal");
const infoModal = document.getElementById("info-modal");
const collectionModal = document.getElementById("collection-modal");
const rulesBody = document.getElementById("rules-body");
const infoBody = document.getElementById("info-body");
const collectionBody = document.getElementById("collection-body");

document.getElementById("btn-rules").addEventListener("click", () => {
  rulesBody.innerHTML = `
    <h3>Overview</h3><p>${RULEBOOK.overview}</p>
    <h3>Scoring</h3><p>${RULEBOOK.scoring}</p>
    <h3>Cards</h3><p>${RULEBOOK.cards}</p>
    <h3>Blinds & Antes</h3><p>${RULEBOOK.blinds}</p>
    <h3>Economy</h3><p>${RULEBOOK.economy}</p>
    <h3>Poker Hands (Level 1)</h3>
    <pre style="margin:0;white-space:pre-wrap;font-family:inherit">${RULEBOOK.hands}</pre>
    <h3>Fan note</h3>
    <p>Unofficial tribute with all 150 Jokers, 22 Tarot, 12 Planet, and 18 Spectral cards. Not affiliated with LocalThunk or Playstack.</p>
  `;
  rulesModal.showModal();
});

document.getElementById("btn-runinfo").addEventListener("click", () => {
  const rows = Object.keys(HAND_DEFS).map((name) => {
    const s = handLevelStats(name, state.levels || blankLevels());
    const plays = (state.handPlays && state.handPlays[name]) || 0;
    return `<div><span>${name} · Lv ${s.level} · ×${plays}</span><span>${s.chips} × ${fmt(s.mult)}</span></div>`;
  }).join("");
  infoBody.innerHTML = `
    <h3>Hand Levels</h3>
    <div class="hand-levels">${rows}</div>
    <h3>Jokers (${(state.jokers || []).length}/${state.maxJokers || 5})</h3>
    <p>${(state.jokers || []).map((j) => `${j.name}${j.edition ? " [" + j.edition + "]" : ""}`).join(", ") || "None"}</p>
    <h3>Consumables (${(state.consumables || []).length}/${state.maxConsumables || 2})</h3>
    <p>${(state.consumables || []).map((c) => c.name).join(", ") || "None"}</p>
  `;
  infoModal.showModal();
});

document.getElementById("btn-collection").addEventListener("click", () => {
  const jokers = JOKER_DEFS.map((j) =>
    `<div class="coll-item ${j.rarity}"><strong>${j.name}</strong><span class="tag">${j.rarity} · $${j.cost}</span><p>${j.desc}</p></div>`
  ).join("");
  const tarots = TAROT_CARDS.map((c) =>
    `<div class="coll-item tarot"><strong>${c.name}</strong><p>${c.desc}</p></div>`
  ).join("");
  const planets = PLANET_CARDS.map((c) =>
    `<div class="coll-item planet"><strong>${c.name}</strong><p>${c.desc} (${c.hand})</p></div>`
  ).join("");
  const spectrals = SPECTRAL_CARDS.map((c) =>
    `<div class="coll-item spectral"><strong>${c.name}</strong><p>${c.desc}</p></div>`
  ).join("");
  const enh = Object.entries(ENHANCEMENTS).map(([k, v]) =>
    `<div class="coll-item"><strong>${v.name}</strong><p>${v.desc}</p></div>`
  ).join("");
  collectionBody.innerHTML = `
    <h3>Jokers (150)</h3><div class="coll-grid">${jokers}</div>
    <h3>Tarot (22)</h3><div class="coll-grid">${tarots}</div>
    <h3>Planet (12)</h3><div class="coll-grid">${planets}</div>
    <h3>Spectral (18)</h3><div class="coll-grid">${spectrals}</div>
    <h3>Enhancements</h3><div class="coll-grid">${enh}</div>
  `;
  collectionModal.showModal();
});

function renderTop() {
  if (state.phase === "title") { topStats.innerHTML = ""; return; }
  topStats.innerHTML = `
    <div class="stat"><b>Ante</b><span>${state.ante} / 8</span></div>
    <div class="stat money"><b>Money</b><span>$${state.money}</span></div>
    <div class="stat chips"><b>Score</b><span>${fmt(state.score)}</span></div>
    <div class="stat"><b>Target</b><span>${fmt(state.target || 0)}</span></div>
    <div class="stat"><b>Hands</b><span>${state.handsLeft}</span></div>
    <div class="stat"><b>Discards</b><span>${state.discardsLeft}</span></div>
    <div class="stat"><b>Deck</b><span>${state.deck.length}</span></div>
  `;
}

function renderLog() {
  logbar.textContent = state.message || "";
}

function cardHTML(card, index) {
  const selected = state.selected.has(card.id) ? "selected" : "";
  const debuffed = card.debuffed ? "debuffed" : "";
  const color = card.enhancement === "stone" ? "black" : SUIT_COLOR[card.suit];
  const mods = cardDisplayLabel(card);
  const rankShow = card.enhancement === "stone" ? "◆" : card.rank;
  const suitShow = card.enhancement === "stone" ? "" : SUIT_SYMBOL[card.suit];
  return `
    <button type="button" class="playing-card ${color} ${selected} ${debuffed} ${card.enhancement || ""} ${card.edition || ""}"
      data-id="${card.id}" style="animation-delay:${index * 0.03}s"
      title="${rankShow}${suitShow}${mods ? " · " + mods : ""}${card.debuffed ? " (debuffed)" : ""}">
      <span class="rank">${rankShow}${suitShow}</span>
      <span class="suit">${card.enhancement === "wild" ? "★" : (suitShow || "◆")}</span>
      <span class="mods">${mods || ""}</span>
      <span class="rank-br">${rankShow}${suitShow}</span>
    </button>
  `;
}

function jokerHTML(j) {
  return `
    <div class="joker ${j.rarity} ${j.edition || ""}" title="${j.desc}">
      <strong>${j.name}</strong>
      ${j.edition ? `<span class="edition-tag">${j.edition}</span>` : ""}
      <div>${j.desc}</div>
      <div class="j-actions">
        <button type="button" data-jmove="${j.uid}" data-dir="-1">◀</button>
        <button type="button" data-jsell="${j.uid}">$${Math.floor(j.cost / 2) + (j.extraSell || 0)}</button>
        <button type="button" data-jmove="${j.uid}" data-dir="1">▶</button>
      </div>
    </div>
  `;
}

function consumableHTML(c) {
  const active = state.usingConsumable && state.usingConsumable.uid === c.uid ? "active" : "";
  return `
    <button type="button" class="consumable ${c.type} ${active}" data-use="${c.uid}" title="${c.desc}">
      <span class="tag">${c.type}</span>
      <strong>${c.name}</strong>
      <span>${c.desc}</span>
    </button>
  `;
}

function renderTitle() {
  stage.innerHTML = `
    <div class="panel-inner title-screen">
      <h2>Ante Run</h2>
      <p>All 150 Jokers · 22 Tarot · 12 Planet · 18 Spectral — a browser poker roguelike funded by Balatro's rulebook.</p>
      <button type="button" class="btn play" id="btn-start">New Run</button>
      <button type="button" class="btn ghost" id="btn-open-collection">Browse Collection</button>
    </div>
  `;
  document.getElementById("btn-start").onclick = startRun;
  document.getElementById("btn-open-collection").onclick = () => document.getElementById("btn-collection").click();
}

function renderBlindSelect() {
  const cards = [];
  if (state.blindIndex <= 0) cards.push(blindChoiceHTML("small"));
  if (state.blindIndex <= 1) cards.push(blindChoiceHTML("big"));
  cards.push(blindChoiceHTML("boss"));
  const canSkip = state.blindIndex < 2;

  stage.innerHTML = `
    <div class="panel-inner blind-select">
      <h2>Ante ${state.ante}</h2>
      <p style="color:var(--muted);margin:0">Select a Blind. Boss Blinds cannot be skipped.</p>
      <div class="blind-grid">${cards.join("")}</div>
      ${canSkip ? `<div class="controls"><button type="button" class="btn ghost" id="btn-skip">Skip Blind (+$5)</button></div>` : ""}
      ${state.jokers.length ? `<p class="section-label">Jokers</p><div class="joker-row">${state.jokers.map(jokerHTML).join("")}</div>` : ""}
      ${state.consumables.length ? `<p class="section-label">Consumables</p><div class="consumable-row">${state.consumables.map(consumableHTML).join("")}</div>` : ""}
    </div>
  `;
  stage.querySelectorAll("[data-blind]").forEach((el) => {
    el.addEventListener("click", () => {
      if (el.disabled) return;
      const kind = el.getAttribute("data-blind");
      if (state.blindIndex === 0 && (kind === "small" || kind === "big")) selectBlind(kind);
      else if (state.blindIndex === 1 && kind === "big") selectBlind(kind);
      else if (state.blindIndex === 2 && kind === "boss") selectBlind(kind);
    });
  });
  const skip = document.getElementById("btn-skip");
  if (skip) skip.onclick = skipBlind;
  bindJokerActions();
  bindConsumables();
}

function blindChoiceHTML(kind) {
  const boss = kind === "boss" ? (state.boss || pickBoss(state.ante)) : null;
  if (kind === "boss" && !state.boss) state.boss = boss;
  const target = blindTarget(state.ante, kind, boss);
  const name = kind === "boss" ? boss.name : BLIND_TYPES[kind].name;
  const desc = kind === "boss" ? boss.desc : "Standard blind — no special effects.";
  let available = false;
  if (state.blindIndex === 0 && (kind === "small" || kind === "big")) available = true;
  if (state.blindIndex === 1 && kind === "big") available = true;
  if (state.blindIndex === 2 && kind === "boss") available = true;
  return `
    <button type="button" class="blind-card ${kind === "boss" ? "boss" : ""}"
      data-blind="${kind}" ${available ? "" : "disabled style=\"opacity:0.4;cursor:not-allowed\""}
      style="border-color:${BLIND_TYPES[kind].color}">
      <h3 style="color:${BLIND_TYPES[kind].color}">${name}</h3>
      <div class="target">${fmt(target)} chips</div>
      <div class="desc">${desc}</div>
      <div class="desc">Reward: $${BLIND_TYPES[kind].reward}</div>
    </button>
  `;
}

function renderPlaying() {
  const preview = previewHand();
  let previewHTML = `<div class="hand-preview"><div class="label">Selected hand</div><div class="name">—</div><div class="meta">Select 1–5 cards</div></div>`;
  if (preview) {
    const stats = handLevelStats(preview.name, state.levels);
    previewHTML = `<div class="hand-preview"><div class="label">Selected hand</div><div class="name">${preview.name}</div><div class="meta">Lv ${stats.level} · Base ${stats.chips} × ${stats.mult} · ${preview.scoringCards.length} scoring</div></div>`;
  }
  const pct = Math.min(100, (state.score / state.target) * 100);

  stage.innerHTML = `
    <div class="panel-inner play-layout">
      <div class="scoreboard">
        <div class="score-box progress">
          <div class="label">${state.blind.name}</div>
          <div class="value">${fmt(state.score)} / ${fmt(state.target)}</div>
          <div class="bar"><div class="fill" style="width:${pct}%"></div></div>
          <div class="label" style="margin-top:0.35rem">${state.blind.desc}</div>
        </div>
        ${previewHTML}
      </div>

      <p class="section-label">Jokers</p>
      <div class="joker-row">${state.jokers.length ? state.jokers.map(jokerHTML).join("") : '<span style="color:var(--muted);font-size:0.85rem">No jokers yet</span>'}</div>

      <p class="section-label">Consumables ${state.usingConsumable ? "(confirm selection)" : ""}</p>
      <div class="consumable-row">${state.consumables.length ? state.consumables.map(consumableHTML).join("") : '<span style="color:var(--muted);font-size:0.85rem">Empty</span>'}</div>

      <p class="section-label">Your hand</p>
      <div class="card-row">${state.hand.map((c, i) => cardHTML(c, i)).join("")}</div>

      <div class="controls">
        <button type="button" class="btn play" id="btn-play" ${state.selected.size && !state.usingConsumable ? "" : "disabled"}>Play Hand</button>
        <button type="button" class="btn discard" id="btn-discard" ${state.selected.size && state.discardsLeft && !state.usingConsumable ? "" : "disabled"}>Discard</button>
        ${state.usingConsumable ? `<button type="button" class="btn ghost" id="btn-cancel-use">Cancel ${state.usingConsumable.name}</button>` : ""}
      </div>
    </div>
  `;
  stage.querySelectorAll(".playing-card").forEach((el) => {
    el.addEventListener("click", () => toggleSelect(Number(el.dataset.id)));
  });
  document.getElementById("btn-play").onclick = playHand;
  document.getElementById("btn-discard").onclick = discardSelected;
  const cancel = document.getElementById("btn-cancel-use");
  if (cancel) cancel.onclick = () => { state.usingConsumable = null; state.selected.clear(); state.message = ""; render(); };
  bindJokerActions();
  bindConsumables();
}

function renderScoreAnim() {
  const r = state.lastScore;
  stage.innerHTML = `
    <div class="panel-inner score-pop">
      <div style="color:var(--muted);margin-bottom:0.5rem">${r.handName} · Level ${r.level}</div>
      <div class="eq"><span class="c">${fmt(r.chips)}</span> × <span class="m">${fmt(r.mult)}</span> = <span class="s">${fmt(r.score)}</span></div>
      <p style="color:var(--muted);max-width:36rem;margin:1rem auto 0;font-size:0.85rem">${(r.logs || []).slice(0, 14).join(" · ")}</p>
    </div>
  `;
}

function renderCashOut() {
  stage.innerHTML = `
    <div class="panel-inner cashout">
      <h2>Blind Cleared!</h2>
      <p style="color:var(--muted)">${state.message}</p>
      <p style="font-size:1.2rem;font-weight:700;color:var(--gold)">Balance: $${state.money}</p>
      <div class="controls"><button type="button" class="btn play" id="btn-shop">Continue to Shop</button></div>
      ${state.jokers.length ? `<p class="section-label">Jokers</p><div class="joker-row">${state.jokers.map(jokerHTML).join("")}</div>` : ""}
      ${state.consumables.length ? `<p class="section-label">Consumables</p><div class="consumable-row">${state.consumables.map(consumableHTML).join("")}</div>` : ""}
    </div>
  `;
  document.getElementById("btn-shop").onclick = goToShop;
  bindJokerActions();
  bindConsumables();
}

function renderShop() {
  stage.innerHTML = `
    <div class="panel-inner">
      <h2 style="font-family:var(--font-display);letter-spacing:0.04em;margin:0 0 0.5rem">Shop</h2>
      <p style="color:var(--muted);margin:0 0 1rem">Money: $${state.money} · Jokers ${state.jokers.length}/${state.maxJokers} · Consumables ${state.consumables.length}/${state.maxConsumables}</p>
      <div class="shop-grid">
        ${state.shop.map((item) => `
          <div class="shop-item">
            <span class="tag ${item.type}">${item.type}</span>
            <h3>${item.name}${item.edition ? " · " + item.edition : ""}</h3>
            <p>${item.desc || (item.hand ? "Upgrade " + item.hand : "")}</p>
            <button type="button" class="btn" data-buy="${item.uid}">Buy $${item.cost}</button>
          </div>
        `).join("")}
      </div>
      <div class="controls" style="margin-top:1rem">
        <button type="button" class="btn ghost" id="btn-reroll">Reroll ${state.freeRerolls ? "(free)" : "$" + state.shopReroll}</button>
        <button type="button" class="btn play" id="btn-leave">Next Blind</button>
      </div>
      ${state.jokers.length ? `<p class="section-label">Your Jokers</p><div class="joker-row">${state.jokers.map(jokerHTML).join("")}</div>` : ""}
      ${state.consumables.length ? `<p class="section-label">Consumables</p><div class="consumable-row">${state.consumables.map(consumableHTML).join("")}</div>` : ""}
    </div>
  `;
  stage.querySelectorAll("[data-buy]").forEach((el) => el.addEventListener("click", () => buyShopItem(Number(el.dataset.buy))));
  document.getElementById("btn-reroll").onclick = rerollShop;
  document.getElementById("btn-leave").onclick = leaveShop;
  bindJokerActions();
  bindConsumables();
}

function renderPack() {
  stage.innerHTML = `
    <div class="panel-inner">
      <h2 style="font-family:var(--font-display);margin:0 0 0.75rem">Booster Pack</h2>
      <p style="color:var(--muted)">Choose one card</p>
      <div class="shop-grid">
        ${(state.packChoices || []).map((item) => `
          <div class="shop-item">
            <span class="tag ${item.type}">${item.type}</span>
            <h3>${item.name}</h3>
            <p>${item.desc || ""}</p>
            <button type="button" class="btn play" data-pick="${item.uid}">Take</button>
          </div>
        `).join("")}
      </div>
      <div class="controls" style="margin-top:1rem">
        <button type="button" class="btn ghost" id="btn-skip-pack">Skip Pack</button>
      </div>
    </div>
  `;
  stage.querySelectorAll("[data-pick]").forEach((el) => el.addEventListener("click", () => pickPackChoice(Number(el.dataset.pick))));
  document.getElementById("btn-skip-pack").onclick = skipPack;
}

function renderEnd(won) {
  stage.innerHTML = `
    <div class="panel-inner end-screen">
      <h2>${won ? "You Win!" : "Game Over"}</h2>
      <p style="color:var(--muted)">${state.message}</p>
      <p>Ante ${Math.min(state.ante, 8)} · $${state.money} · ${(state.jokers || []).map((j) => j.name).join(", ") || "no jokers"}</p>
      <div class="controls"><button type="button" class="btn play" id="btn-again">New Run</button></div>
    </div>
  `;
  document.getElementById("btn-again").onclick = startRun;
}

function bindJokerActions() {
  stage.querySelectorAll("[data-jsell]").forEach((el) => {
    el.addEventListener("click", (e) => { e.stopPropagation(); sellJoker(Number(el.dataset.jsell)); });
  });
  stage.querySelectorAll("[data-jmove]").forEach((el) => {
    el.addEventListener("click", (e) => { e.stopPropagation(); moveJoker(Number(el.dataset.jmove), Number(el.dataset.dir)); });
  });
}

function bindConsumables() {
  stage.querySelectorAll("[data-use]").forEach((el) => {
    el.addEventListener("click", () => tryUseConsumable(Number(el.dataset.use)));
  });
}

function render() {
  renderTop();
  renderLog();
  switch (state.phase) {
    case "title": renderTitle(); break;
    case "blindSelect": renderBlindSelect(); break;
    case "playing": renderPlaying(); break;
    case "scoreAnim": renderScoreAnim(); break;
    case "cashOut": renderCashOut(); break;
    case "shop": renderShop(); break;
    case "pack": renderPack(); break;
    case "won": renderEnd(true); break;
    case "lost": renderEnd(false); break;
    default: renderTitle();
  }
}

state.phase = "title";
state.message = "Welcome to Ante Run — full card collection loaded.";
render();
