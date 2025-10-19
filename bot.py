import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Updater, CommandHandler, CallbackQueryHandler, CallbackContext
import sqlite3
import datetime
import time

logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)
logger = logging.getLogger(__name__)


class FixedClickerBot:
    def __init__(self, token):
        self.token = token
        self.updater = Updater(token)
        self.dispatcher = self.updater.dispatcher
        self.setup_handlers()
        self.init_database()

    def init_database(self):
        """Инициализация базы данных с проверкой существующих колонок"""
        conn = sqlite3.connect('clicker.db')
        cursor = conn.cursor()

        # Создаем таблицу users с всеми необходимыми колонками
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

        # Создаем таблицу upgrades
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS upgrades (
                user_id INTEGER,
                upgrade_type TEXT,
                level INTEGER DEFAULT 1,
                PRIMARY KEY (user_id, upgrade_type)
            )
        ''')

        # Проверяем существование колонки username и добавляем если нужно
        try:
            cursor.execute("SELECT username FROM users LIMIT 1")
        except sqlite3.OperationalError:
            cursor.execute("ALTER TABLE users ADD COLUMN username TEXT")

        # Проверяем другие колонки
        columns_to_check = ['last_passive_claim', 'passive_income']
        for column in columns_to_check:
            try:
                cursor.execute(f"SELECT {column} FROM users LIMIT 1")
            except sqlite3.OperationalError:
                if column == 'last_passive_claim':
                    cursor.execute(f"ALTER TABLE users ADD COLUMN {column} TEXT")
                else:
                    cursor.execute(f"ALTER TABLE users ADD COLUMN {column} INTEGER DEFAULT 0")

        conn.commit()
        conn.close()

    def setup_handlers(self):
        self.dispatcher.add_handler(CommandHandler("start", self.start))
        self.dispatcher.add_handler(CommandHandler("game", self.game))
        self.dispatcher.add_handler(CommandHandler("profile", self.profile))
        self.dispatcher.add_handler(CommandHandler("shop", self.shop))
        self.dispatcher.add_handler(CallbackQueryHandler(self.handle_callback, pattern='^.*$'))

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
            # Получаем только что созданного пользователя
            cursor.execute('SELECT * FROM users WHERE user_id = ?', (user_id,))
            user = cursor.fetchone()

        # Получаем улучшения пользователя
        cursor.execute('SELECT upgrade_type, level FROM upgrades WHERE user_id = ?', (user_id,))
        upgrades = {row[0]: row[1] for row in cursor.fetchall()}

        conn.close()
        return user, upgrades

    def update_user(self, user_id, updates):
        conn = sqlite3.connect('clicker.db')
        cursor = conn.cursor()

        # Проверяем существование колонок перед обновлением
        cursor.execute("PRAGMA table_info(users)")
        existing_columns = [column[1] for column in cursor.fetchall()]

        valid_updates = {}
        for key, value in updates.items():
            if key in existing_columns:
                valid_updates[key] = value
            else:
                print(f"Предупреждение: Колонка {key} не существует в таблице users")

        if valid_updates:
            set_clause = ', '.join([f"{key} = ?" for key in valid_updates.keys()])
            values = list(valid_updates.values())
            values.append(user_id)

            cursor.execute(f'UPDATE users SET {set_clause} WHERE user_id = ?', values)

        conn.commit()
        conn.close()

    def add_upgrade(self, user_id, upgrade_type, level=1):
        conn = sqlite3.connect('clicker.db')
        cursor = conn.cursor()

        cursor.execute('''
            INSERT OR REPLACE INTO upgrades (user_id, upgrade_type, level)
            VALUES (?, ?, ?)
        ''', (user_id, upgrade_type, level))

        conn.commit()
        conn.close()

    def start(self, update: Update, context: CallbackContext):
        user = update.effective_user
        user_data, upgrades = self.get_user_data(user.id)

        # Обновляем username (если колонка существует)
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
                    # Бонус новому пользователю
                    self.update_user(user.id, {'balance': user_data[2] + 50})
            except ValueError:
                pass

        welcome_text = f"""
🎮 *Добро пожаловать в Магазин Кликер!*

Привет, {user.first_name}! 👋

*Зарабатывай токены и получай скидки* в нашем магазине одежды и кроссовок!

💎 *Твой баланс:* {user_data[2]} токенов
⭐ *Уровень:* {user_data[3]}
👥 *Рефералы:* {user_data[6]}

*Как играть:*
• Нажимай 🖱️ *Клик!* для получения токенов
• 🏪 Открывай магазин для улучшений
• 👥 Приглашай друзей за бонусы
• 💤 Разблокируй пассивный доход

*Курс обмена:* 1000 токенов = 100 рублей скидки
        """

        keyboard = [
            [InlineKeyboardButton("🖱️ Клик!", callback_data='click_main')],
            [InlineKeyboardButton("👤 Профиль", callback_data='profile'),
             InlineKeyboardButton("🏪 Магазин", callback_data='shop')],
            [InlineKeyboardButton("👥 Пригласить друзей", callback_data='referral'),
             InlineKeyboardButton("📊 Статистика", callback_data='stats')],
            [InlineKeyboardButton("💤 Пассивный доход", callback_data='passive')]
        ]

        reply_markup = InlineKeyboardMarkup(keyboard)

        update.message.reply_text(welcome_text, reply_markup=reply_markup, parse_mode='Markdown')

    def profile(self, update: Update, context: CallbackContext):
        user = update.effective_user
        user_data, upgrades = self.get_user_data(user.id)

        # Рассчитываем пассивный доход
        try:
            last_claim = datetime.datetime.fromisoformat(
                user_data[9] if user_data[9] else datetime.datetime.now().isoformat())
        except:
            last_claim = datetime.datetime.now()

        now = datetime.datetime.now()
        hours_passed = (now - last_claim).total_seconds() / 3600
        passive_earned = hours_passed * user_data[7]

        profile_text = f"""
👤 *Профиль {user.first_name}*

💎 *Баланс:* {user_data[2]:,} токенов
⭐ *Уровень:* {user_data[3]}
🖱️ *Всего кликов:* {user_data[4]:,}
👥 *Рефералы:* {user_data[6]}
💤 *Пассивный доход:* {user_data[7]} токенов/час

*Доступно к получению:* {passive_earned:.1f} токенов

*Курс обмена:* 
1000 токенов = 100 рублей скидки
5000 токенов = 600 рублей скидки
        """

        keyboard = [
            [InlineKeyboardButton("💤 Забрать пассивный доход", callback_data='claim_passive')],
            [InlineKeyboardButton("💳 Обменять токены", callback_data='exchange')],
            [InlineKeyboardButton("🎮 Назад в игру", callback_data='main_menu')]
        ]

        reply_markup = InlineKeyboardMarkup(keyboard)

        if update.callback_query:
            update.callback_query.edit_message_text(profile_text, reply_markup=reply_markup, parse_mode='Markdown')
        else:
            update.message.reply_text(profile_text, reply_markup=reply_markup, parse_mode='Markdown')

    def shop(self, update: Update, context: CallbackContext):
        user = update.effective_user
        user_data, upgrades = self.get_user_data(user.id)

        shop_text = f"""
🏪 *Магазин улучшений*

💎 *Ваш баланс:* {user_data[2]:,} токенов

*Доступные улучшения:*

🖱️ *Улучшенный клик* (Уровень {upgrades.get('click_power', 1)})
Цена: {100 * upgrades.get('click_power', 1)} токенов
+1 токен за клик

💤 *Пассивный доход* (Уровень {upgrades.get('passive', 1)})
Цена: {200 * upgrades.get('passive', 1)} токенов
+1 токен/час

⚡ *Автокликер* (Уровень {upgrades.get('autoclick', 0)})
Цена: {500 * (upgrades.get('autoclick', 0) + 1)} токенов
Автоматические клики каждую минуту
        """

        keyboard = [
            [InlineKeyboardButton("🖱️ Улучшить клик", callback_data='buy_click_power')],
            [InlineKeyboardButton("💤 Улучшить пассивный доход", callback_data='buy_passive')],
            [InlineKeyboardButton("⚡ Купить автокликер", callback_data='buy_autoclick')],
            [InlineKeyboardButton("🎮 Назад в игру", callback_data='main_menu')]
        ]

        reply_markup = InlineKeyboardMarkup(keyboard)

        if update.callback_query:
            update.callback_query.edit_message_text(shop_text, reply_markup=reply_markup, parse_mode='Markdown')
        else:
            update.message.reply_text(shop_text, reply_markup=reply_markup, parse_mode='Markdown')

    def handle_callback(self, update: Update, context: CallbackContext):
        query = update.callback_query
        user = query.from_user
        user_data, upgrades = self.get_user_data(user.id)

        if query.data == 'click_main':
            # Расчет награды за клик
            base_reward = 1
            click_power_bonus = upgrades.get('click_power', 1) - 1
            level_bonus = user_data[3] * 0.2
            total_reward = base_reward + click_power_bonus + level_bonus

            new_balance = user_data[2] + total_reward
            new_clicks = user_data[4] + 1

            # Проверка повышения уровня
            new_level = user_data[3]
            if new_clicks >= user_data[3] * 150:
                new_level += 1
                level_up_text = f"\n🎉 *Поздравляем! Вы достигли уровня {new_level}!*"
            else:
                level_up_text = ""

            self.update_user(user.id, {
                'balance': new_balance,
                'clicks': new_clicks,
                'level': new_level,
                'last_click': datetime.datetime.now().isoformat()
            })

            response_text = f"""
💎 *+{total_reward:.1f} токенов!*

💰 *Баланс:* {new_balance:.1f} 💎
⭐ *Уровень:* {new_level}
🎯 *Кликов:* {new_clicks:,}
{level_up_text}

Продолжайте в том же духе! 🚀
            """

            keyboard = [
                [InlineKeyboardButton("🖱️ Кликнуть еще!", callback_data='click_main')],
                [InlineKeyboardButton("👤 Профиль", callback_data='profile'),
                 InlineKeyboardButton("🏪 Магазин", callback_data='shop')]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)

            query.edit_message_text(response_text, reply_markup=reply_markup, parse_mode='Markdown')

        elif query.data == 'profile':
            self.profile(update, context)

        elif query.data == 'shop':
            self.shop(update, context)

        elif query.data == 'main_menu':
            self.start(update, context)

        elif query.data == 'claim_passive':
            # Забираем пассивный доход
            try:
                last_claim = datetime.datetime.fromisoformat(
                    user_data[9] if user_data[9] else datetime.datetime.now().isoformat())
            except:
                last_claim = datetime.datetime.now()

            now = datetime.datetime.now()
            hours_passed = (now - last_claim).total_seconds() / 3600
            passive_earned = hours_passed * user_data[7]

            if passive_earned > 0:
                new_balance = user_data[2] + passive_earned
                self.update_user(user.id, {
                    'balance': new_balance,
                    'last_passive_claim': now.isoformat()
                })

                response_text = f"""
💤 *Пассивный доход получен!*

💎 *Получено:* {passive_earned:.1f} токенов
💰 *Новый баланс:* {new_balance:.1f} 💎

Пассивный доход снова накапливается!
                """
            else:
                response_text = "💤 Пассивный доход еще не накоплен. Проверьте позже!"

            keyboard = [[InlineKeyboardButton("👤 Профиль", callback_data='profile')]]
            reply_markup = InlineKeyboardMarkup(keyboard)

            query.edit_message_text(response_text, reply_markup=reply_markup, parse_mode='Markdown')

        elif query.data.startswith('buy_'):
            upgrade_type = query.data[4:]  # 'click_power', 'passive', 'autoclick'
            current_level = upgrades.get(upgrade_type, 1 if upgrade_type != 'autoclick' else 0)

            if upgrade_type == 'click_power':
                price = 100 * current_level
            elif upgrade_type == 'passive':
                price = 200 * current_level
            elif upgrade_type == 'autoclick':
                price = 500 * (current_level + 1)

            if user_data[2] >= price:
                # Покупка улучшения
                new_balance = user_data[2] - price
                new_level = current_level + 1

                self.update_user(user.id, {'balance': new_balance})
                self.add_upgrade(user.id, upgrade_type, new_level)

                # Обновляем пассивный доход если нужно
                if upgrade_type == 'passive':
                    self.update_user(user.id, {'passive_income': new_level})

                response_text = f"""
✅ *Улучшение куплено!*

🎊 *{upgrade_type.replace('_', ' ').title()}* теперь уровень {new_level}
💎 *Потрачено:* {price} токенов
💰 *Осталось:* {new_balance} токенов
                """
            else:
                response_text = f"❌ Недостаточно токенов! Нужно {price}, а у вас {user_data[2]}"

            keyboard = [[InlineKeyboardButton("🏪 Назад в магазин", callback_data='shop')]]
            reply_markup = InlineKeyboardMarkup(keyboard)

            query.edit_message_text(response_text, reply_markup=reply_markup, parse_mode='Markdown')

        elif query.data == 'referral':
            bot_username = context.bot.username
            referral_link = f"https://t.me/{bot_username}?start={user.id}"

            referral_text = f"""
👥 *Реферальная программа*

Приглашайте друзей и получайте бонусы!

🔗 *Ваша реферальная ссылка:*
`{referral_link}`

🎁 *Бонусы:*
• Вы получаете: 100 токенов за каждого друга
• Друг получает: 50 токенов при регистрации

👥 *Приглашено друзей:* {user_data[6]}
            """

            keyboard = [[InlineKeyboardButton("🎮 Назад в игру", callback_data='main_menu')]]
            reply_markup = InlineKeyboardMarkup(keyboard)

            query.edit_message_text(referral_text, reply_markup=reply_markup, parse_mode='Markdown')

        query.answer()

    def run(self):
        self.updater.start_polling()
        print("Бот запущен! 🚀")
        self.updater.idle()


# Запуск бота
if __name__ == '__main__':
    # Получаем токен из переменных окружения (для Railway)
    import os

    TOKEN = os.environ.get('BOT_TOKEN', '7730710795:AAFiL2yQyd49Vm7mcUr7idbG1b59jozhGaU')

    if TOKEN == 'YOUR_BOT_TOKEN_HERE':
        print("❌ Ошибка: Установите переменную окружения BOT_TOKEN")
    else:
        bot = FixedClickerBot(TOKEN)
        bot.run()