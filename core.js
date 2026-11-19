// Конфіг і Telegram
"use strict";
/* ===== Конфіг ===== */
const CFG = window.APP_CONFIG || {};
const G = Object.assign({rounds: 10, basePoints: 50, bonusPoints: 50}, CFG.game || {});
const DB = ((CFG.firebase && CFG.firebase.databaseURL) || "").replace(/\/+$/, "");
const GAMES = ["math", "memory", "reflex", "logic"];
const LIMITS = {math: 8, memory: 15, reflex: 4, logic: 20};   // секунд на раунд
const LANGS = ["uk", "en", "ru"];
const LANG_NAMES = {uk: "🇺🇦 Українська", en: "🇬🇧 English", ru: "🇷🇺 Русский"};


/* ===== Telegram ===== */
const tg = window.Telegram && window.Telegram.WebApp;
if (tg) { try { tg.ready(); tg.expand(); tg.setBackgroundColor("#11142b"); tg.setHeaderColor("#11142b"); } catch (e) {} }
const tgUser = tg && tg.initDataUnsafe && tg.initDataUnsafe.user;
const UID = tgUser ? String(tgUser.id) : "local";
const buzz = kind => { try { tg.HapticFeedback.notificationOccurred(kind); } catch (e) {} };


