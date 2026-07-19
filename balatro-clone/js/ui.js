/* DOM rendering and event wiring */

const stage = document.getElementById("stage");
const topStats = document.getElementById("top-stats");
const logbar = document.getElementById("logbar");
const rulesModal = document.getElementById("rules-modal");
const infoModal = document.getElementById("info-modal");
const rulesBody = document.getElementById("rules-body");
const infoBody = document.getElementById("info-body");

document.getElementById("btn-rules").addEventListener("click", () => {
  rulesBody.innerHTML = `
    <h3>Overview</h3>
    <p>${RULEBOOK.overview}</p>
    <h3>Scoring</h3>
    <p>${RULEBOOK.scoring}</p>
    <h3>Blinds & Antes</h3>
    <p>${RULEBOOK.blinds}</p>
    <h3>Economy & Shop</h3>
    <p>${RULEBOOK.economy}</p>
    <h3>Poker Hands (Level 1)</h3>
    <pre style="margin:0;white-space:pre-wrap;font-family:inherit">${RULEBOOK.hands}</pre>
    <h3>Fan note</h3>
    <p>Ante Run is an unofficial HTML tribute inspired by Balatro's published mechanics (wiki/rulebook values). Not affiliated with LocalThunk or Playstack.</p>
  `;
  rulesModal.showModal();
});

document.getElementById("btn-runinfo").addEventListener("click", () => {
  const rows = Object.keys(HAND_DEFS).map((name) => {
    const s = handLevelStats(name, state.levels || blankLevels());
    const plays = (state.handPlays && state.handPlays[name]) || 0;
    return `<div><span>${name} · Lv ${s.level} · ×${plays}</span><span>${s.chips} × ${s.mult}</span></div>`;
  }).join("");
  infoBody.innerHTML = `
    <h3>Hand Levels</h3>
    <div class="hand-levels">${rows}</div>
    <h3>Jokers (${(state.jokers || []).length}/5)</h3>
    <p>${(state.jokers || []).map((j) => j.name).join(", ") || "None yet"}</p>
    <h3>Ante chip bases (White Stake)</h3>
    <p>${Object.entries(ANTE_BASE).map(([a, c]) => `Ante ${a}: ${fmt(c)}`).join(" · ")}</p>
  `;
  infoModal.showModal();
});

function renderTop() {
  if (state.phase === "title") {
    topStats.innerHTML = "";
    return;
  }
  const pct = state.target ? Math.min(100, (state.score / state.target) * 100) : 0;
  topStats.innerHTML = `
    <div class="stat"><b>Ante</b><span>${state.ante} / 8</span></div>
    <div class="stat money"><b>Money</b><span>$${state.money}</span></div>
    <div class="stat chips"><b>Score</b><span>${fmt(state.score)}</span></div>
    <div class="stat"><b>Target</b><span>${fmt(state.target || 0)}</span></div>
    <div class="stat"><b>Hands</b><span>${state.handsLeft}</span></div>
    <div class="stat"><b>Discards</b><span>${state.discardsLeft}</span></div>
    <div class="stat"><b>Deck</b><span>${state.deck.length}</span></div>
  `;
  void pct;
}

function renderLog() {
  logbar.textContent = state.message || "";
}

function cardHTML(card, index) {
  const selected = state.selected.has(card.id) ? "selected" : "";
  const debuffed = card.debuffed ? "debuffed" : "";
  const color = SUIT_COLOR[card.suit];
  return `
    <button type="button" class="playing-card ${color} ${selected} ${debuffed}"
      data-id="${card.id}" style="animation-delay:${index * 0.03}s"
      aria-pressed="${state.selected.has(card.id)}"
      title="${card.rank} of ${card.suit}${card.debuffed ? " (debuffed)" : ""}">
      <span class="rank">${card.rank}${SUIT_SYMBOL[card.suit]}</span>
      <span class="suit">${SUIT_SYMBOL[card.suit]}</span>
      <span class="rank-br">${card.rank}${SUIT_SYMBOL[card.suit]}</span>
    </button>
  `;
}

function jokerHTML(j, i) {
  return `
    <div class="joker ${j.rarity}" title="${j.desc}">
      <strong>${j.name}</strong>
      <div>${j.desc}</div>
      <div class="j-actions">
        <button type="button" data-jmove="${j.uid}" data-dir="-1" title="Move left">◀</button>
        <button type="button" data-jsell="${j.uid}" title="Sell">$${Math.floor(j.cost / 2)}</button>
        <button type="button" data-jmove="${j.uid}" data-dir="1" title="Move right">▶</button>
      </div>
    </div>
  `;
}

function renderTitle() {
  stage.innerHTML = `
    <div class="panel-inner title-screen">
      <h2>Ante Run</h2>
      <p>A browser poker roguelike funded by Balatro's rulebook: play poker hands, stack Chips × Mult with Jokers, clear 8 Antes.</p>
      <button type="button" class="btn play" id="btn-start">New Run</button>
      <button type="button" class="btn ghost" id="btn-rules-title">Read the Rulebook</button>
    </div>
  `;
  document.getElementById("btn-start").onclick = startRun;
  document.getElementById("btn-rules-title").onclick = () => document.getElementById("btn-rules").click();
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
      ${canSkip ? `<div class="controls"><button type="button" class="btn ghost" id="btn-skip">Skip current Blind (+$5)</button></div>` : ""}
      ${state.jokers.length ? `<p class="section-label">Your Jokers</p><div class="joker-row">${state.jokers.map(jokerHTML).join("")}</div>` : ""}
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
}

