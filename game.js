class GeometryDash {
    constructor() {
        console.log('🎮 GeometryDash mobile version');
        
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        
        if (!this.canvas) {
            console.error('❌ Canvas not found!');
            return;
        }
        
        // Сначала настраиваем canvas
        this.setupCanvas();
        
        // Затем инициализируем игру
        this.initGame();
        
        // Настройка управления
        this.setupMobileControls();
        
        this.highScore = localStorage.getItem('geometryDashHighScore') || 0;
        if (this.highScoreElement) {
            this.highScoreElement.textContent = `🏆 Рекорд: ${this.highScore}`;
        }
        
        // Кнопки
        this.setupButtons();
        
        console.log('✅ Mobile game ready');
    }
    
    setupCanvas() {
        // Устанавливаем размеры canvas
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        console.log('📱 Canvas size:', this.canvas.width, 'x', this.canvas.height);
        
        // Обработчик ресайза
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.ground.y = this.canvas.height - 120;
        });
    }
    
    setupMobileControls() {
        console.log('🎯 Setting up mobile controls...');
        
        // ОБЯЗАТЕЛЬНО: предотвращаем стандартное поведение
        document.addEventListener('touchstart', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        document.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        // ТАП ПО ВСЕМУ ЭКРАНУ для прыжка
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            console.log('📱 Screen tapped - JUMP');
            this.jump();
        }, { passive: false });
        
        this.canvas.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🖱️ Screen clicked - JUMP');
            this.jump();
        });
        
        // Клавиатура для десктопа
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.key === ' ' || e.code === 'ArrowUp') {
                e.preventDefault();
                this.jump();
            }
        });
        
        console.log('✅ Mobile controls ready');
    }
    
    setupButtons() {
        console.log('🔘 Setting up buttons...');
        
        // СТАРТ
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.startGame();
            });
            
            startBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.startGame();
            }, { passive: false });
        }
        
        // РЕСТАРТ
        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) {
            restartBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.restartGame();
            });
        }
        
        // ПОДЕЛИТЬСЯ
        const shareBtn = document.getElementById('shareBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.shareScore();
            });
        }
    }
    
    initGame() {
        this.gameState = 'menu';
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
        this.particles = [];
        
        this.ground = {
            y: this.canvas.height - 120,
            height: 120
        };
        
        console.log('🎮 Game initialized');
    }
    
    startGame() {
        console.log('🚀 STARTING GAME...');
        
        if (this.gameState === 'playing') return;
        
        this.gameState = 'playing';
        
        // Скрываем меню
        const startScreen = document.getElementById('startScreen');
        const gameOverScreen = document.getElementById('gameOverScreen');
        
        if (startScreen) {
            startScreen.classList.add('hidden');
            console.log('✅ Start screen hidden');
        }
        
        if (gameOverScreen) {
            gameOverScreen.classList.add('hidden');
            console.log('✅ Game over screen hidden');
        }
        
        // Сбрасываем состояние
        this.initGame();
        this.gameState = 'playing';
        
        // Запускаем игровой цикл
        console.log('🔄 Starting game loop');
        this.gameLoop();
    }
    
    jump() {
        if (this.gameState !== 'playing') {
            console.log('⚠️ Cannot jump - game not playing');
            return;
        }
        
        if (!this.player.isJumping) {
            this.player.velocityY = this.jumpForce;
            this.player.isJumping = true;
            console.log('🦘 Player jumped!');
            
            // Эффекты прыжка
            this.createParticleEffect(this.player.x + this.player.width/2, this.player.y + this.player.height, 5, '#FFFFFF');
        }
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
    
    update() {
        if (this.gameState !== 'playing') return;
        
        // ФИЗИКА ИГРОКА
        this.player.velocityY += this.gravity;
        this.player.y += this.player.velocityY;
        
        // ПРОВЕРКА ЗЕМЛИ
        if (this.player.y + this.player.height > this.ground.y) {
            this.player.y = this.ground.y - this.player.height;
            this.player.velocityY = 0;
            this.player.isJumping = false;
        }
        
        // ГЕНЕРАЦИЯ ПРЕПЯТСТВИЙ
        this.obstacleTimer++;
        if (this.obstacleTimer > this.obstacleInterval) {
            this.createObstacle();
            this.obstacleTimer = 0;
            this.obstacleInterval = Math.max(40, this.obstacleInterval - 0.1);
        }
        
        // ОБНОВЛЕНИЕ ПРЕПЯТСТВИЙ
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.x -= this.gameSpeed;
            
            // СТОЛКНОВЕНИЕ
            if (this.checkCollision(this.player, obstacle)) {
                this.gameOver();
                return;
            }
            
            // УДАЛЕНИЕ ПРЕПЯТСТВИЙ
            if (obstacle.x + obstacle.width < 0) {
                this.obstacles.splice(i, 1);
                this.score += 10;
                this.updateScore();
                this.createParticleEffect(obstacle.x, obstacle.y, 3, obstacle.color);
            }
        }
        
        // ОБНОВЛЕНИЕ ЧАСТИЦ
        this.updateParticles();
        
        // УВЕЛИЧЕНИЕ СЛОЖНОСТИ
        this.gameSpeed += 0.001;
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
        // ЯРКИЙ ФОН
        this.ctx.fillStyle = '#64B5F6';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // СОЛНЦЕ
        this.ctx.fillStyle = '#FFEB3B';
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width - 80, 80, 40, 0, Math.PI * 2);
        this.ctx.fill();
        
        // ЗЕМЛЯ
        this.ctx.fillStyle = '#81C784';
        this.ctx.fillRect(0, this.ground.y, this.canvas.width, this.ground.height);
        
        // ТРАВА
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillRect(0, this.ground.y - 10, this.canvas.width, 10);
        
        // ПРЕПЯТСТВИЯ
        this.obstacles.forEach(obstacle => {
            this.ctx.fillStyle = obstacle.color;
            
            // ШИПЫ
            this.ctx.beginPath();
            this.ctx.moveTo(obstacle.x, obstacle.y + obstacle.height);
            this.ctx.lineTo(obstacle.x + obstacle.width / 2, obstacle.y);
            this.ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
            this.ctx.closePath();
            this.ctx.fill();
        });
        
        // ИГРОК
        this.ctx.fillStyle = this.player.color;
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // ГЛАЗА ИГРОКА
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(this.player.x + 10, this.player.y + 10, 8, 8);
        this.ctx.fillRect(this.player.x + 25, this.player.y + 10, 8, 8);
        
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(this.player.x + 12, this.player.y + 12, 4, 4);
        this.ctx.fillRect(this.player.x + 27, this.player.y + 12, 4, 4);
        
        // ЧАСТИЦЫ
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
            console.log('✅ Game over screen shown');
        }
        
        if (finalScore) {
            finalScore.textContent = `⭐ Очки: ${this.score}`;
        }
        
        // ЭФФЕКТЫ ПРИ ПРОИГРЫШЕ
        this.createParticleEffect(this.player.x + this.player.width/2, this.player.y + this.player.height/2, 20, '#FF0000');
    }
    
    restartGame() {
        console.log('🔄 RESTARTING GAME');
        this.initGame();
        this.startGame();
    }
    
    shareScore() {
        const shareText = `🎮 Я набрал ${this.score} очков в Geometry Dash Mobile!`;
        alert(shareText);
    }
    
    gameLoop() {
        this.update();
        this.draw();
        
        if (this.gameState === 'playing') {
            requestAnimationFrame(() => this.gameLoop());
        }
    }
}

// 🚀 ПРОСТАЯ ИНИЦИАЛИЗАЦИЯ
function initGame() {
    console.log('📱 Initializing mobile game...');
    
    // Ждем полной загрузки
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.game = new GeometryDash();
        });
    } else {
        window.game = new GeometryDash();
    }
}

// ЗАПУСК
console.log('🎮 Geometry Dash Mobile - Starting...');
initGame();