from flask import Flask, request, jsonify, g, send_from_directory, render_template
import sqlite3
import os
from datetime import datetime

app = Flask(__name__)
DATABASE = 'users.db'

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def init_db():
    with app.app_context():
        db = get_db()
        cursor = db.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                username TEXT NOT NULL,
                coins INTEGER DEFAULT 0,
                clicks INTEGER DEFAULT 100,
                last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        db.commit()

# Инициализация БД при первом запуске
if not os.path.exists(DATABASE):
    init_db()
    print("Database created successfully")

# Главная страница
@app.route('/')
def index():
    return render_template('index.html')

# API эндпоинты
@app.route('/api/user', methods=['GET'])
def get_user():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'User ID is required'}), 400

    db = get_db()
    cursor = db.cursor()

    # Проверяем существование пользователя
    cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()

    # Если пользователь не найден, создаем нового
    if not user:
        username = f'Player_{user_id}'
        cursor.execute(
            'INSERT INTO users (id, username) VALUES (?, ?)',
            (user_id, username)
        )
        db.commit()
        cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
        user = cursor.fetchone()

    # Рассчитываем восстановленные клики
    last_update = datetime.fromisoformat(user['last_update'])
    now = datetime.utcnow()
    time_diff = now - last_update
    minutes_passed = time_diff.total_seconds() / 60

    # Восстанавливаем 1 клик в минуту
    restored_clicks = min(int(minutes_passed), 100 - user['clicks'])
    if restored_clicks > 0:
        new_clicks = user['clicks'] + restored_clicks
        cursor.execute(
            'UPDATE users SET clicks = ?, last_update = ? WHERE id = ?',
            (new_clicks, now.isoformat(), user_id)
        )
        db.commit()
        cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
        user = cursor.fetchone()

    return jsonify({
        'user': dict(user),
        'restored': restored_clicks
    })


@app.route('/api/click', methods=['POST'])
def handle_click():
    data = request.json
    user_id = data.get('user_id')

    if not user_id:
        return jsonify({'error': 'User ID is required'}), 400

    db = get_db()
    cursor = db.cursor()
    cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()

    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Проверяем, есть ли клики
    if user['clicks'] <= 0:
        return jsonify({'error': 'No clicks available'}), 400

    # Обновляем данные
    new_clicks = user['clicks'] - 1
    new_coins = user['coins'] + 1
    now = datetime.utcnow().isoformat()

    cursor.execute(
        'UPDATE users SET clicks = ?, coins = ?, last_update = ? WHERE id = ?',
        (new_clicks, new_coins, now, user_id)
    )
    db.commit()

    return jsonify({
        'success': True,
        'clicks': new_clicks,
        'coins': new_coins
    })


@app.route('/api/update-username', methods=['POST'])
def update_username():
    data = request.json
    user_id = data.get('user_id')
    new_username = data.get('username')

    if not user_id or not new_username:
        return jsonify({'error': 'Invalid request'}), 400

    db = get_db()
    cursor = db.cursor()
    cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()

    if not user:
        return jsonify({'error': 'User not found'}), 404

    cursor.execute(
        'UPDATE users SET username = ? WHERE id = ?',
        (new_username, user_id)
    )
    db.commit()

    return jsonify({'success': True})


@app.route('/api/update-user', methods=['POST'])
def update_user():
    data = request.json
    user_id = data.get('user_id')

    if not user_id:
        return jsonify({'error': 'User ID is required'}), 400

    db = get_db()
    cursor = db.cursor()
    cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()

    if not user:
        return jsonify({'error': 'User not found'}), 404

    coins = data.get('coins', user['coins'])
    clicks = data.get('clicks', user['clicks'])

    cursor.execute(
        'UPDATE users SET coins = ?, clicks = ? WHERE id = ?',
        (coins, clicks, user_id)
    )
    db.commit()

    return jsonify({'success': True})


# Статические файлы
@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)


if __name__ == '__main__':
    # Проверка структуры папок
    required_dirs = ['templates', 'static', 'static/css', 'static/js', 'static/img']
    for directory in required_dirs:
        if not os.path.exists(directory):
            os.makedirs(directory)
            print(f"Created directory: {directory}")

    # Проверка необходимых файлов
    required_files = {
        'templates/index.html': '<!DOCTYPE html><html><head><title>Placeholder</title></head><body><h1>Index.html placeholder</h1></body></html>',
        'static/css/style.css': '/* CSS placeholder */',
        'static/js/script.js': '// JS placeholder'
    }

    for file_path, content in required_files.items():
        if not os.path.exists(file_path):
            with open(file_path, 'w') as f:
                f.write(content)
            print(f"Created placeholder file: {file_path}")

    app.run(host='0.0.0.0', port=5000, debug=True)
