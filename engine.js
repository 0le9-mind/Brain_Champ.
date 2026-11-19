// Ігровий цикл, щоденні/звичайні тренування, події, запуск
"use strict";
let S = null;   // активна гра
const notify = msg => { try { if (tg && tg.showAlert) { tg.showAlert(msg); return; } } catch (e) {} alert(msg); };

function clearTimers() {
  if (!S) return;
  clearTimeout(S.toTimeout); clearTimeout(S.toNext);
  S.timers.forEach(clearTimeout); S.timers = [];
}
function leaveGame() { clearTimers(); S = null; rng = Math.random; }
const mkSession = o => Object.assign({round: 0, score: 0, correct: 0, locked: false, fb: "", mark: null, cur: null, t0: 0, timers: [], lvl: 1}, o);

function startPractice(game, lvl) {
  leaveGame();
  S = mkSession({mode: "practice", game, lvl, rounds: G.practiceRounds});
  nextRound();
}
function startDailyTask(idx) {
  leaveGame();
  const td = ensureToday();
  if (td.done || idx !== td.parts.length) { screenDaily(); return; }
  const game = dailyPlan()[idx];
  rng = mulberry32(hashStr(dateKey() + ":" + idx + ":" + game));   // однакові завдання для всіх у цей день
  S = mkSession({mode: "daily", game, taskIdx: idx, dayKey: td.d, rounds: DAILY.roundsPerTask});
  nextRound();
}

const api = {
  draw: () => drawGame(),
  finish: (ok, reason) => finishRound(ok, reason),
  startClock: () => startClock(),
  later(fn, ms) {
    const sess = S;
    const id = setTimeout(() => { if (S === sess && !sess.locked) fn(); }, ms);
    sess.timers.push(id);
    return id;
  }
};

function startClock() {
  const sess = S;
  sess.cur.running = true;
  sess.t0 = performance.now();
  clearTimeout(sess.toTimeout);
  sess.toTimeout = setTimeout(() => { if (S === sess && !sess.locked) finishRound(false, "timeout"); }, LIMITS[sess.game] * 1000);
}

function nextRound() {
  const sess = S;
  sess.round++; sess.locked = false; sess.fb = ""; sess.mark = null;
  if (sess.mode === "daily") sess.lvl = LV_DAILY[Math.min(sess.round - 1, LV_DAILY.length - 1)];
  sess.cur = MAKERS[sess.game](sess);
  sess.cur.running = false;
  if (sess.cur.autoClock) startClock();
  drawGame();
  if (sess.cur.init) sess.cur.init(api);
}

function drawGame() {
  const r = S.cur, lim = LIMITS[S.game], daily = S.mode === "daily";
  const title = daily ? `${t("task_title", {n: S.taskIdx + 1, total: DAILY.tasks})} · ${t("g_" + S.game)}`
                      : `${t("g_" + S.game)} · ${t("level_short", {n: S.lvl})}`;
  const right = `${t("round", {n: S.round, total: S.rounds})} · ${daily ? "⭐ " + S.score : "✅ " + S.correct}`;
  const el = r.running ? ((performance.now() - S.t0) / 1000).toFixed(2) : 0;
  const bar = `<div class="bar">${r.running ? `<i style="animation-duration:${lim}s;animation-delay:-${el}s"></i>` : ""}</div>`;
  view(`<div class="gh"><span>${esc(title)}</span><span>${esc(right)}</span></div>` + bar + r.render() +
    `<div class="fb">${esc(S.fb)}</div>` + btn("quit", t("btn_quit")));
}

function finishRound(ok, reason) {
  const sess = S;
  if (!sess || sess.locked) return;
  sess.locked = true;
  clearTimeout(sess.toTimeout);
  sess.timers.forEach(clearTimeout); sess.timers = [];
  const lim = LIMITS[sess.game], el = sess.cur.running ? (performance.now() - sess.t0) / 1000 : 0;
  if (ok) {
    sess.correct++;
    if (sess.mode === "daily") {
      const pts = DAILY.basePoints + Math.floor(DAILY.bonusPoints * (1 - Math.min(el, lim) / lim));
      sess.score += pts; sess.fb = t("toast_ok", {pts});
    } else sess.fb = t("toast_ok2");
    Snd.sfx("ok"); buzz("success");
  } else {
    sess.fb = t(reason === "timeout" ? "toast_timeout" : reason === "early" ? "toast_early" : "toast_wrong");
    Snd.sfx("bad"); buzz("error");
  }
  drawGame();
  sess.toNext = setTimeout(() => {
    if (S !== sess) return;
    if (sess.round >= sess.rounds) endGame(); else nextRound();
  }, 700);
}

function endGame() {
  const sess = S;
  clearTimers(); S = null; rng = Math.random;
  if (sess.mode === "daily") endDailyTask(sess);
  else { Snd.sfx("win"); screenPracticeDone(sess); }
}

