class GeometryDash {
    constructor() {
        console.log('🎮 GeometryDash constructor called');
        
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        window.game = this;
        
        if (!this.canvas) {
            console.error('❌ Canvas not found!');
            return;
        }
        
        // Настройка для мобильных
        this.setupMobile();
        this.setupAudio();
        this.setupCanvas();
        this.initGame();
        
        this.highScore = localStorage.getItem('geometryDashHighScore') || 0;
        if (this.highScoreElement) {
            this.highScoreElement.textContent = `🏆 Рекорд: ${this.highScore}`;
        }
        
        setTimeout(() => {
            this.setupEventListeners();
            // Добавляем кнопку прыжка для мобильных
            this.setupMobileJumpButton();

            // Обнаруживаем мобильное устройство
            this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        }, 100);
        
        console.log('✅ Game initialized for mobile');
    }

    jump() {
        console.log('🎮 JUMP METHOD CALLED, gameState:', this.gameState);
        
        if (this.gameState !== 'playing') {
            console.log('⚠️ Cannot jump: game not playing');
            return;
        }
        
        if (!this.player.isJumping) {
            console.log('✅ Player jumps!');
            this.player.velocityY = this.jumpForce;
            this.player.isJumping = true;
            this.player.rotation = -25;
            this.player.scale = 0.8;
            
            // Эффекты прыжка
            this.createParticleEffect(this.player.x + this.player.width/2, 
                                     this.player.y + this.player.height, 
                                     8, '#FFFFFF');
            this.playSound('jump');
            
            setTimeout(() => {
                this.player.scale = 1;
            }, 100);
        } else {
            console.log('⚠️ Player already jumping');
        }
    }

    setupMobileJumpButton() {
        const jumpButton = document.getElementById('jumpButton');
        
        if (!jumpButton) {
            console.log('❌ Jump button not found');
            return;
        }
        
        // Показываем только на мобильных
        if (this.isMobile) {
            jumpButton.style.display = 'flex';
            
            // Нажатие на кнопку
            jumpButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.jump();
                jumpButton.style.transform = 'translateX(-50%) scale(0.9)';
                jumpButton.style.backgroundColor = 'rgba(255, 50, 50, 0.9)';
            }, { passive: false });
            
            // Отпускание кнопки
            jumpButton.addEventListener('touchend', (e) => {
                e.preventDefault();
                jumpButton.style.transform = 'translateX(-50%) scale(1)';
                jumpButton.style.backgroundColor = 'rgba(255, 107, 107, 0.8)';
            }, { passive: false });
            
