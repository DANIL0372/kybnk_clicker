console.log("Script loaded!");

// Основные элементы
const clickArea = document.getElementById('clickArea');
const balanceElement = document.getElementById('balance');
const usernameElement = document.getElementById('username');
const userTagElement = document.getElementById('userTag');
const clickCounterElement = document.getElementById('clickCounter');
const boostBtn = document.getElementById('boostBtn');
const boostTimerElement = document.getElementById('boostTimer');
const progressBar = document.getElementById('progressBar');
const progressLevel = document.getElementById('progressLevel');
const hourlyIncomeElement = document.getElementById('hourlyIncome');
const restoreDelay = 5000; // 5 секунд

// Игровые переменные
let coins = 0;
let coinsPerClick = 1;
let maxClicks = 100;
let currentClicks = maxClicks;
let boostActive = false;
let boostMultiplier = 1;
let boostTimeLeft = 0;
let boostTimer = null;
let level = 0;
let levelProgress = 0;
let lastUpdate = Date.now();
let restoreInterval = null;
let lastClickTime = 0;

// Уровни и прогресс
const levels = [
    { required: 0,    tag: "NEWBIE",    title: "Новичок" },
    { required: 100,  tag: "BEGINNER",  title: "Начинающий" },
    { required: 200,  tag: "EXPLORER",  title: "Исследователь" },
    { required: 300,  tag: "ADVENTURER", title: "Авантюрист" },
    { required: 400,  tag: "EXPERT",    title: "Эксперт" },
    { required: 500,  tag: "MASTER",    title: "Мастер" },
    { required: 600,  tag: "GRANDMASTER", title: "Гроссмейстер" },
    { required: 700,  tag: "LEGEND",    title: "Легенда" },
    { required: 800,  tag: "MYTHIC",    title: "Мифический" },
    { required: 900,  tag: "GODLIKE",   title: "Богоподобный" },
    { required: 1000, tag: "TITAN",     title: "Титан" },
    { required: 1100, tag: "SUPREME",   title: "Верховный" }
];

// Инициализация приложения
window.initApp = function() {
    console.log("Initializing game...");

    // Ваш код инициализации...
    loadGame();
    updateUI();
    updateLevelProgress();
    updateUserTag();

    console.log("Game initialized!");
}

// Добавим новую функцию для отображения UI
function showGameUI() {
    console.log("Showing game UI...");
    updateUI();
    updateLevelProgress();
    updateUserTag();
    console.log("Game UI ready");
}

// Модифицированная функция клика
function handleClick(event) {
    const now = Date.now();

    // Проверяем, прошло ли достаточно времени с последнего клика
    if (currentClicks <= 0 || now - lastClickTime < 100) return;

    lastClickTime = now; // Запоминаем время клика
    currentClicks--;
    coins += coinsPerClick * boostMultiplier;

    createClickEffect(event, coinsPerClick * boostMultiplier);
    updateLevelProgress();
    updateUI();
    saveGame();

    // Запускаем восстановление после клика
    startRestore();
}

// Функция восстановления кликов
function startRestore() {
    // Если интервал уже запущен, не создаем новый
    if (restoreInterval) return;

    restoreInterval = setInterval(() => {
        if (currentClicks < maxClicks) {
            currentClicks++;
            updateUI();
            saveGame();

            if (currentClicks === maxClicks) {
                clearInterval(restoreInterval);
                restoreInterval = null;
            }
        } else {
            clearInterval(restoreInterval);
            restoreInterval = null;
        }
    }, 5000); // 5 секунд
}

// Функция создания анимации клика
function createClickEffect(event, amount) {
    const effect = document.createElement('div');
    effect.className = 'click-text-effect';
    effect.textContent = `+${amount}`;
    effect.style.left = `${event.clientX}px`;
    effect.style.top = `${event.clientY}px`;
    effect.style.color = '#fc036c'; // Устанавливаем нужный цвет
    document.body.appendChild(effect);

    setTimeout(() => {
        effect.remove();
    }, 1200);
}

// Функция обновления интерфейса
// В функции updateUI добавьте:
function updateUI() {
    balanceElement.textContent = formatNumber(coins);
    clickCounterElement.textContent = `${currentClicks}/${maxClicks}`;

    // Добавляем класс восстановления при неполном счетчике
    if (currentClicks < maxClicks) {
        clickCounterElement.classList.add('restoring');
    } else {
        clickCounterElement.classList.remove('restoring');
    }

    clickCounterElement.textContent = `${currentClicks}/${maxClicks}`;
}

// Обновление тега пользователя
function updateUserTag() {
    if (level >= levels.length) level = levels.length - 1;
    const levelTag = levels[level].tag;
    userTagElement.textContent = `${levelTag}=${level}/${levels.length-1}`;
}