function endDailyTask(sess) {
  if (P.today.d !== sess.dayKey) { screenMenu(); return; }   // день змінився під час гри
  P.today.parts[sess.taskIdx] = sess.score;
  P.best[sess.game] = Math.max(P.best[sess.game] || 0, sess.score);
  if (P.today.parts.length >= DAILY.tasks) {
    const info = completeDay();
    saveP(); Snd.sfx("fanfare"); screenDayDone(info);
  } else {
    saveP(); Snd.sfx("win"); screenTaskDone(sess);
  }
}

function completeDay() {
  const td = ensureToday();
  const score = td.parts.reduce((a, b) => a + (b || 0), 0);
  const isBest = score > P.bestDay;
  P.total += score; P.daysDone++;
  P.streak = P.lastDate === yesterdayKey() ? P.streak + 1 : 1;
  P.lastDate = td.d;
  P.recent.push({d: td.d, s: score}); P.recent = P.recent.slice(-7);
  if (isBest) P.bestDay = score;
  td.done = true; td.score = score;
  return {score, isBest};
}

/* ----- Події ----- */
function openTg(id, username, self) {
  if (!username) { notify(t(self ? "no_username_self" : "no_username")); return; }
  const url = "https://t.me/" + String(username).replace(/^@/, "");
  try { if (tg && tg.openTelegramLink) tg.openTelegramLink(url); else window.open(url, "_blank"); }
  catch (e) { window.open(url, "_blank"); }
}

function validName() {
  const v = ($("nm").value || "").trim();
  return v.length >= 2 && v.length <= 20 ? v : null;
}
function screenNameKeep(msg) {
  const typed = ($("nm") && $("nm").value) || "";
  screenName(msg, !!P);
  $("nm").value = typed;
}

const ACTIONS = {
  pickLang: v => { pendingLang = v; lang = v; screenName(); },
  saveName: () => {
    const name = validName();
    if (!name) return screenNameKeep(t("name_invalid"));
    if (P) P.name = name;
    else { P = newProfile(name, pendingLang); P.tipDate = dateKey(); bubbleKind = "both"; }
    lang = P.lang; ensureToday(); saveP();
    screenMenu(t("name_saved", {name}));
  },
  menu: () => { leaveGame(); screenMenu(); },
  daily: () => { leaveGame(); screenDaily(); },
  dstart: v => {
    leaveGame();
    const td = ensureToday(), idx = Number(v);
    if (td.done || idx >= DAILY.tasks) return screenDaily();
    screenTaskIntro(Math.min(idx, td.parts.length));
  },
  dgo: v => startDailyTask(Number(v)),
  practice: () => { leaveGame(); screenPractice(); },
  pcat: v => { leaveGame(); screenPracticeGames(v); },
  pgame: v => { leaveGame(); screenLevel(v); },
  plevel: (v, el) => startPractice(v, Number(el.dataset.l)),
  quit: () => {
    const sess = S, daily = sess && sess.mode === "daily", g = sess && sess.game;
    leaveGame();
    if (daily) screenDaily(); else if (g) screenPracticeGames(catOf(g)); else screenMenu();
  },
  tap: v => { if (!S || S.locked || !S.cur || !S.cur.isReady()) return; S.cur.tap(v, api); },
  profile: () => screenProfile(),
  top: () => screenTop(),
  settings: () => screenSettings(),
  rename: () => screenName("", true),
  chlang: () => screenChangeLang(),
  setLang: v => { P.lang = v; lang = v; saveP(); screenMenu(t("lang_changed")); },
  togSound: () => { P.sound = P.sound === false; persist(); Snd.refresh(); screenSettings(); if (P.sound) Snd.sfx("ok"); },
  togMusic: () => { P.music = P.music === false; persist(); Snd.refresh(); screenSettings(); },
  tip: () => {
    bubbleKind = bubbleKind === "tip" ? "greet" : "tip";
    const b = $("bubble");
    if (b) b.textContent = bubbleText();
  },
  openTg: (v, el) => openTg(v, el.dataset.u, !!el.dataset.self)
};

document.addEventListener("click", e => {
  const el = e.target.closest("[data-act]");
  if (!el) return;
  Snd.unlock();
  const act = el.dataset.act;
  if (act !== "tap" && act !== "tip" && act !== "openTg") Snd.sfx("click");
  const fn = ACTIONS[act];
  if (fn) fn(el.dataset.v, el);
});

/* ----- Старт ----- */
(async function init() {
  view(`<img class="logo" src="logo.jpg" alt="Brain Champ">` + card(t("loading")));
  let raw = null;
  try { raw = await store.get("bc_profile"); } catch (e) {}
  if (raw) {
    try { const p = JSON.parse(raw); if (p && p.name) P = normalizeProfile(p); } catch (e) {}
  }
  if (P) {
    lang = LANGS.includes(P.lang) ? P.lang : DEF_LANG;
    ensureToday();
    bubbleKind = P.tipDate !== dateKey() ? "both" : "greet";   // повна порада — раз на день
    P.tipDate = dateKey();
    persist(); pushRating();
    screenMenu();
  } else screenLang();
})();
