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
        this.highScoreElement.textContent = `🏆 Рекорд: ${this.highScore}`;
        
        // Эффекты и частицы
        this.particles = [];
        this.effects = [];
        this.screenShake = 0;
        
        this.setupTelegramAuth();
        this.checkAuthStatus();
        
        // Цветовые темы
        this.colorThemes = [
            { primary: '#FF6B6B', secondary: '#4ECDC4', bg: '#667eea' },
            { primary: '#FF9E6B', secondary: '#6BFFD3', bg: '#a18cd1' },
            { primary: '#6B83FF', secondary: '#FF6BE8', bg: '#fbc2eb' },
            { primary: '#FFD166', secondary: '#EF476F', bg: '#06d6a0' }
        ];
        this.currentTheme = 0;
        
        // Аудио эффекты
        this.sounds = {
            jump: this.createSound(200, 'square', 0.1),
            score: this.createSound(300, 'sine', 0.1),
            crash: this.createSound(100, 'sawtooth', 0.3)
        };
    }
    
    createSound(freq, type, duration) {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            oscillator.frequency.value = freq;
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
            
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + duration);
        } catch (e) {
            console.log('Audio not supported');
        }
    }
    
    setupTelegramAuth() {
        const savedUser = localStorage.getItem('tg_user');
        if (savedUser) {
            const user = JSON.parse(savedUser);
            console.log('User authorized:', user.first_name);
        }
    }

    checkAuthStatus() {
        const savedUser = localStorage.getItem('tg_user');
        if (savedUser) {
            const user = JSON.parse(savedUser);
            this.hideAuthButton();
        }
    }

    hideAuthButton() {
        const authSection = document.getElementById('authSection');
        if (authSection) {
            authSection.style.display = 'none';
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
        this.gameSpeed = 8;
        this.gravity = 0.9;
        this.jumpForce = -18;
        this.combo = 0;
        this.multiplier = 1;
        
        // Игрок с анимацией
        this.player = {
            x: 100,
            y: this.canvas.height - 180,
            width: 45,
            height: 45,
            velocityY: 0,
            isJumping: false,
            rotation: 0,
            scale: 1,
            color: this.colorThemes[this.currentTheme].primary,
            trail: []
        };
        
        this.obstacles = [];
        this.obstacleTimer = 0;
        this.obstacleInterval = 70;
        
        this.ground = {
            y: this.canvas.height - 120,
            height: 120
        };
        
        // Улучшенный параллакс фон
        this.backgrounds = [
            { x: 0, speed: 0.2, color: this.colorThemes[this.currentTheme].bg, stars: [] },
            { x: 0, speed: 0.5, color: this.darkenColor(this.colorThemes[this.currentTheme].bg, 20), stars: [] },
            { x: 0, speed: 1, color: this.darkenColor(this.colorThemes[this.currentTheme].bg, 40), stars: [] }
        ];
        
        // Создаем звезды для фона
        this.backgrounds.forEach(bg => {
            bg.stars = this.createStars(20);
        });
        
        this.particles = [];
        this.effects = [];
    }
    
    createStars(count) {
        const stars = [];
        for (let i = 0; i < count; i++) {
            stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 1,
                speed: Math.random() * 0.5 + 0.1
            });
        }
        return stars;
    }
    
    darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('click', () => this.jump());
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.jump();
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.key === ' ' || e.code === 'ArrowUp') {
                this.jump();
            }
        });
        
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('shareBtn').addEventListener('click', () => this.shareScore());
        
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.ready();
            Telegram.WebApp.expand();
        }
    }
    
    startGame() {
        this.gameState = 'playing';
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        this.createParticleEffect(this.player.x, this.player.y, 20, this.player.color);
        this.gameLoop();
    }
    
    restartGame() {
        this.currentTheme = (this.currentTheme + 1) % this.colorThemes.length;
        this.initGame();
        this.startGame();
    }
    
    jump() {
        if (this.gameState !== 'playing') return;
        
        if (!this.player.isJumping) {
            this.player.velocityY = this.jumpForce;
            this.player.isJumping = true;
            this.player.rotation = -25;
            
            // Эффект прыжка
            this.createParticleEffect(this.player.x + this.player.width/2, this.player.y + this.player.height, 8, '#FFFFFF');
            this.sounds.jump;
            
            // Анимация масштаба
            this.player.scale = 0.8;
            setTimeout(() => {
                this.player.scale = 1;
            }, 100);
        }
    }
    
    createParticleEffect(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                size: Math.random() * 4 + 2,
                speedX: (Math.random() - 0.5) * 8,
                speedY: (Math.random() - 0.5) * 8,
                color: color,
                life: 1,
                decay: Math.random() * 0.02 + 0.01
            });
        }
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        // Обновление игрока
        this.player.velocityY += this.gravity;
        this.player.y += this.player.velocityY;
        
        // Вращение игрока
        this.player.rotation += this.player.velocityY * 0.5;
        this.player.rotation = Math.max(-25, Math.min(25, this.player.rotation));
        
        // След за игроком
        this.player.trail.push({
            x: this.player.x + this.player.width/2,
            y: this.player.y + this.player.height/2,
            life: 1
        });
        
        if (this.player.trail.length > 8) {
            this.player.trail.shift();
        }
        
        // Обновление следа
        this.player.trail.forEach(point => point.life -= 0.1);
        this.player.trail = this.player.trail.filter(point => point.life > 0);
        
        if (this.player.y + this.player.height > this.ground.y) {
            this.player.y = this.ground.y - this.player.height;
            this.player.velocityY = 0;
            this.player.isJumping = false;
            this.player.rotation = 0;
        }
        
        // Генерация препятствий
        this.obstacleTimer++;
        if (this.obstacleTimer > this.obstacleInterval) {
            this.createObstacle();
            this.obstacleTimer = 0;
            this.obstacleInterval = Math.max(40, this.obstacleInterval - 0.3);
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
                this.score += 10 * this.multiplier;
                this.combo++;
                
                // Комбо система
                if (this.combo % 5 === 0) {
                    this.multiplier++;
                    this.createTextEffect('COMBO x' + this.multiplier, obstacle.x, obstacle.y, '#FFD700');
                    this.sounds.score;
                }
                
                this.updateScore();
                this.createParticleEffect(obstacle.x, obstacle.y, 5, obstacle.color);
            }
        }
        
        // Увеличение скорости
        this.gameSpeed += 0.002;
        
        // Обновление фона
        this.backgrounds.forEach(bg => {
            bg.x = (bg.x - bg.speed) % this.canvas.width;
            bg.stars.forEach(star => {
                star.x -= star.speed;
                if (star.x < 0) star.x = this.canvas.width;
            });
        });
        
        // Обновление частиц
        this.updateParticles();
        this.updateEffects();
        
        // Уменьшение тряски
        if (this.screenShake > 0) {
            this.screenShake *= 0.9;
            if (this.screenShake < 0.1) this.screenShake = 0;
        }
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
    
    updateEffects() {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            effect.life -= 0.02;
            effect.y -= 2;
            
            if (effect.life <= 0) {
                this.effects.splice(i, 1);
            }
        }
    }
    
    createTextEffect(text, x, y, color) {
        this.effects.push({
            text: text,
            x: x,
            y: y,
            color: color,
            life: 1
        });
    }
    
    createObstacle() {
        const types = [
            { width: 35, height: 60, color: this.colorThemes[this.currentTheme].secondary, type: 'spike' },
            { width: 35, height: 90, color: this.darkenColor(this.colorThemes[this.currentTheme].secondary, 20), type: 'spike' },
            { width: 35, height: 130, color: this.darkenColor(this.colorThemes[this.currentTheme].secondary, 40), type: 'spike' },
            { width: 80, height: 40, color: this.colorThemes[this.currentTheme].secondary, type: 'platform' },
            { width: 120, height: 30, color: this.darkenColor(this.colorThemes[this.currentTheme].secondary, 20), type: 'platform' }
        ];
        
        const type = types[Math.floor(Math.random() * types.length)];
        
        this.obstacles.push({
            x: this.canvas.width,
            y: type.type === 'platform' ? this.ground.y - type.height : this.ground.y - type.height,
            width: type.width,
            height: type.height,
            color: type.color,
            type: type.type
        });
    }
    
    checkCollision(player, obstacle) {
        return player.x < obstacle.x + obstacle.width &&
               player.x + player.width > obstacle.x &&
               player.y < obstacle.y + obstacle.height &&
               player.y + player.height > obstacle.y;
    }
    
    draw() {
        // Эффект тряски
        const shakeX = this.screenShake * (Math.random() - 0.5) * 10;
        const shakeY = this.screenShake * (Math.random() - 0.5) * 10;
        
        this.ctx.save();
        this.ctx.translate(shakeX, shakeY);
        
        // Фон с градиентом
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, this.colorThemes[this.currentTheme].bg);
        gradient.addColorStop(1, this.darkenColor(this.colorThemes[this.currentTheme].bg, 30));
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Звезды
        this.backgrounds.forEach(bg => {
            this.ctx.fillStyle = '#FFFFFF';
            bg.stars.forEach(star => {
                this.ctx.globalAlpha = Math.random() * 0.8 + 0.2;
                this.ctx.fillRect(star.x, star.y, star.size, star.size);
            });
            this.ctx.globalAlpha = 1;
        });
        
        // Земля с градиентом
        const groundGradient = this.ctx.createLinearGradient(0, this.ground.y, 0, this.ground.y + this.ground.height);
        groundGradient.addColorStop(0, '#5D4037');
        groundGradient.addColorStop(1, '#3E2723');
        this.ctx.fillStyle = groundGradient;
        this.ctx.fillRect(0, this.ground.y, this.canvas.width, this.ground.height);
        
        // Трава
        this.ctx.fillStyle = '#388E3C';
        this.ctx.fillRect(0, this.ground.y - 15, this.canvas.width, 15);
        
        // След игрока
        this.ctx.strokeStyle = this.player.color;
        this.ctx.lineWidth = 3;
        this.ctx.globalAlpha = 0.6;
        this.ctx.beginPath();
        this.player.trail.forEach((point, index) => {
            if (index === 0) {
                this.ctx.moveTo(point.x, point.y);
            } else {
                this.ctx.lineTo(point.x, point.y);
            }
        });
        this.ctx.stroke();
        this.ctx.globalAlpha = 1;
        
        // Препятствия
        this.obstacles.forEach(obstacle => {
            this.ctx.fillStyle = obstacle.color;
            
            if (obstacle.type === 'spike') {
                // Шипы с градиентом
                const spikeGradient = this.ctx.createLinearGradient(
                    obstacle.x, obstacle.y, 
                    obstacle.x, obstacle.y + obstacle.height
                );
                spikeGradient.addColorStop(0, obstacle.color);
                spikeGradient.addColorStop(1, this.darkenColor(obstacle.color, 40));
                this.ctx.fillStyle = spikeGradient;
                
                this.ctx.beginPath();
                this.ctx.moveTo(obstacle.x, obstacle.y + obstacle.height);
                this.ctx.lineTo(obstacle.x + obstacle.width / 2, obstacle.y);
                this.ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
                this.ctx.closePath();
                this.ctx.fill();
                
                // Контур шипа
                this.ctx.strokeStyle = '#FFFFFF';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            } else {
                // Платформы с тенью
                this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                
                // Верх платформы
                this.ctx.fillStyle = this.lightenColor(obstacle.color, 20);
                this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, 8);
            }
        });
        
        // Частицы
        this.particles.forEach(p => {
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
        });
        this.ctx.globalAlpha = 1;
        
        // Игрок с вращением и масштабом
        this.ctx.save();
        this.ctx.translate(
            this.player.x + this.player.width/2, 
            this.player.y + this.player.height/2
        );
        this.ctx.rotate(this.player.rotation * Math.PI / 180);
        this.ctx.scale(this.player.scale, this.player.scale);
        
        // Градиент для игрока
        const playerGradient = this.ctx.createLinearGradient(
            -this.player.width/2, -this.player.height/2,
            this.player.width/2, this.player.height/2
        );
        playerGradient.addColorStop(0, this.player.color);
        playerGradient.addColorStop(1, this.darkenColor(this.player.color, 20));
        
        this.ctx.fillStyle = playerGradient;
        this.ctx.fillRect(-this.player.width/2, -this.player.height/2, this.player.width, this.player.height);
        
        // Глаза игрока
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(-this.player.width/4, -this.player.height/4, 8, 8);
        this.ctx.fillRect(this.player.width/4 - 8, -this.player.height/4, 8, 8);
        
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(-this.player.width/4 + 2, -this.player.height/4 + 2, 4, 4);
        this.ctx.fillRect(this.player.width/4 - 6, -this.player.height/4 + 2, 4, 4);
        
        this.ctx.restore();
        
        // Текстовые эффекты
        this.effects.forEach(effect => {
            this.ctx.globalAlpha = effect.life;
            this.ctx.fillStyle = effect.color;
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(effect.text, effect.x, effect.y);
        });
        this.ctx.globalAlpha = 1;
        
        this.ctx.restore(); // Восстанавливаем трансформацию тряски
    }
    
    lightenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R > 255 ? 255 : R) * 0x10000 +
            (G > 255 ? 255 : G) * 0x100 +
            (B > 255 ? 255 : B)).toString(16).slice(1);
    }
    
    updateScore() {
        this.scoreElement.textContent = `⭐ Очки: ${this.score}`;
        this.scoreElement.style.color = this.colorThemes[this.currentTheme].primary;
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.highScoreElement.textContent = `🏆 Рекорд: ${this.highScore}`;
            this.highScoreElement.style.color = '#FFD700';
            localStorage.setItem('geometryDashHighScore', this.highScore);
        }
    }
    
    gameOver() {
        this.gameState = 'gameover';
        document.getElementById('finalScore').textContent = `⭐ Очки: ${this.score}`;
        document.getElementById('gameOverScreen').classList.remove('hidden');
        
        // Эффекты при Game Over
        this.screenShake = 2;
        this.createParticleEffect(this.player.x + this.player.width/2, this.player.y + this.player.height/2, 30, '#FF0000');
        this.sounds.crash;
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('geometryDashHighScore', this.highScore);
        }
        
        this.sendScoreToBot();
    }
    
    sendScoreToBot() {
        try {
            const savedUser = localStorage.getItem('tg_user');
            const userData = savedUser ? JSON.parse(savedUser) : null;
            
            if (window.Telegram && Telegram.WebApp) {
                Telegram.WebApp.sendData(JSON.stringify({
                    action: 'game_score',
                    score: this.score,
                    highScore: this.highScore,
                    user: userData
                }));
            }
        } catch (e) {
            console.log('Cannot send data to bot:', e);
        }
    }
    
    shareScore() {
        const shareText = `🎮 Я набрал ${this.score} очков в Geometry Dash Ultimate Edition! Сможешь побить?`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Geometry Dash Ultimate',
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
}

// Функции авторизации
function onTelegramAuth(user) {
    localStorage.setItem('tg_user', JSON.stringify(user));
    showUserInfo(user);
    
    try {
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.sendData(JSON.stringify({
                action: 'telegram_login',
                user: user
            }));
        }
    } catch (e) {
        console.log('WebApp not available:', e);
    }
}

function showUserInfo(user) {
    const authSection = document.getElementById('authSection');
    if (authSection) {
        authSection.innerHTML = `
            <div style="background: rgba(255,255,255,0.2); padding: 10px; border-radius: 10px; margin-top: 10px;">
                <strong>👋 ${user.first_name}!</strong>
                <br>
                <small>ID: ${user.id}</small>
                <br>
                <button onclick="logout()" style="background: #ff4757; color: white; border: none; padding: 5px 10px; border-radius: 5px; margin-top: 5px; cursor: pointer;">Выйти</button>
            </div>
        `;
    }
}

function logout() {
    localStorage.removeItem('tg_user');
    location.reload();
}

// Проверка авторизации при загрузке
window.addEventListener('load', function() {
    const savedUser = localStorage.getItem('tg_user');
    if (savedUser) {
        const user = JSON.parse(savedUser);
        showUserInfo(user);
    }
    
    new GeometryDash();
});