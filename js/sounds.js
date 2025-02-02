// Create and manage all sound instances
class SoundManager {
    constructor() {
        this.masterVolume = 0.3;
        this.musicVolume = 0.2;

        // Initialize base volumes for each sound
        this.baseVolumes = {
            bgMusic: 0.3,
            spawn: 0.4,
            sandHit: 0.3,
            metalHit: 0.5,
            rubberHit: 0.4,
            tennisHit: 1.0,
            balloonHit: 0.6,
            point: 1.0,
            point2: 1.0,
            point3: 1.0,
            point4: 1.0,
            point5: 1.0,
            point6: 1.0,
            point7: 1.0,
            point8: 1.0,
            bullseye: 1.0,
            lose: 1.0,
            countdown: 1.0,
            spawnCube: 0.8,
            merge: 0.4,
            ballDrop: 0.2,
            bump: 0.5,
            cartoon: 0.5,
            ocean: 0.2
        };

        this.sounds = {
            tennisHit: new Audio("./sounds/tennis.mp3"),
            metalHit: new Audio("./sounds/metal.mp3"),
            rubberHit: new Audio("./sounds/rubber.mp3"),
            sandHit: new Audio("./sounds/sand.mp3"),
            balloonHit: new Audio("./sounds/balloon.mp3"),
            bullseye: new Audio("./sounds/bullseye.mp3"),
            point: new Audio("./sounds/point1.mp3"),
            point2: new Audio("./sounds/point2.mp3"),
            point3: new Audio("./sounds/point3.mp3"),
            point4: new Audio("./sounds/point4.mp3"),
            point5: new Audio("./sounds/point5.mp3"),
            point6: new Audio("./sounds/point6.mp3"),
            point7: new Audio("./sounds/point7.mp3"),
            point8: new Audio("./sounds/point8.mp3"),
            bgMusic: new Audio("./sounds/JAM.mp3"),
            spawn: new Audio("./sounds/spawn.mp3"),
            lose: new Audio("./sounds/lose.mp3"),
            countdown: new Audio("./sounds/countdown.mp3"),
            spawnCube: new Audio("./sounds/spawnCube.mp3"),
            merge: new Audio("./sounds/merge.mp3"),
            ballDrop: new Audio("./sounds/ballDrop.mp3"),
            bump: new Audio("./sounds/bump.mp3"),
            cartoon: new Audio("./sounds/cartoon.mp3"),
            ocean: new Audio("./sounds/ocean.mp3")
        };

        // Set up looping for both background music and ocean sound
        this.sounds.bgMusic.loop = true;
        this.sounds.ocean.loop = true;
        this.sounds.bump.loop = true;
        this.sounds.cartoon.loop = true;
        // Apply initial volume to all sounds
        this.updateMasterVolume(this.masterVolume);
    }

    getBaseVolumeForSound(sound) {
        const soundName = Object.entries(this.sounds).find(([_, value]) => value === sound)?.[0];
        return this.baseVolumes[soundName] || 1.0;
    }

    updateMasterVolume(value) {
        this.masterVolume = Math.max(0, Math.min(1, value));
        Object.entries(this.sounds).forEach(([name, sound]) => {
            if (sound instanceof Audio && name !== 'bgMusic' && name !== 'bump' && name !== 'cartoon' && name !== 'ocean') {
                sound.volume = Math.max(0, Math.min(1, this.masterVolume * this.baseVolumes[name]));
            }
        });
        if (this.sounds.bgMusic) {
            this.sounds.bgMusic.volume = Math.max(0, Math.min(1, this.musicVolume * this.baseVolumes.bgMusic));
        }
        if (this.sounds.bump) {
            this.sounds.bump.volume = Math.max(0, Math.min(1, this.musicVolume * this.baseVolumes.bump));
        }
        if (this.sounds.cartoon) {
            this.sounds.cartoon.volume = Math.max(0, Math.min(1, this.musicVolume * this.baseVolumes.cartoon));
        }
        if (this.sounds.ocean) {
            this.sounds.ocean.volume = Math.max(0, Math.min(1, this.baseVolumes.ocean));
        }
    }

