import * as THREE from 'three';
import * as dat from 'dat.gui';

export class SpotlightManager {
    constructor(scene) {
        this.scene = scene;
        this.spotlights = [];
        this.oscillationTime = 0;
        
        // Setup main spotlight
        this.setupSpotlight();
        
        // Setup two additional spotlights
        this.setupAdditionalSpotlights();
        
        // Store initial target positions
        this.initialTarget = {
            x: this.spotlightTarget.position.x,
            y: this.spotlightTarget.position.y,
            z: this.spotlightTarget.position.z
        };
        
        this.controller = null;
        this.setupGUI();
        
        // Replace currentRotation with quaternion storage
        this.initialQuaternion = new THREE.Quaternion();
        this.currentQuaternion = new THREE.Quaternion();

        this.ambientIntensity = 0.3; // Default ambient intensity

        // Store reference to ambient light
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        scene.add(this.ambientLight);

    }

    setupSpotlight() {
        this.spotlight = new THREE.SpotLight(0xffffff, 700);

        this.spotlight.castShadow = true;
        this.spotlight.shadow.mapSize.width = 2048;
        this.spotlight.shadow.mapSize.height = 2048;

        this.spotlight.angle = Math.PI / 6;
        this.spotlight.penumbra = 0.1;
        this.spotlight.decay = 1;
        this.spotlight.distance = 800;

        this.spotlightTarget = new THREE.Object3D();
        this.scene.add(this.spotlightTarget);
        this.spotlight.target = this.spotlightTarget;

        this.scene.add(this.spotlight);

        // After creating spotlightTarget, store its initial direction vector
        this.spotlightDirection = new THREE.Vector3(0, -1, 0);
        this.spotlightTarget.position.copy(
            this.spotlight.position.clone().add(this.spotlightDirection)
        );
    }

    setupAdditionalSpotlights() {
        // Create left spotlight
        const leftSpotlight = new THREE.SpotLight(0xffaaaa, 400);
        leftSpotlight.position.set(300, 250, -700);
        leftSpotlight.angle = Math.PI / 6;
        leftSpotlight.penumbra = 0.1;
        leftSpotlight.decay = 1;
        leftSpotlight.distance = 700;
        leftSpotlight.castShadow = true;
        leftSpotlight.shadow.mapSize.width = 2048;
        leftSpotlight.shadow.mapSize.height = 2048;

        // Create right spotlight
        const rightSpotlight = new THREE.SpotLight(0xaaffaa, 400);
        rightSpotlight.position.set(700, 250, -700);
        rightSpotlight.angle = Math.PI / 6;
        rightSpotlight.penumbra = 0.1;
        rightSpotlight.decay = 1;
        rightSpotlight.distance = 700;
        rightSpotlight.castShadow = true;
        rightSpotlight.shadow.mapSize.width = 2048;
        rightSpotlight.shadow.mapSize.height = 2048;

        // Create separate targets for each spotlight
        const leftTarget = new THREE.Object3D();
        leftTarget.position.set(400, 0, -700);
        this.scene.add(leftTarget);

        const rightTarget = new THREE.Object3D();
        rightTarget.position.set(600, 0, -700);
        this.scene.add(rightTarget);

        // Set the targets for the spotlights
        leftSpotlight.target = leftTarget;
        rightSpotlight.target = rightTarget;

        this.scene.add(leftSpotlight);
        this.scene.add(rightSpotlight);

        this.spotlights.push({
            light: leftSpotlight,
            target: leftTarget
        });
        
        this.spotlights.push({
            light: rightSpotlight,
            target: rightTarget
        });
    }

