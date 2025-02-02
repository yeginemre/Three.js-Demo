import * as THREE from 'three';
import * as CANNON from "cannon-es";

export class Cube {
    #cubeMesh;
    #cubeBody;
    #shaderState = 0; 
    #textures = null;
    
    constructor(size, Material, x = 0, y = 0, z = 0, isBonus = true) {
        this.isBonus = isBonus;
        this.#textures = {
            diffuse: isBonus ? 'assets/star.png' : 'assets/box.png',
            normal: isBonus ? 'assets/starCube.png' : 'assets/boxNormal.png'
        };
        const cubeGeometry = new THREE.BoxGeometry(size, size, size);

        const cubeMaterial = new THREE.MeshStandardMaterial({
            roughness: 0.7,
            metalness: 0.3
        });

        this.#cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial);
        this.#cubeMesh.userData.parent = this;

        this.#cubeMesh.castShadow = true;
        this.#cubeMesh.receiveShadow = true;

        this.loadTextures();

        const cubeShape = new CANNON.Box(new CANNON.Vec3(size/2, size/2, size/2));
        this.#cubeBody = new CANNON.Body({ 
            mass: 1,
            material: Material,
            linearDamping: 0.4,
            angularDamping: 0.9
        });
        this.#cubeBody.addShape(cubeShape);

        this.#cubeBody.position.set(x, y, z);
        this.#cubeMesh.position.set(x, y, z);
    }

    toggleShaderState() {
        this.#shaderState = (this.#shaderState + 1) % 3;
        if (!this.#cubeMesh) return;

        this.#cubeMesh.material = this.createShaderMaterial();
        this.loadTextures();
    }

    createShaderMaterial() {
        if (this.#shaderState === 0) {
            return new THREE.MeshStandardMaterial({
                roughness: 0.7,
                metalness: 0.3
            });
        } else if (this.#shaderState === 1) {
            // Bump mapping shader
            return new THREE.ShaderMaterial({
                vertexShader: window.shaders.bumpMapVertex,
                fragmentShader: window.shaders.bumpMapFragment,
                uniforms: THREE.UniformsUtils.merge([
                    THREE.UniformsLib['lights'],
                    {
                        diffuseMap: { value: null },
                        normalMap: { value: null },
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
            // Toon shader
            return new THREE.ShaderMaterial({
                vertexShader: window.shaders.toonVertexShader,
                fragmentShader: window.shaders.toonFragmentShader,
                uniforms: THREE.UniformsUtils.merge([
                    THREE.UniformsLib['lights'],
                    {
                        diffuseMap: { value: null },
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

    // Helper method to load textures
    loadTextures() {
        const textureLoader = new THREE.TextureLoader();
        
        // Load diffuse texture
        textureLoader.load(
            this.#textures.diffuse,
            (texture) => {
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.set(1, 1);
                
                if (this.#cubeMesh && this.#cubeMesh.material) {
                    if (this.#shaderState === 0) {
                        this.#cubeMesh.material = new THREE.MeshStandardMaterial({
                            map: texture,
                            roughness: 0.7,
                            metalness: 0.3
                        });
                    } else if (this.#cubeMesh.material.uniforms && this.#cubeMesh.material.uniforms.diffuseMap) {
                        this.#cubeMesh.material.uniforms.diffuseMap.value = texture;
                    }
                }
            }
        );

        // Only load normal map if using bump mapping shader
        if (this.#shaderState === 1) {
            textureLoader.load(
                this.#textures.normal,
                (texture) => {
                    texture.wrapS = THREE.RepeatWrapping;
                    texture.wrapT = THREE.RepeatWrapping;
                    texture.repeat.set(1, 1);
                    if (this.#cubeMesh && 
                        this.#cubeMesh.material && 
                        this.#cubeMesh.material.uniforms && 
                        this.#cubeMesh.material.uniforms.normalMap) {
                        this.#cubeMesh.material.uniforms.normalMap.value = texture;
                    }
                }
            );
        }
    }

    // Method to update shader uniforms
    updateUniforms(spotlightManager) {
        if (!this.#cubeMesh || this.#shaderState === 0 || this.shouldRemove) return;

        const material = this.#cubeMesh.material;
        if (material.type === 'ShaderMaterial' && material.uniforms) {
            // Main spotlight
            const spotlightPos = spotlightManager.spotlight.position.clone();
            const spotlightDir = new THREE.Vector3();
            spotlightDir.subVectors(
                spotlightManager.spotlightTarget.position,
                spotlightManager.spotlight.position
            ).normalize();

            material.uniforms.spotLightPosition.value.copy(spotlightPos);
            material.uniforms.spotLightDirection.value.copy(spotlightDir);
            material.uniforms.spotLightAngle.value = spotlightManager.spotlight.angle;
            material.uniforms.spotLightIntensity.value = 
                spotlightManager.spotlight.intensity / 50.0;
            
            material.uniforms.ambientIntensity.value = spotlightManager.ambientIntensity;

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

                material.uniforms.spotLight2Position.value.copy(leftPos);
                material.uniforms.spotLight2Direction.value.copy(leftDir);
                material.uniforms.spotLight2Angle.value = leftSpotlight.light.angle;
                material.uniforms.spotLight2Intensity.value = leftSpotlight.light.intensity / 50.0;
                material.uniforms.spotLight2Color.value.copy(leftSpotlight.light.color);

                // Right spotlight
                const rightSpotlight = spotlightManager.spotlights[1];
                const rightPos = rightSpotlight.light.position.clone();
                const rightDir = new THREE.Vector3();
                rightDir.subVectors(
                    rightSpotlight.target.position,
                    rightSpotlight.light.position
                ).normalize();

                material.uniforms.spotLight3Position.value.copy(rightPos);
                material.uniforms.spotLight3Direction.value.copy(rightDir);
                material.uniforms.spotLight3Angle.value = rightSpotlight.light.angle;
                material.uniforms.spotLight3Intensity.value = rightSpotlight.light.intensity / 50.0;
                material.uniforms.spotLight3Color.value.copy(rightSpotlight.light.color);
            }
        }
    }

    static createBox(scene, world, position, material, textureUrl = 'assets/box.png') {
        const cube = new Cube(30, material, position.x, position.y, position.z, false);
        cube.add(scene, world);
        return cube;
    }

    animate() {
        this.#cubeMesh.position.copy(this.#cubeBody.position);
        this.#cubeMesh.quaternion.copy(this.#cubeBody.quaternion);
    }

    add(scene, world) {
        scene.add(this.#cubeMesh);
        world.addBody(this.#cubeBody);
    }

    getMesh() {
        return this.#cubeMesh;
    }

    getBody() {
        return this.#cubeBody;
    }

    setX(x) {
        this.#cubeBody.position.x = x;
        this.#cubeMesh.position.x = x;
    }

    setY(y) {
        this.#cubeBody.position.y = y;
        this.#cubeMesh.position.y = y;
    }

    setZ(z) {
        this.#cubeBody.position.z = z;
        this.#cubeMesh.position.z = z;
    }

    rotX(x) {
        this.#cubeMesh.rotation.x = x;
        this.#cubeBody.quaternion.setFromEuler(x, 0, 0);
    }

    rotY(y) {
        this.#cubeMesh.rotation.y = y;
        this.#cubeBody.quaternion.setFromEuler(0, y, 0);
    }

    rotZ(z) {
        this.#cubeMesh.rotation.z = z;
        this.#cubeBody.quaternion.setFromEuler(0, 0, z);
    }

    addX(x) {
        if (this.isBonus && !this.shouldRemove) {
            this.#cubeBody.position.x += x;
            this.#cubeMesh.position.x = this.#cubeBody.position.x;
        }
    }

    angleZ(theta) {
        const currentRotation = this.#cubeMesh.rotation.z;
        const newRotation = currentRotation + theta;
        this.#cubeMesh.rotation.z = newRotation;
        this.#cubeBody.quaternion.setFromEuler(0, 0, newRotation);
    }

    getShaderState() {
        return this.#shaderState;
    }

    setShaderState(state) {
        this.#shaderState = state;
        if (this.#cubeMesh) {
            this.#cubeMesh.material = this.createShaderMaterial();
            this.loadTextures();
        }
    }
} 