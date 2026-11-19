// Екрани та меню
"use strict";
const view = html => { app.innerHTML = html; window.scrollTo(0, 0); };
const btn = (act, label, cls = "", extra = "") => `<button class="btn ${cls}" data-act="${act}" ${extra}>${label}</button>`;
const card = txt => `<div class="card">${esc(txt)}</div>`;
let pendingLang = DEF_LANG;

/* ----- Аватар (фото з Telegram або літера) ----- */
function avatarHtml(photo, name, size) {
  const ch = esc((name || "?").trim().charAt(0).toUpperCase() || "?");
  const st = `width:${size}px;height:${size}px;font-size:${Math.round(size * 0.45)}px`;
  const img = photo ? `<img src="${esc(photo)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">` : "";
  return `<span class="av" style="${st}"><b>${ch}</b>${img}</span>`;
}
const myPhoto = () => (tgUser && tgUser.photo_url) || "";

/* ----- Чоловічок-помічник ----- */
let bubbleKind = "greet";   // greet | both | tip
function greetKey() {
  const h = new Date().getHours();
  return h >= 5 && h < 11 ? "morning" : h >= 11 && h < 17 ? "day" : h >= 17 && h < 23 ? "evening" : "night";
}
function bubbleText() {
  const g = t("greet_" + greetKey()), tip = t("tip_brain");
  return bubbleKind === "tip" ? tip : bubbleKind === "both" ? g + "\n\n" + tip : g;
}
const mascotHtml = (text, withId) =>
  `<div class="mascot"><img class="mimg" src="mascot.jpg" alt="" data-act="tip"><div class="bubble" ${withId ? 'id="bubble"' : ""}>${esc(text)}</div></div>`;
function mascotComment(ratio) { return t(ratio >= 0.8 ? "m_good" : ratio >= 0.5 ? "m_ok" : "m_try"); }

/* ----- Початок ----- */
function screenLang() {
  lang = DEF_LANG;
  view(`<img class="logo" src="logo.jpg" alt="Brain Champ">` + card(t("choose_lang")) +
    LANGS.map(c => btn("pickLang", LANG_NAMES[c], "", `data-v="${c}"`)).join(""));
}

function screenName(msg = "", renaming = false) {
  const val = P ? P.name : (tgUser && tgUser.first_name ? tgUser.first_name.slice(0, 20) : "");
  view(`<h1>🧠 Brain Champ</h1>` + card(t(renaming ? "name_prompt" : "ask_name")) +
    (msg ? `<div class="fb" style="color:var(--bad)">${esc(msg)}</div>` : "") +
    `<input id="nm" maxlength="20" autocomplete="off" value="${esc(val)}">` +
    btn("saveName", t("btn_save"), "main") + (renaming ? btn("menu", t("btn_menu")) : ""));
}

/* ----- Меню ----- */
function screenMenu(note = "") {
  const td = ensureToday();
  const status = td.done ? t("daily_done", {score: td.score, max: DAY_MAX}) : t("daily_todo");
  view(`<h1>🧠 Brain Champ</h1>` + (note ? `<div class="fb">${esc(note)}</div>` : "") +
    mascotHtml(bubbleText(), true) +
    card(t("menu_title", {rating: rating(), total: P.total, streak: curStreak()})) +
    `<button class="btn main" data-act="daily">${t("btn_daily")}<div class="sub">${esc(status)}</div></button>` +
    btn("practice", t("btn_practice")) +
    `<div class="row">${btn("profile", t("btn_profile"))}${btn("top", t("btn_top"))}</div>` +
    btn("settings", t("btn_settings")));
}

