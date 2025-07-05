import os
from flask import Flask, send_from_directory, render_template

app = Flask(__name__)

# Пути для статики
static_dir = os.path.join(os.path.dirname(__file__), 'static')
templates_dir = os.path.join(os.path.dirname(__file__), 'templates')

app.static_folder = static_dir
app.template_folder = templates_dir

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory(static_dir, filename)

# SPA роутинг
@app.route('/<path:path>')
def serve_spa(path):
    return render_template('index.html')

# Точка входа для Vercel
def handler(request):
    return app(request)

application = app

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
