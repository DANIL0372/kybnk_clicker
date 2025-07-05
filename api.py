import os
from flask import Flask, send_from_directory, render_template

app = Flask(__name__,
            static_folder='static',
            template_folder='templates')

@app.route('/')
def index():
    return render_template('index.html')

# Новый обработчик статики с коррекцией путей
@app.route('/static/<path:subpath>')
def serve_static(subpath):
    @app.route('/static/img/<filename>')
    def serve_img(filename):
        return send_from_directory('static/img', filename)

    @app.route('/static/css/<filename>')
    def serve_css(filename):
        return send_from_directory('static/css', filename)

    @app.route('/static/js/<filename>')
    def serve_js(filename):
        return send_from_directory('static/js', filename)

    # Разбиваем путь на тип ресурса и имя файла
    parts = subpath.split('/')
    if len(parts) > 1:
        resource_type = parts[0]
        filename = '/'.join(parts[1:])
        return send_from_directory(f'static/{resource_type}', filename)
    return send_from_directory('static', subpath)

# Обработчик для всех путей SPA
@app.route('/<path:path>')
def serve_spa(path):
    return render_template('index.html')

# WSGI-совместимый экспорт
application = app
