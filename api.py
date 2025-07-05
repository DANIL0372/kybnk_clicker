import os
from flask import Flask, send_from_directory, render_template

app = Flask(__name__,
            static_folder='static',
            template_folder='templates')

@app.route('/')
def index():
    return render_template('index.html')

# Правильный обработчик статики
@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

# Обработчик для всех путей SPA
@app.route('/<path:path>')
def serve_spa(path):
    return render_template('index.html')

# WSGI-совместимый экспорт
application = app
