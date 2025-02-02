import { ObjectManager } from './controls.js';
import { soundManager } from './sounds.js';

export class KeyboardControls {
    constructor(bouncer, cameraManager, spotlightManager , document, spawnCube, ground, map, cubes, balls, scene) {
        this.bouncer = bouncer;
        this.currentMenu = null;
        this.cameraManager = cameraManager;
        this.spotlightManager = spotlightManager;
        this.menuState = 0;
        this.document = document;
        this.isPaused = false;
        this.spawnCube = spawnCube;
        this.gameActive = false;
        this.ground = ground;
        this.map = map;
        this.cubes = cubes;
        this.balls = balls;
        this.shaderState = 0;
        this.isNight = false;
        this.scene = scene;
        this.isStarted = false;

        
        // Add control keys tracking
        this.keys = {
            w: false,
            s: false,
            a: false,
            d: false,
            q: false,
            e: false,
            ArrowLeft: false,
            ArrowRight: false,
            ArrowUp: false,
            ArrowDown: false,
            t: false,
            u: false,
            g: false,
            j: false,
            b: false,
            m: false,
            'Numpad7': false,
            'Numpad9': false,
            'Numpad4': false,
            'Numpad6': false,
            'Numpad1': false,
            'Numpad3': false,
            'Numpad8': false,
            'Numpad2': false,
            p: false,
            x: false,
            z: false,
            y: false,
            n: false,
            r: false,
            o: false,
            Backspace: false,
            v: false,
        };
        
        // Start both movement loops
        this.moveLoop();
        this.controlLoop();
        this.setupEventListeners();

        // Message overlay
        const messageOverlay = document.createElement('div');
        messageOverlay.style.position = 'fixed';
        messageOverlay.style.top = '100px';
        messageOverlay.style.left = '50%';
        messageOverlay.style.transform = 'translateX(-50%)';
        messageOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        messageOverlay.style.color = 'white';
        messageOverlay.style.padding = '10px 20px';
        messageOverlay.style.borderRadius = '5px';
        messageOverlay.style.fontFamily = 'Arial, sans-serif';
        messageOverlay.style.fontSize = '40px';
        messageOverlay.style.display = 'none';
        messageOverlay.style.zIndex = '1000';
        document.body.appendChild(messageOverlay);
        this.messageOverlay = messageOverlay;

        // Get help overlay reference
        this.helpOverlay = document.getElementById('helpOverlay');

        // Add reference to track the current bonus cube
        this.currentBonusCube = null;

        // Add visibility change listener
        document.addEventListener('visibilitychange', () => {
            if (this.gameActive) {
                if (document.hidden) {
                    // Page is hidden (user switched tabs or minimized)
                    this.isPaused = true;
                    
                    // Show pause message
                    this.messageOverlay.textContent = 'Game Paused';
                    this.messageOverlay.style.display = 'block';
                } else {
                    // Page is visible again
                    this.isPaused = false;
                    this.messageOverlay.style.display = 'none';
                }
            }
        });

        // Add window blur/focus listeners as backup
        window.addEventListener('blur', () => {
            if (this.gameActive) {
                this.isPaused = true;
                this.messageOverlay.textContent = 'Game Paused';
                this.messageOverlay.style.display = 'block';
            }
        });

        window.addEventListener('focus', () => {
            if (this.gameActive) {
                this.isPaused = false;
                this.messageOverlay.style.display = 'none';
            }
        });

        // Prevent F11 default behavior
        window.addEventListener('keydown', (event) => {
            if (event.key === 'F11') {
                event.preventDefault();
            }
        });
    }

