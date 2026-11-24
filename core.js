// Конфіг, список ігор, Telegram
"use strict";
const CFG = window.APP_CONFIG || {};
const G = {practiceRounds: (CFG.game && CFG.game.practiceRounds) || 10};
const DAILY = Object.assign({tasks: 5, roundsPerTask: 4, basePoints: 25, bonusPoints: 25}, CFG.daily || {});
const TASK_MAX = DAILY.roundsPerTask * (DAILY.basePoints + DAILY.bonusPoints);   // максимум за завдання
const DAY_MAX = DAILY.tasks * TASK_MAX;                                            // максимум за день
// порівняння з вченими: частка від максимуму за день
const SCI = Object.assign({high: 0.85, mid: 0.5}, CFG.scientists || {});
const LV_DAILY = [1, 2, 4, 5];   // складність раундів у щоденному тренуванні

const DB = ((CFG.firebase && CFG.firebase.databaseURL) || "").replace(/\/+$/, "");
const LANGS = ["uk", "en", "ru"];
const LANG_NAMES = {uk: "🇺🇦 Українська", en: "🇬🇧 English", ru: "🇷🇺 Русский"};

// Категорії та міні-ігри (19 ігор)
const CAT_ORDER = ["calc", "memory", "logic", "attention", "reaction"];
const CATS = {
  calc: ["math", "compare", "missing", "chain"],
  memory: ["memory", "simon", "vanish", "digits", "tower"],
  logic: ["logic", "odd", "multiples", "extreme"],
  attention: ["stroop", "diff", "count", "schulte"],
  reaction: ["reflex", "target", "opposite"]
};
const CAT_ICON = {calc: "🧮", memory: "🧩", logic: "🔗", attention: "👁️", reaction: "⚡"};
const GAMES = [].concat(...CAT_ORDER.map(c => CATS[c]));
const catOf = g => CAT_ORDER.find(c => CATS[c].includes(g));
// секунд на раунд
const LIMITS = {math: 8, compare: 6, missing: 8, chain: 10, memory: 15, simon: 30, vanish: 8, digits: 8, tower: 15,
  logic: 20, odd: 8, multiples: 8, extreme: 6, stroop: 5, diff: 10, count: 8, schulte: 15,
  reflex: 4, target: 2.5, opposite: 3};

// Telegram
const tg = window.Telegram && window.Telegram.WebApp;
if (tg) { try { tg.ready(); tg.expand(); tg.setBackgroundColor("#11142b"); tg.setHeaderColor("#11142b"); } catch (e) {} }
const tgUser = tg && tg.initDataUnsafe && tg.initDataUnsafe.user;
const UID = tgUser ? String(tgUser.id) : "local";
const buzz = kind => { try { tg.HapticFeedback.notificationOccurred(kind); } catch (e) {} };
