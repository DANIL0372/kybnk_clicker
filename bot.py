import logging
from telegram import Update, KeyboardButton, ReplyKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, CallbackContext
import sqlite3
import datetime

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)


class WebAppBot:
    def __init__(self, token):
        self.token = token
        self.application = Application.builder().token(token).build()
        self.setup_handlers()
        self.init_database()

    def init_database(self):
        conn = sqlite3.connect('clicker.db')
        cursor = conn.cursor()

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                user_id INTEGER PRIMARY KEY,
                username TEXT,
                balance INTEGER DEFAULT 100,
                level INTEGER DEFAULT 1,
                clicks INTEGER DEFAULT 0,
                last_click TEXT,
                referrals INTEGER DEFAULT 0,
                passive_income INTEGER DEFAULT 0,
                last_passive_claim TEXT,
                created_at TEXT
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS upgrades (
                user_id INTEGER,
                upgrade_type TEXT,
                level INTEGER DEFAULT 1,
                PRIMARY KEY (user_id, upgrade_type)
            )
        ''')

        conn.commit()
        conn.close()

    def setup_handlers(self):
        self.application.add_handler(CommandHandler("start", self.start))

    def get_user_data(self, user_id):
        conn = sqlite3.connect('clicker.db')
        cursor = conn.cursor()

        cursor.execute('SELECT * FROM users WHERE user_id = ?', (user_id,))
        user = cursor.fetchone()

        if not user:
            now = datetime.datetime.now().isoformat()
            cursor.execute('''
                INSERT INTO users (user_id, username, balance, level, clicks, passive_income, created_at, last_passive_claim)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (user_id, None, 100, 1, 0, 0, now, now))
            conn.commit()
            cursor.execute('SELECT * FROM users WHERE user_id = ?', (user_id,))
            user = cursor.fetchone()

        cursor.execute('SELECT upgrade_type, level FROM upgrades WHERE user_id = ?', (user_id,))
        upgrades = {row[0]: row[1] for row in cursor.fetchall()}

        conn.close()
        return user, upgrades

    def update_user(self, user_id, updates):
        conn = sqlite3.connect('clicker.db')
        cursor = conn.cursor()

        set_clause = ', '.join([f"{key} = ?" for key in updates.keys()])
        values = list(updates.values())
        values.append(user_id)

        cursor.execute(f'UPDATE users SET {set_clause} WHERE user_id = ?', values)
        conn.commit()
        conn.close()

    async def start(self, update: Update, context: CallbackContext):
        user = update.effective_user
        user_data, upgrades = self.get_user_data(user.id)

        # Обновляем username
        self.update_user(user.id, {'username': user.username})

        # Реферальная система
        if context.args:
            try:
                referrer_id = int(context.args[0])
                if referrer_id != user.id:
                    referrer_data, _ = self.get_user_data(referrer_id)
                    self.update_user(referrer_id, {
                        'balance': referrer_data[2] + 100,
                        'referrals': referrer_data[6] + 1
                    })
                    self.update_user(user.id, {'balance': user_data[2] + 50})
            except ValueError:
                pass

        welcome_text = f"""
🎮 *Добро пожаловать в Магазин Кликер!*

Привет, {user.first_name}! 👋

Нажми кнопку ниже, чтобы открыть игру в полноэкранном режиме!

💎 *Твой баланс:* {user_data[2]} токенов
⭐ *Уровень:* {user_data[3]}

*Курс обмена:* 1000 токенов = 100 рублей скидки
        """

        # ЗАМЕНИТЕ ЭТОТ URL НА ВАШ LOCALHOST.RUN URL
        web_app_url = "https://4f8f7a78fa9870.lhr.life"  # ← ЗАМЕНИТЕ НА ВАШ URL

        keyboard = [[
            KeyboardButton(
                "🎮 Открыть игру",
                web_app=WebAppInfo(url=web_app_url)
            )
        ]]

        reply_markup = ReplyKeyboardMarkup(
            keyboard,
            resize_keyboard=True,
            one_time_keyboard=False  # Изменил на False, чтобы кнопка не пропадала
        )

        await update.message.reply_text(welcome_text, reply_markup=reply_markup, parse_mode='Markdown')

    def run(self):
        print("WebApp бот запущен! 🚀")
        self.application.run_polling()


if __name__ == '__main__':
    # ЗАМЕНИТЕ НА ВАШ ТОКЕН БОТА
    TOKEN = "7730710795:AAFiL2yQyd49Vm7mcUr7idbG1b59jozhGaU"
    bot = WebAppBot(TOKEN)
    bot.run()