    updateMusicVolume(value) {
        this.musicVolume = Math.max(0, Math.min(1, value));
        if (this.sounds.bgMusic) {
            this.sounds.bgMusic.volume = Math.max(0, Math.min(1, this.musicVolume * this.baseVolumes.bgMusic));
        }
        if (this.sounds.bump) {
            this.sounds.bump.volume = Math.max(0, Math.min(1, this.musicVolume * this.baseVolumes.bump));
        }
        if (this.sounds.cartoon) {
            this.sounds.cartoon.volume = Math.max(0, Math.min(1, this.musicVolume * this.baseVolumes.cartoon));
        }
    }

    playSound(soundName, options = {}) {
        const sound = this.sounds[soundName];
        if (!sound) return;

        if (options.currentTime !== undefined) {
            sound.currentTime = options.currentTime;
        }

        if (options.volume !== undefined) {
            // Clamp volume between 0 and 1
            const baseVolume = this.getBaseVolumeForSound(sound);
            const multiplier = soundName === 'bgMusic' ? this.musicVolume : this.masterVolume;
            const volume = Math.max(0, Math.min(1, options.volume * multiplier * baseVolume));
            sound.volume = volume;
        }

        sound.play().catch(error => {
            console.log("Audio play was prevented:", error);
        });
    }

    // Create volume control UI
    createVolumeControl() {
        const volumeControl = document.createElement('div');
        volumeControl.style.position = 'fixed';
        volumeControl.style.top = '20px';
        volumeControl.style.left = '50%';
        volumeControl.style.transform = 'translateX(-50%)';
        volumeControl.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        volumeControl.style.padding = '10px';
        volumeControl.style.borderRadius = '5px';
        volumeControl.style.color = 'white';
        volumeControl.style.fontFamily = 'Arial, sans-serif';
        volumeControl.style.zIndex = '1000';
        volumeControl.style.display = 'flex';
        volumeControl.style.flexDirection = 'row';
        volumeControl.style.gap = '20px';

        // Sound Effects Volume Control
        const sfxContainer = document.createElement('div');
        sfxContainer.style.display = 'flex';
        sfxContainer.style.alignItems = 'center';
        sfxContainer.style.gap = '10px';

        const sfxLabel = document.createElement('label');
        sfxLabel.textContent = 'SFX: ';
        sfxLabel.style.minWidth = '50px';

        const sfxSlider = document.createElement('input');
        sfxSlider.type = 'range';
        sfxSlider.min = '0';
        sfxSlider.max = '1';
        sfxSlider.step = '0.1';
        sfxSlider.value = this.masterVolume;
        sfxSlider.style.width = '100px';

        sfxSlider.addEventListener('input', (e) => {
            this.updateMasterVolume(parseFloat(e.target.value));
        });

        sfxContainer.appendChild(sfxLabel);
        sfxContainer.appendChild(sfxSlider);

        // Music Volume Control
        const musicContainer = document.createElement('div');
        musicContainer.style.display = 'flex';
        musicContainer.style.alignItems = 'center';
        musicContainer.style.gap = '10px';

        const musicLabel = document.createElement('label');
        musicLabel.textContent = 'Music: ';
        musicLabel.style.minWidth = '50px';

        const musicSlider = document.createElement('input');
        musicSlider.type = 'range';
        musicSlider.min = '0';
        musicSlider.max = '1';
        musicSlider.step = '0.1';
        musicSlider.value = this.musicVolume;
        musicSlider.style.width = '100px';

        musicSlider.addEventListener('input', (e) => {
            this.updateMusicVolume(parseFloat(e.target.value));
        });

        musicContainer.appendChild(musicLabel);
        musicContainer.appendChild(musicSlider);

        // Add both controls to the container
        volumeControl.appendChild(sfxContainer);
        volumeControl.appendChild(musicContainer);

        document.body.appendChild(volumeControl);
    }
}

export const soundManager = new SoundManager(); 