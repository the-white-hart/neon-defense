class MissileManager {
    constructor(ctx, gameState) {
        this.ctx = ctx;
        this.gameState = gameState;
        this.playerMissiles = [];
        this.explosions = [];
        this.missileImages = [];
        this.loadMissileImages();
    }

    loadMissileImages() {
        for (let i = 1; i <= 10; i++) {
            const img = new Image();
            img.src = `./assets/images/missiles/${i.toString().padStart(2, '0')}.png`;
            this.missileImages.push(img);
        }
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
            missileImage: this.missileImages[Math.floor(Math.random() * this.missileImages.length)]
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
            maxRadius: 30,
            speed: 100
        });
    }

    update(deltaTime) {
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
            }
        }

        // Update enemy missiles
        for (let i = this.gameState.enemyMissiles.length - 1; i >= 0; i--) {
            const missile = this.gameState.enemyMissiles[i];
            missile.x += missile.vx * deltaTime / 1000;
            missile.y += missile.vy * deltaTime / 1000;
        }

        // Update explosions
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const explosion = this.explosions[i];
            explosion.radius += explosion.speed * deltaTime / 1000;
            if (explosion.radius > explosion.maxRadius) {
                this.explosions.splice(i, 1);
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
            // Draw exhaust trail
            this.ctx.strokeStyle = '#f0f';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(missile.x - missile.vx * 10, missile.y - missile.vy * 10);
            this.ctx.lineTo(missile.x, missile.y);
            this.ctx.stroke();
            
            // Calculate angle based on missile velocity
            let angle = Math.atan2(missile.vy, missile.vx);
            
            // Draw missile image
            if (missile.missileImage && missile.missileImage.complete) {
                this.ctx.save();
                this.ctx.translate(missile.x, missile.y);
                this.ctx.rotate(angle + Math.PI/2 - Math.PI/4);
                
                const missileSize = 30;
                this.ctx.drawImage(
                    missile.missileImage,
                    -missileSize/2, -missileSize/2,
                    missileSize, missileSize
                );
                
                this.ctx.restore();
            }
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
    }

    checkCollisions(cities) {
        // Check for collisions between explosions and enemy missiles
        for (const explosion of this.explosions) {
            for (let i = this.gameState.enemyMissiles.length - 1; i >= 0; i--) {
                const missile = this.gameState.enemyMissiles[i];
                const dx = missile.x - explosion.x;
                const dy = missile.y - explosion.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < explosion.radius) {
                    this.gameState.enemyMissiles.splice(i, 1);
                    this.gameState.missilesDestroyed++;
                    this.gameState.score += 10 * this.gameState.scoreMultiplier;
                }
            }
        }

        // Check for collisions between enemy missiles and cities
        for (let i = this.gameState.enemyMissiles.length - 1; i >= 0; i--) {
            const missile = this.gameState.enemyMissiles[i];
            for (const city of cities) {
                if (!city.destroyed) {
                    const dx = missile.x - city.x;
                    const dy = missile.y - city.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 30) {
                        this.gameState.enemyMissiles.splice(i, 1);
                        city.health -= 50;
                        if (city.health <= 0) {
                            city.destroyed = true;
                        } else {
                            city.damaged = true;
                        }
                        break;
                    }
                }
            }
        }
    }
}

export default MissileManager;