function blindChoiceHTML(kind) {
  const boss = kind === "boss" ? (state.boss || pickBoss(state.ante)) : null;
  if (kind === "boss" && !state.boss) state.boss = boss;
  const target = blindTarget(state.ante, kind, boss);
  const name = kind === "boss" ? boss.name : BLIND_TYPES[kind].name;
  const desc = kind === "boss" ? boss.desc : "Standard blind — no special effects.";
  const reward = BLIND_TYPES[kind].reward;

  // Highlight available
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
      <div class="desc">Reward: $${reward}</div>
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

      <p class="section-label">Jokers (order matters — left → right)</p>
      <div class="joker-row">${state.jokers.length ? state.jokers.map(jokerHTML).join("") : '<span style="color:var(--muted);font-size:0.85rem">No jokers yet — visit the shop after this blind.</span>'}</div>

      <p class="section-label">Your hand</p>
      <div class="card-row" id="hand-row">
        ${state.hand.map((c, i) => cardHTML(c, i)).join("")}
      </div>

      <div class="controls">
        <button type="button" class="btn play" id="btn-play" ${state.selected.size ? "" : "disabled"}>Play Hand</button>
        <button type="button" class="btn discard" id="btn-discard" ${state.selected.size && state.discardsLeft ? "" : "disabled"}>Discard</button>
      </div>
    </div>
  `;

  stage.querySelectorAll(".playing-card").forEach((el) => {
    el.addEventListener("click", () => toggleSelect(Number(el.dataset.id)));
  });
  document.getElementById("btn-play").onclick = playHand;
  document.getElementById("btn-discard").onclick = discardSelected;
  bindJokerActions();
}

function renderScoreAnim() {
  const r = state.lastScore;
  stage.innerHTML = `
    <div class="panel-inner score-pop">
      <div style="color:var(--muted);margin-bottom:0.5rem">${r.handName} · Level ${r.level}</div>
      <div class="eq"><span class="c">${fmt(r.chips)}</span> × <span class="m">${fmt(r.mult)}</span> = <span class="s">${fmt(r.score)}</span></div>
      <p style="color:var(--muted);max-width:36rem;margin:1rem auto 0;font-size:0.85rem">${(r.logs || []).slice(0, 12).join(" · ")}</p>
    </div>
  `;
}

function renderCashOut() {
  stage.innerHTML = `
    <div class="panel-inner cashout">
      <h2>Blind Cleared!</h2>
      <p style="color:var(--muted)">${state.message}</p>
      <p style="font-size:1.2rem;font-weight:700;color:var(--gold)">Balance: $${state.money}</p>
      <div class="controls">
        <button type="button" class="btn play" id="btn-shop">Continue to Shop</button>
      </div>
      ${state.jokers.length ? `<p class="section-label">Jokers</p><div class="joker-row">${state.jokers.map(jokerHTML).join("")}</div>` : ""}
    </div>
  `;
  document.getElementById("btn-shop").onclick = goToShop;
  bindJokerActions();
}

function renderShop() {
  stage.innerHTML = `
    <div class="panel-inner">
      <h2 style="font-family:var(--font-display);letter-spacing:0.04em;margin:0 0 0.5rem">Shop</h2>
      <p style="color:var(--muted);margin:0 0 1rem">Money: $${state.money} · Jokers ${state.jokers.length}/${state.maxJokers}</p>
      <div class="shop-grid">
        ${state.shop.map((item) => `
          <div class="shop-item">
            <span class="tag ${item.type}">${item.type}</span>
            <h3>${item.name}</h3>
            <p>${item.type === "planet" ? `Upgrade ${item.hand}` : item.desc}</p>
            <button type="button" class="btn" data-buy="${item.uid}" ${state.money < item.cost ? "disabled" : ""}>Buy $${item.cost}</button>
          </div>
        `).join("") || "<p>Sold out.</p>"}
      </div>
      <div class="controls" style="margin-top:1rem">
        <button type="button" class="btn ghost" id="btn-reroll" ${state.money < state.shopReroll ? "disabled" : ""}>Reroll $${state.shopReroll}</button>
        <button type="button" class="btn play" id="btn-leave">Next Blind</button>
      </div>
      ${state.jokers.length ? `<p class="section-label">Your Jokers (sell / reorder)</p><div class="joker-row">${state.jokers.map(jokerHTML).join("")}</div>` : ""}
    </div>
  `;
  stage.querySelectorAll("[data-buy]").forEach((el) => {
    el.addEventListener("click", () => buyShopItem(Number(el.dataset.buy)));
  });
  document.getElementById("btn-reroll").onclick = rerollShop;
  document.getElementById("btn-leave").onclick = leaveShop;
  bindJokerActions();
}

function renderEnd(won) {
  stage.innerHTML = `
    <div class="panel-inner end-screen">
      <h2>${won ? "You Win!" : "Game Over"}</h2>
      <p style="color:var(--muted)">${state.message}</p>
      <p>Reached Ante ${Math.min(state.ante, 8)} · $${state.money} · ${state.jokers.map((j) => j.name).join(", ") || "no jokers"}</p>
      <div class="controls">
        <button type="button" class="btn play" id="btn-again">New Run</button>
      </div>
    </div>
  `;
  document.getElementById("btn-again").onclick = startRun;
}

function bindJokerActions() {
  stage.querySelectorAll("[data-jsell]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      sellJoker(Number(el.dataset.jsell));
    });
  });
  stage.querySelectorAll("[data-jmove]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      moveJoker(Number(el.dataset.jmove), Number(el.dataset.dir));
    });
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
    case "won": renderEnd(true); break;
    case "lost": renderEnd(false); break;
    default: renderTitle();
  }
}

// Boot
state.phase = "title";
state.message = "Welcome to Ante Run.";
render();
