import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { sand, woodMat } from './material.js';  

export class Bouncer {
    #bouncerMesh;
    #bouncerBody;
    scene = null;
    world = null;
    #currentMaterial = 'wood';  // default material is wood
    shaderState = 0;  // Default state is bump mapping
    #textures = {
        sand: null,
        wood: null
    };

    constructor(scene, world, x = 0, y = 0, z = 0) {
        this.scene = scene;
        this.world = world;
        this.loader = new GLTFLoader();
        this.textureLoader = new THREE.TextureLoader();
        
        // Load textures including normal maps
        this.#textures = {
            sand: {
                diffuse: this.textureLoader.load('assets/sand.jpg'),
                normal: this.textureLoader.load('assets/groundNormal.jpg', 
                )
            },
            wood: {
                diffuse: this.textureLoader.load('assets/wood.jpg'),
                normal: this.textureLoader.load('assets/woodNormal.png',
                )
            }
        };
        // Create physics body first
        const shape = new CANNON.Box(new CANNON.Vec3(11.2, 30.5, 11.2));
        this.#bouncerBody = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(x, y, z),
            material: woodMat,
            type: CANNON.Body.STATIC
        });
        this.#bouncerBody.addShape(shape);
        this.loadModel(x, y, z);
    }

    switchMaterial() {
        if (!this.#bouncerMesh) return;

        this.#currentMaterial = this.#currentMaterial === 'wood' ? 'sand' : 'wood';
        const physicsMaterial = this.#currentMaterial === 'wood' ? woodMat : sand;
        const textures = this.#textures[this.#currentMaterial];

        this.#bouncerBody.material = physicsMaterial;

        this.#bouncerMesh.traverse((node) => {
            if (node.isMesh) {
                if (this.shaderState === 0) {
                    // Standard material
                    node.material = new THREE.MeshStandardMaterial({
                        map: textures.diffuse,
                        roughness: this.#currentMaterial === 'sand' ? 0.9 : 0.7,
                        metalness: this.#currentMaterial === 'sand' ? 0.0 : 0.1
                    });
                } else if (this.shaderState === 1) {
                    // Bump mapping shader
                    node.material = new THREE.ShaderMaterial({
                        vertexShader: window.shaders.bumpMapVertex,
                        fragmentShader: window.shaders.bumpMapFragment,
                        uniforms: THREE.UniformsUtils.merge([
                            THREE.UniformsLib['lights'],
                            {
                                diffuseMap: { value: textures.diffuse },
                                normalMap: { value: textures.normal },
                                normalScale: { value: new THREE.Vector2(2.0, 2.0) },
                                spotLightPosition: { value: new THREE.Vector3() },
                                spotLightDirection: { value: new THREE.Vector3() },
                                spotLightAngle: { value: Math.PI / 3 },
                                spotLightIntensity: { value: 1.0 },
                                spotLight2Position: { value: new THREE.Vector3() },
                                spotLight2Direction: { value: new THREE.Vector3() },
                                spotLight2Angle: { value: Math.PI / 6 },
                                spotLight2Intensity: { value: 400 / 50.0 },
                                spotLight3Position: { value: new THREE.Vector3() },
                                spotLight3Direction: { value: new THREE.Vector3() },
                                spotLight3Angle: { value: Math.PI / 6 },
                                spotLight3Intensity: { value: 400 / 50.0 },
                                spotLightColor: { value: new THREE.Color(0xffffff) },
                                spotLight2Color: { value: new THREE.Color(0xffaaaa) },
                                spotLight3Color: { value: new THREE.Color(0xaaffaa) },
                                geometryType: { value: 2 },
                                ambientIntensity: { value: 0.3 },
                                emissiveColor: { value: new THREE.Color(0x000000) }
                            }
                        ]),
                        lights: true
                    });
                } else {
                    // Toon shader (state 2)
                    node.material = new THREE.ShaderMaterial({
                        vertexShader: window.shaders.toonVertexShader,
                        fragmentShader: window.shaders.toonFragmentShader,
                        uniforms: THREE.UniformsUtils.merge([
                            THREE.UniformsLib['lights'],
                            {
                                diffuseMap: { value: textures.diffuse },
                                spotLightPosition: { value: new THREE.Vector3() },
                                spotLightDirection: { value: new THREE.Vector3() },
                                spotLightAngle: { value: Math.PI / 3 },
                                spotLightIntensity: { value: 1.0 },
                                spotLight2Position: { value: new THREE.Vector3() },
                                spotLight2Direction: { value: new THREE.Vector3() },
                                spotLight2Angle: { value: Math.PI / 6 },
                                spotLight2Intensity: { value: 400 / 50.0 },
                                spotLight3Position: { value: new THREE.Vector3() },
                                spotLight3Direction: { value: new THREE.Vector3() },
                                spotLight3Angle: { value: Math.PI / 6 },
                                spotLight3Intensity: { value: 400 / 50.0 },
                                spotLightColor: { value: new THREE.Color(0xffffff) },
                                spotLight2Color: { value: new THREE.Color(0xffaaaa) },
                                spotLight3Color: { value: new THREE.Color(0xaaffaa) },
                                geometryType: { value: 2 },
                                ambientIntensity: { value: 0.3 },
                                emissiveColor: { value: new THREE.Color(0x000000) }
                            }
                        ]),
                        lights: true
                    });
                }
            }
        });
    }

    loadModel(x, y, z) {
        this.loader.load(
            'assets/models/bouncer.glb',
            (gltf) => {
                this.#bouncerMesh = gltf.scene;
                
                // Get initial textures
                const textures = this.#textures.wood;
                
                // Set userData on the root mesh
                this.#bouncerMesh.userData.parent = this;
                
                this.#bouncerMesh.traverse((node) => {
                    if (node.isMesh) {
                        node.material = new THREE.MeshStandardMaterial({
                            map: textures.diffuse,
                            roughness: 0.7,
                            metalness: 0.1
                        });
                        node.castShadow = true;
                        node.receiveShadow = true;
                        node.userData.parent = this;
                    }
                });
                
                this.#bouncerMesh.scale.set(1, 1, 1);
                this.#bouncerMesh.position.copy(this.#bouncerBody.position);
                this.#bouncerMesh.quaternion.copy(this.#bouncerBody.quaternion);
                
                this.scene.add(this.#bouncerMesh);
            },
            undefined,
            (error) => {
                console.error('Error loading bouncer model:', error);
            }
        );
    }

    add(scene, world) {
        this.scene = scene;
        this.world = world;
        if (this.#bouncerMesh) scene.add(this.#bouncerMesh);
        if (this.#bouncerBody) world.addBody(this.#bouncerBody);
    }

    animate() {
        if (this.#bouncerMesh && this.#bouncerBody) {
            this.#bouncerMesh.position.copy(this.#bouncerBody.position);
            this.#bouncerMesh.quaternion.copy(this.#bouncerBody.quaternion);
        }
    }

    getMesh() {
        return this.#bouncerMesh;
    }

    getBody() {
        return this.#bouncerBody;
    }

    setX(x) {
        if (this.#bouncerBody) this.#bouncerBody.position.x = x;
        if (this.#bouncerMesh) this.#bouncerMesh.position.x = x;
    }

    setY(y) {
        if (this.#bouncerBody) this.#bouncerBody.position.y = y;
        if (this.#bouncerMesh) this.#bouncerMesh.position.y = y;
    }

    setZ(z) {
        if (this.#bouncerBody) this.#bouncerBody.position.z = z;
        if (this.#bouncerMesh) this.#bouncerMesh.position.z = z;
    }

    rotX(x) {
        if (this.#bouncerMesh) this.#bouncerMesh.rotation.x = x;
        if (this.#bouncerBody) this.#bouncerBody.quaternion.setFromEuler(x, 0, 0);
    }

    rotY(y) {
        if (this.#bouncerMesh) this.#bouncerMesh.rotation.y = y;
        if (this.#bouncerBody) this.#bouncerBody.quaternion.setFromEuler(0, y, 0);
    }

    rotZ(z) {
        if (this.#bouncerMesh) this.#bouncerMesh.rotation.z = z;
        if (this.#bouncerBody) this.#bouncerBody.quaternion.setFromEuler(0, 0, z);
    }
    addX(x) {
        this.#bouncerBody.position.x += x;
    }

    angleZ(theta) {
        // Get current rotation
        const currentRotation = this.#bouncerMesh.rotation.z;
        // Calculate new rotation
        const newRotation = currentRotation + theta;
        const minRotation = -60 * (Math.PI / 180);
        const maxRotation = 60 * (Math.PI / 180);
        // Convert -60 degrees to radians

        
        // Clamp the rotation between min and max values
        const clampedRotation = Math.max(minRotation, Math.min(maxRotation, newRotation));
        
        // Apply clamped rotation to mesh
        this.#bouncerMesh.rotation.z = clampedRotation;
        
        // Create quaternion from Euler angles, preserving X rotation
        const euler = new THREE.Euler(this.#bouncerMesh.rotation.x, 0, clampedRotation, 'XYZ');
        const quaternion = new CANNON.Quaternion();
        quaternion.setFromEuler(euler.x, euler.y, euler.z);
        this.#bouncerBody.quaternion.copy(quaternion);
    }

    angleX(theta) {
        // Get current rotation
        const currentRotation = this.#bouncerMesh.rotation.x;
        // Calculate new rotation
        const newRotation = currentRotation + theta;
        
        // Convert -60 degrees to radians for limits
        const minRotation = -60 * (Math.PI / 180);
        const maxRotation = 0; // Allow positive rotation up to 60 degrees
        
        // Clamp the rotation between min and max values
        const clampedRotation = Math.max(minRotation, Math.min(maxRotation, newRotation));
        
        // Apply clamped rotation to mesh
        this.#bouncerMesh.rotation.x = clampedRotation;
        
        // Create quaternion from Euler angles, preserving Z rotation
        const euler = new THREE.Euler(clampedRotation, 0, this.#bouncerMesh.rotation.z, 'XYZ');
        const quaternion = new CANNON.Quaternion();
        quaternion.setFromEuler(euler.x, euler.y, euler.z);
        this.#bouncerBody.quaternion.copy(quaternion);
    }

    resetRotation() {
        // Reset both mesh and body rotations to initial state (0)
        this.#bouncerMesh.rotation.x = 0;
        this.#bouncerMesh.rotation.z = 0;
        this.#bouncerBody.quaternion.setFromEuler(0, 0, 0);
    }

    getCurrentMaterial() {
        return this.#currentMaterial;
    }

    // method to update shader uniforms
    updateUniforms(spotlightManager) {
        if (!this.#bouncerMesh || this.shaderState === 0) return;

        this.#bouncerMesh.traverse((node) => {
            if (node.isMesh && node.material.type === 'ShaderMaterial') {
                // Main spotlight
                const spotlightPos = spotlightManager.spotlight.position.clone();
                const spotlightDir = new THREE.Vector3();
                spotlightDir.subVectors(
                    spotlightManager.spotlightTarget.position,
                    spotlightManager.spotlight.position
                ).normalize();

                node.material.uniforms.spotLightPosition.value.copy(spotlightPos);
                node.material.uniforms.spotLightDirection.value.copy(spotlightDir);
                node.material.uniforms.spotLightAngle.value = spotlightManager.spotlight.angle;
                node.material.uniforms.spotLightIntensity.value = 
                    spotlightManager.spotlight.intensity / 50.0;
                
                // Update ambient intensity
                node.material.uniforms.ambientIntensity.value = spotlightManager.ambientIntensity;

                // Additional spotlights
                if (spotlightManager.spotlights.length >= 2) {
                    // Left spotlight
                    const leftSpotlight = spotlightManager.spotlights[0];
                    const leftPos = leftSpotlight.light.position.clone();
                    const leftDir = new THREE.Vector3();
                    leftDir.subVectors(
                        leftSpotlight.target.position,
                        leftSpotlight.light.position
                    ).normalize();

                    node.material.uniforms.spotLight2Position.value.copy(leftPos);
                    node.material.uniforms.spotLight2Direction.value.copy(leftDir);
                    node.material.uniforms.spotLight2Angle.value = leftSpotlight.light.angle;
                    node.material.uniforms.spotLight2Intensity.value = leftSpotlight.light.intensity / 50.0;
                    node.material.uniforms.spotLight2Color.value.copy(leftSpotlight.light.color);

                    // Right spotlight
                    const rightSpotlight = spotlightManager.spotlights[1];
                    const rightPos = rightSpotlight.light.position.clone();
                    const rightDir = new THREE.Vector3();
                    rightDir.subVectors(
                        rightSpotlight.target.position,
                        rightSpotlight.light.position
                    ).normalize();

                    node.material.uniforms.spotLight3Position.value.copy(rightPos);
                    node.material.uniforms.spotLight3Direction.value.copy(rightDir);
                    node.material.uniforms.spotLight3Angle.value = rightSpotlight.light.angle;
                    node.material.uniforms.spotLight3Intensity.value = rightSpotlight.light.intensity / 50.0;
                    node.material.uniforms.spotLight3Color.value.copy(rightSpotlight.light.color);
                }
            }
        });
    }

    toggleShaderState() {
        this.shaderState = (this.shaderState + 1) % 3;
        if (!this.#bouncerMesh) return;

        this.#bouncerMesh.traverse((node) => {
            if (node.isMesh) {
                const textures = this.#textures[this.#currentMaterial];
                
                if (this.shaderState === 0) {
                    // Standard material
                    node.material = new THREE.MeshStandardMaterial({
                        map: textures.diffuse,
                        roughness: this.#currentMaterial === 'sand' ? 0.9 : 0.7,
                        metalness: this.#currentMaterial === 'sand' ? 0.0 : 0.1
                    });
                } else if (this.shaderState === 1) {
                    // Bump mapping shader
                    node.material = new THREE.ShaderMaterial({
                        vertexShader: window.shaders.bumpMapVertex,
                        fragmentShader: window.shaders.bumpMapFragment,
                        uniforms: THREE.UniformsUtils.merge([
                            THREE.UniformsLib['lights'],
                            {
                                diffuseMap: { value: textures.diffuse },
                                normalMap: { value: textures.normal },
                                normalScale: { value: new THREE.Vector2(2.0, 2.0) },
                                spotLightPosition: { value: new THREE.Vector3() },
                                spotLightDirection: { value: new THREE.Vector3() },
                                spotLightAngle: { value: Math.PI / 3 },
                                spotLightIntensity: { value: 1.0 },
                                spotLight2Position: { value: new THREE.Vector3() },
                                spotLight2Direction: { value: new THREE.Vector3() },
                                spotLight2Angle: { value: Math.PI / 6 },
                                spotLight2Intensity: { value: 400 / 50.0 },
                                spotLight3Position: { value: new THREE.Vector3() },
                                spotLight3Direction: { value: new THREE.Vector3() },
                                spotLight3Angle: { value: Math.PI / 6 },
                                spotLight3Intensity: { value: 400 / 50.0 },
                                spotLightColor: { value: new THREE.Color(0xffffff) },
                                spotLight2Color: { value: new THREE.Color(0xffaaaa) },
                                spotLight3Color: { value: new THREE.Color(0xaaffaa) },
                                geometryType: { value: 2 },
                                ambientIntensity: { value: 0.3 },
                                emissiveColor: { value: new THREE.Color(0x000000) }
                            }
                        ]),
                        lights: true
                    });
                } else {
                    // Toon shader (state 2)
                    node.material = new THREE.ShaderMaterial({
                        vertexShader: window.shaders.toonVertexShader,
                        fragmentShader: window.shaders.toonFragmentShader,
                        uniforms: THREE.UniformsUtils.merge([
                            THREE.UniformsLib['lights'],
                            {
                                diffuseMap: { value: textures.diffuse },
                                spotLightPosition: { value: new THREE.Vector3() },
                                spotLightDirection: { value: new THREE.Vector3() },
                                spotLightAngle: { value: Math.PI / 3 },
                                spotLightIntensity: { value: 1.0 },
                                spotLight2Position: { value: new THREE.Vector3() },
                                spotLight2Direction: { value: new THREE.Vector3() },
                                spotLight2Angle: { value: Math.PI / 6 },
                                spotLight2Intensity: { value: 400 / 50.0 },
                                spotLight3Position: { value: new THREE.Vector3() },
                                spotLight3Direction: { value: new THREE.Vector3() },
                                spotLight3Angle: { value: Math.PI / 6 },
                                spotLight3Intensity: { value: 400 / 50.0 },
                                spotLightColor: { value: new THREE.Color(0xffffff) },
                                spotLight2Color: { value: new THREE.Color(0xffaaaa) },
                                spotLight3Color: { value: new THREE.Color(0xaaffaa) },
                                geometryType: { value: 2 },
                                ambientIntensity: { value: 0.3 },
                                emissiveColor: { value: new THREE.Color(0x000000) }
                            }
                        ]),
                        lights: true
                    });
                }
            }
        });
    }
} 