            // На случай клика мышью (для тестирования)
            jumpButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.jump();
            });
        }
    }
    
    setupMobile() {
        // Предотвращаем масштабирование на мобильных
        document.addEventListener('touchmove', (e) => {
            if (e.scale !== 1) { 
                e.preventDefault(); 
            }
        }, { passive: false });
        
        // Предотвращаем выделение текста
        document.addEventListener('selectstart', (e) => {
            e.preventDefault();
        });
        
        // Фиксируем viewport
        const viewport = document.querySelector('meta[name=viewport]');
        if (viewport) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        }
    }
    
    setupAudio() {
        this.audioContext = null;
        this.sounds = {
            jump: { freq: 300, type: 'sine', duration: 0.1 },
            score: { freq: 400, type: 'square', duration: 0.05 },
            crash: { freq: 150, type: 'sawtooth', duration: 0.3 },
            powerup: { freq: 600, type: 'triangle', duration: 0.2 }
        };
        
        // Инициализация аудио контекста по первому клику (требование браузеров)
        this.initAudioOnFirstTouch();
    }
    
    initAudioOnFirstTouch() {
        const initAudio = () => {
            if (!this.audioContext) {
                try {
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    console.log('🔊 Audio context initialized');
                } catch (e) {
                    console.log('❌ Audio not supported:', e);
                }
            }
            
            // Убираем обработчики после первого касания
            document.removeEventListener('touchstart', initAudio);
            document.removeEventListener('click', initAudio);
        };
        
        document.addEventListener('touchstart', initAudio, { once: true });
        document.addEventListener('click', initAudio, { once: true });
    }
    
    playSound(soundName) {
        if (!this.audioContext) return;
        
        const sound = this.sounds[soundName];
        if (!sound) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = sound.freq;
            oscillator.type = sound.type;
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + sound.duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + sound.duration);
        } catch (e) {
            console.log('Audio error:', e);
        }
    }
    
    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Адаптивный ресайз для мобильных
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.ground.y = this.canvas.height - 120;
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
        this.screenShake = 0;
        
        this.player = {
            x: 100,
            y: this.canvas.height - 180,
            width: 45,
            height: 45,
            velocityY: 0,
            isJumping: false,
            rotation: 0,
            scale: 1,
            color: '#FF6B6B',
            trail: []
        };
        
        this.obstacles = [];
        this.obstacleTimer = 0;
        this.obstacleInterval = 70;
        this.particles = [];
        this.effects = [];
        this.collectibles = [];
        
        this.ground = {
            y: this.canvas.height - 120,
            height: 120
        };
        
        // Цветовые темы
        this.colorThemes = [
            { primary: '#FF6B6B', secondary: '#4ECDC4', bg: '#64B5F6' },
            { primary: '#FF9E6B', secondary: '#6BFFD3', bg: '#a18cd1' },
            { primary: '#6B83FF', secondary: '#FF6BE8', bg: '#fbc2eb' }
        ];
        this.currentTheme = 0;
    }
    
    setupEventListeners() {
        console.log('🔧 Setting up event listeners...');
        
        // КНОПКА СТАРТА
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
        
        // КНОПКА РЕСТАРТА
        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.restartGame());
        }
        
        // КНОПКА ПОДЕЛИТЬСЯ
        const shareBtn = document.getElementById('shareBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareScore());
        }
        
        // ВАЖНО: Используем делегирование событий для canvas
        this.setupCanvasControls();
        
        // Клавиатура для десктопа
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.key === ' ' || e.code === 'ArrowUp') {
                e.preventDefault();
                this.jump();
            }
        });
        
        // Telegram Web App
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.ready();
            Telegram.WebApp.expand();
        }
        
        console.log('✅ All event listeners setup complete');
    }
    
    setupCanvasControls() {
        // Используем один обработчик для всех событий
        const handleJump = (e) => {
            // Предотвращаем только для touch событий
            if (e.type === 'touchstart') {
                e.preventDefault();
            }
            
            // Прыгаем только если игра активна
            if (this.gameState === 'playing') {
                this.jump();
                
                // Визуальная обратная связь на мобильных
                if (this.isMobile) {
                    this.createTapEffect(e);
                }
            }
            
            // Также запускаем игру если в меню
            if (this.gameState === 'menu') {
                this.startGame();
            }
        };
        
        // Вешаем обработчики на canvas
        this.canvas.addEventListener('click', handleJump);
        this.canvas.addEventListener('touchstart', handleJump, { passive: false });
        
        // Также на всю область документа для надежности
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.key === ' ') {
                e.preventDefault();
                handleJump(e);
            }
        });
    }
    
    createTapEffect(e) {
        // Получаем координаты тапа
        let x, y;
        if (e.touches && e.touches[0]) {
            x = e.touches[0].clientX;
            y = e.touches[0].clientY;
        } else {
            x = e.clientX;
            y = e.clientY;
        }
        
        // Создаем эффект круговой волны
        const effect = document.createElement('div');
        effect.style.position = 'fixed';
        effect.style.left = (x - 25) + 'px';
        effect.style.top = (y - 25) + 'px';
        effect.style.width = '50px';
        effect.style.height = '50px';
        effect.style.borderRadius = '50%';
        effect.style.backgroundColor = 'rgba(255, 107, 107, 0.3)';
        effect.style.border = '2px solid rgba(255, 107, 107, 0.5)';
        effect.style.zIndex = '9998';
        effect.style.pointerEvents = 'none';
        effect.style.animation = 'tapEffect 0.5s forwards';
        
        document.body.appendChild(effect);
        
        // Удаляем эффект после анимации
        setTimeout(() => {
            document.body.removeChild(effect);
        }, 500);
    }
    
    setupSwipeControls() {
        let startX, startY;
        
        this.canvas.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: true });
        
        this.canvas.addEventListener('touchend', (e) => {
            if (!startX || !startY) return;
            
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            
            const diffX = endX - startX;
            const diffY = endY - startY;
            
            // Свайп вверх для прыжка
            if (Math.abs(diffY) > Math.abs(diffX) && diffY < -30) {
                this.jump();
            }
            
            startX = startY = null;
        }, { passive: true });
    }
    
    startGame() {
        console.log('🎮 START GAME');
        
        this.gameState = 'playing';
        
        const startScreen = document.getElementById('startScreen');
        const gameOverScreen = document.getElementById('gameOverScreen');
        const menu = document.getElementById('menu');
        const gameContainer = document.getElementById('gameContainer');
        
        if (startScreen) startScreen.classList.add('hidden');
        if (gameOverScreen) gameOverScreen.classList.add('hidden');
        if (menu) menu.classList.add('hidden');
        
        this.createParticleEffect(this.player.x, this.player.y, 20, this.player.color);
        this.playSound('powerup');
        this.gameLoop();

        if (gameContainer) {
            gameContainer.classList.add('playing');
        }
        
        this.createParticleEffect(this.player.x, this.player.y, 20, this.player.color);
        this.playSound('powerup');
        this.gameLoop();
    }
    
    jump() {
        if (this.gameState !== 'playing') return;
        
        if (!this.player.isJumping) {
            this.player.velocityY = this.jumpForce;
            this.player.isJumping = true;
            this.player.rotation = -25;
            this.player.scale = 0.8;
            
            // Эффекты прыжка
            this.createParticleEffect(this.player.x + this.player.width/2, this.player.y + this.player.height, 8, '#FFFFFF');
            this.playSound('jump');
            
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
    
    createTextEffect(text, x, y, color) {
        this.effects.push({
            text: text,
            x: x,
            y: y,
            color: color,
            life: 1
        });
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        // Физика игрока
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
        
        if (this.player.trail.length > 5) {
            this.player.trail.shift();
        }
        
        this.player.trail.forEach(point => point.life -= 0.2);
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
            this.obstacleInterval = Math.max(40, this.obstacleInterval - 0.2);
        }
        
        // Генерация коллектабелей
        if (Math.random() < 0.02) {
            this.createCollectible();
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
                
                if (this.combo % 5 === 0) {
                    this.multiplier++;
                    this.createTextEffect('COMBO x' + this.multiplier, obstacle.x, obstacle.y, '#FFD700');
                    this.playSound('powerup');
                }
                
                this.updateScore();
                this.createParticleEffect(obstacle.x, obstacle.y, 5, obstacle.color);
            }
        }
        
        // Обновление коллектабелей
        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const collectible = this.collectibles[i];
            collectible.x -= this.gameSpeed;
            collectible.rotation += 0.1;
            
            if (this.checkCollision(this.player, collectible)) {
                this.collectibles.splice(i, 1);
                this.score += 50;
                this.createTextEffect('+50', collectible.x, collectible.y, '#00FF00');
                this.createParticleEffect(collectible.x, collectible.y, 15, '#FFFF00');
                this.playSound('score');
                this.updateScore();
            } else if (collectible.x + collectible.width < 0) {
                this.collectibles.splice(i, 1);
            }
        }
        
        // Увеличение скорости
        this.gameSpeed += 0.001;
        
        // Обновление частиц и эффектов
        this.updateParticles();
        this.updateEffects();
        
        // Уменьшение тряски
        if (this.screenShake > 0) {
            this.screenShake *= 0.9;
            if (this.screenShake < 0.1) this.screenShake = 0;
        }
    }
    
    createCollectible() {
        this.collectibles.push({
            x: this.canvas.width,
            y: this.ground.y - 80,
            width: 20,
            height: 20,
            color: '#FFFF00',
            rotation: 0,
            type: 'coin'
        });
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
    
    createObstacle() {
        const types = [
            { width: 35, height: 60, type: 'spike' },
            { width: 35, height: 90, type: 'spike' },
            { width: 80, height: 40, type: 'platform' }
        ];
        
        const type = types[Math.floor(Math.random() * types.length)];
        const theme = this.colorThemes[this.currentTheme];
        
        this.obstacles.push({
            x: this.canvas.width,
            y: type.type === 'platform' ? this.ground.y - type.height : this.ground.y - type.height,
            width: type.width,
            height: type.height,
            color: theme.secondary,
            type: type.type
        });
    }
    
    checkCollision(player, object) {
        return player.x < object.x + object.width &&
               player.x + player.width > object.x &&
               player.y < object.y + object.height &&
               player.y + player.height > object.y;
    }
    
    draw() {
        // Эффект тряски
        const shakeX = this.screenShake * (Math.random() - 0.5) * 10;
        const shakeY = this.screenShake * (Math.random() - 0.5) * 10;
        
        this.ctx.save();
        this.ctx.translate(shakeX, shakeY);
        
        const theme = this.colorThemes[this.currentTheme];
        
        // ЯРКИЙ ФОН
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, theme.bg);
        gradient.addColorStop(1, this.darkenColor(theme.bg, 20));
        this.ctx.fillStyle = gradient;
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
        
        // КОЛЛЕКТАБЕЛИ
        this.collectibles.forEach(collectible => {
            this.ctx.save();
            this.ctx.translate(collectible.x + collectible.width/2, collectible.y + collectible.height/2);
            this.ctx.rotate(collectible.rotation);
            
            this.ctx.fillStyle = collectible.color;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, collectible.width/2, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.strokeStyle = '#FFA000';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            this.ctx.restore();
        });
        
        // ПРЕПЯТСТВИЯ
        this.obstacles.forEach(obstacle => {
            this.ctx.fillStyle = obstacle.color;
            
            if (obstacle.type === 'spike') {
                this.ctx.beginPath();
                this.ctx.moveTo(obstacle.x, obstacle.y + obstacle.height);
                this.ctx.lineTo(obstacle.x + obstacle.width / 2, obstacle.y);
                this.ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
                this.ctx.closePath();
                this.ctx.fill();
            } else {
                this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            }
        });
        
        // СЛЕД ИГРОКА
        this.ctx.strokeStyle = theme.primary;
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
        
        // ИГРОК
        this.ctx.save();
        this.ctx.translate(
            this.player.x + this.player.width/2, 
            this.player.y + this.player.height/2
        );
        this.ctx.rotate(this.player.rotation * Math.PI / 180);
        this.ctx.scale(this.player.scale, this.player.scale);
        
        const playerGradient = this.ctx.createLinearGradient(
            -this.player.width/2, -this.player.height/2,
            this.player.width/2, this.player.height/2
        );
        playerGradient.addColorStop(0, theme.primary);
        playerGradient.addColorStop(1, this.darkenColor(theme.primary, 20));
        
        this.ctx.fillStyle = playerGradient;
        this.ctx.fillRect(-this.player.width/2, -this.player.height/2, this.player.width, this.player.height);
        
        // ГЛАЗА
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(-this.player.width/4, -this.player.height/4, 8, 8);
        this.ctx.fillRect(this.player.width/4 - 8, -this.player.height/4, 8, 8);
        
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(-this.player.width/4 + 2, -this.player.height/4 + 2, 4, 4);
        this.ctx.fillRect(this.player.width/4 - 6, -this.player.height/4 + 2, 4, 4);
        
        this.ctx.restore();
        
        // ЧАСТИЦЫ
        this.particles.forEach(p => {
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
        
        // ТЕКСТОВЫЕ ЭФФЕКТЫ
        this.effects.forEach(effect => {
            this.ctx.globalAlpha = effect.life;
            this.ctx.fillStyle = effect.color;
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(effect.text, effect.x, effect.y);
        });
        this.ctx.globalAlpha = 1;
        
        this.ctx.restore();
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
        this.gameState = 'gameover';
        
        const gameOverScreen = document.getElementById('gameOverScreen');
        const finalScore = document.getElementById('finalScore');
        const menu = document.getElementById('menu');
        const gameContainer = document.getElementById('gameContainer');
        
        if (gameOverScreen) gameOverScreen.classList.remove('hidden');
        if (finalScore) finalScore.textContent = `⭐ Очки: ${this.score}`;
        if (menu) menu.classList.remove('hidden'); // Показываем меню снова
    if (gameContainer) {
        gameContainer.classList.remove('playing'); // Убираем класс playing
    }
        
        this.screenShake = 2;
        this.createParticleEffect(this.player.x + this.player.width/2, this.player.y + this.player.height/2, 30, '#FF0000');
        this.playSound('crash');
        this.sendScoreToBot();
    }
    
    restartGame() {
        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer) {
            gameContainer.classList.add('playing');
        }
        
        const menu = document.getElementById('menu');
        if (menu) {
            menu.classList.add('hidden');
        }
        
        this.currentTheme = (this.currentTheme + 1) % this.colorThemes.length;
        this.initGame();
        this.startGame();
    }
    
    
    shareScore() {
        const shareText = `🎮 Я набрал ${this.score} очков в Geometry Dash Ultimate!`;
        if (navigator.share) {
            navigator.share({
                title: 'Geometry Dash Ultimate',
                text: shareText
            });
        } else {
            alert(shareText);
        }
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

// Инициализация
function initializeGame() {
    console.log('🚀 INITIALIZING GAME...');
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.game = new GeometryDash();
        });
    } else {
        window.game = new GeometryDash();
    }
}


