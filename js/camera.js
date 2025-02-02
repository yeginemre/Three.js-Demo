import * as THREE from 'three';
import * as dat from 'dat.gui';

export class CameraManager {
    constructor() {
        // Create perspective camera
        this.perspectiveCamera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        
        // Create orthographic camera with corrected aspect ratio
        const frustumSize = 50;
        const aspect = window.innerWidth / window.innerHeight;
        this.orthographicCamera = new THREE.OrthographicCamera(
            frustumSize * aspect / -2,
            frustumSize * aspect / 2,
            frustumSize / 2,
            frustumSize / -2,
            0.1,
            1000
        );

        //  initial camera location
        this.initX = 0;
        this.initY = 110; 
        this.initZ = 160;  
        
        // variables to handle camera location
        this.cameraX = this.initX;
        this.cameraY = this.initY;  
        this.cameraZ = this.initZ;

        // Set initial positions
        this.perspectiveCamera.position.set(this.initX, this.initY, this.initZ);
        this.orthographicCamera.position.set(this.cameraX, this.cameraY, this.cameraZ);

        // Initialize cameras to look at origin
        this.lookAtPoint = new THREE.Vector3(0, 0, 0);
        
        this.perspectiveCamera.up.set(0, 1, 0);
        this.orthographicCamera.up.set(0, 1, 0);
        
        const euler = new THREE.Euler(10 * Math.PI / 180, 0, 0, 'YXZ');
        this.perspectiveCamera.setRotationFromEuler(euler);
        this.orthographicCamera.setRotationFromEuler(euler);
        
        // Store initial quaternion
        this.initialQuaternion = new THREE.Quaternion().copy(this.perspectiveCamera.quaternion);

        // Start with perspective camera
        this.activeCamera = this.perspectiveCamera;
        
        this.controller = null;
        this.setupGUI();

        // Add storage for stored camera position
        this.storedPosition = null;
        this.storedLookAt = null;
        this.storedQuaternion = null;
        
        this.defaultPosition = {
            pos: new THREE.Vector3(0, 85, 150),
            lookAt: new THREE.Vector3(0, 0, 0)
        };
        
        this.topDownPosition = {
            pos: new THREE.Vector3(500, 350, -699),
            lookAt: new THREE.Vector3(500, 0, -700)
        };
        
        this.isTopDown = false;
        this.isTransitioning = false;
        this.transitionSpeed = 0.005 ;
    }

