class AudioManager {
    constructor() {
        this.sounds = {};
        this.currentLaser = 0;
        this.init();
    }

    init() {
        // Background music
        this.sounds.background = new Howl({
            src: ['./assets/audio/background.mp3'],
            volume: 0.3,
            loop: true
        });
        
        // Game sounds
        this.sounds.explosion = new Howl({ src: ['./assets/audio/explosion.mp3'], volume: 0.3 });
        this.sounds.cityDamaged = new Howl({ src: ['./assets/audio/city-damaged.mp3'], volume: 0.4 });
        this.sounds.cityDestroyed = new Howl({ src: ['./assets/audio/city-destroyed.mp3'], volume: 0.4 });
        this.sounds.powerup = new Howl({ src: ['./assets/audio/powerup.mp3'], volume: 0.3 });
        
        // Add laser sounds
        this.sounds.lasers = [];
        for (let i = 1; i <= 4; i++) {
            const sound = new Howl({
                src: [`./assets/audio/laser/laser0${i}.mp3`],
                volume: 0.4
            });
            this.sounds.lasers.push(sound);
        }
    }

    playSound(name) {
        if (name === 'laser') {
            this.sounds.lasers[this.currentLaser].play();
            this.currentLaser = (this.currentLaser + 1) % this.sounds.lasers.length;
        } else if (this.sounds[name]) {
            this.sounds[name].play();
        }
    }

    startMusic() {
        if (this.sounds.background) {
            this.sounds.background.play();
        }
    }

    stopMusic() {
        if (this.sounds.background) {
            this.sounds.background.stop();
        }
    }

    setMusicVolume(volume) {
        if (this.sounds.background) {
            this.sounds.background.volume(volume);
        }
    }

    setSFXVolume(volume) {
        // Set volume for all sound effects
        Object.values(this.sounds).forEach(sound => {
            if (sound !== this.sounds.background) {
                if (Array.isArray(sound)) {
                    sound.forEach(s => s.volume(volume));
                } else {
                    sound.volume(volume);
                }
            }
        });
    }
}

export default AudioManager;
