import * as THREE from 'three';
import * as CANNON from "cannon-es";
import { metal,rubberMat,tennisBall,balloonMat } from './material.js';
import { TextureLoader } from 'three';

export class Ball {
    #ballMesh;
    #ballBody;
    #shaderState = 0; 
    #textures = null;
    scene = null;
    world = null;
    static bonusBallTexture = new TextureLoader().load('assets/star.png');
    constructor(radius, Material, x = 0, y = 20, z = 0, isBonusBall = false, initialShaderState = 0) {
        this.#shaderState = initialShaderState;
        
        // Add bonus ball creation
        if (isBonusBall) {
            const sphereGeometry = new THREE.SphereGeometry(radius, 32, 32);
            Ball.bonusBallTexture.wrapS = THREE.RepeatWrapping;
            Ball.bonusBallTexture.wrapT = THREE.RepeatWrapping;
            this.#textures = {
                diffuse: 'assets/star.png',
                normal: 'assets/starBall.png'
            };
            const sphereMaterial = new THREE.MeshStandardMaterial({
                roughness: 0.7,
                metalness: 0.3
            });
            
            this.#ballMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
            this.#ballMesh.userData.parent = this;
            
            this.#ballMesh.castShadow = true;
            this.#ballMesh.receiveShadow = true;

            const sphereShape = new CANNON.Sphere(radius);
            this.#ballBody = new CANNON.Body({ 
                mass: 15,
                material: Material,
                position: new CANNON.Vec3(x, y, z)
            });
            this.#ballBody.addShape(sphereShape);

            this.#ballMesh.position.set(x, y, z);

            this.loadTextures();
            if (initialShaderState > 0) {
                this.#ballMesh.material = this.createShaderMaterial();
                this.loadTextures();
            }
            
            return;
        }

        // Metal ball creation
        if (Material === metal) {
            this.#textures = {
                diffuse: 'assets/metal2.jpg',
                normal: 'assets/metalNormal.png'
            };
            
            const sphereGeometry = new THREE.SphereGeometry(radius, 32, 32);
            const sphereMaterial = new THREE.MeshStandardMaterial({
                roughness: 0.7,
                metalness: 0.3
            });
            
            this.#ballMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
            this.#ballMesh.userData.parent = this;
            
            this.#ballMesh.castShadow = true;
            this.#ballMesh.receiveShadow = true;

            this.loadTextures();

            const sphereShape = new CANNON.Sphere(radius);
            this.#ballBody = new CANNON.Body({ 
                mass: 1, 
                material: Material,
                position: new CANNON.Vec3(x, y, z)
            });
            this.#ballBody.addShape(sphereShape);
            
            this.#ballMesh.position.set(x, y, z);
            
            if (initialShaderState > 0) {
                this.#ballMesh.material = this.createShaderMaterial();
                this.loadTextures();
            }
        }

        // Rubber ball creation
        if (Material === rubberMat) {
            this.#textures = {
                diffuse: 'assets/rubber2.jpg',
                normal: 'assets/rubberNormal.png'
            };
            
            const sphereGeometry = new THREE.SphereGeometry(radius, 32, 32);
            const sphereMaterial = new THREE.MeshStandardMaterial({
                roughness: 0.7,
                metalness: 0.3
            });
            
            this.#ballMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
            this.#ballMesh.userData.parent = this;
            
            this.#ballMesh.castShadow = true;
            this.#ballMesh.receiveShadow = true;

            this.loadTextures();

            const sphereShape = new CANNON.Sphere(radius);
            this.#ballBody = new CANNON.Body({ 
                mass: 0.8,
                material: Material,
                position: new CANNON.Vec3(x, y, z)
            });
            this.#ballBody.addShape(sphereShape);
            
            this.#ballMesh.position.set(x, y, z);
            
            if (initialShaderState > 0) {
                this.#ballMesh.material = this.createShaderMaterial();
                this.loadTextures();
            }
        }

        if (Material === tennisBall) {
            this.#textures = {
                diffuse: 'assets/tennis.jpg',
                normal: 'assets/tennisNormal.png'
            };
            
            const sphereGeometry = new THREE.SphereGeometry(radius, 32, 32);
            const sphereMaterial = new THREE.MeshStandardMaterial({
                roughness: 0.7,
                metalness: 0.3
            });
            
            this.#ballMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
            this.#ballMesh.userData.parent = this;
            
            this.#ballMesh.castShadow = true;
            this.#ballMesh.receiveShadow = true;

            this.loadTextures();

            const sphereShape = new CANNON.Sphere(radius);
            this.#ballBody = new CANNON.Body({ 
                mass: 5,
                material: Material,
                position: new CANNON.Vec3(x, y, z)
            });
            this.#ballBody.addShape(sphereShape);
            
            this.#ballMesh.position.set(x, y, z);
            
            if (initialShaderState > 0) {
                this.#ballMesh.material = this.createShaderMaterial();
                this.loadTextures();
            }
            return;
        }

        // Add balloon ball creation
        if (Material === balloonMat) {
            const sphereGeometry = new THREE.SphereGeometry(radius, 32, 32);

            this.#textures = {
                diffuse: 'assets/balloon.jpg',
                normal: 'assets/balloonNormal.jpg'
            };
            
            const sphereMaterial = new THREE.MeshStandardMaterial({
                roughness: 0.7,
                metalness: 0.3
            });
            
            this.#ballMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
            this.#ballMesh.userData.parent = this;
            
            this.#ballMesh.castShadow = true;
            this.#ballMesh.receiveShadow = true;

            this.loadTextures();

            const sphereShape = new CANNON.Sphere(radius);
            this.#ballBody = new CANNON.Body({ 
                mass: 0.3,
                material: Material,
                position: new CANNON.Vec3(x, y, z),
                linearDamping: 0.1,
                angularDamping: 0.2
            });
            this.#ballBody.addShape(sphereShape);
            
            this.#ballMesh.position.set(x, y, z);
            
            if (initialShaderState > 0) {
                this.#ballMesh.material = this.createShaderMaterial();
                this.loadTextures();
            }
            return;
        }
    }

    animate() {
        if (this.#ballMesh && this.#ballBody) {
            this.#ballMesh.position.copy(this.#ballBody.position);
            this.#ballMesh.quaternion.copy(this.#ballBody.quaternion);
        }
    }

    add(scene, world) {
        this.scene = scene;
        this.world = world;

        if (this.#ballMesh && this.#ballBody) {
            scene.add(this.#ballMesh);
            world.addBody(this.#ballBody);
        }
    }

    getMesh() {
        return this.#ballMesh;
    }

    getBody() {
        return this.#ballBody;
    }

    setX(x) {
        if (this.#ballBody) this.#ballBody.position.x = x;
        if (this.#ballMesh) this.#ballMesh.position.x = x;
    }

    setY(y) {
        if (this.#ballBody) this.#ballBody.position.y = y;
        if (this.#ballMesh) this.#ballMesh.position.y = y;
    }

    setZ(z) {
        if (this.#ballBody) this.#ballBody.position.z = z;
        if (this.#ballMesh) this.#ballMesh.position.z = z;
    }

    rotX(x) {
        if (this.#ballMesh) this.#ballMesh.rotation.x = x;
        if (this.#ballBody) this.#ballBody.quaternion.setFromEuler(x, 0, 0);
    }

    rotY(y) {
        if (this.#ballMesh) this.#ballMesh.rotation.y = y;
        if (this.#ballBody) this.#ballBody.quaternion.setFromEuler(0, y, 0);
    }

    rotZ(z) {
        if (this.#ballMesh) this.#ballMesh.rotation.z = z;
        if (this.#ballBody) this.#ballBody.quaternion.setFromEuler(0, 0, z);
    }

    updateLighting(lightPosition, lightDirection) {
        if (this.#ballMesh && this.#ballMesh.material.type === 'ShaderMaterial') {
            this.#ballMesh.material.uniforms.spotLightPosition.value.copy(lightPosition);
            this.#ballMesh.material.uniforms.spotLightDirection.value.copy(lightDirection);
        }
    }

    // helper method to create shader material
    createShaderMaterial() {
        if (this.#shaderState === 0) {
            return new THREE.MeshStandardMaterial({
                color: 0xcccccc,
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
                        normalScale: { value: new THREE.Vector2(1.5, 1.5) },
                        spotLightPosition: { value: new THREE.Vector3() },
                        spotLightDirection: { value: new THREE.Vector3() },
                        spotLightAngle: { value: Math.PI / 4 },
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
                        spotLightAngle: { value: Math.PI / 4 },
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

    // Add helper method to load textures
    loadTextures() {
        if (!this.#textures) return;
        
        const textureLoader = new THREE.TextureLoader();
        
        // Load diffuse texture
        textureLoader.load(
            this.#textures.diffuse,
            (texture) => {
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                if (this.#shaderState === 0) {
                    this.#ballMesh.material = new THREE.MeshStandardMaterial({
                        map: texture,
                        roughness: 0.7,
                        metalness: 0.3
                    });
                } else if (this.#ballMesh.material.uniforms && this.#ballMesh.material.uniforms.diffuseMap) {
                    this.#ballMesh.material.uniforms.diffuseMap.value = texture;
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
                    if (this.#ballMesh.material.uniforms && this.#ballMesh.material.uniforms.normalMap) {
                        this.#ballMesh.material.uniforms.normalMap.value = texture;
                    }
                }
            );
        }
    }

    // Add method to update shader uniforms
    updateUniforms(spotlightManager) {
        if (!this.#ballMesh || this.#shaderState === 0 || 
            this.shouldRemove || this.vanishingMaterial) return;

        const material = this.#ballMesh.material;
        if (material.type === 'ShaderMaterial' && material.uniforms) {
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
            
            // Update ambient intensity
            if (material.uniforms.ambientIntensity) {
                material.uniforms.ambientIntensity.value = spotlightManager.ambientIntensity;
            }
        }
    }

    toggleShaderState() {
        this.#shaderState = (this.#shaderState + 1) % 3;
        if (!this.#ballMesh || !this.#textures) return;

        this.#ballMesh.material = this.createShaderMaterial();

        this.loadTextures();
    }
}