// Екрани та меню
"use strict";
/* ===== Екрани ===== */
const view = html => { app.innerHTML = html; window.scrollTo(0, 0); };
const btn = (act, label, cls = "", extra = "") => `<button class="btn ${cls}" data-act="${act}" ${extra}>${label}</button>`;

let pendingLang = DEF_LANG;

function screenLang() {
  lang = DEF_LANG;
  view(`<h1>🧠 Brain Champ</h1><div class="card">${esc(t("choose_lang"))}</div>` +
    LANGS.map(c => btn("pickLang", LANG_NAMES[c], "", `data-v="${c}"`)).join(""));
}

function screenName(msg = "", renaming = false) {
  const val = P ? P.name : (tgUser && tgUser.first_name ? tgUser.first_name.slice(0, 20) : "");
  view(`<h1>🧠 Brain Champ</h1><div class="card">${esc(t("ask_name"))}</div>` +
    (msg ? `<div class="fb" style="color:var(--bad)">${esc(msg)}</div>` : "") +
    `<input id="nm" maxlength="20" autocomplete="off" value="${esc(val)}">` +
    btn("saveName", t("btn_save"), "main") + (renaming ? btn("menu", t("btn_menu")) : ""));
}

function screenMenu(note = "") {
  view(`<h1>🧠 Brain Champ</h1>` + (note ? `<div class="fb">${esc(note)}</div>` : "") +
    `<div class="card">${esc(t("menu_title", {name: P.name, rating: rating()}))}</div>` +
    btn("games", t("btn_play"), "main") +
    `<div class="row">${btn("profile", t("btn_profile"))}${btn("top", t("btn_top"))}</div>` +
    btn("settings", t("btn_settings")));
}

function screenGames() {
  view(`<h1>${esc(t("choose_game"))}</h1>` +
    GAMES.map(g => `<button class="btn" data-act="play" data-v="${g}">${t("game_" + g)}<div class="mut">${esc(t("desc_" + g))}</div></button>`).join("") +
    btn("menu", t("btn_menu")));
}

function screenProfile() {
  const lines = GAMES.map(g => t("profile_line", {game: t("game_" + g), best: P.stats[g].best, plays: P.stats[g].plays})).join("\n");
  const r = rating();
  const txt = t("profile", {name: "\u0001", lang: LANG_NAMES[lang], rating: r, title: titleFor(r), plays: totalPlays(), lines: "\u0002"});
  view(`<div class="card">${esc(txt).replace("\u0001", esc(P.name)).replace("\u0002", esc(lines))}</div>` +
    btn("settings", t("btn_settings")) + btn("menu", t("btn_menu")));
}

async function screenTop() {
  view(`<h1>${esc(t("top_title"))}</h1><div class="card">${esc(t("loading"))}</div>` + btn("menu", t("btn_menu")));
  let rows = [], note = "";
  if (!DB) {
    rows = [{id: UID, name: P.name, rating: rating()}];
    note = t("top_offline");
  } else {
    try {
      const r = await fetch(DB + "/players.json");
      const data = (await r.json()) || {};
      rows = Object.keys(data).map(id => ({id, name: String(data[id].name || "?"), rating: Number(data[id].rating) || 0}));
      rows.sort((a, b) => b.rating - a.rating);
      rows = rows.slice(0, 10);
    } catch (e) { note = t("top_error"); }
  }
  const medals = ["🥇", "🥈", "🥉"];
  const list = rows.length
    ? rows.map((p, i) => `<div class="${p.id === UID ? "me" : ""}">${medals[i] || (i + 1) + "."} ${esc(p.name)} — ${p.rating}</div>`).join("")
    : (note ? "" : esc(t("top_empty")));
  view(`<h1>${esc(t("top_title"))}</h1><div class="card">${list}${note ? `<div class="mut" style="margin-top:10px">${esc(note)}</div>` : ""}</div>` + btn("menu", t("btn_menu")));
}

function screenSettings() {
  view(`<h1>${esc(t("settings_title"))}</h1>` + btn("rename", t("btn_rename")) + btn("chlang", t("btn_language")) + btn("menu", t("btn_menu")));
}

function screenChangeLang() {
  view(`<h1>${esc(t("btn_language"))}</h1>` + LANGS.map(c => btn("setLang", LANG_NAMES[c], "", `data-v="${c}"`)).join("") + btn("settings", "←"));
}


