import os
from flask import Flask, send_from_directory, render_template, request

app = Flask(__name__, static_folder='static', template_folder='templates')

@app.route('/')
def index():
    return render_template('index.html')

# Новый обработчик статики
@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory(app.static_folder, filename)

# Обработчик для всех путей SPA
@app.route('/<path:path>')
def serve_spa(path):
    return render_template('index.html')

# WSGI-совместимый экспорт
application = app
