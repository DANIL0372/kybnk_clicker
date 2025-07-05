console.log("Script loaded!");

// Основные игровые элементы
let coins = 0;
const coinsPerClick = 1;
let currentClicks = 100;
const maxClicks = 100;

// Инициализация игры
window.initApp = function() {
    console.log("Initializing game...");
    
    try {
        // Назначаем обработчики
        document.getElementById('clickArea').addEventListener('click', handleClick);
        
        // Загружаем сохранение
        loadGame();
        
        // Обновляем интерфейс
        updateUI();
        
        console.log("Game initialized!");
    } catch (error) {
        console.error("Init error:", error);
    }
};

// Обработчик клика
function handleClick(event) {
    try {
        coins += coinsPerClick;
        currentClicks--;
        
        // Обновляем интерфейс
        updateUI();
        saveGame();
    } catch (error) {
        console.error("Click error:", error);
    }
}

// Обновление интерфейса
function updateUI() {
    document.getElementById('balance').textContent = coins;
    document.getElementById('clickCounter').textContent = `${currentClicks}/${maxClicks}`;
}

// Сохранение игры
function saveGame() {
    const gameData = { coins, currentClicks };
    localStorage.setItem('kybnkSave', JSON.stringify(gameData));
}

// Загрузка игры
function loadGame() {
    const saveData = JSON.parse(localStorage.getItem('kybnkSave'));
    if (saveData) {
        coins = saveData.coins || 0;
        currentClicks = saveData.currentClicks || maxClicks;
    }
}