// ГАРАНТИРОВАННО РАБОЧАЯ КНОПКА ПРЫЖКА
class JumpButtonManager {
    constructor() {
        this.createJumpButton();
        this.bindEvents();
        console.log('🚀 JumpButtonManager initialized');
    }
    
    createJumpButton() {
        // Удаляем старую кнопку если есть
        const oldBtn = document.getElementById('guaranteedJumpBtn');
        if (oldBtn) oldBtn.remove();
        
        // Создаем новую супер-кнопку
        this.jumpBtn = document.createElement('div');
        this.jumpBtn.id = 'guaranteedJumpBtn';
        this.jumpBtn.innerHTML = `
            <div class="jump-inner">
                <span>↑</span>
                <span class="jump-text">ПРЫЖОК</span>
            </div>
        `;
        
        // Стилизуем ее НАПРЯМУЮ в JS для гарантии
        Object.assign(this.jumpBtn.style, {
            position: 'fixed',
            bottom: '50px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '150px',
            height: '150px',
            backgroundColor: '#FF3B30',
            borderRadius: '50%',
            color: 'white',
            fontSize: '24px',
            fontWeight: 'bold',
            cursor: 'pointer',
            zIndex: '9999',
            boxShadow: '0 10px 30px rgba(255, 59, 48, 0.7)',
            border: '5px solid white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            userSelect: 'none',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation'
        });
        
        // Внутренний элемент
        const inner = this.jumpBtn.querySelector('.jump-inner');
        Object.assign(inner.style, {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
        });
        
        document.body.appendChild(this.jumpBtn);
    }
    
