import os
from flask import Flask, send_from_directory, render_template

# Создаем экземпляр Flask с именем "application"
application = Flask(__name__, static_folder='static', template_folder='templates')

@application.route('/')
def index():
    return render_template('index.html')

@application.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory(application.static_folder, filename)

@application.route('/<path:path>')
def serve_spa(path):
    return render_template('index.html')

# Точка входа для Vercel (должна называться application)
if __name__ == '__main__':
    application.run(host='0.0.0.0', port=8080)