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
        // Очистка
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Земля
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(0, this.ground.y, this.canvas.width, this.ground.height);
        
        // Препятствия
        this.obstacles.forEach(obstacle => {
            this.ctx.fillStyle = obstacle.color;
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        });
        
        // Игрок
        this.ctx.fillStyle = this.player.color;
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Частицы
        this.particles.forEach(p => {
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(p.x, p.y, p.size, p.size);
        });
        this.ctx.globalAlpha = 1;
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