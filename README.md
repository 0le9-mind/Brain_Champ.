# 🧠 Brain Champ — повний пакет

## Папка `github/` — гра (Mini App). Це те, що йде на GitHub Pages
index.html — сторінка | style.css — дизайн | config.js — налаштування і посилання на Firebase
core.js, i18n.js, utils.js, screens.js, games.js, engine.js — код гри (переклади, 4 міні-ігри, меню, профіль)

Завантаж УСІ ці 9 файлів у репозиторій (Add file → Upload files; можна вибрати одразу всі).
Далі: Settings → Pages → Branch main, / (root). Адреса: https://ТВІЙ-ЛОГІН.github.io/НАЗВА-РЕПО/

## Telegram (з телефона, ПК не потрібен)
@BotFather → /newapp → вибрати бота → вставити адресу GitHub Pages → отримаєш пряме посилання на гру.
Або: /mybots → бот → Bot Settings → Menu Button → вставити адресу.

## Папка `bot/` — необов'язковий бот-запускач (потребує ПК)
Лише привітання з кнопкою «Грати». Для гри не потрібен.
.env: BOT_TOKEN і WEBAPP_URL (без коментарів). Запуск: start.bat

## Топ гравців
Створи Firebase Realtime Database (test mode) і встав її адресу в config.js → databaseURL.
