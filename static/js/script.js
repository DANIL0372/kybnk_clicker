// Глобальная проверка инициализации
if (window.appInitialized) {
    console.log("App already initialized");
    throw new Error("App already initialized");
}
window.appInitialized = true;

console.log("Script loaded!");

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

// ========== ФУНКЦИИ ДОЛЖНЫ БЫТЬ ОБЪЯВЛЕНЫ ПЕРЕД ИХ ИСПОЛЬЗОВАНИЕМ ==========

// Активация буста
function activateBoost() {
    if (boostActive || currentClicks < 10) return;

    currentClicks -= 10;
    boostActive = true;
    boostMultiplier = 2;
    boostTimeLeft = 30;
    if (boostBtn) boostBtn.classList.add('active');

    // Запускаем таймер
    if (boostTimer) clearInterval(boostTimer);
    boostTimer = setInterval(() => {
        boostTimeLeft--;
        if (boostTimerElement) boostTimerElement.textContent = `${boostTimeLeft}s`;

        if (boostTimeLeft <= 0) {
            clearInterval(boostTimer);
            boostActive = false;
            boostMultiplier = 1;
            if (boostTimerElement) boostTimerElement.textContent = "BOOST";
            if (boostBtn) boostBtn.classList.remove('active');
        }
    }, 1000);

    updateUI();
    saveGame();
}

// Функция создания анимации клика
function createClickEffect(event, amount) {
    const effect = document.createElement('div');
    effect.className = 'click-text-effect';
    effect.textContent = `+${amount}`;
    effect.style.left = `${event.clientX}px`;
    effect.style.top = `${event.clientY}px`;
    effect.style.color = '#fc036c';
    document.body.appendChild(effect);

    setTimeout(() => {
        effect.remove();
    }, 1200);
}

// Функция обновления интерфейса
function updateUI() {
    if (balanceElement) balanceElement.textContent = formatNumber(coins);
    if (clickCounterElement) {
        clickCounterElement.textContent = `${currentClicks}/${maxClicks}`;
        
        // Добавляем класс восстановления
        if (currentClicks < maxClicks) {
            clickCounterElement.classList.add('restoring');
        } else {
            clickCounterElement.classList.remove('restoring');
        }
    }
}

// Обновление тега пользователя
function updateUserTag() {
    if (userTagElement && level < levels.length) {
        const levelTag = levels[level].tag;
        userTagElement.textContent = `${levelTag}=${level}/${levels.length-1}`;
    }
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

    // Рассчитываем прогресс
    const currentLevelMin = levels[level].required;
    const nextLevelMin = level < levels.length - 1 ? 
        levels[level + 1].required : 
        levels[level].required + 100;

    levelProgress = Math.min(100, ((coins - currentLevelMin) / (nextLevelMin - currentLevelMin)) * 100);

    // Обновляем прогрессбар
    document.documentElement.style.setProperty('--progress', `${levelProgress}%`);
    if (progressLevel) progressLevel.textContent = `LEVEL ${level}`;
}

// Функция восстановления кликов
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

// Сохранение состояния игры
function saveGame() {
    const gameData = {
        coins: coins,
        currentClicks: currentClicks,
        level: level,
        levelProgress: levelProgress,
        lastUpdate: Date.now(),
        username: usernameElement ? usernameElement.textContent : "PLAYER"
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

        if (saveData.username && usernameElement) {
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
        usernameElement.textContent = newName.trim();
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

// Форматирование чисел
function formatNumber(num) {
    return num.toLocaleString('ru-RU', { maximumFractionDigits: 0 });
}

// Модифицированная функция клика
function handleClick(event) {
    try {
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
    } catch (error) {
        console.error("Click error:", error);
    }
}

// Автосохранение
setInterval(saveGame, 30000);
window.addEventListener('beforeunload', saveGame);

// ========== ИНИЦИАЛИЗАЦИЯ ==========
window.initApp = function() {
    console.log("Initializing app...");
    
    try {
        // Получаем элементы
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

        // Проверка элементов
        if (!clickArea) throw new Error("clickArea element not found!");
        if (!balanceElement) throw new Error("balanceElement not found!");

        // Назначаем обработчики
        clickArea.addEventListener('click', handleClick);
        if (boostBtn) boostBtn.addEventListener('click', activateBoost);
        if (usernameElement) usernameElement.addEventListener('click', changeUsername);

        // Инициализация игры
        loadGame();

        console.log("App initialized successfully");
    } catch (error) {
        console.error("Initialization error:", error);
        alert("Initialization error: " + error.message);
    }
};

// Функция для скрытия заставки
function hideSplashScreen() {
    try {
        const splashScreen = document.getElementById('splashScreen');
        const appContainer = document.querySelector('.app-container');

        if (!splashScreen || !appContainer) {
            throw new Error("Splash screen or app container not found");
        }

        splashScreen.style.opacity = '0';

        setTimeout(() => {
            splashScreen.style.display = 'none';
            appContainer.style.display = 'flex';

            setTimeout(() => {
                appContainer.style.opacity = '1';
                if (typeof initApp === 'function') initApp();
            }, 50);
        }, 1000);
    } catch (error) {
        console.error("hideSplashScreen error:", error);
        const appContainer = document.querySelector('.app-container');
        if (appContainer) {
            appContainer.style.display = 'flex';
            appContainer.style.opacity = '1';
            if (typeof initApp === 'function') initApp();
        }
    }
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('load', () => {
        setTimeout(hideSplashScreen, 2000);
    });
});
