// Утиліти, сховище, профіль
"use strict";
let rng = Math.random;   // у щоденних завданнях підміняється на генератор із зерном (однакові завдання для всіх)
const mulberry32 = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const hashStr = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const rnd = (a, b) => Math.floor(rng() * (b - a + 1)) + a;
const pick = arr => arr[rnd(0, arr.length - 1)];
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const sample = (arr, n) => shuffle(arr.slice()).slice(0, n);
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
const $ = id => document.getElementById(id);
const app = $("app");

// Дати
const pad2 = n => String(n).padStart(2, "0");
const dateKey = (d = new Date()) => d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
const yesterdayKey = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dateKey(d); };

// Сховище: Telegram CloudStorage + localStorage
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

// Профіль
let P = null;
const newProfile = (name, l) => ({
  v: 2, name, lang: l, sound: true, music: true,
  total: 0, daysDone: 0, streak: 0, lastDate: "", bestDay: 0,
  best: {}, recent: [], today: {d: "", parts: [], done: false, score: 0}, tipDate: ""
});
function normalizeProfile(p) {
  const q = Object.assign(newProfile(p.name, p.lang), p);
  delete q.stats;   // старий формат (до щоденних тренувань)
  q.v = 2;
  return q;
}
function ensureToday() {
  const d = dateKey();
  if (!P.today || P.today.d !== d) P.today = {d, parts: [], cor: [], done: false, score: 0};
  if (!P.today.cor) P.today.cor = [];
  return P.today;
}
const persist = () => store.set("bc_profile", JSON.stringify(P));
const saveP = () => { persist(); pushRating(); };
const rating = () => {
  if (!P.recent.length) return 0;
  const avg = P.recent.reduce((s, r) => s + r.s, 0) / P.recent.length;
  return Math.min(1000, Math.round(avg / DAY_MAX * 1000));
};
const curStreak = () => (P.lastDate === dateKey() || P.lastDate === yesterdayKey()) ? P.streak : 0;
const titleFor = r => t("tl_" + [200, 400, 600, 800].filter(x => r >= x).length);

function pushRating() {
  if (!DB || !P) return;
  try {
    fetch(DB + "/players/" + encodeURIComponent(UID) + ".json", {
      method: "PUT", body: JSON.stringify({
        name: P.name, total: P.total, rating: rating(), streak: curStreak(), ts: Date.now(),
        username: (tgUser && tgUser.username) || "", photo: (tgUser && tgUser.photo_url) || ""
      })
    }).catch(() => {});
  } catch (e) {}
}

// Щоденний план: по одній грі з кожної категорії, однаковий для всіх у цей день
function dailyPlan() {
  const r = mulberry32(hashStr("plan:" + dateKey()));
  return Array.from({length: DAILY.tasks}, (_, i) => {
    const list = CATS[CAT_ORDER[i % CAT_ORDER.length]];
    return list[Math.floor(r() * list.length)];
  });
}
