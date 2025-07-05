import os
from flask import Flask, send_from_directory, render_template

app = Flask(__name__,
            static_folder='static',
            template_folder='templates')

# Основной маршрут
@app.route('/')
def home():
    return render_template('index.html')

# Маршрут для статических файлов
@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

# Обработчик для всех остальных путей (SPA)
@app.route('/<path:path>')
def catch_all(path):
    return render_template('index.html')

# Обязательно для Vercel
application = app
