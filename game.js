class GeometryDash {
    constructor() {
        console.log('🎮 Initializing Geometry Dash Mobile');
        
        // Получаем элементы
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        
        if (!this.canvas) {
            console.error('❌ Canvas not found');
            return;
        }
        
        // Сразу настраиваем размеры
        this.setupCanvas();
        
        // Инициализируем игру
        this.initGame();
        
        // Настраиваем управление
        this.setupControls();
        
        // Настраиваем кнопки
        this.setupButtons();
        
        console.log('✅ Game ready for mobile');
    }
    
    setupCanvas() {
        // Устанавливаем точные размеры
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        console.log('📱 Canvas size:', this.canvas.width, 'x', this.canvas.height);
    }
    
    setupControls() {
        console.log('🎯 Setting up mobile controls');
        
        // ПРОСТОЙ ТАП ПО ЭКРАНУ - без preventDefault
        this.canvas.addEventListener('touchstart', (e) => {
            if (this.gameState === 'playing') {
                this.jump();
            }
            e.preventDefault();
        });
        
        this.canvas.addEventListener('click', (e) => {
            if (this.gameState === 'playing') {
                this.jump();
            }
        });
        
        // Клавиатура
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.gameState === 'playing') {
                this.jump();
            }
        });
    }
    
    setupButtons() {
        console.log('🔘 Setting up buttons');
        
        const startBtn = document.getElementById('startBtn');
        const restartBtn = document.getElementById('restartBtn');
        const shareBtn = document.getElementById('shareBtn');
        
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startGame());
            startBtn.addEventListener('touchstart', (e) => {
                this.startGame();
                e.preventDefault();
            });
        }
        
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.restartGame());
        }
        
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareScore());
        }
    }
    
    initGame() {
        this.gameState = 'menu'; // menu, playing, gameover
        this.score = 0;
        this.gameSpeed = 8;
        this.gravity = 0.9;
        this.jumpForce = -18;
        
        // Игрок
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
        this.obstacleInterval = 80;
        
        this.ground = {
            y: this.canvas.height - 120,
            height: 120
        };
        
        this.particles = [];
        
        // Обновляем интерфейс
        this.updateScore();
    }
    
    startGame() {
        console.log('🚀 Starting game');
        
        if (this.gameState === 'playing') return;
        
        this.gameState = 'playing';
        
        // Прячем меню
        this.hideElement('startScreen');
        this.hideElement('gameOverScreen');
        
        // Запускаем игровой цикл
        this.gameLoop();
    }
    
    hideElement(id) {
        const element = document.getElementById(id);
        if (element) {
            element.classList.add('hidden');
        }
    }
    
    showElement(id) {
        const element = document.getElementById(id);
        if (element) {
            element.classList.remove('hidden');
        }
    }
    
    jump() {
        if (this.gameState !== 'playing') return;
        
        if (!this.player.isJumping) {
            this.player.velocityY = this.jumpForce;
            this.player.isJumping = true;
            console.log('🦘 Jump!');
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
            this.obstacleInterval = Math.max(50, this.obstacleInterval - 0.1);
        }
        
        // Обновление препятствий
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.x -= this.gameSpeed;
            
            // Столкновение
            if (this.checkCollision(this.player, obstacle)) {
                this.gameOver();
                return;
            }
            
            // Удаление вышедших за экран
            if (obstacle.x + obstacle.width < 0) {
                this.obstacles.splice(i, 1);
                this.score += 10;
                this.updateScore();
            }
        }
        
        // Увеличение скорости
        this.gameSpeed += 0.001;
    }
    
    createObstacle() {
        const height = Math.random() * 60 + 40;
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
        this.ctx.fillStyle = '#64B5F6';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Солнце
        this.ctx.fillStyle = '#FFEB3B';
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width - 80, 80, 40, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Земля
        this.ctx.fillStyle = '#81C784';
        this.ctx.fillRect(0, this.ground.y, this.canvas.width, this.ground.height);
        
        // Трава
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillRect(0, this.ground.y - 10, this.canvas.width, 10);
        
        // Препятствия
        this.obstacles.forEach(obstacle => {
            this.ctx.fillStyle = obstacle.color;
            
            // Рисуем треугольник (шип)
            this.ctx.beginPath();
            this.ctx.moveTo(obstacle.x, obstacle.y + obstacle.height);
            this.ctx.lineTo(obstacle.x + obstacle.width / 2, obstacle.y);
            this.ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
            this.ctx.closePath();
            this.ctx.fill();
        });
        
        // Игрок
        this.ctx.fillStyle = this.player.color;
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Глаза
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(this.player.x + 10, this.player.y + 10, 8, 8);
        this.ctx.fillRect(this.player.x + 25, this.player.y + 10, 8, 8);
        
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(this.player.x + 12, this.player.y + 12, 4, 4);
        this.ctx.fillRect(this.player.x + 27, this.player.y + 12, 4, 4);
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
        console.log('💀 Game Over');
        this.gameState = 'gameover';
        
        this.showElement('gameOverScreen');
        
        const finalScore = document.getElementById('finalScore');
        if (finalScore) {
            finalScore.textContent = `⭐ Очки: ${this.score}`;
        }
    }
    
    restartGame() {
        console.log('🔄 Restarting game');
        this.initGame();
        this.startGame();
    }
    
    shareScore() {
        alert(`🎮 Я набрал ${this.score} очков в Geometry Dash!`);
    }
    
    gameLoop() {
        this.update();
        this.draw();
        
        if (this.gameState === 'playing') {
            requestAnimationFrame(() => this.gameLoop());
        }
    }
}

// 🚀 ПРОСТОЙ ЗАПУСК
console.log('🎮 Geometry Dash Mobile - Loading...');

// Ждем загрузки страницы
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.game = new GeometryDash();
    });
} else {
    window.game = new GeometryDash();
}

// Глобальная функция для отладки
window.startGame = function() {
    if (window.game) {
        window.game.startGame();
    }
};