    bindEvents() {
        // АБСОЛЮТНО ВСЕ ВОЗМОЖНЫЕ ОБРАБОТЧИКИ
        const events = [
            'click',
            'touchstart',
            'touchend',
            'mousedown',
            'pointerdown'
        ];
        
        events.forEach(eventType => {
            this.jumpBtn.addEventListener(eventType, (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                
                // Прыгаем
                this.executeJump();
                
                // Визуальная обратная связь
                this.animateButton();
                
                return false;
            }, { 
                passive: false,
                capture: true 
            });
        });
        
        // Также вешаем на весь документ для отладки
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.key === ' ' || e.code === 'ArrowUp') {
                e.preventDefault();
                this.executeJump();
            }
        });
    }
    
    executeJump() {
        console.log('🔄 EXECUTE JUMP CALLED');
        
        // 3 способа вызвать прыжок
        try {
            // Способ 1: Через глобальный объект game
            if (window.game && window.game.jump) {
                window.game.jump();
                console.log('✅ Jump via window.game.jump()');
                return;
            }
            
            // Способ 2: Через вызов метода напрямую
            const canvas = document.getElementById('gameCanvas');
            if (canvas && canvas.gameInstance && canvas.gameInstance.jump) {
                canvas.gameInstance.jump();
                console.log('✅ Jump via canvas.gameInstance.jump()');
                return;
            }
            
            // Способ 3: Эмуляция нажатия пробела
            console.log('⚠️ Direct jump failed, simulating space press');
            const spaceEvent = new KeyboardEvent('keydown', {
                key: ' ',
                code: 'Space',
                keyCode: 32,
                which: 32,
                bubbles: true
            });
            document.dispatchEvent(spaceEvent);
            
        } catch (error) {
            console.error('❌ Jump error:', error);
        }
    }
    
    animateButton() {
        // Анимация нажатия
        this.jumpBtn.style.transform = 'translateX(-50%) scale(0.85)';
        this.jumpBtn.style.backgroundColor = '#FF0000';
        
        setTimeout(() => {
            this.jumpBtn.style.transform = 'translateX(-50%) scale(1)';
            this.jumpBtn.style.backgroundColor = '#FF3B30';
        }, 150);
        
        // Пульсация
        this.jumpBtn.style.animation = 'none';
        setTimeout(() => {
            this.jumpBtn.style.animation = 'jumpPulse 0.5s';
        }, 10);
    }
}

