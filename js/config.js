const CONFIG = {
    COLORS: {
        NEON_CYAN: '#00ffff',
        NEON_MAGENTA: '#ff00ff',
        NEON_BLUE: '#0088ff',
        NEON_GREEN: '#0f0',
        NEON_YELLOW: '#ffff00',
        BACKGROUND: '#000033'
    },
    GAME: {
        FPS: 60,
        WIDTH: window.innerWidth,
        HEIGHT: window.innerHeight,
        MISSILE_INTERVAL: 2000, // Time between enemy missiles in ms
        MISSILE_SPEED: 200, // Base speed of enemy missiles
        PLAYER_MISSILE_SPEED: 400, // Speed of player missiles
        EXPLOSION_RADIUS: 100,
        EXPLOSION_SPEED: 200,
        MISSILE_ENERGY_COST: 10,
        CITIES: 6,
        INITIAL_ENERGY: 100,
        ENERGY_REGEN_RATE: 0.1,
        CITY_SCORE: 100,
        MISSILE_SCORE: 150,
        WAVE_DURATION: 30000, // 30 seconds per wave
        DIFFICULTY_INCREASE: {
            MISSILE_SPEED: 1.1,  // 10% increase per wave
            SPAWN_RATE: 0.9,    // 10% faster spawning per wave
            MAX_WAVES: 10
        }
    },
    MISSILES: {
        PLAYER: {
            SPEED: 5,
            SIZE: 4,
            COLOR: '#0ff',
            EXPLOSION_RADIUS: 100,
            WIDTH: 3,
            LENGTH: 15,
            TRAIL_LENGTH: 5
        },
        ENEMY: {
            MIN_SPEED: 0.5,
            MAX_SPEED: 1,
            SIZE: 3,
            COLOR: '#f0f',
            SPAWN_RATE: 3000, // 3 seconds
            DAMAGE: 25, // Cities now take 4 hits to destroy
            WIDTH: 4,
            LENGTH: 20,
            TRAIL_LENGTH: 10
        }
    },
    CANNON: {
        WIDTH: 40,
        HEIGHT: 60,
        BASE_WIDTH: 80,
        BASE_HEIGHT: 30,
        COLOR: '#00ffff',
        GLOW: 20
    },
    CITY: {
        WIDTH: 60,
        HEIGHT: 40,
        MAX_HEALTH: 100,
        SHIELD_HEIGHT: 10,
        GLOW: 15
    },
    AUDIO: {
        MUSIC_VOLUME: 0.5,
        SFX_VOLUME: 0.5
    },
    POWERUPS: {
        TYPES: {
            ENERGY_BOOST: {
                COLOR: '#0f0',
                AMOUNT: 50
            },
            MEGA_EXPLOSION: {
                COLOR: '#f00',
                RADIUS_MULTIPLIER: 2
            },
            SHIELD_REPAIR: {
                COLOR: '#00f',
                CITIES_RESTORED: 1
            },
            EMP: {
                COLOR: '#ff0',
                DURATION: 3000
            }
        },
        SPAWN_INTERVAL: 15000,  // Every 15 seconds
        DURATION: 10000,        // Last 10 seconds
        SIZE: 30
    },
    PARTICLES: {
        COUNT: 20,
        SPEED: 3,
        LIFETIME: 1000,
        SIZE: 2
    }
};
