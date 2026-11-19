// Утиліти, сховище, профіль
"use strict";
/* ===== Утиліти ===== */
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = arr => arr[rnd(0, arr.length - 1)];
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const sample = (arr, n) => shuffle(arr.slice()).slice(0, n);
const $ = id => document.getElementById(id);
const app = $("app");


/* ===== Сховище профілю: Telegram CloudStorage + localStorage ===== */
const useCloud = () => { try { return !!(tg && tg.CloudStorage && tg.isVersionAtLeast("6.9")); } catch (e) { return false; } };
const store = {
  get(key) {
    return new Promise(res => {
      let local = null;
      try { local = localStorage.getItem(key); } catch (e) {}
      if (!useCloud()) return res(local);
      let done = false;
      const to = setTimeout(() => { if (!done) { done = true; res(local); } }, 2500);
      try {
        tg.CloudStorage.getItem(key, (err, v) => { if (done) return; done = true; clearTimeout(to); res(!err && v ? v : local); });
      } catch (e) { done = true; clearTimeout(to); res(local); }
    });
  },
  set(key, val) {
    try { localStorage.setItem(key, val); } catch (e) {}
    if (useCloud()) { try { tg.CloudStorage.setItem(key, val, () => {}); } catch (e) {} }
  }
};


/* ===== Профіль ===== */
let P = null;   // {name, lang, stats:{game:{plays,best,total}}}
const emptyStats = () => Object.fromEntries(GAMES.map(g => [g, {plays: 0, best: 0, total: 0}]));
const saveP = () => { store.set("bc_profile", JSON.stringify(P)); pushRating(); };
const rating = () => Math.round(GAMES.reduce((s, g) => s + P.stats[g].best, 0) / GAMES.length);
const totalPlays = () => GAMES.reduce((s, g) => s + P.stats[g].plays, 0);
const titleFor = r => t("tl_" + [200, 400, 600, 800].filter(x => r >= x).length);

function pushRating() {
  if (!DB || !P) return;
  try {
    fetch(DB + "/players/" + encodeURIComponent(UID) + ".json", {
      method: "PUT", body: JSON.stringify({name: P.name, rating: rating(), ts: Date.now()})
    }).catch(() => {});
  } catch (e) {}
}


