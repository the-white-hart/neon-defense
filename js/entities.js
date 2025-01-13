class Entity {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class City extends Entity {
    constructor(x, y) {
        super(x, y);
        this.width = CONFIG.CITIES.WIDTH;
        this.height = CONFIG.CITIES.HEIGHT;
        this.alive = true;
    }

    draw(ctx) {
        if (!this.alive) return;
        
        ctx.fillStyle = CONFIG.COLORS.NEON_CYAN;
        ctx.fillRect(this.x - this.width/2, this.y, this.width, this.height);
        
        // Draw shield
        ctx.beginPath();
        ctx.strokeStyle = CONFIG.COLORS.NEON_BLUE;
        ctx.lineWidth = 2;
        ctx.arc(this.x, this.y, this.width/2 + 10, Math.PI, 0);
        ctx.stroke();
    }
}

class Missile extends Entity {
    constructor(x, y, targetX, targetY, isEnemy) {
        super(x, y);
        this.targetX = targetX;
        this.targetY = targetY;
        this.isEnemy = isEnemy;
        this.speed = isEnemy ? 
            CONFIG.MISSILES.ENEMY.MIN_SPEED + Math.random() * (CONFIG.MISSILES.ENEMY.MAX_SPEED - CONFIG.MISSILES.ENEMY.MIN_SPEED) :
            CONFIG.MISSILES.PLAYER.SPEED;
    }

    update() {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.speed) {
            return false;
        }
        
        this.x += (dx / distance) * this.speed;
        this.y += (dy / distance) * this.speed;
        
        return true;
    }

    draw(ctx) {
        ctx.strokeStyle = this.isEnemy ? CONFIG.COLORS.NEON_MAGENTA : CONFIG.COLORS.NEON_CYAN;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        const angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
        ctx.lineTo(
            this.x - Math.cos(angle) * 20,
            this.y - Math.sin(angle) * 20
        );
        ctx.stroke();
    }