    setupGUI() {
        this.controls = {
            turnOn: true,
            intensity: this.spotlight.intensity,
            ambient: 0.3,
            posX: this.spotlight.position.x,
            posY: this.spotlight.position.y,
            posZ: this.spotlight.position.z,
            rotX: 0,
            rotY: 0,
            rotZ: 0
        };
        
        const gui = new dat.GUI();
        this.gui = gui;
        gui.hide();
        const spotlightFolder = gui.addFolder('Spotlight Controls');
        this.controller = spotlightFolder;

        spotlightFolder.add(this.controls, 'turnOn').name('Light On/Off')
            .onChange(value => this.spotlight.intensity = value ? this.controls.intensity : 0);

        spotlightFolder.add(this.controls, 'intensity', 0, 1000).name('Intensity')
            .onChange(value => {
                if (this.controls.turnOn) this.spotlight.intensity = value;
            });

        // Add ambient control right after intensity
        spotlightFolder.add(this.controls, 'ambient', 0, 1).name('Ambient')
            .onChange(value => {
                this.ambientIntensity = value;
                // Update shader materials
                if (this.groundMaterial) {
                    this.groundMaterial.uniforms.ambientIntensity.value = value;
                }
                // Update scene's ambient light
                this.ambientLight.intensity = value;
            });

        // Position controls
        spotlightFolder.add(this.controls, 'posX', -500, 500).name('posX')
            .onChange(value => {
                // Calculate the offset between current position and target
                const offset = new THREE.Vector3().subVectors(
                    this.spotlightTarget.position,
                    this.spotlight.position
                );
                
                // Move spotlight
                this.spotlight.position.x = value;
                // Move target by the same amount to maintain direction
                this.spotlightTarget.position.x = value + offset.x;
                
            });

        spotlightFolder.add(this.controls, 'posY', 0, 1000).name('posY')
            .onChange(value => {
                const offset = new THREE.Vector3().subVectors(
                    this.spotlightTarget.position,
                    this.spotlight.position
                );
                
                this.spotlight.position.y = value;
                this.spotlightTarget.position.y = value + offset.y;
                
            });

        spotlightFolder.add(this.controls, 'posZ', -500, 500).name('posZ')
            .onChange(value => {
                const offset = new THREE.Vector3().subVectors(
                    this.spotlightTarget.position,
                    this.spotlight.position
                );
                
                this.spotlight.position.z = value;
                this.spotlightTarget.position.z = value + offset.z;
                
            });

        // Target controls
        const euler = new THREE.Euler(0, 0, 0, 'YXZ'); // YXZ order for consistent rotation
        
        spotlightFolder.add(this.controls, 'rotX', -180, 180).name('rotX')
            .onChange(value => {
                euler.x = value * (Math.PI / 180);
                this.currentQuaternion.setFromEuler(euler);
                this.updateSpotlightTarget();
            });

        spotlightFolder.add(this.controls, 'rotY', -180, 180).name('rotY')
            .onChange(value => {
                euler.y = -value * (Math.PI / 180);
                this.currentQuaternion.setFromEuler(euler);
                this.updateSpotlightTarget();
            });

        spotlightFolder.add(this.controls, 'rotZ', -180, 180).name('rotZ')
            .onChange(value => {
                euler.z = -value * (Math.PI / 180);
                this.currentQuaternion.setFromEuler(euler);
                this.updateSpotlightTarget();
            });
    }

    openMenu() {
        this.gui.show();  // Show the GUI
        this.controller.open();
    }

    closeMenu() {
        this.gui.hide();  // Hide the GUI
        this.controller.close();
    }

    update() {
        
        // Update oscillation
        this.oscillationTime += window.animation_multiplier * 0.02;
        const oscillation = Math.sin(this.oscillationTime) * 100; // Oscillate between -100 and 100
        
        // Update spotlight targets
        if (this.spotlights.length >= 2) {
            // Update left spotlight target
            const leftSpotlight = this.spotlights[0];
            leftSpotlight.target.position.x = 400 + oscillation;
            
            // Update right spotlight target (opposite direction)
            const rightSpotlight = this.spotlights[1];
            rightSpotlight.target.position.x = 600 - oscillation;
            
        }
    }

    updateAxisSelection(axis, mode) {
        if (this.gui) {
            const folder = mode === 'translate' ? 
                this.gui.__folders['Position'] : 
                this.gui.__folders['Rotation'];
            
            folder.__controllers.forEach(controller => {
                if (controller.property === axis) {
                    controller.domElement.style.background = '#444';
                } else {
                    controller.domElement.style.background = 'none';
                }
            });
        }
    }

    // Add this new method to handle all rotation calculations
    updateSpotlightTarget() {
        const distance = 100; // Fixed distance from spotlight to target
        
        // Start with a vector pointing down
        let targetVector = new THREE.Vector3(0, -distance, 0);
        
        // Apply the quaternion rotation
        targetVector.applyQuaternion(this.currentQuaternion);
        
        // Set target position relative to spotlight position
        this.spotlightTarget.position.copy(
            this.spotlight.position.clone().add(targetVector)
        );
    }

    setInitialState(enabled) {
        // Update the control and the actual spotlight
        this.controls.turnOn = enabled;
        this.spotlight.intensity = enabled ? this.controls.intensity : 0;
        
        // Update the GUI checkbox if it exists
        if (this.controller) {
            const turnOnController = this.controller.__controllers.find(
                controller => controller.property === 'turnOn'
            );
            if (turnOnController) {
                turnOnController.setValue(enabled);
            }
        }
    }

    // method to set the ground material reference
    setGroundMaterial(material) {
        this.groundMaterial = material;
        if (this.groundMaterial && this.groundMaterial.uniforms) {
            this.groundMaterial.uniforms.ambientIntensity = { value: this.controls.ambient };
        }
    }

    resetSpotlight() {
        // Reset position
        this.spotlight.position.set(0, 500, 0);
        
        // Reset target position (maintaining the downward direction)
        this.spotlightTarget.position.set(0, 0, 0);
        
        // Reset rotation (this will automatically update the target through the GUI)
        const controllers = this.controller.__controllers;
        controllers.forEach(controller => {
            switch(controller.property) {
                case 'posX':
                    controller.setValue(0);
                    break;
                case 'posY':
                    controller.setValue(500);
                    break;
                case 'posZ':
                    controller.setValue(0);
                    break;
                case 'rotX':
                case 'rotY':
                case 'rotZ':
                    controller.setValue(0);
                    break;
                case 'intensity':
                    controller.setValue(700);
                    break;
                case 'turnOn':
                    controller.setValue(true);
                    break;
            }
        });
    }

}
