// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    
    const canvas = document.getElementById('gameCanvas');
    const startButton = document.getElementById('start-game');
    const settingsButton = document.getElementById('settings-button');
    const closeSettingsButton = document.getElementById('closeSettings');
    const settingsMenu = document.querySelector('.settings-menu');
    const musicVolumeSlider = document.getElementById('musicVolume');
    const sfxVolumeSlider = document.getElementById('sfxVolume');
    
    let gameInstance = null;

    class Game {
        constructor(canvas) {
            console.log('Game constructor called');
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.setupCanvas();
            this.init();
            this.lastTime = performance.now();
            this.running = false;
            
            // Stats tracking
            this.totalShots = 0;
            this.missilesDestroyed = 0;
            
            // Missile system
            this.maxMissiles = 40; // Increased to 40 missiles per level
            this.missiles = this.maxMissiles;
            
            // Wave and scoring system
            this.wave = 1;
            this.score = 0;
            this.scoreMultiplier = 1;
            this.reserveCities = 0;
            this.nextBonusCityScore = 10000;
            this.bonusCityInterval = 10000;
            
            // Enemy wave management
            this.enemyMissiles = [];
            this.baseSpeed = 100; // Base speed for wave 1
            this.enemyMissilesPerWave = [
                10,  // Wave 1
                12,  // Wave 2
                15,  // Wave 3
                18,  // Wave 4
                20,  // Wave 5
                25,  // Wave 6
                30,  // Wave 7
                35,  // Wave 8
                40,  // Wave 9
                45   // Wave 10+
            ];
            this.remainingEnemyMissiles = this.getEnemyMissileCount();
            this.missileInterval = 2000;
            this.nextMissileTime = performance.now();
            
            // Explosion tracking
            this.explosions = [];
            this.playerMissiles = [];
            
            // Wave message
            this.showingWaveMessage = false;
            this.waveMessageStartTime = 0;
            
            // High scores
            this.highScores = this.loadHighScores();
        }

        loadHighScores() {
            const scores = localStorage.getItem('neonDefenseHighScores');
            return scores ? JSON.parse(scores) : [];
        }

        saveHighScore(name, score, accuracy) {
            const newScore = { name, score, accuracy, wave: this.wave };
            this.highScores.push(newScore);
            this.highScores.sort((a, b) => b.score - a.score);
            this.highScores = this.highScores.slice(0, 10); // Keep top 10
            localStorage.setItem('neonDefenseHighScores', JSON.stringify(this.highScores));
            
            // Update the high score table in the UI
            const table = document.querySelector('.high-scores table');
            if (table) {
                const tbody = table.querySelector('tbody') || table;
                tbody.innerHTML = `
                    <tr><th>Name</th><th>Score</th><th>Wave</th><th>Accuracy</th></tr>
                    ${this.highScores.map(score => 
                        `<tr class="${score === newScore ? 'new-score' : ''}">
                            <td>${score.name}</td>
                            <td>${score.score}</td>
                            <td>${score.wave}</td>
                            <td>${score.accuracy}%</td>
                        </tr>`
                    ).join('')}
                `;
            }
        }

        getAccuracy() {
            return this.totalShots > 0 ? Math.round((this.missilesDestroyed / this.totalShots) * 100) : 0;
        }

        setupCanvas() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            window.addEventListener('resize', () => {
                this.canvas.width = window.innerWidth;
                this.canvas.height = window.innerHeight;
            });
        }

        init() {
            // Initialize cities
            this.cities = [];
            this.initializeCities();
            
            // Setup event listeners
            this.canvas.addEventListener('click', this.handleClick.bind(this));
            this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
            
            // Initialize cannon
            this.cannon = {
                x: this.canvas.width / 2,
                y: this.canvas.height - 20,
                angle: 0
            };
            
            // Start background music
            audioManager.startMusic();
        }

        start() {
            if (!this.running) {
                this.running = true;
                requestAnimationFrame(this.gameLoop.bind(this));
                
                const menu = document.getElementById('menu');
                if (menu) menu.style.display = 'none';
            }
        }

        stop() {
            this.running = false;
            audioManager.stopMusic();
        }

        gameLoop(currentTime) {
            if (!this.running) return;

            const deltaTime = (currentTime - this.lastTime) / 1000;
            this.lastTime = currentTime;

            this.update(deltaTime, currentTime);
            this.render();

            requestAnimationFrame(this.gameLoop.bind(this));
        }

        update(deltaTime, currentTime) {
            // If showing wave message, check if it's time to hide it
            if (this.showingWaveMessage) {
                if (currentTime - this.waveMessageStartTime >= 3000) {
                    this.showingWaveMessage = false;
                }
                return; // Pause game updates while showing message
            }

            // Check for level completion - when all missiles are gone AND none are in flight
            if (this.remainingEnemyMissiles === 0 && this.enemyMissiles.length === 0) {
                this.completeLevel();
                return;
            }

            // Check for game over
            if (this.isGameOver()) {
                this.endGame();
                return;
            }

            // Spawn new enemy missiles
            if (this.remainingEnemyMissiles > 0 && currentTime >= this.nextMissileTime) {
                this.spawnMissile();
                this.remainingEnemyMissiles--;
                this.nextMissileTime = currentTime + this.missileInterval;
            }

            // Update player missiles
            for (let i = this.playerMissiles.length - 1; i >= 0; i--) {
                const missile = this.playerMissiles[i];
                missile.x += missile.vx * deltaTime;
                missile.y += missile.vy * deltaTime;
                
                const dx = missile.targetX - missile.x;
                const dy = missile.targetY - missile.y;
                const distanceToTarget = Math.sqrt(dx * dx + dy * dy);
                
                if (distanceToTarget < 5) {
                    this.explosions.push({
                        x: missile.targetX,
                        y: missile.targetY,
                        radius: 0,
                        maxRadius: 100,
                        speed: 200
                    });
                    audioManager.playSound('explosion');
                    this.playerMissiles.splice(i, 1);
                }
            }

            // Update enemy missiles
            for (let i = this.enemyMissiles.length - 1; i >= 0; i--) {
                const missile = this.enemyMissiles[i];
                missile.x += missile.vx * deltaTime;
                missile.y += missile.vy * deltaTime;

                // Check for collisions with explosions
                let destroyed = false;
                for (const explosion of this.explosions) {
                    const dx = missile.x - explosion.x;
                    const dy = missile.y - explosion.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < explosion.radius) {
                        this.score += 25 * this.scoreMultiplier;
                        this.enemyMissiles.splice(i, 1);
                        this.missilesDestroyed++;
                        destroyed = true;
                        
                        // Check for bonus city
                        if (this.score >= this.nextBonusCityScore) {
                            this.reserveCities++;
                            audioManager.playSound('cityDestroyed');
                            this.nextBonusCityScore += this.bonusCityInterval;
                        }
                        break;
                    }
                }
                
                if (destroyed) continue;

                // Check for collisions with cities or ground
                if (missile.y >= this.canvas.height - 50) {
                    let hitCity = false;
                    for (const city of this.cities) {
                        if (!city.destroyed) {
                            const dx = missile.x - city.x;
                            const dy = missile.y - city.y;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            if (distance < 30) {
                                // Damage the city
                                city.health -= 50;
                                if (city.health <= 0) {
                                    city.destroyed = true;
                                    audioManager.playSound('cityDestroyed');
                                } else {
                                    city.damaged = true;
                                    audioManager.playSound('cityDamaged'); // You'll need to add this sound
                                }
                                hitCity = true;
                                break;
                            }
                        }
                    }
                    // Remove missile whether it hit a city or just hit the ground
                    this.enemyMissiles.splice(i, 1);
                }
            }

            // Update explosions
            for (let i = this.explosions.length - 1; i >= 0; i--) {
                const explosion = this.explosions[i];
                explosion.radius += explosion.speed * deltaTime;
                if (explosion.radius > explosion.maxRadius) {
                    this.explosions.splice(i, 1);
                }
            }
        }

        completeLevel() {
            // Calculate bonus points
            const remainingMissileBonus = this.missiles * 5 * this.scoreMultiplier;
            const remainingCityBonus = this.getAliveCityCount() * 100 * this.scoreMultiplier;
            this.score += remainingMissileBonus + remainingCityBonus;

            // Deploy reserve cities if needed
            while (this.reserveCities > 0 && this.getAliveCityCount() < 6) {
                this.deployReserveCity();
                this.reserveCities--;
            }

            // Update difficulty
            this.wave++;
            if (this.wave % 2 === 0 && this.scoreMultiplier < 6) {
                this.scoreMultiplier++;
            }

            // Reset for next level and replenish missiles
            this.missiles = this.maxMissiles;
            this.remainingEnemyMissiles = this.getEnemyMissileCount();
            this.missileInterval = Math.max(500, 2000 - (this.wave - 1) * 100);
            
            // Show wave message and pause before starting next wave
            this.showingWaveMessage = true;
            this.waveMessageStartTime = performance.now();
            this.nextMissileTime = this.waveMessageStartTime + 3000; // Start spawning 3 seconds after message
        }

        deployReserveCity() {
            for (let i = 0; i < this.cities.length; i++) {
                if (this.cities[i].destroyed) {
                    this.cities[i].destroyed = false;
                    this.cities[i].health = 100;
                    this.cities[i].damaged = false;
                    break;
                }
            }
        }

        getAliveCityCount() {
            return this.cities.filter(city => !city.destroyed).length;
        }

        isGameOver() {
            return this.getAliveCityCount() === 0 && this.reserveCities === 0;
        }

        endGame() {
            this.stop();
            
            // Create game over overlay
            const overlay = document.createElement('div');
            overlay.className = 'game-over-overlay';
            overlay.innerHTML = `
                <div class="game-over-content">
                    <h1>THE END</h1>
                    <div class="stats">
                        <p>Final Score: ${this.score}</p>
                        <p>Waves Survived: ${this.wave}</p>
                        <p>Accuracy: ${this.getAccuracy()}%</p>
                    </div>
                    <div class="high-score-entry">
                        <input type="text" id="playerName" placeholder="Enter your name" maxlength="10">
                        <button id="submitScore">Submit Score</button>
                    </div>
                    <div class="high-scores">
                        <h2>High Scores</h2>
                        <table>
                            <tr><th>Name</th><th>Score</th><th>Wave</th><th>Accuracy</th></tr>
                            ${this.highScores.map(score => 
                                `<tr>
                                    <td>${score.name}</td>
                                    <td>${score.score}</td>
                                    <td>${score.wave}</td>
                                    <td>${score.accuracy}%</td>
                                </tr>`
                            ).join('')}
                        </table>
                    </div>
                    <button id="returnToMenu">Return to Menu</button>
                </div>
            `;
            document.body.appendChild(overlay);
            
            // Add event listeners
            const submitButton = overlay.querySelector('#submitScore');
            const nameInput = overlay.querySelector('#playerName');
            const menuButton = overlay.querySelector('#returnToMenu');
            
            submitButton.addEventListener('click', () => {
                const name = nameInput.value.trim() || 'Anonymous';
                this.saveHighScore(name, this.score, this.getAccuracy());
                submitButton.disabled = true;
                nameInput.disabled = true;
            });
            
            menuButton.addEventListener('click', () => {
                overlay.remove();
                const menu = document.getElementById('menu');
                if (menu) menu.style.display = 'block';
            });
        }

        render() {
            // Clear the canvas
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // Draw wave message if showing
            if (this.showingWaveMessage) {
                this.ctx.save();
                this.ctx.fillStyle = '#0ff';
                this.ctx.font = 'bold 72px Orbitron';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(`WAVE ${this.wave}`, this.canvas.width / 2, this.canvas.height / 2);
                
                // Show missile count
                this.ctx.font = 'bold 36px Orbitron';
                this.ctx.fillText(`${this.remainingEnemyMissiles} MISSILES INCOMING`, 
                    this.canvas.width / 2, this.canvas.height / 2 + 60);
                this.ctx.restore();
                
                // Don't draw the rest of the game while showing message
                return;
            }

            // Draw cities
            for (const city of this.cities) {
                if (!city.destroyed) {
                    // Draw city base
                    this.ctx.beginPath();
                    this.ctx.fillStyle = '#0ff';
                    this.ctx.fillRect(city.x - 15, city.y - 15, 30, 30);
                    
                    // Draw city dome
                    this.ctx.strokeStyle = '#0ff';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.arc(city.x, city.y - 20, 15, Math.PI, 0);
                    this.ctx.stroke();

                    // If damaged, draw cracks
                    if (city.damaged) {
                        this.ctx.strokeStyle = '#f00';
                        this.ctx.beginPath();
                        // Draw multiple cracks
                        for (let i = 0; i < 3; i++) {
                            const startX = city.x - 10 + (i * 10);
                            this.ctx.moveTo(startX, city.y - 25);
                            this.ctx.lineTo(startX + 5, city.y - 5);
                        }
                        this.ctx.stroke();
                    }

                    // Draw health bar
                    const healthBarWidth = 30;
                    const healthBarHeight = 4;
                    const healthBarY = city.y - 35;
                    
                    // Draw background (red portion)
                    this.ctx.fillStyle = '#f00';
                    this.ctx.fillRect(
                        city.x - healthBarWidth/2,
                        healthBarY,
                        healthBarWidth,
                        healthBarHeight
                    );
                    
                    // Draw remaining health (green portion)
                    this.ctx.fillStyle = '#0f0';
                    this.ctx.fillRect(
                        city.x - healthBarWidth/2,
                        healthBarY,
                        (city.health/100) * healthBarWidth,
                        healthBarHeight
                    );
                }
            }

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

            // Draw player missiles
            for (const missile of this.playerMissiles) {
                this.ctx.beginPath();
                this.ctx.strokeStyle = '#0ff';
                this.ctx.lineWidth = 2;
                this.ctx.moveTo(missile.startX, missile.startY);
                this.ctx.lineTo(missile.x, missile.y);
                this.ctx.stroke();
            }

            // Draw enemy missiles with shorter trails
            for (const missile of this.enemyMissiles) {
                this.ctx.beginPath();
                this.ctx.strokeStyle = '#f0f';
                this.ctx.lineWidth = 2;
                this.ctx.moveTo(missile.x, missile.y);
                // Shorter trail length (reduced from 10 to 5)
                this.ctx.lineTo(
                    missile.x - missile.vx * 5,
                    missile.y - missile.vy * 5
                );
                this.ctx.stroke();
            }

            // Draw explosions
            for (const explosion of this.explosions) {
                this.ctx.beginPath();
                this.ctx.strokeStyle = '#0ff';
                this.ctx.lineWidth = 2;
                this.ctx.arc(
                    explosion.x,
                    explosion.y,
                    explosion.radius,
                    0,
                    Math.PI * 2
                );
                this.ctx.stroke();
            }

            // Draw HUD
            this.ctx.fillStyle = '#0ff';
            this.ctx.font = '20px Orbitron';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`Score: ${Math.floor(this.score)}`, 20, 30);
            this.ctx.fillText(`Missiles: ${this.missiles}`, 20, 60);
            this.ctx.fillText(`Wave: ${this.wave}`, 20, 90);
            this.ctx.fillText(`Multiplier: ${this.scoreMultiplier}x`, 20, 120);
            this.ctx.fillText(`Reserve Cities: ${this.reserveCities}`, 20, 150);
        }

        getEnemyMissileCount() {
            return this.enemyMissilesPerWave[Math.min(this.wave - 1, this.enemyMissilesPerWave.length - 1)];
        }

        spawnMissile() {
            const startX = Math.random() * this.canvas.width;
            
            // Get list of surviving cities
            const survivingCities = this.cities.filter(city => !city.destroyed);
            if (survivingCities.length === 0) return;
            
            // If some cities are destroyed, target remaining ones more frequently
            let targetCity;
            if (survivingCities.length < this.cities.length) {
                // 80% chance to target surviving cities when some are destroyed
                if (Math.random() < 0.8) {
                    targetCity = survivingCities[Math.floor(Math.random() * survivingCities.length)];
                } else {
                    targetCity = this.cities[Math.floor(Math.random() * this.cities.length)];
                }
            } else {
                // All cities alive, target randomly
                targetCity = this.cities[Math.floor(Math.random() * this.cities.length)];
            }
            
            if (!targetCity) return;
            
            const angle = Math.atan2(targetCity.y - 0, targetCity.x - startX);
            const speed = this.baseSpeed * (1 + (this.wave - 1) * 0.2); // 20% faster each wave
            
            this.enemyMissiles.push({
                x: startX,
                y: 0,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed
            });
        }

        handleClick(event) {
            if (this.missiles > 0) {
                const rect = this.canvas.getBoundingClientRect();
                const targetX = event.clientX - rect.left;
                const targetY = event.clientY - rect.top;
                
                const angle = Math.atan2(targetY - this.cannon.y, targetX - this.cannon.x);
                const speed = 400;
                
                this.playerMissiles.push({
                    x: this.cannon.x,
                    y: this.cannon.y,
                    startX: this.cannon.x,
                    startY: this.cannon.y,
                    targetX: targetX,
                    targetY: targetY,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed
                });
                
                audioManager.playSound('shoot');
                this.missiles--;
                this.totalShots++;
            }
        }

        handleMouseMove(event) {
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            this.cannon.angle = Math.atan2(y - this.cannon.y, x - this.cannon.x);
        }

        initializeCities() {
            const citySpacing = this.canvas.width / 7;
            for (let i = 0; i < 6; i++) {
                this.cities.push({
                    x: citySpacing * (i + 1),
                    y: this.canvas.height - 50,
                    destroyed: false,
                    health: 100, // Full health
                    damaged: false // Track damage state
                });
            }
        }
    }

    function initializeGame() {
        console.log('Initializing game setup');
        
        const menu = document.getElementById('menu');
        const startButton = document.getElementById('start-game');
        const settingsButton = document.getElementById('settings-button');
        const canvas = document.getElementById('gameCanvas');
        
        if (!menu || !startButton || !settingsButton || !canvas) {
            console.error('Required elements not found:', {
                menu: !!menu,
                startButton: !!startButton,
                settingsButton: !!settingsButton,
                canvas: !!canvas
            });
            return;
        }
        
        menu.style.display = 'block';
        
        startButton.addEventListener('click', () => {
            console.log('Start button clicked');
            if (gameInstance) {
                gameInstance.stop();
            }
            
            menu.style.display = 'none';
            gameInstance = new Game(canvas);
            gameInstance.start();
        });
        
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
                           onchange="audioManager.setMusicVolume(this.value / 100)">
                </div>
                <div class="setting">
                    <label>SFX Volume</label>
                    <input type="range" min="0" max="100" value="50"
                           onchange="audioManager.setSFXVolume(this.value / 100)">
                </div>
                <button onclick="this.parentElement.remove()">Close</button>
            `;
            document.body.appendChild(settingsMenu);
        });
    }

    // Initialize only once when the DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeGame);
    } else {
        initializeGame();
    }
});
