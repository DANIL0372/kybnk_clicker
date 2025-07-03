from flask import Flask, render_template, make_response

app = Flask(__name__)


@app.route('/')
def index():
    # Создаем response с нужным заголовком
    response = make_response(render_template('index.html'))

    # Добавляем заголовок для пропуска страницы предупреждения
    response.headers['ngrok-skip-browser-warning'] = 'true'

    # Дополнительные важные заголовки
    response.headers[
        'Content-Security-Policy'] = "default-src 'self' 'unsafe-inline' https://*.ngrok-free.app https://telegram.org; img-src 'self' data: https://*;"
    response.headers['X-Content-Type-Options'] = 'nosniff'

    return response


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')  # Запуск на всех интерфейсах