/* ----- Щоденне тренування ----- */
function screenDaily() {
  const td = ensureToday(), plan = dailyPlan(), parts = td.parts;
  const list = plan.map((g, i) => {
    const done = i < parts.length;
    return `<div>${done ? "✅" : i === parts.length ? "▶️" : "⏳"} ${esc(t("g_" + g))}${done ? ` — <b>${parts[i]}/${TASK_MAX}</b>` : ""}</div>`;
  }).join("");
  if (td.done) {
    view(`<h1>${esc(t("daily_title"))}</h1>` + card(t("daily_finished", {score: td.score, max: DAY_MAX})) +
      `<div class="card">${list}</div>` + btn("menu", t("btn_menu")));
  } else {
    view(`<h1>${esc(t("daily_title"))}</h1>` + card(t("daily_intro", {total: DAILY.tasks})) +
      `<div class="card">${list}</div>` +
      btn("dstart", parts.length ? t("btn_continue", {n: parts.length, total: plan.length}) : t("btn_start"), "main", `data-v="${parts.length}"`) +
      btn("menu", t("btn_menu")));
  }
}

function screenTaskIntro(idx) {
  const g = dailyPlan()[idx];
  view(`<h1>${esc(t("task_title", {n: idx + 1, total: DAILY.tasks}))}</h1>` +
    `<div class="card"><div class="q sm">${esc(t("g_" + g))}</div><div class="hint">${esc(t("d_" + g))}</div></div>` +
    btn("dgo", t("btn_go"), "main", `data-v="${idx}"`) + btn("daily", t("btn_back")));
}

function screenTaskDone(sess) {
  view(`<h1>${esc(t("task_title", {n: sess.taskIdx + 1, total: DAILY.tasks}))}</h1>` +
    card(t("task_done", {game: t("g_" + sess.game), score: sess.score, max: TASK_MAX, correct: sess.correct, total: sess.rounds})) +
    mascotHtml(mascotComment(sess.score / TASK_MAX)) +
    btn("dstart", t("btn_next"), "main", `data-v="${sess.taskIdx + 1}"`) + btn("menu", t("btn_menu")));
}

function screenDayDone(info) {
  view(`<h1>🏁</h1>` +
    card(t("day_done", {score: info.score, max: DAY_MAX, streak: curStreak(), rating: rating(), total: P.total}) + (info.isBest ? t("day_best") : "")) +
    mascotHtml(mascotComment(info.score / DAY_MAX)) + btn("top", t("btn_top")) + btn("menu", t("btn_menu"), "main"));
}

/* ----- Звичайне тренування (без балів) ----- */
function screenPractice() {
  view(`<h1>${esc(t("practice_title"))}</h1>` + card(t("practice_note")) +
    CAT_ORDER.map(c => btn("pcat", t("cat_" + c), "", `data-v="${c}"`)).join("") + btn("menu", t("btn_menu")));
}
function screenPracticeGames(cat) {
  view(`<h1>${esc(t("cat_" + cat))}</h1>` +
    CATS[cat].map(g => `<button class="btn" data-act="pgame" data-v="${g}">${esc(t("g_" + g))}<div class="sub">${esc(t("d_" + g))}</div></button>`).join("") +
    btn("practice", t("btn_back")));
}
function screenLevel(game) {
  view(`<h1>${esc(t("g_" + game))}</h1><div class="card"><div class="hint">${esc(t("d_" + game))}</div></div>` +
    card(t("choose_level")) +
    [1, 2, 3, 4, 5].map(n => btn("plevel", t("level_n", {n}), "", `data-v="${game}" data-l="${n}"`)).join("") +
    btn("pcat", t("btn_back"), "", `data-v="${catOf(game)}"`));
}
function screenPracticeDone(sess) {
  view(`<h1>🏁</h1>` +
    card(t("practice_result", {game: t("g_" + sess.game), correct: sess.correct, total: sess.rounds})) +
    mascotHtml(mascotComment(sess.correct / sess.rounds)) +
    btn("plevel", t("btn_again"), "main", `data-v="${sess.game}" data-l="${sess.lvl}"`) +
    `<div class="row">${btn("pgame", t("choose_level"), "", `data-v="${sess.game}"`)}${btn("menu", t("btn_menu"))}</div>`);
}

