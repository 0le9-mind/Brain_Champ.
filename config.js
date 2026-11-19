// Конфігурація Brain Champ (у стилі Firebase). Редагуй лише значення в лапках.
window.APP_CONFIG = {
  firebase: {
    // Вставити посилання на Realtime Database, наприклад:
    // "https://brain-champ-12345-default-rtdb.europe-west1.firebasedatabase.app"
    // Якщо порожньо — топ гравців показує лише тебе, а прогрес зберігається в Telegram.
    databaseURL: ""
  },
  game: {
    rounds: 10,       // раундів у грі
    basePoints: 50,   // бали за правильну відповідь
    bonusPoints: 50   // максимальний бонус за швидкість (максимум за гру = 1000)
  },
  defaultLanguage: "uk"   // uk | en | ru
};
