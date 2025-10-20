from flask import Flask, request, jsonify, send_from_directory
import sqlite3
import datetime
import json

app = Flask(__name__)


def get_db_connection():
    conn = sqlite3.connect('clicker.db')
    conn.row_factory = sqlite3.Row
    return conn


@app.route('/')
def home():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Магазин Кликер</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://telegram.org/js/telegram-web-app.js"></script>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
            body {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                min-height: 100vh;
                padding: 20px;
            }
            .container {
                max-width: 400px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .header h1 {
                font-size: 2em;
                margin-bottom: 10px;
            }
            .balance-card {
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border-radius: 20px;
                padding: 25px;
                margin-bottom: 25px;
                text-align: center;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            .balance-amount {
                font-size: 3em;
                font-weight: bold;
                margin: 10px 0;
            }
            .click-area {
                background: rgba(255, 255, 255, 0.15);
                border-radius: 50%;
                width: 250px;
                height: 250px;
                margin: 30px auto;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s;
                border: 4px solid rgba(255, 255, 255, 0.3);
            }
            .click-area:active {
                transform: scale(0.95);
                background: rgba(255, 255, 255, 0.25);
            }
            .click-text {
                font-size: 2em;
                font-weight: bold;
            }
            .stats-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin-bottom: 25px;
            }
            .stat-card {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 15px;
                padding: 20px;
                text-align: center;
            }
            .stat-value {
                font-size: 1.5em;
                font-weight: bold;
                margin-top: 5px;
            }
            .upgrade-btn {
                width: 100%;
                padding: 15px;
                background: rgba(255, 255, 255, 0.2);
                border: none;
                border-radius: 10px;
                color: white;
                margin: 10px 0;
                cursor: pointer;
            }
            .reward-popup {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.8);
                padding: 20px 30px;
                border-radius: 15px;
                font-size: 1.5em;
                font-weight: bold;
                z-index: 1000;
                animation: fadeOut 1s forwards;
            }
            @keyframes fadeOut {
                0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -100%) scale(0.8); }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎮 Магазин Кликер</h1>
                <p>Зарабатывай токены для скидок!</p>
            </div>

            <div class="balance-card">
                <div>Ваш баланс</div>
                <div class="balance-amount" id="balance">100</div>
                <div>токенов</div>
            </div>

            <div class="click-area" id="clickButton">
                <div class="click-text">КЛИК!</div>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div>Уровень</div>
                    <div class="stat-value" id="level">1</div>
                </div>
                <div class="stat-card">
                    <div>Кликов</div>
                    <div class="stat-value" id="clicks">0</div>
                </div>
            </div>

            <button class="upgrade-btn" onclick="buyUpgrade('click')">
                🖱️ Улучшить клик (100 💎)
            </button>
            <button class="upgrade-btn" onclick="buyUpgrade('passive')">
                💤 Пассивный доход (200 💎)
            </button>
        </div>

        <script>
            let tg = window.Telegram.WebApp;
            let userData = {
                balance: 100,
                level: 1,
                clicks: 0,
                upgrades: {
                    click: 1,
                    passive: 0
                }
            };

            tg.expand();
            tg.enableClosingConfirmation();

            function updateUI() {
                document.getElementById('balance').textContent = userData.balance;
                document.getElementById('level').textContent = userData.level;
                document.getElementById('clicks').textContent = userData.clicks;
            }

            function handleClick() {
                const baseReward = 1;
                const upgradeBonus = (userData.upgrades.click - 1) * 0.5;
                const totalReward = baseReward + upgradeBonus;

                userData.balance += totalReward;
                userData.clicks += 1;

                // Проверка уровня
                if (userData.clicks >= userData.level * 50) {
                    userData.level += 1;
                    showReward(`🎉 Уровень ${userData.level}!`);
                }

                updateUI();
                showReward(`+${totalReward.toFixed(1)}`);
            }

            function buyUpgrade(type) {
                const prices = { click: 100, passive: 200 };
                const price = prices[type];

                if (userData.balance >= price) {
                    userData.balance -= price;
                    userData.upgrades[type] += 1;
                    updateUI();
                    showReward('Улучшение куплено!');
                } else {
                    showReward('Недостаточно токенов!');
                }
            }

            function showReward(text) {
                const popup = document.createElement('div');
                popup.className = 'reward-popup';
                popup.textContent = text;
                document.body.appendChild(popup);

                setTimeout(() => {
                    document.body.removeChild(popup);
                }, 1000);
            }

            document.getElementById('clickButton').addEventListener('click', handleClick);
            updateUI();
        </script>
    </body>
    </html>
    """


@app.route('/webapp')
def webapp():
    return send_from_directory('.', 'index.html')


@app.route('/api/user/<user_id>')
def get_user(user_id):
    return jsonify({
        'user_id': int(user_id),
        'balance': 100,
        'level': 1,
        'clicks': 0,
        'referrals': 0,
        'passive_income': 0,
        'upgrades': {
            'click_power': 1,
            'passive': 0,
            'autoclick': 0
        }
    })


if __name__ == '__main__':
    print("Запуск Flask сервера на http://localhost:5000")
    print("Для WebApp URL: https://your-subdomain.lhr.life/webapp")
    app.run(host='0.0.0.0', port=5000, debug=True)