    setupGUI() {
        const gui = new dat.GUI();
        this.gui = gui;
        const cameraFolder = gui.addFolder('Camera Controls');
        this.controller = cameraFolder;

        // Remove the 'h' key binding from dat.gui
        gui.__closeButton.style.visibility = 'hidden';
        gui.__proto__.constructor.toggleHide = function() {};

        gui.hide();

        const cameraControls = {
            projectionType: 'Perspective',
            posX: this.activeCamera.position.x,
            posY: this.activeCamera.position.y,
            posZ: this.activeCamera.position.z,
            rotX: 0,
            rotY: 0,
            rotZ: 0
        };

        // Camera type switcher
        cameraFolder.add(cameraControls, 'projectionType', ['Perspective', 'Orthographic'])
            .onChange(value => {
                this.activeCamera = value === 'Perspective' ? 
                    this.perspectiveCamera : this.orthographicCamera;
            });

        // Position controls
        cameraFolder.add(cameraControls, 'posX', -500, 500).onChange((value) => {
            this.cameraX = value;
            this.lookAtPoint.x = (value - this.initX);
            this.perspectiveCamera.position.x = value;
            this.orthographicCamera.position.x = value;
        });

        cameraFolder.add(cameraControls, 'posY', 1, 500).onChange((value) => {
            this.cameraY = value;
            this.lookAtPoint.y = (value - this.initY);
            this.perspectiveCamera.position.y = value;
            this.orthographicCamera.position.y = value;
        });

        cameraFolder.add(cameraControls, 'posZ', -500, 500).onChange((value) => {
            this.cameraZ = value;
            this.lookAtPoint.z = (value - this.initZ);
            this.perspectiveCamera.position.z = value;
            this.orthographicCamera.position.z = value;
        });

        // rotation controls using quaternions
        const euler = new THREE.Euler(0, 0, 0, 'YXZ');
        const quaternion = new THREE.Quaternion().copy(this.initialQuaternion);

        // Look-at controls
        cameraFolder.add(cameraControls, 'rotX', -180, 180).onChange((value) => {
            euler.x = value * (Math.PI / 180);
            quaternion.setFromEuler(euler);
            this.activeCamera.quaternion.copy(quaternion.multiply(this.initialQuaternion));
        });

        cameraFolder.add(cameraControls, 'rotY', -180, 180).onChange((value) => {
            euler.y = -value * (Math.PI / 180);
            quaternion.setFromEuler(euler);
            this.activeCamera.quaternion.copy(quaternion.multiply(this.initialQuaternion));
        });

        cameraFolder.add(cameraControls, 'rotZ', -180, 180).onChange((value) => {
            euler.z = -value * (Math.PI / 180);
            quaternion.setFromEuler(euler);
            this.activeCamera.quaternion.copy(quaternion.multiply(this.initialQuaternion));
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

    onWindowResize() {
        const aspect = window.innerWidth / window.innerHeight;
        
        // Update perspective camera
        this.perspectiveCamera.aspect = aspect;
        this.perspectiveCamera.updateProjectionMatrix();
        
        // Update orthographic camera
        const frustumSize = 50;
        this.orthographicCamera.left = -frustumSize * aspect / 2;
        this.orthographicCamera.right = frustumSize * aspect / 2;
        this.orthographicCamera.top = frustumSize / 2;
        this.orthographicCamera.bottom = -frustumSize / 2;
        this.orthographicCamera.updateProjectionMatrix();
    }

    getActiveCamera() {
        return this.activeCamera;
    }

    // method for camera transition
    transitionCamera() {
        if (this.isTransitioning) return;
        
        if (!this.isTopDown) {
            // Store current camera configuration before going to top-down view
            this.storedPosition = new THREE.Vector3().copy(this.activeCamera.position);
            this.storedLookAt = new THREE.Vector3().copy(this.lookAtPoint);
            this.storedQuaternion = new THREE.Quaternion().copy(this.activeCamera.quaternion);
            
            // Transition to top-down view
            const targetPosition = this.topDownPosition;
            // Create temporary camera to get target rotation
            const tempCamera = this.activeCamera.clone();
            tempCamera.position.copy(targetPosition.pos);
            tempCamera.lookAt(targetPosition.lookAt);
            
            const startPosition = {
                pos: new THREE.Vector3().copy(this.activeCamera.position),
                lookAt: new THREE.Vector3().copy(this.lookAtPoint),
                quaternion: new THREE.Quaternion().copy(this.activeCamera.quaternion)
            };
            
            const endPosition = {
                pos: targetPosition.pos,
                lookAt: targetPosition.lookAt,
                quaternion: tempCamera.quaternion
            };
            
            this.startTransition(startPosition, endPosition);
        } else {
            // Return to stored position
            const targetPosition = {
                pos: this.storedPosition || this.defaultPosition.pos,
                lookAt: this.storedLookAt || this.defaultPosition.lookAt,
                quaternion: this.storedQuaternion || this.activeCamera.quaternion
            };
            
            const startPosition = {
                pos: new THREE.Vector3().copy(this.activeCamera.position),
                lookAt: new THREE.Vector3().copy(this.lookAtPoint),
                quaternion: new THREE.Quaternion().copy(this.activeCamera.quaternion)
            };
            
            this.startTransition(startPosition, targetPosition);
        }
    }

    startTransition(startPosition, targetPosition) {
        this.isTransitioning = true;
        let progress = 0;
        
        const animate = () => {
            if (progress >= 1) {
                this.isTransitioning = false;
                this.isTopDown = !this.isTopDown;
                return;
            }
            
            progress += this.transitionSpeed;
            
            // Interpolate position
            this.activeCamera.position.lerpVectors(
                startPosition.pos,
                targetPosition.pos,
                progress
            );
            
            // Interpolate lookAt point
            this.lookAtPoint.lerpVectors(
                startPosition.lookAt,
                targetPosition.lookAt,
                progress
            );
            
            // Interpolate rotation using quaternion slerp
            this.activeCamera.quaternion.slerpQuaternions(
                startPosition.quaternion,
                targetPosition.quaternion,
                progress
            );
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }

    resetCamera() {
        // Reset position
        this.activeCamera.position.set(this.initX, this.initY, this.initZ);
        
        // Reset look at point
        this.lookAtPoint.set(0, 0, 0);
        
        // Reset rotation using initial quaternion
        this.activeCamera.quaternion.copy(this.initialQuaternion);
        
        // Update GUI controllers
        const controllers = this.controller.__controllers;
        controllers.forEach(controller => {
            switch(controller.property) {
                case 'posX':
                    controller.setValue(this.initX);
                    break;
                case 'posY':
                    controller.setValue(this.initY);
                    break;
                case 'posZ':
                    controller.setValue(this.initZ);
                    break;
                case 'rotX':
                    controller.setValue(-35); 
                    break;
                case 'rotY':
                case 'rotZ':
                    controller.setValue(0);
                    break;
            }
        });
    }
}
