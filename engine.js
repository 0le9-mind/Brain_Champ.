// Ігровий цикл, події, запуск
"use strict";
/* ===== Ігровий цикл ===== */
let S = null;   // активна гра

function clearTimers() { if (S) { clearTimeout(S.toTimeout); clearTimeout(S.toShow); clearTimeout(S.toNext); } }
function leaveGame() { clearTimers(); S = null; }

function startGame(g) {
  leaveGame();
  S = {game: g, round: 0, score: 0, correct: 0, locked: false, fb: "", mark: null, cur: null, t0: 0};
  nextRound();
}

function startClock() {
  const sess = S;
  sess.cur.running = true;
  sess.t0 = performance.now();
  sess.toTimeout = setTimeout(() => { if (S === sess && !sess.locked) finishRound(false, "timeout"); }, LIMITS[sess.game] * 1000);
}

function nextRound() {
  const sess = S;
  sess.round++;
  sess.locked = false; sess.fb = ""; sess.mark = null;
  sess.cur = MAKERS[sess.game](sess);
  if (sess.cur.kind === "grid") {
    sess.cur.running = false;
    drawGame();
    sess.toShow = setTimeout(() => {
      if (S !== sess) return;
      sess.cur.phase = "play";
      startClock();
      drawGame();
    }, 1000 + 500 * sess.cur.k);
  } else {
    startClock();
    drawGame();
  }
}

function drawGame() {
  const r = S.cur, lim = LIMITS[S.game];
  const head = `<div class="gh"><span>${esc(t("game_" + S.game))}</span><span>${esc(t("round", {n: S.round, total: G.rounds}))} · ⭐ ${S.score}</span></div>`;
  const elapsed = r.running ? ((performance.now() - S.t0) / 1000).toFixed(2) : 0;
  const bar = `<div class="bar">${r.running ? `<i style="animation-duration:${lim}s;animation-delay:-${elapsed}s"></i>` : ""}</div>`;
  let body = "";
  if (r.kind === "options") {
    body = r.text + `<div class="grid" style="grid-template-columns:repeat(${r.cols},1fr)">` +
      r.options.map((o, i) => {
        let cls = "";
        if (S.mark) { if (i === r.answer) cls = "ok"; else if (i === S.mark.chosen) cls = "bad"; }
        return `<button class="btn opt ${cls}" data-act="opt" data-v="${i}">${esc(o)}</button>`;
      }).join("") + `</div>`;
  } else {
    const hint = r.phase === "show" ? t("mem_show", {k: r.k}) : t("mem_play", {k: r.k, found: r.found.size});
    let cells = "";
    for (let i = 0; i < 9; i++) {
      const has = r.map[i] !== undefined;
      let label = "▫️", cls = "";
      if (r.phase === "show") { if (has) label = r.map[i]; }
      else if (r.found.has(i)) { label = r.map[i]; cls = "found"; }
      else { label = "?"; if (S.mark && S.mark.bad === i) cls = "bad"; }
      cells += `<button class="btn cell ${cls}" data-act="cell" data-v="${i}">${label}</button>`;
    }
    body = `<div class="hint">${esc(hint)}</div><div class="grid" style="grid-template-columns:repeat(3,1fr)">${cells}</div>`;
  }
  view(head + bar + body + `<div class="fb">${esc(S.fb)}</div>` + btn("quit", t("btn_quit")));
}

function finishRound(ok, reason) {
  const sess = S;
  if (!sess || sess.locked) return;
  sess.locked = true;
  clearTimeout(sess.toTimeout);
  const lim = LIMITS[sess.game], el = (performance.now() - sess.t0) / 1000;
  let pts = 0;
  if (ok && el <= lim) pts = G.basePoints + Math.floor(G.bonusPoints * (1 - el / lim));
  if (ok) { sess.score += pts; sess.correct++; sess.fb = t("toast_ok", {pts}); buzz("success"); }
  else { sess.fb = reason === "timeout" ? t("toast_timeout") : t("toast_wrong"); buzz("error"); }
  drawGame();
  sess.toNext = setTimeout(() => {
    if (S !== sess) return;
    if (sess.round >= G.rounds) endGame(); else nextRound();
  }, 650);
}

function answerOption(idx) {
  if (!S || S.locked || S.cur.kind !== "options") return;
  S.mark = {chosen: idx};
  finishRound(idx === S.cur.answer);
}

function tapCell(i) {
  if (!S || S.locked || S.cur.kind !== "grid" || S.cur.phase !== "play") return;
  const r = S.cur;
  if (r.found.has(i)) return;
  if (r.map[i] === r.next) {
    r.found.add(i); r.next++;
    if (r.next > r.k) finishRound(true); else drawGame();
  } else {
    S.mark = {bad: i};
    finishRound(false);
  }
}

function endGame() {
  const sess = S, g = sess.game, st = P.stats[g];
  const isRecord = sess.score > st.best;
  st.plays++; st.total += sess.score; st.best = Math.max(st.best, sess.score);
  saveP();
  S = null;
  let txt = t("result", {game: t("game_" + g), score: sess.score, correct: sess.correct, total: G.rounds, best: st.best, rating: rating()});
  if (isRecord && sess.score > 0) txt += t("record_new");
  view(`<h1>🏁</h1><div class="card">${esc(txt)}</div>` +
    btn("play", t("btn_again"), "main", `data-v="${g}"`) +
    `<div class="row">${btn("games", t("btn_play"))}${btn("menu", t("btn_menu"))}</div>`);
}


/* ===== Події ===== */
function validName() {
  const v = ($("nm").value || "").trim();
  return v.length >= 2 && v.length <= 20 ? v : null;
}

const ACTIONS = {
  pickLang: v => { pendingLang = v; lang = v; screenName(); },
  saveName: () => {
    const name = validName();
    if (!name) return screenNameKeep(t("name_invalid"));
    if (P) P.name = name; else P = {name, lang: pendingLang, stats: emptyStats()};
    lang = P.lang;
    saveP();
    screenMenu(t("name_saved", {name}));
  },
  menu: () => { leaveGame(); screenMenu(); },
  games: () => { leaveGame(); screenGames(); },
  play: v => startGame(v),
  opt: v => answerOption(Number(v)),
  cell: v => tapCell(Number(v)),
  quit: () => { leaveGame(); screenMenu(); },
  profile: () => screenProfile(),
  top: () => screenTop(),
  settings: () => screenSettings(),
  rename: () => screenName("", true),
  chlang: () => screenChangeLang(),
  setLang: v => { P.lang = v; lang = v; saveP(); screenMenu(t("lang_changed")); }
};

function screenNameKeep(msg) {   // повторний показ форми імені зі збереженням введеного тексту
  const typed = ($("nm") && $("nm").value) || "";
  screenName(msg, !!P);
  $("nm").value = typed;
}

document.addEventListener("click", e => {
  const el = e.target.closest("[data-act]");
  if (!el) return;
  const fn = ACTIONS[el.dataset.act];
  if (fn) fn(el.dataset.v);
});


/* ===== Старт ===== */
(async function init() {
  view(`<h1>🧠 Brain Champ</h1><div class="card">${esc(t("loading"))}</div>`);
  let raw = null;
  try { raw = await store.get("bc_profile"); } catch (e) {}
  if (raw) {
    try {
      const p = JSON.parse(raw);
      p.stats = Object.assign(emptyStats(), p.stats || {});
      if (p && p.name) P = p;
    } catch (e) {}
  }
  if (P) { lang = LANGS.includes(P.lang) ? P.lang : DEF_LANG; pushRating(); screenMenu(); }
  else screenLang();
})();

