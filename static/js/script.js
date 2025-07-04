console.log("Script loaded!");

// Основные элементы
const clickArea = document.getElementById('clickArea');
const balanceElement = document.getElementById('balance');
const usernameElement = document.getElementById('username');
const userTagElement = document.getElementById('userTag');
const clickCounterElement = document.getElementById('clickCounter');
const progressBar = document.getElementById('progressBar');
const progressLevel = document.getElementById('progressLevel');

// Игровые переменные
let coins = 0;
let coinsPerClick = 1;
let maxClicks = 100;
let currentClicks = maxClicks;
let level = 0;
let levelProgress = 0;
let lastUpdate = Date.now()

// Уровни
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

// Функция для изменения имени пользователя
function changeUsername() {
    const newName = prompt('Введите ваше игровое имя:', usernameElement.textContent);
    if (newName && newName.trim() !== '') {
        const trimmedName = newName.trim();
        usernameElement.textContent = trimmedName;
        localStorage.setItem('playerName', trimmedName);
    }
}

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
        const minutesPassed = Math.floor((now - lastUpdate) / 60000);
        const restoredClicks = Math.min(minutesPassed, maxClicks - currentClicks);

        if (restoredClicks > 0) {
            currentClicks += restoredClicks;
            showNotification(`Восстановлено ${restoredClicks} кликов!`);
        }
    }

    // Назначаем обработчики событий
    clickArea.addEventListener('click', handleClick);

    // Обновление интерфейса
    updateUI();
    updateLevelProgress();
    updateUserTag();

    // Запускаем восстановление кликов каждую минуту
    setInterval(restoreClicks, 3000); // 60 секунд

    console.log("App initialized successfully");
}

// Обработка клика по монете
function handleClick(event) {
    if (currentClicks <= 0) return;

    currentClicks--;
    coins += coinsPerClick;

    updateLevelProgress();
    updateUI();
}

// Обновление интерфейса
function updateUI() {
    balanceElement.textContent = formatNumber(coins);
    clickCounterElement.textContent = `${currentClicks}/${maxClicks}`;
    saveProgress();
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
    progressBar.style.width = `${levelProgress}%`;
    progressLevel.textContent = `LEVEL ${level}`;
}

// Форматирование чисел с разделителями
function formatNumber(num) {
    return num.toLocaleString('en-US', {
        maximumFractionDigits: 0
    });
}

// Запуск при загрузке
document.addEventListener('DOMContentLoaded', initApp);
