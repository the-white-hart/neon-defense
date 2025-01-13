class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    createExplosionParticles(x, y, color) {
        for (let i = 0; i < CONFIG.PARTICLES.COUNT; i++) {
            const angle = (Math.PI * 2 * i) / CONFIG.PARTICLES.COUNT;
            const speed = Math.random() * CONFIG.PARTICLES.SPEED;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                alpha: 1,
                size: CONFIG.PARTICLES.SIZE,
                lifetime: CONFIG.PARTICLES.LIFETIME,
                created: performance.now()
            });
        }
    }

    update() {
        const currentTime = performance.now();
        this.particles = this.particles.filter(particle => {
            const age = currentTime - particle.created;
            if (age >= particle.lifetime) return false;

            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.alpha = 1 - (age / particle.lifetime);

            return true;
        });
    }

    draw(ctx) {
        this.particles.forEach(particle => {
            ctx.save();
            ctx.globalAlpha = particle.alpha;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }
}

const particleSystem = new ParticleSystem();
