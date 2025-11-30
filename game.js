class GeometryDash {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        
        this.setupCanvas();
        this.initGame();
        this.setupEventListeners();
        
        this.highScore = localStorage.getItem('geometryDashHighScore') || 0;
        this.highScoreElement.textContent = `Рекорд: ${this.highScore}`;
        this.setupTelegramAuth();
    }
    
      
    setupTelegramAuth() {
        // Проверяем авторизацию при старте
        const savedUser = localStorage.getItem('tg_user');
        if (savedUser) {
            const user = JSON.parse(savedUser);
            console.log('User already authorized:', user.first_name);
        }
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
        this.gameState = 'menu';
        this.score = 0;
        this.gameSpeed = 5;
        this.gravity = 0.8;
        this.jumpForce = -15;
        
        this.player = {
            x: 100,
            y: this.canvas.height - 150,
            width: 40,
            height: 40,
            velocityY: 0,
            isJumping: false,
            color: '#FF6B6B'
        };
        
        this.obstacles = [];
        this.obstacleTimer = 0;
        this.obstacleInterval = 90;
        
        this.ground = {
            y: this.canvas.height - 100,
            height: 100
        };
        
        this.backgrounds = [
            { x: 0, speed: 0.5, color: '#87CEEB' },
            { x: 0, speed: 1, color: '#98D8E8' },
            { x: 0, speed: 2, color: '#B0E0E6' }
        ];
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('click', () => this.jump());
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.key === ' ') {
                this.jump();
            }
        });
        
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('shareBtn').addEventListener('click', () => this.shareScore());
        
        Telegram.WebApp.ready();
        Telegram.WebApp.expand();
    }
    
    startGame() {
        this.gameState = 'playing';
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        this.gameLoop();
    }
    
    restartGame() {
        this.initGame();
        this.startGame();
    }
    
    jump() {
        if (this.gameState !== 'playing') return;
        
        if (!this.player.isJumping) {
            this.player.velocityY = this.jumpForce;
            this.player.isJumping = true;
        }
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        this.player.velocityY += this.gravity;
        this.player.y += this.player.velocityY;
        
        if (this.player.y + this.player.height > this.ground.y) {
            this.player.y = this.ground.y - this.player.height;
            this.player.velocityY = 0;
            this.player.isJumping = false;
        }
        
        this.obstacleTimer++;
        if (this.obstacleTimer > this.obstacleInterval) {
            this.createObstacle();
            this.obstacleTimer = 0;
            this.obstacleInterval = Math.max(30, this.obstacleInterval - 0.5);
        }
        
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
        
        this.gameSpeed += 0.001;
        
        this.backgrounds.forEach(bg => {
            bg.x = (bg.x - bg.speed) % this.canvas.width;
        });
    }
    
    createObstacle() {
        const types = [
            { width: 30, height: 50, color: '#4ECDC4' },
            { width: 30, height: 80, color: '#45B7AF' },
            { width: 30, height: 120, color: '#3DA199' }
        ];
        
        const type = types[Math.floor(Math.random() * types.length)];
        
        this.obstacles.push({
            x: this.canvas.width,
            y: this.ground.y - type.height,
            width: type.width,
            height: type.height,
            color: type.color
        });
    }
    
    checkCollision(player, obstacle) {
        return player.x < obstacle.x + obstacle.width &&
               player.x + player.width > obstacle.x &&
               player.y < obstacle.y + obstacle.height &&
               player.y + player.height > obstacle.y;
    }
    
    draw() {
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.backgrounds.forEach((bg, index) => {
            this.ctx.fillStyle = bg.color;
            this.ctx.fillRect(bg.x, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillRect(bg.x + this.canvas.width, 0, this.canvas.width, this.canvas.height);
        });
        
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(0, this.ground.y, this.canvas.width, this.ground.height);
        
        this.ctx.fillStyle = '#228B22';
        this.ctx.fillRect(0, this.ground.y - 10, this.canvas.width, 10);
        
        this.ctx.fillStyle = this.player.color;
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.player.x + 5, this.player.y + 5, this.player.width - 10, this.player.height - 10);
        
        this.obstacles.forEach(obstacle => {
            this.ctx.fillStyle = obstacle.color;
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            
            this.ctx.beginPath();
            this.ctx.moveTo(obstacle.x, obstacle.y + obstacle.height);
            this.ctx.lineTo(obstacle.x + obstacle.width / 2, obstacle.y);
            this.ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
            this.ctx.closePath();
            this.ctx.fillStyle = '#FF0000';
            this.ctx.fill();
        });
    }
    
    updateScore() {
        this.scoreElement.textContent = `Очки: ${this.score}`;
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.highScoreElement.textContent = `Рекорд: ${this.highScore}`;
            localStorage.setItem('geometryDashHighScore', this.highScore);
        }
    }
    
    gameOver() {
        this.gameState = 'gameover';
        document.getElementById('finalScore').textContent = `Очки: ${this.score}`;
        document.getElementById('gameOverScreen').classList.remove('hidden');
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('geometryDashHighScore', this.highScore);
        }
        
        this.sendScoreToBot();
    }
    
    sendScoreToBot() {
        try {
            Telegram.WebApp.sendData(JSON.stringify({
                action: 'game_score',
                score: this.score,
                highScore: this.highScore
            }));
        } catch (e) {
            console.log('Cannot send data to bot:', e);
        }
    }
    
    shareScore() {
        const shareText = `🎮 Я набрал ${this.score} очков в Geometry Dash Technical Edition! Сможешь побить мой рекорд?`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Geometry Dash',
                text: shareText
            });
        } else {
            alert(shareText);
        }
    }
    
    gameLoop() {
        this.update();
        this.draw();
        
        if (this.gameState === 'playing') {
            requestAnimationFrame(() => this.gameLoop());
        }
    }
    sendScoreToBot() {
        try {
            const savedUser = localStorage.getItem('tg_user');
            const userData = savedUser ? JSON.parse(savedUser) : null;
            
            Telegram.WebApp.sendData(JSON.stringify({
                action: 'game_score',
                score: this.score,
                highScore: this.highScore,
                user: userData  // Добавляем данные пользователя
            }));
        } catch (e) {
            console.log('Cannot send data to bot:', e);
        }
    }
}
function onTelegramAuth(user) {
    // Сохраняем данные
    localStorage.setItem('tg_user', JSON.stringify(user));
    
    // Показываем информацию о пользователе
    showUserInfo(user);
    
    // Отправляем данные в бота
    try {
        Telegram.WebApp.sendData(JSON.stringify({
            action: 'telegram_login',
            user: user
        }));
    } catch (e) {
        console.log('WebApp not available:', e);
    }
}

function showUserInfo(user) {
    const authSection = document.getElementById('authSection');
    authSection.innerHTML = `
        <div id="userInfo">
            <strong>👋 Привет, ${user.first_name}!</strong>
            <br>
            <small>ID: ${user.id}</small>
            <br>
            <button class="logout-btn" onclick="logout()">Выйти</button>
        </div>
    `;
}

function logout() {
    localStorage.removeItem('tg_user');
    location.reload(); // Перезагружаем страницу
}

// Проверяем авторизацию при загрузке
window.addEventListener('load', function() {
    const savedUser = localStorage.getItem('tg_user');
    if (savedUser) {
        const user = JSON.parse(savedUser);
        showUserInfo(user);
    }
});

window.addEventListener('load', () => {
    new GeometryDash();
});