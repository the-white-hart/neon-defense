class GameState {
    constructor() {
        this.reset();
    }

    reset() {
        // Stats tracking
        this.totalShots = 0;
        this.missilesDestroyed = 0;
        
        // Missile system
        this.maxMissiles = 40;
        this.missiles = this.maxMissiles;
        
        // Wave and scoring system
        this.wave = 1;
        this.score = 0;
        this.reserveCities = 0;
        
        // Enemy wave management
        this.enemyMissiles = [];
        this.baseSpeed = 100;
        this.enemyMissilesPerWave = [
            10,  // Wave 1
            12,  // Wave 2
            15,  // Wave 3
            18,  // Wave 4
            20,  // Wave 5
            25,  // Wave 6
            30,  // Wave 7
            35,  // Wave 8
            40   // Wave 9
        ];
        
        // Initialize wave
        this.remainingEnemyMissiles = this.getEnemyMissileCount();
        this.missileInterval = 2000;
        
        // Wave message and timing
        this.showingWaveMessage = true;
        this.waveMessageStartTime = performance.now();
        this.nextMissileTime = this.waveMessageStartTime + 3000;

        // Game state
        this.running = false;
        this.gameOver = false;
        this.victory = false;
    }

    getEnemyMissileCount() {
        return this.enemyMissilesPerWave[Math.min(this.wave - 1, this.enemyMissilesPerWave.length - 1)];
    }

    completeWave() {
        this.wave++;
        
        // Check for victory after wave 9
        if (this.wave > 9) {
            this.victory = true;
            return;
        }
        
        // Reset for next wave
        this.missiles = this.maxMissiles;
        this.remainingEnemyMissiles = this.getEnemyMissileCount();
        // Decrease missile spawn interval each wave
        this.missileInterval = Math.max(500, 2000 - (this.wave - 1) * 200);
        this.enemyMissiles = [];
        
        // Show wave message
        this.showingWaveMessage = true;
        this.waveMessageStartTime = performance.now();
        this.nextMissileTime = this.waveMessageStartTime + 3000;

        console.log('Wave completed:', {
            newWave: this.wave,
            remainingMissiles: this.remainingEnemyMissiles,
            interval: this.missileInterval
        });
    }

    getAccuracy() {
        return this.totalShots > 0 ? Math.round((this.missilesDestroyed / this.totalShots) * 100) : 0;
    }

    getHighScores() {
        return JSON.parse(localStorage.getItem('neonDefenseHighScores')) || [];
    }

    saveHighScore(name) {
        const highScores = this.getHighScores();
        const newScore = {
            name: name,
            score: Math.floor(this.score),
            wave: this.wave,
            accuracy: this.getAccuracy()
        };
        
        highScores.push(newScore);
        highScores.sort((a, b) => b.score - a.score);
        highScores.splice(10); // Keep only top 10
        
        localStorage.setItem('neonDefenseHighScores', JSON.stringify(highScores));
        return highScores.findIndex(score => score === newScore);
    }
}

export default GameState;
