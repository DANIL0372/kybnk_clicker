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

// Инициализация приложения
function initApp() {
    console.log("Initializing app...");

    // Назначаем обработчики событий
    clickArea.addEventListener('click', handleClick);

    // Обновление интерфейса
    updateUI();
    updateLevelProgress();
    updateUserTag();

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
