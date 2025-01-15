class HUDRenderer {
    constructor(ctx) {
        this.ctx = ctx;
        this.warningFlashTimer = 0;
        this.warningIsRed = false;
        this.lastWarningToggle = performance.now();
    }

    render(gameState) {
        // Draw HUD background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.beginPath();
        this.ctx.roundRect(10, 10, 
            gameState.missiles <= 10 ? 380 : 280, 
            gameState.missiles <= 10 ? 210 : 170, 
            10
        );
        this.ctx.fill();
        
        // Draw HUD text
        this.ctx.fillStyle = '#0ff';
        this.ctx.font = '20px Orbitron';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${Math.floor(gameState.score)}`, 20, 40);
        this.ctx.fillText(`Shots Remaining: ${gameState.missiles}`, 20, 70);
        this.ctx.fillText(`Wave: ${gameState.wave}`, 20, 100);
        this.ctx.fillText(`Multiplier: ${gameState.wave}x`, 20, 130);
        this.ctx.fillText(`Missiles Remaining: ${gameState.remainingEnemyMissiles}`, 20, 160);
        
        // Draw low ammo warning
        if (gameState.missiles <= 10 && !gameState.showingWaveMessage) {
            this.ctx.fillStyle = this.warningIsRed ? '#f00' : '#ff0';
            this.ctx.fillText('Warning! Ammo level critical!', 20, 190);
        }
        
        // Draw reserve cities count
        if (gameState.reserveCities > 0) {
            this.ctx.fillStyle = '#0ff';
            this.ctx.fillText(
                `Reserve Cities: ${gameState.reserveCities}`, 
                20, 
                gameState.missiles <= 10 ? 220 : 190
            );
        }
    }

    updateWarningFlash(currentTime, gameState) {
        if (gameState.missiles <= 10 && !gameState.showingWaveMessage) {
            const timeSinceLastToggle = currentTime - this.lastWarningToggle;
            if (timeSinceLastToggle >= 500) {
                this.warningIsRed = !this.warningIsRed;
                this.lastWarningToggle = currentTime;
            }
        } else {
            this.warningIsRed = false;
            this.lastWarningToggle = currentTime;
        }
    }

    renderWaveMessage(gameState) {
        if (!gameState.showingWaveMessage) return;

        this.ctx.save();
        this.ctx.fillStyle = '#0ff';
        this.ctx.font = 'bold 72px Orbitron';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(
            `WAVE ${gameState.wave}`, 
            this.ctx.canvas.width / 2, 
            this.ctx.canvas.height / 2
        );
        
        this.ctx.font = 'bold 36px Orbitron';
        this.ctx.fillText(
            `${gameState.remainingEnemyMissiles} MISSILES INCOMING`,
            this.ctx.canvas.width / 2,
            this.ctx.canvas.height / 2 + 60
        );
        this.ctx.restore();
    }
}

export default HUDRenderer;
