class MissileManager {
    constructor(ctx, gameState, audioManager) {
        this.ctx = ctx;
        this.gameState = gameState;
        this.audioManager = audioManager;
        this.playerMissiles = [];
        this.explosions = [];
        this.pulseTime = 0;  // Add pulse timer for triangle animation
    }

    loadMissileImages() {
        // Remove this method as we no longer need missile images
    }

    spawnEnemyMissile(cities) {
        const startX = Math.random() * this.ctx.canvas.width;
        
        // Get list of surviving cities
        const survivingCities = cities.filter(city => !city.destroyed);
        if (survivingCities.length === 0) return;
        
        // Target selection logic
        let targetCity;
        if (survivingCities.length < cities.length) {
            // 80% chance to target surviving cities when some are destroyed
            if (Math.random() < 0.8) {
                targetCity = survivingCities[Math.floor(Math.random() * survivingCities.length)];
            } else {
                targetCity = cities[Math.floor(Math.random() * cities.length)];
            }
        } else {
            // All cities alive, target randomly
            targetCity = cities[Math.floor(Math.random() * cities.length)];
        }
        
        if (!targetCity) return;
        
        const angle = Math.atan2(targetCity.y - 0, targetCity.x - startX);
        const speed = this.gameState.baseSpeed * (1 + (this.gameState.wave - 1) * 0.2);
        
        const missile = {
            x: startX,
            y: 0,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            targetX: targetCity.x,
            targetY: targetCity.y,
            rotation: angle
        };
        
        this.gameState.enemyMissiles.push(missile);
    }

    firePlayerMissile(targetX, targetY, cannonX, cannonY) {
        if (this.gameState.missiles <= 0) return;

        const angle = Math.atan2(targetY - cannonY, targetX - cannonX);
        const speed = 400;
        
        this.playerMissiles.push({
            x: cannonX,
            y: cannonY,
            startX: cannonX,
            startY: cannonY,
            targetX: targetX,
            targetY: targetY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed
        });

        this.gameState.missiles--;
        this.gameState.totalShots++;
    }

    createExplosion(x, y) {
        this.explosions.push({
            x: x,
            y: y,
            radius: 0,
            maxRadius: 90,
            growthRate: 200,
            duration: 1000
        });
    }

    update(deltaTime) {
        // Update pulse animation
        this.pulseTime += deltaTime / 1000;
        
        // Update player missiles
        for (let i = this.playerMissiles.length - 1; i >= 0; i--) {
            const missile = this.playerMissiles[i];
            missile.x += missile.vx * deltaTime / 1000;
            missile.y += missile.vy * deltaTime / 1000;
            
            // Check if missile has reached its target
            const dx = missile.x - missile.targetX;
            const dy = missile.y - missile.targetY;
            if (dx * dx + dy * dy < 100) {
                this.createExplosion(missile.x, missile.y);
                this.playerMissiles.splice(i, 1);
                this.audioManager.playSound('explosion');
            }
        }

        // Update enemy missiles
        for (let i = this.gameState.enemyMissiles.length - 1; i >= 0; i--) {
            const missile = this.gameState.enemyMissiles[i];
            
            // Update position using velocity
            missile.x += missile.vx * deltaTime / 1000;
            missile.y += missile.vy * deltaTime / 1000;
            
            // Check for ground impact or target reached
            if (missile.y >= this.ctx.canvas.height - 10 || 
                (Math.abs(missile.x - missile.targetX) < 10 && Math.abs(missile.y - missile.targetY) < 10)) {
                this.createExplosion(missile.x, missile.y);
                this.gameState.enemyMissiles.splice(i, 1);
                this.audioManager.playSound('impact');
                continue;
            }
        }

        // Update explosions and check for missile hits
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const explosion = this.explosions[i];
            explosion.radius += explosion.growthRate * deltaTime / 1000;
            
            // Check for enemy missiles caught in explosion
            for (let j = this.gameState.enemyMissiles.length - 1; j >= 0; j--) {
                const missile = this.gameState.enemyMissiles[j];
                const dx = missile.x - explosion.x;
                const dy = missile.y - explosion.y;
                if (dx * dx + dy * dy < explosion.radius * explosion.radius) {
                    this.createExplosion(missile.x, missile.y);
                    this.gameState.enemyMissiles.splice(j, 1);
                    this.gameState.missilesDestroyed++;
                    // Score based on wave multiplier
                    this.gameState.score += 25 * this.gameState.wave;
                }
            }
            
            if (explosion.radius >= explosion.maxRadius) {
                this.explosions.splice(i, 1);
            }
        }
    }

    checkCollisions(cities) {
        for (let i = this.gameState.enemyMissiles.length - 1; i >= 0; i--) {
            const missile = this.gameState.enemyMissiles[i];
            for (const city of cities) {
                if (!city.destroyed) {
                    const dx = missile.x - city.x;
                    const dy = missile.y - city.y;
                    if (Math.sqrt(dx * dx + dy * dy) < 30) {
                        this.audioManager.playSound('cityDamaged');
                        city.health = Math.max(0, city.health - 50);
                        city.destroyed = city.health === 0;
                        if (city.destroyed) {
                            this.audioManager.playSound('cityDestroyed');
                            this.createExplosion(city.x, city.y);
                        }
                        this.gameState.enemyMissiles.splice(i, 1);
                        break;
                    }
                }
            }
        }
    }

    render() {
        // Draw player missiles
        for (const missile of this.playerMissiles) {
            this.ctx.beginPath();
            this.ctx.strokeStyle = '#0ff';
            this.ctx.lineWidth = 2;
            this.ctx.moveTo(missile.startX, missile.startY);
            this.ctx.lineTo(missile.x, missile.y);
            this.ctx.stroke();
        }

        // Draw enemy missiles
        for (const missile of this.gameState.enemyMissiles) {
            // Draw exhaust trail with doubled length
            const trailLength = 180; // Doubled from 90
            this.ctx.strokeStyle = '#ff0000'; // Changed to red
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            const trailStartX = missile.x - Math.cos(missile.rotation) * trailLength;
            const trailStartY = missile.y - Math.sin(missile.rotation) * trailLength;
            this.ctx.moveTo(trailStartX, trailStartY);
            this.ctx.lineTo(missile.x, missile.y);
            this.ctx.stroke();

            // Draw pulsating triangle at tip
            const pulseScale = 0.8 + Math.sin(this.pulseTime * 5) * 0.2; // Pulsate between 0.6 and 1.0 scale
            const triangleSize = 10 * pulseScale;
            
            this.ctx.save();
            this.ctx.translate(missile.x, missile.y);
            this.ctx.rotate(missile.rotation);
            
            this.ctx.beginPath();
            this.ctx.fillStyle = '#ff0000';
            this.ctx.moveTo(triangleSize, 0);
            this.ctx.lineTo(-triangleSize/2, triangleSize/2);
            this.ctx.lineTo(-triangleSize/2, -triangleSize/2);
            this.ctx.closePath();
            this.ctx.fill();
            
            this.ctx.restore();
        }

        // Draw explosions
        for (const explosion of this.explosions) {
            const gradient = this.ctx.createRadialGradient(
                explosion.x, explosion.y, 0,
                explosion.x, explosion.y, explosion.radius
            );
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            gradient.addColorStop(0.4, 'rgba(255, 100, 100, 0.4)');
            gradient.addColorStop(1, 'rgba(255, 50, 50, 0)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
}

export default MissileManager;
