"""Невеликий бот-запускач для Mini App Brain Champ (необов'язковий).
Показує привітання і кнопку, що відкриває гру. Запуск: python main.py"""
import asyncio
import os

from aiogram import Bot, Dispatcher
from aiogram.filters import CommandStart
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, Message, WebAppInfo
from dotenv import load_dotenv

load_dotenv()
TOKEN = os.getenv("BOT_TOKEN", "")
WEBAPP_URL = os.getenv("WEBAPP_URL", "")

dp = Dispatcher()


@dp.message(CommandStart())
async def start(message: Message):
    kb = InlineKeyboardMarkup(inline_keyboard=[[
        InlineKeyboardButton(text="🧠 Грати в Brain Champ", web_app=WebAppInfo(url=WEBAPP_URL))
    ]])
    await message.answer(
        "🧠 Brain Champ — тренування мозку!\n\n"
        "🧮 Математичний спринт\n🧩 Пошук числа\n⚡ Швидкий вибір\n🔗 Логічні ланцюжки\n\n"
        "Натисни кнопку, щоб грати.",
        reply_markup=kb,
    )


async def main():
    if not TOKEN or not WEBAPP_URL:
        raise SystemExit("У файлі .env потрібні BOT_TOKEN і WEBAPP_URL")
    bot = Bot(TOKEN)
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
