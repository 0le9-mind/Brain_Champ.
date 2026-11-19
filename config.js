// Конфігурація Brain Champ (у стилі Firebase). Редагуй лише значення.
window.APP_CONFIG = {
  firebase: {
    // Вставити посилання на Realtime Database, наприклад:
    // "https://brain-champ-12345-default-rtdb.europe-west1.firebasedatabase.app"
    // Якщо порожньо — топ показує лише тебе, а прогрес зберігається в Telegram.
    databaseURL: "https://brain-champ-10100-default-rtdb.europe-west1.firebasedatabase.app/"
  },
  game: {
    practiceRounds: 10     // раундів у звичайному тренуванні (бали не зараховуються)
  },
  daily: {
    tasks: 5,              // завдань у щоденному тренуванні
    roundsPerTask: 4,      // раундів у кожному завданні
    basePoints: 25,        // бали за правильну відповідь
    bonusPoints: 25        // максимальний бонус за швидкість (максимум за день = 5*4*50 = 1000)
  },
  defaultLanguage: "uk"    // uk | en | ru
};
