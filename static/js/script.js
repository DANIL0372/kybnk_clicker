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

window.initApp = function() {
    console.log("Initializing app...");

    try {
        // Получаем элементы после загрузки DOM
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

        // Проверка существования элементов
        if (!clickArea) throw new Error("clickArea element not found!");
        if (!balanceElement) throw new Error("balanceElement not found!");

        // Назначаем обработчики
        clickArea.addEventListener('click', handleClick);
        if (boostBtn) boostBtn.addEventListener('click', activateBoost);
        if (usernameElement) usernameElement.addEventListener('click', changeUsername);

        // Инициализация игрового состояния
        loadGame();
        updateUI();
        updateLevelProgress();
        updateUserTag();

        console.log("App initialized successfully");
    } catch (error) {
        console.error("Initialization error:", error);
        alert("Initialization error: " + error.message);
    }
};

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

// Остальные функции без изменений (startRestore, createClickEffect, updateUI, и т.д.)
// ... (все функции из вашего исходного script.js) ...

// Функция для скрытия заставки
function hideSplashScreen() {
    try {
        const splashScreen = document.getElementById('splashScreen');
        const appContainer = document.querySelector('.app-container');

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
        document.querySelector('.app-container').style.display = 'flex';
        document.querySelector('.app-container').style.opacity = '1';
        if (typeof initApp === 'function') initApp();
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('load', () => {
        setTimeout(hideSplashScreen, 2000);
    });
});
