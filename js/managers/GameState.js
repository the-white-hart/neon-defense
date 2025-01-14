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
        this.scoreMultiplier = 1;
        this.reserveCities = 0;
        this.nextBonusCityScore = 10000;
        this.bonusCityInterval = 10000;
        
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
        this.remainingEnemyMissiles = this.getEnemyMissileCount();
        this.missileInterval = 2000;
        this.nextMissileTime = performance.now();
        
        // Wave message
        this.showingWaveMessage = false;
        this.waveMessageStartTime = 0;

        // Game state
        this.running = false;
        this.gameOver = false;
        this.victory = false;
    }

    getEnemyMissileCount() {
        return this.enemyMissilesPerWave[Math.min(this.wave - 1, this.enemyMissilesPerWave.length - 1)];
    }

    completeWave() {
        // Calculate bonus points
        const remainingMissileBonus = this.missiles * 5 * this.scoreMultiplier;
        const cityBonus = 100 * this.scoreMultiplier;  // Base bonus per city
        this.score = Number(this.score) || 0;  // Ensure score is a number
        this.score += remainingMissileBonus;  // Add missile bonus

        // Check for victory at wave 9
        if (this.wave === 9) {
            this.victory = true;
            return;
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
        this.enemyMissiles = [];  // Clear any remaining missiles
        
        // Show wave message
        this.showingWaveMessage = true;
        this.waveMessageStartTime = performance.now();
        this.nextMissileTime = this.waveMessageStartTime + 3000;
        
        // Ensure game is still running
        this.running = true;
    }

    getAccuracy() {
        return this.totalShots > 0 ? Math.round((this.missilesDestroyed / this.totalShots) * 100) : 0;
    }

    saveHighScore(name) {
        const highScores = JSON.parse(localStorage.getItem('neonDefenseHighScores')) || [];
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
