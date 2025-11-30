class GeometryDash {
    constructor() {
        console.log('🎮 GeometryDash constructor called');
        
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        
        if (!this.canvas) {
            console.error('❌ Canvas not found!');
            return;
        }
        
        this.setupCanvas();
        this.initGame();
        
        this.highScore = localStorage.getItem('geometryDashHighScore') || 0;
        if (this.highScoreElement) {
            this.highScoreElement.textContent = `🏆 Рекорд: ${this.highScore}`;
        }
        
        // Инициализируем события после небольшой задержки
        setTimeout(() => {
            this.setupEventListeners();
        }, 100);
        
        console.log('✅ Game initialized');
    }
    
    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });
    }
    
    initGame() {
        this.gameState = 'menu'; // menu, playing, gameover
        this.score = 0;
        this.gameSpeed = 8;
        this.gravity = 0.9;
        this.jumpForce = -18;
        
        this.player = {
            x: 100,
            y: this.canvas.height - 180,
            width: 45,
            height: 45,
            velocityY: 0,
            isJumping: false,
            color: '#FF6B6B'
        };
        
        this.obstacles = [];
        this.obstacleTimer = 0;
        this.obstacleInterval = 70;
        
        this.ground = {
            y: this.canvas.height - 120,
            height: 120
        };
        
        this.particles = [];
        
        console.log('🎮 Game state initialized:', this.gameState);
    }
    
    setupEventListeners() {
        console.log('🔧 Setting up event listeners...');
        
        // СТАРТОВАЯ КНОПКА - несколько способов на всякий случай
        const startBtn = document.getElementById('startBtn');
        console.log('📍 Start button element:', startBtn);
        
        if (startBtn) {
            // Способ 1: Обычный click
            startBtn.addEventListener('click', (e) => {
                console.log('🎯 START BUTTON CLICKED (click event)');
                e.preventDefault();
                this.startGame();
            });
            
            // Способ 2: Touch для мобильных
            startBtn.addEventListener('touchstart', (e) => {
                console.log('📱 START BUTTON TOUCHED (touch event)');
                e.preventDefault();
                this.startGame();
            });
            
            // Способ 3: Просто на всякий случай
            startBtn.onclick = () => {
                console.log('⚡ START BUTTON (onclick)');
                this.startGame();
            };
            
            console.log('✅ Start button listeners added');
        } else {
            console.error('❌ Start button not found in DOM!');
            this.createEmergencyButton();
        }
        
        // КНОПКА РЕСТАРТА
        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                console.log('🔄 Restart button clicked');
                this.restartGame();
            });
        }
        
        // КНОПКА ПОДЕЛИТЬСЯ
        const shareBtn = document.getElementById('shareBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                console.log('📤 Share button clicked');
                this.shareScore();
            });
        }
        
        // ИГРОВОЕ УПРАВЛЕНИЕ
        this.canvas.addEventListener('click', () => {
            console.log('🎯 Canvas clicked - jump');
            this.jump();
        });
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            console.log('📱 Canvas touched - jump');
            this.jump();
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.key === ' ' || e.code === 'ArrowUp') {
                e.preventDefault();
                console.log('⌨️ Key pressed - jump');
                this.jump();
            }
        });
        
        // Telegram Web App
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.ready();
            Telegram.WebApp.expand();
            console.log('📱 Telegram Web App initialized');
        }
        
        console.log('✅ All event listeners setup complete');
        
        // Делаем глобальную функцию для ручного запуска
        window.manualStartGame = () => {
            console.log('🛠️ Manual game start called');
            this.startGame();
        };
    }
    
    createEmergencyButton() {
        console.log('🚨 Creating emergency start button');
        
        const emergencyBtn = document.createElement('button');
        emergencyBtn.textContent = '🚨 ЭКСТРЕННЫЙ СТАРТ';
        emergencyBtn.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ff0000;
            color: white;
            padding: 20px 30px;
            font-size: 24px;
            border: none;
            border-radius: 15px;
            z-index: 1000;
            cursor: pointer;
        `;
        
        emergencyBtn.addEventListener('click', () => {
            console.log('🚨 EMERGENCY START BUTTON CLICKED');
            this.startGame();
        });
        
        document.body.appendChild(emergencyBtn);
    }
    
    startGame() {
        console.log('🎮 START GAME FUNCTION CALLED');
        console.log('Current game state:', this.gameState);
        
        if (this.gameState === 'playing') {
            console.log('⚠️ Game already playing');
            return;
        }
        
        this.gameState = 'playing';
        
        // Скрываем экраны
        const startScreen = document.getElementById('startScreen');
        const gameOverScreen = document.getElementById('gameOverScreen');
        
        console.log('Start screen element:', startScreen);
        console.log('Game over screen element:', gameOverScreen);
        
        if (startScreen) {
            startScreen.classList.add('hidden');
            console.log('✅ Start screen hidden');
        }
        
        if (gameOverScreen) {
            gameOverScreen.classList.add('hidden');
            console.log('✅ Game over screen hidden');
        }
        
        // Сбрасываем игру
        this.initGame();
        this.gameState = 'playing';
        
        // Создаем эффекты
        this.createParticleEffect(this.player.x, this.player.y, 10, '#FF6B6B');
        
        // Запускаем игровой цикл
        console.log('🔄 Starting game loop...');
        this.gameLoop();
        
        console.log('✅ GAME STARTED SUCCESSFULLY!');
    }
    
    createParticleEffect(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                size: Math.random() * 3 + 1,
                speedX: (Math.random() - 0.5) * 6,
                speedY: (Math.random() - 0.5) * 6,
                color: color,
                life: 1,
                decay: Math.random() * 0.02 + 0.01
            });
        }
    }
    
    jump() {
        if (this.gameState !== 'playing') return;
        
        if (!this.player.isJumping) {
            this.player.velocityY = this.jumpForce;
            this.player.isJumping = true;
            console.log('🦘 Player jumped');
        }
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        // Физика игрока
        this.player.velocityY += this.gravity;
        this.player.y += this.player.velocityY;
        
        // Проверка земли
        if (this.player.y + this.player.height > this.ground.y) {
            this.player.y = this.ground.y - this.player.height;
            this.player.velocityY = 0;
            this.player.isJumping = false;
        }
        
        // Генерация препятствий
        this.obstacleTimer++;
        if (this.obstacleTimer > this.obstacleInterval) {
            this.createObstacle();
            this.obstacleTimer = 0;
        }
        
        // Обновление препятствий
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.x -= this.gameSpeed;
            
            if (this.checkCollision(this.player, obstacle)) {
                this.gameOver();
                return;
            }
            
            if (obstacle.x + obstacle.width < 0) {
                this.obstacles.splice(i, 1);
                this.score += 10;
                this.updateScore();
            }
        }
        
        // Обновление частиц
        this.updateParticles();
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.speedX;
            p.y += p.speedY;
            p.life -= p.decay;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    createObstacle() {
        const height = Math.random() * 80 + 40;
        this.obstacles.push({
            x: this.canvas.width,
            y: this.ground.y - height,
            width: 30,
            height: height,
            color: '#4ECDC4'
        });
    }
    
    checkCollision(player, obstacle) {
        return player.x < obstacle.x + obstacle.width &&
               player.x + player.width > obstacle.x &&
               player.y < obstacle.y + obstacle.height &&
               player.y + player.height > obstacle.y;
    }
    
   draw() {
    // ЯРКИЙ ФОН с градиентом
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#64B5F6'); // Яркий голубой
    gradient.addColorStop(1, '#BA68C8'); // Фиолетовый
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // СОЛНЦЕ
    this.ctx.fillStyle = '#FFEB3B';
    this.ctx.beginPath();
    this.ctx.arc(this.canvas.width - 100, 100, 40, 0, Math.PI * 2);
    this.ctx.fill();

    // ОБЛАКА
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    this.ctx.beginPath();
    this.ctx.arc(200, 80, 30, 0, Math.PI * 2);
    this.ctx.arc(230, 70, 25, 0, Math.PI * 2);
    this.ctx.arc(260, 80, 30, 0, Math.PI * 2);
    this.ctx.fill();

    // ЯРКАЯ ЗЕМЛЯ
    const groundGradient = this.ctx.createLinearGradient(0, this.ground.y, 0, this.ground.y + this.ground.height);
    groundGradient.addColorStop(0, '#81C784'); // Ярко-зеленый
    groundGradient.addColorStop(1, '#4CAF50'); // Зеленый
    this.ctx.fillStyle = groundGradient;
    this.ctx.fillRect(0, this.ground.y, this.canvas.width, this.ground.height);

    // ТРАВА
    this.ctx.fillStyle = '#2E7D32';
    this.ctx.fillRect(0, this.ground.y - 10, this.canvas.width, 10);
    
    // ТРАВКА (декорации)
    this.ctx.fillStyle = '#388E3C';
    for (let i = 0; i < 10; i++) {
        const x = (i * 100) % this.canvas.width;
        this.ctx.fillRect(x, this.ground.y - 15, 3, 15);
        this.ctx.fillRect(x + 20, this.ground.y - 20, 3, 20);
        this.ctx.fillRect(x + 40, this.ground.y - 12, 3, 12);
    }

    // ЯРКИЕ ПРЕПЯТСТВИЯ
    this.obstacles.forEach(obstacle => {
        const obstacleGradient = this.ctx.createLinearGradient(
            obstacle.x, obstacle.y, 
            obstacle.x, obstacle.y + obstacle.height
        );
        obstacleGradient.addColorStop(0, '#FF5722'); // Ярко-оранжевый
        obstacleGradient.addColorStop(1, '#E64A19'); // Оранжевый
        
        this.ctx.fillStyle = obstacleGradient;
        
        // Шипы с эффектом
        this.ctx.beginPath();
        this.ctx.moveTo(obstacle.x, obstacle.y + obstacle.height);
        this.ctx.lineTo(obstacle.x + obstacle.width / 2, obstacle.y);
        this.ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Блеск на шипах
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    });

    // ЯРКИЙ ИГРОК с градиентом
    const playerGradient = this.ctx.createLinearGradient(
        this.player.x, this.player.y,
        this.player.x + this.player.width, this.player.y + this.player.height
    );
    playerGradient.addColorStop(0, '#FF4081'); // Розовый
    playerGradient.addColorStop(1, '#E91E63'); // Ярко-розовый
    
    this.ctx.fillStyle = playerGradient;
    this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
    
    // ДЕТАЛИ ИГРОКА
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillRect(this.player.x + 10, this.player.y + 10, 8, 8); // Глаз 1
    this.ctx.fillRect(this.player.x + 25, this.player.y + 10, 8, 8); // Глаз 2
    
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(this.player.x + 12, this.player.y + 12, 4, 4); // Зрачок 1
    this.ctx.fillRect(this.player.x + 27, this.player.y + 12, 4, 4); // Зрачок 2
    
    // УЛЫБКА
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(this.player.x + 21, this.player.y + 25, 6, 0.2, Math.PI - 0.2);
    this.ctx.stroke();

    // ЯРКИЕ ЧАСТИЦЫ
    this.particles.forEach(p => {
        this.ctx.globalAlpha = p.life;
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
    });
    this.ctx.globalAlpha = 1;
    
    // ЭФФЕКТ СВЕТА вокруг игрока когда играет
    if (this.gameState === 'playing') {
        this.ctx.shadowColor = '#FF4081';
        this.ctx.shadowBlur = 20;
        this.ctx.fillStyle = 'rgba(255, 64, 129, 0.1)';
        this.ctx.beginPath();
        this.ctx.arc(
            this.player.x + this.player.width/2, 
            this.player.y + this.player.height/2, 
            30, 0, Math.PI * 2
        );
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }
}
    
    updateScore() {
        if (this.scoreElement) {
            this.scoreElement.textContent = `⭐ Очки: ${this.score}`;
        }
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            if (this.highScoreElement) {
                this.highScoreElement.textContent = `🏆 Рекорд: ${this.highScore}`;
            }
            localStorage.setItem('geometryDashHighScore', this.highScore);
        }
    }
    
    gameOver() {
        console.log('💀 GAME OVER');
        this.gameState = 'gameover';
        
        const gameOverScreen = document.getElementById('gameOverScreen');
        const finalScore = document.getElementById('finalScore');
        
        if (gameOverScreen) {
            gameOverScreen.classList.remove('hidden');
        }
        
        if (finalScore) {
            finalScore.textContent = `⭐ Очки: ${this.score}`;
        }
        
        this.sendScoreToBot();
    }
    
    restartGame() {
        console.log('🔄 RESTART GAME');
        this.initGame();
        this.startGame();
    }
    
    shareScore() {
        alert(`🎮 Я набрал ${this.score} очков в Geometry Dash!`);
    }
    
    sendScoreToBot() {
        try {
            if (window.Telegram && Telegram.WebApp) {
                Telegram.WebApp.sendData(JSON.stringify({
                    action: 'game_score',
                    score: this.score,
                    highScore: this.highScore
                }));
            }
        } catch (e) {
            console.log('Cannot send data to bot:', e);
        }
    }
    
    gameLoop() {
        this.update();
        this.draw();
        
        if (this.gameState === 'playing') {
            requestAnimationFrame(() => this.gameLoop());
        }
    }
}

// 🔧 АВАРИЙНАЯ ИНИЦИАЛИЗАЦИЯ
function initializeGame() {
    console.log('🚀 INITIALIZING GAME...');
    
    // Ждем полной загрузки DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('📄 DOM fully loaded');
            window.game = new GeometryDash();
        });
    } else {
        console.log('📄 DOM already loaded');
        window.game = new GeometryDash();
    }
    
    // Глобальные функции для отладки
    window.debugStartGame = () => {
        console.log('🐛 DEBUG: Manual game start');
        if (window.game) {
            window.game.startGame();
        } else {
            console.error('Game not initialized');
        }
    };
}

// 🎯 ЗАПУСК
console.log('🎮 Geometry Dash Ultimate - Loading...');
initializeGame();