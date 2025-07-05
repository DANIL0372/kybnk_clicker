import os
from flask import Flask, render_template, send_from_directory

app = Flask(__name__)

# Получаем абсолютный путь к корневой директории
base_dir = os.path.abspath(os.path.dirname(__file__))
static_dir = os.path.join(base_dir, 'static')
templates_dir = os.path.join(base_dir, 'templates')

# Настраиваем пути для Flask
app.static_folder = static_dir
app.template_folder = templates_dir


# Главная страница
@app.route('/')
def index():
    return render_template('index.html')


# Обслуживание статических файлов
@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory(static_dir, filename)


# Для SPA-роутинга (все остальные пути)
@app.route('/<path:path>')
def serve_spa(path):
    return render_template('index.html')


if __name__ == '__main__':
    print(f"Static directory: {static_dir}")
    print(f"Templates directory: {templates_dir}")

    # Проверка существования файлов
    if not os.path.exists(static_dir):
        print(f"❌ Ошибка: Папка static не найдена!")
    else:
        print(f"✅ Папка static найдена")
        print(f"   CSS файлы: {os.listdir(os.path.join(static_dir, 'css'))}")
        print(f"   JS файлы: {os.listdir(os.path.join(static_dir, 'js'))}")
        print(f"   Изображения: {os.listdir(os.path.join(static_dir, 'img'))}")

    if not os.path.exists(templates_dir):
        print(f"❌ Ошибка: Папка templates не найдена!")
    else:
        print(f"✅ Папка templates найдена")
        print(f"   HTML файлы: {os.listdir(templates_dir)}")

    print("\nЗапуск сервера: http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
