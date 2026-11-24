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
// Порівняння з видатними вченими за результатом щоденного тренування (стабільне протягом дня)
function sciPick(ratio) {
  const tier = ratio >= SCI.high ? ["einstein"] : ratio >= SCI.mid ? ["pascal", "newton"] : ["plato", "socrates", "aristotle"];
  const k = hashStr("sci:" + dateKey());
  const name = tier[k % tier.length];
  return {name, text: t("sci_" + name + "_" + (1 + Math.floor(k / 7) % 2)), info: t("sci_info_" + name)};
}
const sciComment = ratio => sciPick(ratio).text;
// чоловічок порівнює з ученим, а нижче — коротка довідка про нього
function sciHtml(ratio) {
  const s = sciPick(ratio);
  return mascotHtml(s.text) + `<div class="card sci"><div class="mut">${esc(t("sci_about"))}</div>${esc(s.info)}</div>`;
}
// Повідомлення після тренування залежно від кількості помилок
function practiceComment(correct, rounds) {
  const err = rounds - correct;
  return t(err === 0 ? "pc_perfect" : err <= 2 ? "pc_good" : correct / rounds >= 0.4 ? "pc_mid" : "pc_poor");
}

/* ----- Мозок із зеленим заповненням (чим менше помилок, тим більше зеленого) ----- */
function brainHtml(pct, caption) {
  pct = Math.max(0, Math.min(1, pct || 0));
  const HEMI = "M98 14C70 6 36 20 26 52C14 62 12 90 26 104C22 124 40 146 66 146C80 156 92 150 98 140Z";
  const GYRI = ["M44 48C56 40 68 50 80 42", "M32 78C48 66 60 84 78 72", "M36 108C50 98 62 116 80 104", "M60 128C70 120 80 132 90 124", "M54 28C62 22 76 28 86 22"];
  const z = pct * 8;   // 8 зон: знизу вгору, ліва й права півкулі по черзі
  let zones = "";
  for (let i = 0; i < 8; i++) {
    const frac = Math.max(0, Math.min(1, z - i));
    const band = Math.floor(i / 2), left = i % 2 === 0, h = 37, y = 158 - (band + 1) * h;
    zones += `<rect x="${left ? 0 : 100}" y="${y}" width="100" height="${h}" fill="#323b73"/>`;
    if (frac > 0) zones += `<rect class="gz" style="animation-delay:${i * 130}ms" x="${left ? 0 : 100}" y="${y}" width="100" height="${h}" fill="#3ddc84" fill-opacity="${frac.toFixed(2)}"/>`;
  }
  const p = Math.round(pct * 100);
  const svg = `<svg viewBox="0 0 200 170" role="img" aria-label="${p}%"><defs><clipPath id="bclip"><path d="${HEMI}"/><path d="${HEMI}" transform="translate(200,0) scale(-1,1)"/></clipPath></defs>` +
    `<g clip-path="url(#bclip)">${zones}</g>` +
    `<g fill="none" stroke="#0b1030" stroke-opacity=".55" stroke-width="3" stroke-linecap="round">${GYRI.map(d => `<path d="${d}"/>`).join("")}<g transform="translate(200,0) scale(-1,1)">${GYRI.map(d => `<path d="${d}"/>`).join("")}</g></g>` +
    `<g fill="none" stroke="#9aa3d6" stroke-width="3" stroke-linejoin="round"><path d="${HEMI}"/><path d="${HEMI}" transform="translate(200,0) scale(-1,1)"/></g></svg>`;
  return `<div class="card brain"><div class="mut">${esc(t("brain_title"))}</div>${svg}<div class="bp">${p}%</div>` +
    (caption ? `<div>${esc(caption)}</div>` : "") + `<div class="mut">${esc(t("brain_hint"))}</div></div>`;
}

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
      sciHtml(td.score / DAY_MAX) + brainHtml(td.acc !== undefined ? td.acc : td.score / DAY_MAX, td.cor.length >= DAILY.tasks ? t("brain_caption", {c: td.cor.reduce((a, b) => a + (b || 0), 0), n: DAILY.tasks * DAILY.roundsPerTask}) : "") + `<div class="card">${list}</div>` + btn("menu", t("btn_menu")));
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
    brainHtml(sess.correct / sess.rounds, t("brain_caption", {c: sess.correct, n: sess.rounds})) +
    mascotHtml(practiceComment(sess.correct, sess.rounds)) +
    btn("dstart", t("btn_next"), "main", `data-v="${sess.taskIdx + 1}"`) + btn("menu", t("btn_menu")));
}

function screenDayDone(info) {
  view(`<h1>🏁</h1>` +
    card(t("day_done", {score: info.score, max: DAY_MAX, streak: curStreak(), rating: rating(), total: P.total}) + (info.isBest ? t("day_best") : "")) +
    brainHtml(info.acc, t("brain_caption", {c: info.cor, n: info.n})) + sciHtml(info.score / DAY_MAX) + btn("top", t("btn_top")) + btn("menu", t("btn_menu"), "main"));
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
    brainHtml(sess.correct / sess.rounds, t("brain_caption", {c: sess.correct, n: sess.rounds})) +
    mascotHtml(practiceComment(sess.correct, sess.rounds)) +
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
