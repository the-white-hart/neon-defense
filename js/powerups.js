class Powerup {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.size = CONFIG.POWERUPS.SIZE;
        this.collected = false;
        this.createdAt = performance.now();
    }

    isExpired() {
        return performance.now() - this.createdAt > CONFIG.POWERUPS.DURATION;
    }

    draw(ctx) {
        if (this.collected) return;

        const config = CONFIG.POWERUPS.TYPES[this.type];
        ctx.fillStyle = config.COLOR;
        
        // Draw powerup icon
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size/2, 0, Math.PI * 2);
        ctx.fill();

        // Add glow effect
        ctx.shadowBlur = 20;
        ctx.shadowColor = config.COLOR;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw pulsing ring
        const pulseSize = (Math.sin(performance.now() / 200) + 1) * 5;
        ctx.strokeStyle = config.COLOR;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size/2 + pulseSize, 0, Math.PI * 2);
        ctx.stroke();
    }

    checkCollision(x, y) {
        if (this.collected) return false;
        const dx = this.x - x;
        const dy = this.y - y;
        return Math.sqrt(dx * dx + dy * dy) < this.size;
    }

    apply(game) {
        const config = CONFIG.POWERUPS.TYPES[this.type];
        switch(this.type) {
            case 'ENERGY_BOOST':
                game.energy = Math.min(100, game.energy + config.AMOUNT);
                break;
            case 'MEGA_EXPLOSION':
                game.explosionMultiplier = config.RADIUS_MULTIPLIER;
                setTimeout(() => game.explosionMultiplier = 1, config.DURATION);
                break;
            case 'SHIELD_REPAIR':
                let repairedCount = 0;
                for (let city of game.cities) {
                    if (!city.alive && repairedCount < config.CITIES_RESTORED) {
                        city.alive = true;
                        repairedCount++;
                    }
                }
                break;
            case 'EMP':
                game.empActive = true;
                game.missiles = game.missiles.filter(m => !m.isEnemy);
                setTimeout(() => game.empActive = false, config.DURATION);
                break;
        }
        this.collected = true;
    }
}