    controlLoop() {
        if (!this.gameActive || this.isPaused) {
            requestAnimationFrame(() => this.controlLoop());
            return;
        }

        if (!this.currentMenu) {
            requestAnimationFrame(() => this.controlLoop());
            return;
        }

        const step = 0.1 * window.animation_multiplier; // Adjust step based on multiplier

        // Get the appropriate controllers
        let controllers;
        if (this.currentMenu instanceof ObjectManager) {
            const objectFolder = this.currentMenu.gui?.__folders['Object'];
            controllers = objectFolder?.__controllers;
        } else {
            controllers = this.currentMenu.controller?.__controllers;
        }

        if (!controllers) {
            requestAnimationFrame(() => this.controlLoop());
            return;
        }
        
        const getController = (propertyName) => {
            return controllers.find(controller => controller.property === propertyName);
        };

        const adjustValue = (propertyName, delta) => {
            const controller = getController(propertyName);
            if (controller) {
                const currentValue = controller.getValue();
                const newValue = currentValue + (delta * step);
                const clampedValue = Math.max(controller.__min, Math.min(controller.__max, newValue));
                controller.setValue(clampedValue);
            }
        };

        // Position X
        if (this.keys.t) adjustValue('posX', -50);
        if (this.keys.u) adjustValue('posX', 50);
        
        // Position Y
        if (this.keys.g) adjustValue('posY', -50);
        if (this.keys.j) adjustValue('posY', 50);
        
        // Position Z
        if (this.keys.b) adjustValue('posZ', 50);
        if (this.keys.m) adjustValue('posZ', -50);

        // Rotation X
        if (this.keys.Numpad7) adjustValue('rotX', -20);
        if (this.keys.Numpad9) adjustValue('rotX', 20);
        
        // Rotation Y
        if (this.keys.Numpad4) adjustValue('rotY', -20);
        if (this.keys.Numpad6) adjustValue('rotY', 20);
        
        // Rotation Z
        if (this.keys.Numpad1) adjustValue('rotZ', -20);
        if (this.keys.Numpad3) adjustValue('rotZ', 20);

        // Spotlight intensity
        if (this.keys.y) adjustValue('intensity', 50);
        if (this.keys.n) adjustValue('intensity', -50);

        // Add ambient intensity control using Numpad2 and Numpad8
        if (this.keys.Numpad8) adjustValue('ambient', 0.2);  // Increase ambient
        if (this.keys.Numpad2) adjustValue('ambient', -0.2); // Decrease ambient

        requestAnimationFrame(() => this.controlLoop());
    }