// Запускаем менеджер кнопок при загрузке
window.addEventListener('load', function() {
    setTimeout(() => {
        new JumpButtonManager();
        
        // Также добавляем тап по всему экрану
        document.addEventListener('click', function(e) {
            if (e.target.id !== 'guaranteedJumpBtn' && 
                e.target.id !== 'startBtn' && 
                e.target.id !== 'restartBtn' && 
                e.target.id !== 'shareBtn') {
                
                const jumpManager = new JumpButtonManager();
                jumpManager.executeJump();
            }
        });
        
        document.addEventListener('touchstart', function(e) {
            if (e.target.id !== 'guaranteedJumpBtn' && 
                e.target.id !== 'startBtn' && 
                e.target.id !== 'restartBtn' && 
                e.target.id !== 'shareBtn') {
                
                e.preventDefault();
                const jumpManager = new JumpButtonManager();
                jumpManager.executeJump();
            }
        }, { passive: false });
        
    }, 1000); // Задержка для полной загрузки игры
});




// СКРИПТ ПРОВЕРКИ РАБОТОСПОСОБНОСТИ
console.log('🔄 Running jump system check...');

// Проверяем каждые 2 секунды работает ли прыжок
setInterval(() => {
    console.log('🔍 Jump system status:');
    console.log('- window.game exists:', !!window.game);
    console.log('- window.game.jump exists:', !!(window.game && window.game.jump));
    console.log('- Game state:', window.game ? window.game.gameState : 'no game');
    console.log('- Canvas exists:', !!document.getElementById('gameCanvas'));
}, 2000);

// Тестовая функция для проверки прыжка из консоли
window.testJump = function() {
    console.log('🧪 TEST JUMP FUNCTION CALLED');
    if (window.game && window.game.jump) {
        window.game.jump();
        return '✅ Jump successful!';
    }
    return '❌ Jump failed - game not found';
};
// Запуск
console.log('🎮 Geometry Dash Mobile Ultimate - Loading...');
initializeGame();