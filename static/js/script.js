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
function initApp() {
    console.log("Initializing app...");

    // Загрузка сохраненного имени
    const savedName = localStorage.getItem('playerName');
    if (savedName) {
        usernameElement.textContent = savedName;
    }

    // Загрузка сохраненного прогресса
    const savedProgress = localStorage.getItem('kybnkProgress');
    if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        coins = progress.coins || 0;
        currentClicks = progress.currentClicks || maxClicks;
        level = progress.level || 0;
        levelProgress = progress.levelProgress || 0;
        lastUpdate = progress.lastUpdate || Date.now();

        // Восстановление кликов
        const now = Date.now();
        const minutesPassed = Math.floor((now - lastUpdate) / 3000);
        const restoredClicks = Math.min(minutesPassed, maxClicks - currentClicks);

        if (restoredClicks > 0) {
            currentClicks += restoredClicks;
            showNotification(`Восстановлено ${restoredClicks} кликов!`);
        }
    }

    // Назначаем обработчики событий
    clickArea.addEventListener('click', handleClick);
    boostBtn.addEventListener('click', activateBoost);

    // Назначаем обработчик для изменения имени
    usernameElement.addEventListener('click', changeUsername);

    // Обновление интерфейса
    updateUI();
    updateLevelProgress();
    updateUserTag();

    // Запускаем восстановление кликов каждую минуту
    setInterval(restoreClicks, 60000);

    console.log("App initialized successfully");
}

// Обработка клика по монете
function handleClick(event) {
    if (currentClicks <= 0) return;

    currentClicks--;
    coins += coinsPerClick * boostMultiplier;

    createClickEffect(event, coinsPerClick * boostMultiplier);
    updateLevelProgress();
    updateUI();
}

// Функция создания анимации клика
function createClickEffect(event, amount) {
    const effect = document.createElement('div');
    effect.className = 'click-text-effect';
    effect.textContent = `+${amount}`;
    effect.style.left = `${event.clientX}px`;
    effect.style.top = `${event.clientY}px`;
    document.body.appendChild(effect);

    setTimeout(() => {
        effect.remove();
    }, 1200);
}

// Обновление интерфейса
function updateUI() {
    balanceElement.textContent = formatNumber(coins);
    clickCounterElement.textContent = `${currentClicks}/${maxClicks}`;
    saveProgress();
}

// Обновление тега пользователя
function updateUserTag() {
    const levelTag = levels[level].tag;
    userTagElement.textContent = `${levelTag}=${level}/11`;
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
}

// Восстановление кликов
function restoreClicks() {
    if (currentClicks < maxClicks) {
        currentClicks++;
        updateUI();
    }
}

// Сохранение прогресса
function saveProgress() {
    const progress = {
        coins,
        currentClicks,
        level,
        levelProgress,
        lastUpdate: Date.now()
    };
    localStorage.setItem('kybnkProgress', JSON.stringify(progress));
}

// Функция для изменения имени пользователя
function changeUsername() {
    const newName = prompt('Введите ваше игровое имя:', usernameElement.textContent);
    if (newName && newName.trim() !== '') {
        const trimmedName = newName.trim();
        usernameElement.textContent = trimmedName;
        localStorage.setItem('playerName', trimmedName);
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
    return num.toLocaleString('en-US', {
        maximumFractionDigits: 0
    });
}

// Запуск при загрузке
document.addEventListener('DOMContentLoaded', initApp);