/* ----- Профіль (з аватаром Telegram) ----- */
function screenProfile() {
  const r = rating();
  const lines = GAMES.filter(g => P.best[g] > 0).map(g => `${t("g_" + g)}: 🏆 ${P.best[g]}/${TASK_MAX}`).join("\n");
  const linesBlock = lines ? t("profile_games") + "\n" + lines : t("profile_none");
  const txt = t("profile", {name: P.name, lang: LANG_NAMES[lang], rating: r, title: titleFor(r), total: P.total,
    streak: curStreak(), days: P.daysDone, bestDay: P.bestDay, max: DAY_MAX, lines: linesBlock});
  const body = txt.split("\n").slice(3).join("\n");   // перші рядки (ім'я, мова) вже показані зверху
  view(`<div class="prof">${avatarHtml(myPhoto(), P.name, 96)}<div class="pname">${esc(P.name)}</div>` +
    (tgUser && tgUser.username ? `<div class="mut">@${esc(tgUser.username)}</div>` : "") +
    `<div class="mut">${esc(LANG_NAMES[lang])}</div></div>` +
    `<div class="card">${esc(body)}</div>` +
    (tg ? btn("openTg", t("btn_open_tg"), "", `data-v="${esc(UID)}" data-u="${esc((tgUser && tgUser.username) || "")}" data-self="1"`) : "") +
    btn("settings", t("btn_settings")) + btn("menu", t("btn_menu")));
}

/* ----- Топ гравців ----- */
async function screenTop() {
  view(`<h1>${esc(t("top_title"))}</h1>` + card(t("loading")) + btn("menu", t("btn_menu")));
  let rows = [], note = "";
  const me = {id: UID, name: P.name, total: P.total, username: (tgUser && tgUser.username) || "", photo: myPhoto()};
  if (!DB) { rows = [me]; note = t("top_offline"); }
  else {
    try {
      const data = (await (await fetch(DB + "/players.json")).json()) || {};
      rows = Object.keys(data).map(id => ({
        id, name: String(data[id].name || "?"), total: Number(data[id].total) || 0,
        username: String(data[id].username || ""), photo: String(data[id].photo || "")
      }));
      rows.sort((a, b) => b.total - a.total);
      rows = rows.slice(0, 10);
    } catch (e) { note = t("top_error"); }
  }
  const medals = ["🥇", "🥈", "🥉"];
  const list = rows.length
    ? rows.map((p, i) => `<div class="prow ${p.id === UID ? "me" : ""}" data-act="openTg" data-v="${esc(p.id)}" data-u="${esc(p.username)}">` +
        `<span class="pos">${medals[i] || (i + 1) + "."}</span>${avatarHtml(p.photo, p.name, 38)}` +
        `<span class="pn">${esc(p.name)}</span><span class="pt">${p.total} 💎</span></div>`).join("")
    : (note ? "" : esc(t("top_empty")));
  view(`<h1>${esc(t("top_title"))}</h1><div class="card list">${list}</div>` +
    (rows.length && tg ? `<div class="mut center">${esc(t("top_hint"))}</div>` : "") +
    (note ? `<div class="mut center">${esc(note)}</div>` : "") + btn("menu", t("btn_menu")));
}

/* ----- Налаштування ----- */
function screenSettings() {
  view(`<h1>${esc(t("settings_title"))}</h1>` + btn("rename", t("btn_rename")) + btn("chlang", t("btn_language")) +
    btn("togSound", t("btn_sound", {v: t(P.sound !== false ? "on" : "off")})) +
    btn("togMusic", t("btn_music", {v: t(P.music !== false ? "on" : "off")})) + btn("menu", t("btn_menu")));
}
function screenChangeLang() {
  view(`<h1>${esc(t("btn_language"))}</h1>` + LANGS.map(c => btn("setLang", LANG_NAMES[c], "", `data-v="${c}"`)).join("") + btn("settings", t("btn_back")));
}
