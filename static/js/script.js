console.log("Game script loaded!");

// Основные элементы
let clickArea, balanceElement, usernameElement, userTagElement, clickCounterElement;
let boostBtn, boostTimerElement, progressBar, progressLevel, hourlyIncomeElement;

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

// Инициализация элементов
function initElements() {
    clickArea = document.getElementById('clickArea');
    balanceElement = document.getElementById('balance');
    usernameElement = document.getElementById('username');
    userTagElement = document.getElementById('userTag');
    clickCounterElement = document.getElementById('clickCounter');
    boostBtn = document.getElementById('boostBtn');
    boostTimerElement = document.getElementById('boostTimer');
    progressBar = document.getElementById('progressBar');
    progressLevel = document.getElementById('progressLevel');
    hourlyIncomeElement = document.getElementById('hourlyIncome');
}

// Инициализация приложения
function initApp() {
    console.log("Initializing game...");

    initElements();

    if (!clickArea || !balanceElement) {
        console.error("Critical elements not found! Retrying in 500ms");
        setTimeout(initApp, 500);
        return;
    }

    console.log("All elements found");

    // Назначаем обработчики
    clickArea.addEventListener('click', handleClick);
    usernameElement.addEventListener('click', changeUsername);
    boostBtn.addEventListener('click', activateBoost);

    // Инициализация игрового состояния
    loadGame();
    updateUI();
    updateLevelProgress();
    updateUserTag();

    console.log("Game initialized successfully!");
}

// Обновление интерфейса
function updateUI() {
    if (!balanceElement || !clickCounterElement) return;

    balanceElement.textContent = formatNumber(coins);
    clickCounterElement.textContent = `${currentClicks}/${maxClicks}`;

    if (currentClicks < maxClicks) {
        clickCounterElement.classList.add('restoring');
    } else {
        clickCounterElement.classList.remove('restoring');
    }
}

// Обновление тега пользователя
function updateUserTag() {
    if (!userTagElement) return;

    if (level >= levels.length) level = levels.length - 1;
    const levelTag = levels[level].tag;
    userTagElement.textContent = `${levelTag}=${level}/${levels.length-1}`;
}

// Обновление прогресса уровня
function updateLevelProgress() {
    if (!progressBar || !progressLevel) return;

    let newLevel = 0;
    for (let i = levels.length - 1; i >= 0; i--) {
        if (coins >= levels[i].required) {
            newLevel = i;
            break;
        }
    }

    if (newLevel !== level) {
        level = newLevel;
        updateUserTag();
    }

    const currentLevelMin = levels[level].required;
    const nextLevelMin = level < levels.length - 1 ?
        levels[level + 1].required :
        levels[level].required + 100;

    levelProgress = Math.min(100, ((coins - currentLevelMin) / (nextLevelMin - currentLevelMin)) * 100);

    document.documentElement.style.setProperty('--progress', `${levelProgress}%`);
    progressLevel.textContent = `LEVEL ${level}`;
}

// Обработка клика
function handleClick(event) {
    const now = Date.now();
    if (currentClicks <= 0 || now - lastClickTime < 100) return;

    lastClickTime = now;
    currentClicks--;
    coins += coinsPerClick * boostMultiplier;

    createClickEffect(event, coinsPerClick * boostMultiplier);
    updateLevelProgress();
    updateUI();
    saveGame();

    startRestore();
}

// Восстановление кликов
function startRestore() {
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
    }, 5000);
}

// Анимация клика
function createClickEffect(event, amount) {
    const effect = document.createElement('div');
    effect.className = 'click-text-effect';
    effect.textContent = `+${amount}`;
    effect.style.left = `${event.clientX}px`;
    effect.style.top = `${event.clientY}px`;
    effect.style.color = '#fc036c';
    document.body.appendChild(effect);

    setTimeout(() => effect.remove(), 1200);
}

// Активация буста
function activateBoost() {
    if (boostActive || currentClicks < 10) return;

    currentClicks -= 10;
    boostActive = true;
    boostMultiplier = 2;
    boostTimeLeft = 30;
    boostBtn.classList.add('active');

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

// Сохранение игры
function saveGame() {
    const gameData = {
        coins: coins,
        currentClicks: currentClicks,
        level: level,
        lastUpdate: Date.now(),
        username: usernameElement ? usernameElement.textContent : 'PLAYER'
    };
    localStorage.setItem('kybnkSave', JSON.stringify(gameData));
}

// Загрузка игры
function loadGame() {
    const saveData = JSON.parse(localStorage.getItem('kybnkSave'));
    if (saveData) {
        coins = saveData.coins || 0;
        currentClicks = saveData.currentClicks || maxClicks;
        level = saveData.level || 0;
        lastUpdate = saveData.lastUpdate || Date.now();

        if (saveData.username && usernameElement) {
            usernameElement.textContent = saveData.username;
        }

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

// Смена имени пользователя
function changeUsername() {
    const newName = prompt('Введите ваше игровое имя:',
        usernameElement ? usernameElement.textContent : 'PLAYER');

    if (newName && newName.trim() !== '') {
        usernameElement.textContent = newName.trim();
        saveGame();
    }
}

// Уведомления
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 3000);
}

// Форматирование чисел
function formatNumber(num) {
    return num.toLocaleString('ru-RU', { maximumFractionDigits: 0 });
}

// Автосохранение
setInterval(saveGame, 30000);
window.addEventListener('beforeunload', saveGame);

// Функция скрытия заставки и показа игры
function showGameInterface() {
    const splashScreen = document.getElementById('splashScreen');
    const appContainer = document.getElementById('appContainer');

    if (!splashScreen || !appContainer) return;

    // Плавное исчезновение заставки
    splashScreen.style.opacity = '0';

    setTimeout(() => {
        splashScreen.style.display = 'none';
        appContainer.classList.remove('hidden');

        setTimeout(() => {
            appContainer.style.opacity = '1';
            initApp(); // Инициализация игры после показа интерфейса
        }, 50);
    }, 1000);
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    // Показываем заставку минимум 2 секунды
    setTimeout(showGameInterface, 2000);
});
