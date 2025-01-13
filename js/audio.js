class AudioManager {
    constructor() {
        this.music = new Howl({
            src: ['assets/audio/background.mp3'],
            loop: true,
            volume: 0.5
        });

        this.sounds = {
            shoot: new Howl({
                src: ['assets/audio/shoot.mp3'],
                volume: 0.5
            }),
            explosion: new Howl({
                src: ['assets/audio/explosion.mp3'],
                volume: 0.5
            }),
            cityDestroyed: new Howl({
                src: ['assets/audio/city-destroyed.mp3'],
                volume: 0.5
            })
        };
    }

    startMusic() {
        this.music.play();
    }

    stopMusic() {
        this.music.stop();
    }

    playSound(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName].play();
        }
    }

    setMusicVolume(volume) {
        this.music.volume(volume);
    }

    setSFXVolume(volume) {
        Object.values(this.sounds).forEach(sound => {
            sound.volume(volume);
        });
    }
}

const audioManager = new AudioManager();