    setupEventListeners() {
        // Help overlay handler
        this.document.addEventListener('keydown', (event) => {
            if (event.key.toLowerCase() === 'h' && this.gameActive) {
                event.preventDefault();
                event.stopImmediatePropagation();
                
                const isHidden = window.getComputedStyle(this.helpOverlay).display === 'none';
                this.helpOverlay.style.display = isHidden ? 'block' : 'none';
                if (this.isStarted ) {
                    this.isPaused = !this.isPaused;
                }
            }
        }, true);

        // Menu control
        this.document.addEventListener('keydown', (event) => {
            if (!this.gameActive) return;
            
            if (event.key.toLowerCase() === 'c') {
                if (this.currentMenu != null) {
                    this.currentMenu.closeMenu();
                }
                switch(this.menuState) {
                    case 0:
                        this.messageOverlay.textContent = 'Camera Mode';
                        this.currentMenu = this.cameraManager;
                        this.currentMenu.openMenu();
                        this.messageOverlay.style.display = 'block';
                        this.menuState = 1;
                        break;
                    case 1:
                        this.messageOverlay.textContent = 'Spotlight Mode';
                        this.currentMenu = this.spotlightManager;
                        this.currentMenu.openMenu();
                        this.messageOverlay.style.display = 'block';
                        this.menuState = 2;
                        break;
                    case 2:
                        this.messageOverlay.textContent = 'Object Mode: Pick an object';
                        this.messageOverlay.style.display = 'block';
                        this.menuState = 3;
                        break;
                    case 3:
                        // Clear object selection when exiting object mode
                        if (this.currentMenu instanceof ObjectManager && this.currentMenu.selectedObject) {
                            if (this.currentMenu.selectedObject.material.type === 'ShaderMaterial') {
                                const uniforms = this.currentMenu.selectedObject.material.uniforms;
                                if (uniforms && uniforms.emissiveColor) {
                                    uniforms.emissiveColor.value.setHex(0x000000);
                                }
                            } else {
                                this.currentMenu.selectedObject.material.emissive.setHex(0x000000);
                            }
                            this.currentMenu.clearSelection();
                        }
                        this.messageOverlay.style.display = 'none';
                        this.menuState = 0;
                        break;
                }
            }
        });

        // Track all key states
        this.document.addEventListener('keydown', (event) => {
            if (!this.gameActive) return;
            
            // Convert alphabetic keys to lowercase for case-insensitive matching
            const key = event.key.toLowerCase();
            // Use event.code for numpad keys, convert other keys to lowercase
            const keyCode = event.code;
            if (this.keys.hasOwnProperty(keyCode)) {
                this.keys[keyCode] = true;
            } else if (this.keys.hasOwnProperty(key)) {  // Check lowercase version
                this.keys[key] = true;
            }
        });

        this.document.addEventListener('keyup', (event) => {
            // Convert alphabetic keys to lowercase for case-insensitive matching
            const key = event.key.toLowerCase();
            const keyCode = event.code;
            if (this.keys.hasOwnProperty(keyCode)) {
                this.keys[keyCode] = false;
            } else if (this.keys.hasOwnProperty(key)) {  // Check lowercase version
                this.keys[key] = false;
            }
        });

        // Camera position toggle
        this.document.addEventListener('keydown', (event) => {
            if (!this.gameActive) return;
            
            if (event.key.toLowerCase() === 'p' && !this.cameraManager.isTransitioning) {
                this.cameraManager.transitionCamera();
            }
        });

        // Cube spawning
        this.document.addEventListener('keydown', (event) => {
            if (!this.gameActive || this.isPaused) return;
            
            switch (event.code) {
                case 'Space':
                    this.spawnCube();
                    break;
            }
        });

        // Add ground material toggle
        this.document.addEventListener('keydown', (event) => {
            if (!this.gameActive || this.isPaused) return;
            
            if (event.key.toLowerCase() === 'x') {

                this.shaderState = (this.shaderState + 1) % 3;
                this.ground.toggleShaderState();
                this.map.toggleShaderState();
                this.bouncer.toggleShaderState();
                this.cubes.forEach(cube => cube.toggleShaderState());
                this.balls.forEach(ball => ball.toggleShaderState());
                
                // Show message overlay
                switch(this.shaderState) {
                    case 0:
                        this.messageOverlay.textContent = 'No Shader';
                        soundManager.sounds.cartoon.pause();
                        soundManager.sounds.bgMusic.oncanplay =  function() {
                            soundManager.sounds.bgMusic.currentTime = soundManager.sounds.cartoon.currentTime;
                        };
                        soundManager.playSound('bgMusic');

                        break;
                    case 1:
                        this.messageOverlay.textContent = 'Bump Mapping';
                        soundManager.sounds.bgMusic.pause();
                        soundManager.sounds.bump.oncanplay = function() {
                            soundManager.sounds.bump.currentTime = soundManager.sounds.bgMusic.currentTime;
                        };
                        soundManager.playSound('bump');

                        break;
                    case 2:
                        this.messageOverlay.textContent = 'Toon Shading';
                        soundManager.sounds.bump.pause();
                        soundManager.sounds.cartoon.oncanplay = function() {
                            soundManager.sounds.cartoon.currentTime = soundManager.sounds.bump.currentTime;
                        };
                        soundManager.playSound('cartoon');

                        break;
                }
                this.messageOverlay.style.display = 'block';
                
                // Hide message after 1 second
                setTimeout(() => {
                    this.messageOverlay.style.display = 'none';
                }, 1000);
            }
        });

        // Add water shader toggle
        this.document.addEventListener('keydown', (event) => {
            if (!this.gameActive || this.isPaused) return;
            
            if (event.key.toLowerCase() === 'z') {
                if (typeof window.switchWaterShader === 'function') {
                    window.switchWaterShader();
                    this.map.isWaveShader = !this.map.isWaveShader;
                    soundManager.sounds.ocean.volume = this.ground.useDynamicShader ? 0.3 : 0.1;

                    // Update message based on shader type
                    this.messageOverlay.textContent = this.ground.useDynamicShader ? 
                        'Wave Shader' : 'Stationary Shader';
                    this.messageOverlay.style.display = 'block';
                    
                    // Hide message after 1 second
                    setTimeout(() => {
                        this.messageOverlay.style.display = 'none';
                    }, 1000);
                } else {
                    console.warn('Water shader switch function not available');
                }
            }
        });

        // Add day/night toggle
        this.document.addEventListener('keydown', (event) => {
            if (!this.gameActive || this.isPaused) return;
            
            if (event.key.toLowerCase() === 'o') {
                this.isNight = !this.isNight;
                
                // Change background color and ambient light
                if (this.isNight) {
                    this.scene.background = this.scene.nightColor;
                    this.messageOverlay.textContent = 'Night Mode';
                    // Set ambient to 0 for night
                    this.spotlightManager.controls.ambient = 0.1;
                    this.spotlightManager.controller.__controllers.find(
                        c => c.property === 'ambient'
                    ).setValue(0.1);
                } else {
                    this.scene.background = this.scene.dayColor;
                    this.messageOverlay.textContent = 'Day Mode';
                    // Reset ambient to 0.3 for day
                    this.spotlightManager.controls.ambient = 0.3;
                    this.spotlightManager.controller.__controllers.find(
                        c => c.property === 'ambient'
                    ).setValue(0.3);
                }
                
                // Show message
                this.messageOverlay.style.display = 'block';
                
                // Hide message after 1 second
                setTimeout(() => {
                    this.messageOverlay.style.display = 'none';
                }, 1000);
            }
        });

        this.document.addEventListener('keydown', (event) => {
            if (!this.gameActive || this.isPaused) return;
            if (event.key === 'Backspace') {
                window.stopTimer = !window.stopTimer;  // Toggle the global variable

                if (window.stopTimer) {
                    this.messageOverlay.textContent = 'Timer Stopped';
                    this.messageOverlay.style.display = 'block';
                } else {
                    this.messageOverlay.textContent = 'Timer Running';
                    this.messageOverlay.style.display = 'block';
                }

                // Hide message after 1 second
                setTimeout(() => {
                    this.messageOverlay.style.display = 'none';
                }, 1000);
            }
        });

        // Camera reset
        this.document.addEventListener('keydown', (event) => {
            if (!this.gameActive || this.isPaused) return;
            
            if (event.key.toLowerCase() === 'v' && this.currentMenu === this.cameraManager) {
                this.cameraManager.resetCamera();
                
                // Show message overlay
                this.messageOverlay.textContent = 'Camera Reset';
                this.messageOverlay.style.display = 'block';
                
                // Hide message after 1 second
                setTimeout(() => {
                    this.messageOverlay.style.display = 'none';
                }, 1000);
            }
        });

        // Spotlight reset
        this.document.addEventListener('keydown', (event) => {
            if (!this.gameActive || this.isPaused) return;
            
            if (event.key.toLowerCase() === 'v' && this.currentMenu === this.spotlightManager) {
                this.spotlightManager.resetSpotlight();
                
                // Show message overlay
                this.messageOverlay.textContent = 'Spotlight Reset';
                this.messageOverlay.style.display = 'block';
                
                // Hide message after 1 second
                setTimeout(() => {
                    this.messageOverlay.style.display = 'none';
                }, 1000);
            }
        });
    }

