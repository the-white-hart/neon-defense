// Import managers
import AudioManager from './managers/AudioManager.js';
import HUDRenderer from './managers/HUDRenderer.js';
import GameState from './managers/GameState.js';
import MissileManager from './managers/MissileManager.js';
import CityManager from './managers/CityManager.js';

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    
    const canvas = document.getElementById('gameCanvas');
    const menu = document.getElementById('menu');
    const startButton = document.getElementById('start-game');
    const settingsButton = document.getElementById('settings-button');
    const rulesButton = document.getElementById('rules-button');
    const rulesPopup = document.getElementById('rules-popup');
    const closeRulesButton = rulesPopup.querySelector('.close-button');
    
    let gameInstance = null;

    // Rules popup functionality
    rulesButton.addEventListener('click', () => {
        rulesPopup.classList.remove('hidden');
    });

    closeRulesButton.addEventListener('click', () => {
        rulesPopup.classList.add('hidden');
    });

    rulesPopup.addEventListener('click', (e) => {
        if (e.target === rulesPopup) {
            rulesPopup.classList.add('hidden');
        }
    });

    // Start game button functionality
    startButton.addEventListener('click', () => {
        console.log('Start button clicked');
        if (gameInstance) {
            gameInstance.stop();
        }
        
        menu.style.display = 'none';
        gameInstance = new Game(canvas);
        gameInstance.start();
    });
    
    // Settings button functionality
    settingsButton.addEventListener('click', () => {
        console.log('Settings button clicked');
        const existingMenu = document.querySelector('.settings-menu');
        if (existingMenu) {
            existingMenu.remove();
        }
        
        const settingsMenu = document.createElement('div');
        settingsMenu.className = 'settings-menu';
        settingsMenu.innerHTML = `
            <h2>Settings</h2>
            <div class="setting">
                <label>Music Volume</label>
                <input type="range" min="0" max="100" value="50" 
                       onchange="gameInstance.audioManager.setMusicVolume(this.value / 100)">
            </div>
            <div class="setting">
                <label>SFX Volume</label>
                <input type="range" min="0" max="100" value="50"
                       onchange="gameInstance.audioManager.setSFXVolume(this.value / 100)">
            </div>
            <button onclick="this.parentElement.remove()">Close</button>
        `;
        document.body.appendChild(settingsMenu);
    });

    class Game {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.setupCanvas();
            
            // Initialize managers
            this.gameState = new GameState();
            this.audioManager = new AudioManager();
            this.hudRenderer = new HUDRenderer(this.ctx);
            this.cityManager = new CityManager(this.ctx);
            this.missileManager = new MissileManager(this.ctx, this.gameState);
            
            // Initialize game state
            this.lastTime = performance.now();
            this.running = false;
            
            // Initialize cannon
            this.cannon = {
                x: this.canvas.width / 2,
                y: this.canvas.height - 30,
                angle: -Math.PI / 2
            };
            
            // Load background images
            this.backgroundImage = new Image();
            this.backgroundImage.src = '/assets/images/bg.jpg';
            
            this.menuBackgroundImage = new Image();
            this.menuBackgroundImage.src = '/assets/images/neon_city.webp';
        }

        setupCanvas() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            
            window.addEventListener('resize', () => {
                this.canvas.width = window.innerWidth;
                this.canvas.height = window.innerHeight;
            });
        }

        start() {
            this.running = true;
            this.gameState.running = true;
            this.audioManager.startMusic();
            this.gameLoop(performance.now());
            
            // Add event listeners
            this.canvas.addEventListener('click', this.handleClick.bind(this));
            this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        }

        stop() {
            this.running = false;
            this.audioManager.stopMusic();
            
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
            
            // Remove event listeners
            this.canvas.removeEventListener('click', this.handleClick.bind(this));
            this.canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this));
        }

        gameLoop(currentTime) {
            if (!this.running) return;

            const deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;

            this.update(deltaTime, currentTime);
            this.render();

            this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
        }

        update(deltaTime, currentTime) {
            if (!this.gameState.running) return;

            // Update HUD warning flash
            this.hudRenderer.updateWarningFlash(currentTime, this.gameState);

            // Update missiles and check collisions
            this.missileManager.update(deltaTime);
            this.missileManager.checkCollisions(this.cityManager.cities);

            // Spawn new enemy missiles
            if (currentTime >= this.gameState.nextMissileTime && 
                this.gameState.remainingEnemyMissiles > 0 && 
                !this.gameState.showingWaveMessage) {
                this.missileManager.spawnEnemyMissile(this.cityManager.cities);
                this.gameState.remainingEnemyMissiles--;
                this.gameState.nextMissileTime = currentTime + this.gameState.missileInterval;
            }

            // Check if wave is complete
            if (this.gameState.remainingEnemyMissiles === 0 && 
                this.gameState.enemyMissiles.length === 0) {
                this.gameState.completeWave();
                
                // Deploy reserve cities if available
                while (this.gameState.reserveCities > 0 && 
                       this.cityManager.getAliveCityCount() < 6) {
                    this.cityManager.deployReserveCity();
                    this.gameState.reserveCities--;
                }
            }

            // Check if game is over
            if (this.cityManager.getAliveCityCount() === 0 && 
                this.gameState.reserveCities === 0) {
                this.endGame();
            }

            // Update wave message
            if (this.gameState.showingWaveMessage && 
                currentTime - this.gameState.waveMessageStartTime > 3000) {
                this.gameState.showingWaveMessage = false;
            }
        }

        render() {
            // Clear the canvas
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Draw background
            if (this.backgroundImage && this.backgroundImage.complete) {
                this.ctx.drawImage(this.backgroundImage, 0, 0, this.canvas.width, this.canvas.height);
            }

            // If showing wave message, only draw that
            if (this.gameState.showingWaveMessage) {
                this.hudRenderer.renderWaveMessage(this.gameState);
                return;
            }

            // Draw cities
            this.cityManager.render();

            // Draw cannon
            this.ctx.save();
            this.ctx.translate(this.cannon.x, this.cannon.y);
            this.ctx.rotate(this.cannon.angle);
            
            this.ctx.beginPath();
            this.ctx.fillStyle = '#0ff';
            this.ctx.arc(0, 0, 20, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.beginPath();
            this.ctx.lineWidth = 8;
            this.ctx.strokeStyle = '#0ff';
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(40, 0);
            this.ctx.stroke();
            
            this.ctx.restore();

            // Draw missiles and explosions
            this.missileManager.render();

            // Draw HUD
            this.hudRenderer.render(this.gameState);
        }

        handleClick(event) {
            if (!this.running) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const targetX = event.clientX - rect.left;
            const targetY = event.clientY - rect.top;
            
            this.missileManager.firePlayerMissile(
                targetX, 
                targetY, 
                this.cannon.x, 
                this.cannon.y
            );
            
            if (this.gameState.missiles > 0) {
                this.audioManager.playSound('laser');
            }
        }

        handleMouseMove(event) {
            if (!this.running) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;
            
            this.cannon.angle = Math.atan2(
                mouseY - this.cannon.y,
                mouseX - this.cannon.x
            );
        }

        endGame() {
            this.stop();
            this.showGameOver();
        }

        showGameOver() {
            const overlay = document.createElement('div');
            overlay.className = 'game-over-overlay';
            
            const content = document.createElement('div');
            content.className = 'game-over-content';
            
            const title = document.createElement('h1');
            title.textContent = 'THE END';
            
            const stats = document.createElement('div');
            stats.className = 'stats';
            stats.innerHTML = `
                Final Score: ${Math.floor(this.gameState.score)}<br>
                Waves Survived: ${this.gameState.wave}<br>
                Accuracy: ${this.gameState.getAccuracy()}%
            `;
            
            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.placeholder = 'Enter your name';
            nameInput.maxLength = 20;
            
            const submitButton = document.createElement('button');
            submitButton.textContent = 'Submit Score';
            submitButton.disabled = true;
            
            const menuButton = document.createElement('button');
            menuButton.textContent = 'Return to Menu';
            menuButton.disabled = true;
            
            const highScoresDiv = document.createElement('div');
            highScoresDiv.className = 'high-scores';
            
            // Enable submit button when name is entered
            nameInput.addEventListener('input', () => {
                submitButton.disabled = !nameInput.value.trim();
            });
            
            submitButton.addEventListener('click', () => {
                const name = nameInput.value.trim();
                if (name) {
                    const position = this.gameState.saveHighScore(name);
                    
                    submitButton.disabled = true;
                    nameInput.disabled = true;
                    menuButton.disabled = false;
                    menuButton.focus();
                }
            });
            
            menuButton.addEventListener('click', () => {
                overlay.remove();
                this.showMenu();
            });
            
            content.appendChild(title);
            content.appendChild(stats);
            content.appendChild(nameInput);
            content.appendChild(submitButton);
            content.appendChild(highScoresDiv);
            content.appendChild(menuButton);
            
            overlay.appendChild(content);
            document.body.appendChild(overlay);
            
            setTimeout(() => nameInput.focus(), 100);
        }

        showMenu() {
            const menuElement = document.getElementById('menu');
            if (menuElement) {
                menuElement.style.display = 'block';
                const startButton = menuElement.querySelector('button');
                if (startButton) {
                    startButton.focus();
                }
            }
            
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            if (this.menuBackgroundImage && this.menuBackgroundImage.complete) {
                this.ctx.drawImage(this.menuBackgroundImage, 0, 0, this.canvas.width, this.canvas.height);
            }
            
            this.gameState.reset();
            this.cityManager.reset();
        }
    }

    // Show menu initially
    menu.style.display = 'block';
});