// Обновление прогресса уровня
function updateLevelProgress() {
    // Определяем текущий уровень
    let newLevel = 0;
    for (let i = levels.length - 1; i >= 0; i--) {
        if (coins >= levels[i].required) {
            newLevel = i;
            break;
        }
    }

    // Если уровень изменился
    if (newLevel !== level) {
        level = newLevel;
        updateUserTag();
    }

    // Рассчитываем прогресс для текущего уровня
    const currentLevelMin = levels[level].required;
    const nextLevelMin = level < levels.length - 1 ?
        levels[level + 1].required :
        levels[level].required + 100;

    levelProgress = Math.min(100, ((coins - currentLevelMin) / (nextLevelMin - currentLevelMin)) * 100);

    // Обновляем прогрессбар
    document.documentElement.style.setProperty('--progress', `${levelProgress}%`);
    progressLevel.textContent = `LEVEL ${level}`;
}

// Активация буста
function activateBoost() {
    if (boostActive || currentClicks < 10) return;

    currentClicks -= 10;
    boostActive = true;
    boostMultiplier = 2;
    boostTimeLeft = 30;
    boostBtn.classList.add('active');

    // Запускаем таймер
    if (boostTimer) clearInterval(boostTimer);
    boostTimer = setInterval(() => {
        boostTimeLeft--;
        boostTimerElement.textContent = `${boostTimeLeft}s`;

        if (boostTimeLeft <= 0) {
            clearInterval(boostTimer);
            boostActive = false;
            boostMultiplier = 1;
            boostTimerElement.textContent = "BOOST";
            boostBtn.classList.remove('active');
        }
    }, 1000);

    updateUI();
    saveGame();
}

// Сохранение состояния игры
function saveGame() {
    const gameData = {
        coins: coins,
        currentClicks: currentClicks,
        level: level,
        levelProgress: levelProgress,
        lastUpdate: Date.now(),
        username: usernameElement.textContent
    };
    localStorage.setItem('kybnkSave', JSON.stringify(gameData));
}

// Загрузка состояния игры
function loadGame() {
    const saveData = JSON.parse(localStorage.getItem('kybnkSave'));
    if (saveData) {
        coins = saveData.coins || 0;
        currentClicks = saveData.currentClicks || maxClicks;
        level = saveData.level || 0;
        levelProgress = saveData.levelProgress || 0;
        lastUpdate = saveData.lastUpdate || Date.now();

        if (saveData.username) {
            usernameElement.textContent = saveData.username;
        }

        // Восстановление кликов за время простоя
        const now = Date.now();
        const secondsPassed = Math.floor((now - lastUpdate) / 1000);
        const restoredClicks = Math.min(Math.floor(secondsPassed / 5), maxClicks - currentClicks);

        if (restoredClicks > 0) {
            currentClicks += restoredClicks;
            showNotification(`Восстановлено ${restoredClicks} кликов!`);
        }
    }
    updateUI();
    updateLevelProgress();
    updateUserTag();
}

// Функция для изменения имени пользователя
function changeUsername() {
    const newName = prompt('Введите ваше игровое имя:', usernameElement.textContent);
    if (newName && newName.trim() !== '') {
        const trimmedName = newName.trim();
        usernameElement.textContent = trimmedName;
        saveGame();
    }
}

// Функция показа уведомлений
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Форматирование чисел с разделителями
function formatNumber(num) {
    return num.toLocaleString('ru-RU', {
        maximumFractionDigits: 0
    });
}

// Автосохранение каждые 30 секунд
setInterval(saveGame, 30000);

// Сохранение при закрытии вкладки
window.addEventListener('beforeunload', saveGame);

// Функция для скрытия заставки
function hideSplashScreen() {

    console.log("Hiding splash screen...");
    console.log("Splash element:", document.getElementById('splashScreen'));
    console.log("App container:", document.querySelector('.app-container'));

    const splashScreen = document.getElementById('splashScreen');
    const appContainer = document.querySelector('.app-container');

    // Плавное исчезновение заставки
    splashScreen.style.opacity = '0';

    setTimeout(() => {
        // Скрываем заставку после анимации
        splashScreen.style.display = 'none';

        // Показываем основное приложение
        appContainer.style.opacity = '1';

        // Отображаем игровой интерфейс
    showGameUI();

        // Инициализируем игру
        initApp();
    }, 1000);
}

// Показываем заставку минимум 2 секунды перед запуском
document.addEventListener('DOMContentLoaded', () => {

    // Ждем загрузки всех ресурсов
    window.addEventListener('load', () => {
        // Минимальное время показа заставки - 2 секунды
        setTimeout(hideSplashScreen, 3000);
    });
});
