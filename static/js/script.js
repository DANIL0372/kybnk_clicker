// Гарантированная инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded and parsed");
    
    // Проверяем, что игра еще не инициализирована
    if (window.gameInitialized) return;
    window.gameInitialized = true;
    
    // Основные игровые элементы
    let coins = 0;
    const coinsPerClick = 1;
    let currentClicks = 100;
    const maxClicks = 100;
    
    // Функция инициализации
    function initFullGame() {
        console.log("Initializing full game...");
        
        try {
            // Получаем элементы
            const clickArea = document.getElementById('clickArea');
            const balanceElement = document.getElementById('balance');
            const clickCounterElement = document.getElementById('clickCounter');
            
            if (!clickArea || !balanceElement || !clickCounterElement) {
                throw new Error("Game elements not found");
            }
            
            // Обработчик клика
            clickArea.addEventListener('click', function(event) {
                coins += coinsPerClick;
                currentClicks--;
                
                // Обновляем интерфейс
                balanceElement.textContent = coins;
                clickCounterElement.textContent = `${currentClicks}/${maxClicks}`;
                
                // Эффект клика
                const effect = document.createElement('div');
                effect.textContent = `+${coinsPerClick}`;
                effect.style.position = 'fixed';
                effect.style.left = `${event.clientX}px`;
                effect.style.top = `${event.clientY}px`;
                effect.style.color = '#fc036c';
                effect.style.fontSize = '24px';
                effect.style.fontWeight = 'bold';
                effect.style.zIndex = '1000';
                document.body.appendChild(effect);
                
                setTimeout(() => effect.remove(), 1000);
            });
            
            // Устанавливаем начальные значения
            balanceElement.textContent = coins;
            clickCounterElement.textContent = `${currentClicks}/${maxClicks}`;
            
            console.log("Full game initialized!");
        } catch (error) {
            console.error("Full game init error:", error);
        }
    }
    
    // Запускаем полную игру через 3 секунды после загрузки
    setTimeout(initFullGame, 3000);
});