    moveLoop() {
        if (!this.gameActive || this.isPaused) {
            requestAnimationFrame(() => this.moveLoop());
            return;
        }

        const speed = 1.5 * window.animation_multiplier;
        const angleSpeed = 0.05 * window.animation_multiplier;
        
        // Move bouncer
        if (this.keys.ArrowRight) this.bouncer.angleZ(-angleSpeed);
        if (this.keys.ArrowLeft) this.bouncer.angleZ(angleSpeed);
        if (this.keys.ArrowUp) this.bouncer.angleX(-angleSpeed);
        if (this.keys.ArrowDown) this.bouncer.angleX(angleSpeed);
        if (this.keys.w) {
            this.bouncer.switchMaterial();
            this.keys.w = false;
        }
        if (this.keys.a) this.bouncer.addX(-speed);
        if (this.keys.d) this.bouncer.addX(speed);
        if (this.keys.r) {
            this.bouncer.resetRotation();
            this.keys.r = false;
        }

        // Move bonus cube
        if (this.cubes.length > 0) {
            // Get the most recently spawned cube (which should be the bonus cube)
            this.currentBonusCube = this.cubes[this.cubes.length - 1];
            
            // Only move if it's a bonus cube (not a static box)
            if (this.currentBonusCube && !this.currentBonusCube.getBody().isStatic) {
                if (this.keys.q) this.currentBonusCube.addX(-speed);
                if (this.keys.e) this.currentBonusCube.addX(speed);
            }
        }

        requestAnimationFrame(() => this.moveLoop());
    }

    getCurrentMenu() {
        return this.currentMenu;
    }

    getMenuState() {
        return this.menuState;
    }

    togglePause() {
        this.isPaused = !this.isPaused;
    }

    startGame() {
        this.gameActive = true;
        this.isPaused = true;
        this.messageOverlay.textContent = '3...';
        this.messageOverlay.style.display = 'block';
        
        let countdown = 3;
        const countdownInterval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                this.messageOverlay.textContent = `${countdown}...`;
            } else {
                this.isStarted = true;

                clearInterval(countdownInterval);
                this.messageOverlay.textContent = 'Go!';
                setTimeout(() => {
                    this.messageOverlay.style.display = 'none';
                    if ( window.getComputedStyle(this.helpOverlay).display === 'none'){  
                        this.isPaused = false;
                    }
                }, 1200);
            }
        }, 1200);
    }

    endGame() {
        this.gameActive = false;
    }
} 