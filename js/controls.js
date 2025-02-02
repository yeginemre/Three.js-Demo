import * as dat from 'dat.gui';
import * as THREE from 'three';

export class ObjectManager {
    constructor() {
        this.gui = null;
        this.controls = null;
        this.selectedObject = null;
        this.controller = null;
        this.originalMass = 1;
        this.currentRotation = new THREE.Euler(0, 0, 0, 'XYZ');
        this.quaternion = new THREE.Quaternion();
        this.objectRotations = new Map();
    }

    clearSelection() {
        if (this.selectedObject) {
            // Store current rotation before clearing
            if (this.controls) {
                this.objectRotations.set(this.selectedObject.uuid, {
                    rotX: this.controls.rotX,
                    rotY: this.controls.rotY,
                    rotZ: this.controls.rotZ
                });
            }
            
            // Remove transform controls
            if (this.transformControls) {
                this.transformControls.detach();
            }
            
            // Restore physics properties only if object has a physics body
            const instance = this.selectedObject.userData.parent;
            if (instance && instance.getBody && instance.getBody()) {
                const body = instance.getBody();
                body.mass = this.originalMass;
                body.updateMassProperties();
            }
            
            // Clear material highlighting based on material type
            if (this.selectedObject.material) {
                if (this.selectedObject.material.type === 'ShaderMaterial') {
                    const uniforms = this.selectedObject.material.uniforms;
                    if (uniforms && uniforms.emissiveColor) {
                        uniforms.emissiveColor.value.setHex(0x000000);
                    }
                } else if (this.selectedObject.material.emissive) {
                    this.selectedObject.material.emissive.setHex(0x000000);
                }
            }
            
            // Reset GUI and rotation state
            if (this.gui) {
                this.gui.destroy();
                this.gui = null;
            }
            this.currentRotation.set(0, 0, 0);
            this.quaternion.identity();
            
            this.selectedObject = null;
        }
    }

    createControls(object) {
        if (this.gui) this.gui.destroy();
        
        const instance = object.userData.parent;
        
        // Get stored rotation or use current object rotation
        const storedRotation = this.objectRotations.get(object.uuid);
        let rotX, rotY, rotZ;
        
        if (storedRotation) {
            // Use stored values
            rotX = storedRotation.rotX;
            rotY = storedRotation.rotY;
            rotZ = storedRotation.rotZ;
            
            this.currentRotation.set(
                -rotX * Math.PI / 180,
                -rotY * Math.PI / 180,
                -rotZ * Math.PI / 180
            );
            this.quaternion.setFromEuler(this.currentRotation);
        } else {
            // Initialize from current object state
            if (instance) {
                if (instance.getBody && instance.getBody()) {
                    const bodyQuat = instance.getBody().quaternion;
                    this.quaternion.set(bodyQuat.x, bodyQuat.y, bodyQuat.z, bodyQuat.w);
                    this.currentRotation.setFromQuaternion(this.quaternion);
                } else {
                    this.currentRotation.copy(object.rotation);
                    this.quaternion.setFromEuler(this.currentRotation);
                }
            } else {
                this.currentRotation.copy(object.rotation);
                this.quaternion.setFromEuler(this.currentRotation);
            }
            
            // Convert to degrees for the controls
            rotX = -this.currentRotation.x * 180 / Math.PI;
            rotY = -this.currentRotation.y * 180 / Math.PI;
            rotZ = -this.currentRotation.z * 180 / Math.PI;
        }

        // Stop physics simulation only for physics objects
        if (instance && instance.getBody && instance.getBody()) {
            const body = instance.getBody();
            this.originalMass = body.mass;
            body.mass = 0;
            body.velocity.set(0, 0, 0);
            body.angularVelocity.set(0, 0, 0);
            body.updateMassProperties();
        }

        // Get object radius/size, handle both basic geometries and GLTF models
        let radius = 1; // Default value
        if (object.geometry && object.geometry.parameters) {
            radius = object.geometry.parameters.radius || object.geometry.parameters.width/2 || 1;
        }
        
        this.gui = new dat.GUI({ width: 300 });
        
        // Initialize controls with current object position and rotation
        this.controls = {
            posX: instance ? (instance.getBody ? instance.getBody()?.position.x || object.position.x : object.position.x) : object.position.x,
            posY: instance ? (instance.getBody ? instance.getBody()?.position.y || object.position.y : object.position.y) : object.position.y,
            posZ: instance ? (instance.getBody ? instance.getBody()?.position.z || object.position.z : object.position.z) : object.position.z,
            rotX: rotX,
            rotY: rotY,
            rotZ: rotZ
        };

        const objectFolder = this.gui.addFolder('Object');
        this.controller = objectFolder;
        
        objectFolder.add(this.controls, 'posX', -500, 500).onChange((value) => {
            if (instance && instance.setX) {
                instance.setX(value);
            } else {
                object.position.x = value;
            }
        });
        objectFolder.add(this.controls, 'posY', 0, 500).onChange((value) => {
            if (instance && instance.setY) {
                instance.setY(value);
            } else {
                object.position.y = value;
            }
        });
        objectFolder.add(this.controls, 'posZ', -500, 500).onChange((value) => {
            if (instance && instance.setZ) {
                instance.setZ(value);
            } else {
                object.position.z = value;
            }
        });
        objectFolder.add(this.controls, 'rotX', -180, 180).onChange((value) => {
            this.currentRotation.x =  - value * Math.PI / 180;
            this.quaternion.setFromEuler(this.currentRotation);
            
            if (instance) {
                if (instance.getBody && instance.getBody()) {
                    // For physics objects
                    const body = instance.getBody();
                    body.quaternion.copy(this.quaternion);
                    instance.getMesh().quaternion.copy(this.quaternion);
                } else {
                    // For non-physics objects
                    object.rotation.x = - value * Math.PI / 180;
                    object.quaternion.setFromEuler(object.rotation);
                }
            } else {
                object.quaternion.copy(this.quaternion);
            }
        });
        objectFolder.add(this.controls, 'rotY', -180, 180).onChange((value) => {
            this.currentRotation.y = - value * Math.PI / 180;
            this.quaternion.setFromEuler(this.currentRotation);
            
            if (instance) {
                if (instance.getBody && instance.getBody()) {
                    // For physics objects
                    const body = instance.getBody();
                    body.quaternion.copy(this.quaternion);
                    instance.getMesh().quaternion.copy(this.quaternion);
                } else {
                    // For non-physics objects
                    object.rotation.y = - value * Math.PI / 180;
                    object.quaternion.setFromEuler(object.rotation);
                }
            } else {
                object.quaternion.copy(this.quaternion);
            }
        });
        objectFolder.add(this.controls, 'rotZ', -180, 180).onChange((value) => {
            this.currentRotation.z = - value * Math.PI / 180;
            this.quaternion.setFromEuler(this.currentRotation);
            
            if (instance) {
                if (instance.getBody && instance.getBody()) {
                    // For physics objects
                    const body = instance.getBody();
                    body.quaternion.copy(this.quaternion);
                    instance.getMesh().quaternion.copy(this.quaternion);
                } else {
                    // For non-physics objects
                    object.rotation.z = - value * Math.PI / 180;
                    object.quaternion.setFromEuler(object.rotation);
                }
            } else {
                object.quaternion.copy(this.quaternion);
            }
        });
        objectFolder.open();
    }

    openMenu(){
        this.controller.open();
    }

    closeMenu(){
        this.controller.close();
}
}