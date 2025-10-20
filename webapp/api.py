from flask import Flask, request, jsonify, send_from_directory
import sqlite3
import datetime
import os

app = Flask(__name__)


def get_db_connection():
    conn = sqlite3.connect('../clicker.db')
    conn.row_factory = sqlite3.Row
    return conn


@app.route('/api/user/<int:user_id>', methods=['GET'])
def get_user(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM users WHERE user_id = ?', (user_id,))
    user = cursor.fetchone()

    if not user:
        now = datetime.datetime.now().isoformat()
        cursor.execute('''
            INSERT INTO users (user_id, balance, level, clicks, passive_income, created_at, last_passive_claim)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (user_id, 100, 1, 0, 0, now, now))
        conn.commit()
        cursor.execute('SELECT * FROM users WHERE user_id = ?', (user_id,))
        user = cursor.fetchone()

    cursor.execute('SELECT upgrade_type, level FROM upgrades WHERE user_id = ?', (user_id,))
    upgrades = {row[0]: row[1] for row in cursor.fetchall()}

    conn.close()

    return jsonify({
        'user_id': user['user_id'],
        'balance': user['balance'],
        'level': user['level'],
        'clicks': user['clicks'],
        'referrals': user['referrals'],
        'passive_income': user['passive_income'],
        'upgrades': upgrades
    })


@app.route('/api/click', methods=['POST'])
def handle_click():
    data = request.json
    user_id = data['user_id']

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM users WHERE user_id = ?', (user_id,))
    user = cursor.fetchone()

    cursor.execute('SELECT upgrade_type, level FROM upgrades WHERE user_id = ?', (user_id,))
    upgrades = {row[0]: row[1] for row in cursor.fetchall()}

    # Расчет награды
    base_reward = 1
    click_power_bonus = upgrades.get('click_power', 1) - 1
    level_bonus = user['level'] * 0.2
    total_reward = base_reward + click_power_bonus + level_bonus

    new_balance = user['balance'] + total_reward
    new_clicks = user['clicks'] + 1

    # Проверка повышения уровня
    new_level = user['level']
    if new_clicks >= user['level'] * 150:
        new_level += 1

    cursor.execute('''
        UPDATE users 
        SET balance = ?, clicks = ?, level = ?, last_click = ?
        WHERE user_id = ?
    ''', (new_balance, new_clicks, new_level, datetime.datetime.now().isoformat(), user_id))

    conn.commit()
    conn.close()

    return jsonify({
        'success': True,
        'reward': total_reward,
        'new_balance': new_balance,
        'new_level': new_level,
        'new_clicks': new_clicks
    })


@app.route('/api/upgrade', methods=['POST'])
def buy_upgrade():
    data = request.json
    user_id = data['user_id']
    upgrade_type = data['upgrade_type']

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM users WHERE user_id = ?', (user_id,))
    user = cursor.fetchone()

    cursor.execute('SELECT level FROM upgrades WHERE user_id = ? AND upgrade_type = ?', (user_id, upgrade_type))
    upgrade = cursor.fetchone()

    current_level = upgrade['level'] if upgrade else (1 if upgrade_type != 'autoclick' else 0)

    if upgrade_type == 'click_power':
        price = 100 * current_level
    elif upgrade_type == 'passive':
        price = 200 * current_level
    elif upgrade_type == 'autoclick':
        price = 500 * (current_level + 1)

    if user['balance'] >= price:
        new_balance = user['balance'] - price
        new_level = current_level + 1

        cursor.execute('UPDATE users SET balance = ? WHERE user_id = ?', (new_balance, user_id))

        cursor.execute('''
            INSERT OR REPLACE INTO upgrades (user_id, upgrade_type, level)
            VALUES (?, ?, ?)
        ''', (user_id, upgrade_type, new_level))

        if upgrade_type == 'passive':
            cursor.execute('UPDATE users SET passive_income = ? WHERE user_id = ?', (new_level, user_id))

        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'new_balance': new_balance,
            'new_level': new_level
        })
    else:
        conn.close()
        return jsonify({
            'success': False,
            'error': 'Недостаточно токенов'
        })


@app.route('/webapp')
def serve_webapp():
    return send_from_directory('.', 'index.html')


@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)