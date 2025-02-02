import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { groundMat } from './material.js';

export class Ground {
    constructor(scene, world, gameMode, spotlightManager) {
        this.scene = scene;
        this.world = world;
        this.gameMode = gameMode;
        this.zones = [];
        this.meshes = [];
        this.bodies = [];
        this.oscillationSpeed = 1;
        this.oscillationAmplitude = 60;
        this.time = 0;
        this.highlightedZone = null;
        this.highlightTimeout = null;
        this.spotlightManager = spotlightManager;
        this.shaderState = 0;  // Default to no bump mapping
        // Create all grounds
        this.createFlatGround();
        this.createSecondGround();
        this.createGround();

        const groundMaterial = new THREE.ShaderMaterial({
            uniforms: {
                ambientIntensity: { value: spotlightManager.ambientIntensity }
            }
        });

        spotlightManager.setGroundMaterial(groundMaterial);
    }

    createFlatGround() {
        // Create flat ground
        const flatGroundGeometry = new THREE.PlaneGeometry(750, 750, 200, 200);
        const flatGroundTexture = new THREE.TextureLoader().load('./assets/ground.jpg');
        const normalMap = new THREE.TextureLoader().load('./assets/groundNormal.jpg');

        flatGroundTexture.wrapS = THREE.RepeatWrapping;
        flatGroundTexture.wrapT = THREE.RepeatWrapping;
        flatGroundTexture.repeat.set(4, 4);
        flatGroundTexture.magFilter = THREE.LinearFilter;
        flatGroundTexture.minFilter = THREE.LinearMipmapLinearFilter;

        normalMap.wrapS = THREE.RepeatWrapping;
        normalMap.wrapT = THREE.RepeatWrapping;
        normalMap.repeat.set(4, 4);
        normalMap.magFilter = THREE.LinearFilter;
        normalMap.minFilter = THREE.LinearMipmapLinearFilter;

        // Create both materials
        this.bumpMaterial = new THREE.ShaderMaterial({
            vertexShader: window.shaders.bumpMapVertex,
            fragmentShader: window.shaders.bumpMapFragment,
            uniforms: THREE.UniformsUtils.merge([
                THREE.UniformsLib['lights'],
                {
                    diffuseMap: { value: flatGroundTexture },
                    normalMap: { value: normalMap },
                    spotLightPosition: { value: new THREE.Vector3() },
                    spotLightDirection: { value: new THREE.Vector3() },
                    spotLightAngle: { value: this.spotlightManager.spotlight.angle },
                    spotLightIntensity: { value: this.spotlightManager.spotlight.intensity },
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
                    geometryType: { value: 0 },
                    ambientIntensity: { value: this.spotlightManager.ambientIntensity }
                }
            ]),
            lights: true
        });

        this.simpleMaterial = new THREE.MeshStandardMaterial({
            map: flatGroundTexture,
            roughness: 0.8,
            metalness: 0.2
        });

        this.flatGround = new THREE.Mesh(flatGroundGeometry, this.simpleMaterial);
        this.flatGround.rotation.x = -Math.PI / 2;
        this.flatGround.position.set(0, -0.2, 300);

        this.flatGround.receiveShadow = true;
        this.scene.add(this.flatGround);

        // Add physics body for the flat ground
        const flatGroundShape = new CANNON.Plane();
        this.flatGroundBody = new CANNON.Body({
            mass: 0,
            material: groundMat,
            type: CANNON.Body.STATIC
        });
        this.flatGroundBody.addShape(flatGroundShape);
        this.flatGroundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
        this.flatGroundBody.position.y = -0.2;
        this.world.addBody(this.flatGroundBody);

        this.updateGroundUniforms = () => {
            // Main spotlight
            const spotlightPos = this.spotlightManager.spotlight.position.clone();
            const spotlightDir = new THREE.Vector3();
            spotlightDir.subVectors(
                this.spotlightManager.spotlightTarget.position,
                this.spotlightManager.spotlight.position
            ).normalize();

            // Update uniforms for main spotlight
            this.bumpMaterial.uniforms.spotLightPosition.value.copy(spotlightPos);
            this.bumpMaterial.uniforms.spotLightDirection.value.copy(spotlightDir);
            this.bumpMaterial.uniforms.spotLightAngle.value = this.spotlightManager.spotlight.angle;
            this.bumpMaterial.uniforms.spotLightIntensity.value = 
                this.spotlightManager.spotlight.intensity / 50.0;

            // Add uniforms for additional spotlights
            if (this.spotlightManager.spotlights.length >= 2) {
                // Left spotlight
                const leftSpotlight = this.spotlightManager.spotlights[0];
                const leftPos = leftSpotlight.light.position.clone();
                const leftDir = new THREE.Vector3();
                leftDir.subVectors(
                    leftSpotlight.target.position,
                    leftSpotlight.light.position
                ).normalize();

                this.bumpMaterial.uniforms.spotLight2Position.value.copy(leftPos);
                this.bumpMaterial.uniforms.spotLight2Direction.value.copy(leftDir);
                this.bumpMaterial.uniforms.spotLight2Angle.value = leftSpotlight.light.angle;
                this.bumpMaterial.uniforms.spotLight2Intensity.value = leftSpotlight.light.intensity / 50.0;
                this.bumpMaterial.uniforms.spotLight2Color.value.copy(leftSpotlight.light.color);

                // Right spotlight
                const rightSpotlight = this.spotlightManager.spotlights[1];
                const rightPos = rightSpotlight.light.position.clone();
                const rightDir = new THREE.Vector3();
                rightDir.subVectors(
                    rightSpotlight.target.position,
                    rightSpotlight.light.position
                ).normalize();

                this.bumpMaterial.uniforms.spotLight3Position.value.copy(rightPos);
                this.bumpMaterial.uniforms.spotLight3Direction.value.copy(rightDir);
                this.bumpMaterial.uniforms.spotLight3Angle.value = rightSpotlight.light.angle;
                this.bumpMaterial.uniforms.spotLight3Intensity.value = rightSpotlight.light.intensity / 50.0;
                this.bumpMaterial.uniforms.spotLight3Color.value.copy(rightSpotlight.light.color);
            }
        };

        // Add toon materials
        this.toonMaterial = new THREE.ShaderMaterial({
            vertexShader: window.shaders.toonVertexShader,
            fragmentShader: window.shaders.toonFragmentShader,
            uniforms: THREE.UniformsUtils.merge([
                THREE.UniformsLib['lights'],
                {
                    diffuseMap: { value: flatGroundTexture },
                    spotLightPosition: { value: new THREE.Vector3() },
                    spotLightDirection: { value: new THREE.Vector3() },
                    spotLightAngle: { value: this.spotlightManager.spotlight.angle },
                    spotLightIntensity: { value: this.spotlightManager.spotlight.intensity },
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
                    geometryType: { value: 0 },
                    ambientIntensity: { value: this.spotlightManager.ambientIntensity },
                    emissiveColor: { value: new THREE.Color(0x000000) }
                }
            ]),
            lights: true
        });
    }

    createSecondGround() {
        // Create second ground
        const secondGroundGeometry = new THREE.PlaneGeometry(700, 350, 200, 200);
        const secondGroundTexture = new THREE.TextureLoader().load('./assets/ground.jpg');
        const secondGroundNormalMap = new THREE.TextureLoader().load('./assets/groundNormal.jpg');
        
        // Set texture wrapping and repeat for both textures
        secondGroundTexture.wrapS = THREE.RepeatWrapping;
        secondGroundTexture.wrapT = THREE.RepeatWrapping;
        secondGroundTexture.repeat.set(4, 4);
        secondGroundTexture.magFilter = THREE.LinearFilter;
        secondGroundTexture.minFilter = THREE.LinearMipmapLinearFilter;

        secondGroundNormalMap.wrapS = THREE.RepeatWrapping;
        secondGroundNormalMap.wrapT = THREE.RepeatWrapping;
        secondGroundNormalMap.repeat.set(4, 4);
        secondGroundNormalMap.magFilter = THREE.LinearFilter;
        secondGroundNormalMap.minFilter = THREE.LinearMipmapLinearFilter;

        // Create both materials for second ground with all three spotlights
        this.secondGroundBumpMaterial = new THREE.ShaderMaterial({
            vertexShader: window.shaders.bumpMapVertex,
            fragmentShader: window.shaders.bumpMapFragment,
            uniforms: THREE.UniformsUtils.merge([
                THREE.UniformsLib['lights'],
                {
                    diffuseMap: { value: secondGroundTexture },
                    normalMap: { value: secondGroundNormalMap },
                    // Main spotlight uniforms
                    spotLightPosition: { value: new THREE.Vector3() },
                    spotLightDirection: { value: new THREE.Vector3() },
                    spotLightAngle: { value: this.spotlightManager.spotlight.angle },
                    spotLightIntensity: { value: this.spotlightManager.spotlight.intensity },
                    // Additional spotlights uniforms
                    spotLight2Position: { value: new THREE.Vector3() },
                    spotLight2Direction: { value: new THREE.Vector3() },
                    spotLight2Angle: { value: Math.PI / 6 },
                    spotLight2Intensity: { value: 400 / 50.0 },
                    spotLight3Position: { value: new THREE.Vector3() },
                    spotLight3Direction: { value: new THREE.Vector3() },
                    spotLight3Angle: { value: Math.PI / 6 },
                    spotLight3Intensity: { value: 400 / 50.0 },
                    spotLightColor: { value: new THREE.Color(0xffffff) },    // White for main spotlight
                    spotLight2Color: { value: new THREE.Color(0xffaaaa) },   // Reddish for left spotlight
                    spotLight3Color: { value: new THREE.Color(0xaaffaa) },   // Greenish for right spotlight
                    geometryType: { value: 0 },
                    ambientIntensity: { value: this.spotlightManager.ambientIntensity }
                }
            ]),
            lights: true
        });

        this.secondGroundSimpleMaterial = new THREE.MeshStandardMaterial({
            map: secondGroundTexture,
            roughness: 0.8,
            metalness: 0.2
        });

        this.secondGround = new THREE.Mesh(
            secondGroundGeometry, 
            this.secondGroundSimpleMaterial
        );
        this.secondGround.rotation.x = -Math.PI / 2;
        this.secondGround.position.set(500, -0.1, -700);
        this.secondGround.receiveShadow = true;
        this.scene.add(this.secondGround);

        // Add physics body for the second ground
        const secondGroundShape = new CANNON.Plane();
        this.secondGroundBody = new CANNON.Body({
            mass: 0,
            material: groundMat,
            type: CANNON.Body.STATIC
        });
        this.secondGroundBody.addShape(secondGroundShape);
        this.secondGroundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
        this.secondGroundBody.position.set(0, -0.1, 500);
        this.world.addBody(this.secondGroundBody);

        const wallHeight = 19.9;
        const wallThickness = 2;
        const groundWidth = 700;
        const groundDepth = 350;
        
        const wallGeometry = new THREE.PlaneGeometry(groundDepth, wallHeight);
        const backWallGeometry = new THREE.PlaneGeometry(groundWidth + wallThickness * 2, wallHeight);
        
        const wallMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            side: THREE.DoubleSide
        });

        const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
        leftWall.position.set(-groundWidth/2 + 500, -10.05, -700); 
        leftWall.rotation.y = -Math.PI / 2; 
        this.scene.add(leftWall);

        const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
        rightWall.rotation.y = -Math.PI / 2;
        rightWall.position.set(groundWidth/2 + 500, -10.05, -700);
        this.scene.add(rightWall);

        const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
        backWall.rotation.y = Math.PI;
        
        backWall.position.set(500, -10.05, -150 - groundDepth/2 - 200);
        this.scene.add(backWall);

        // Add toon materials
        this.secondGroundToonMaterial = new THREE.ShaderMaterial({
            vertexShader: window.shaders.toonVertexShader,
            fragmentShader: window.shaders.toonFragmentShader,
            uniforms: THREE.UniformsUtils.merge([
                THREE.UniformsLib['lights'],
                {
                    diffuseMap: { value: secondGroundTexture },
                    spotLightPosition: { value: new THREE.Vector3() },
                    spotLightDirection: { value: new THREE.Vector3() },
                    spotLightAngle: { value: this.spotlightManager.spotlight.angle },
                    spotLightIntensity: { value: this.spotlightManager.spotlight.intensity },
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
                    geometryType: { value: 0 },
                    ambientIntensity: { value: this.spotlightManager.ambientIntensity },
                    emissiveColor: { value: new THREE.Color(0x000000) }
                }
            ]),
            lights: true
        });
    }

    createGround() {
        const radius = 80;
        const geometry = new THREE.CircleGeometry(radius, 64);
        
        // Load textures
        const texture = new THREE.TextureLoader().load('./assets/target.jpg');
        const normalMap = new THREE.TextureLoader().load('./assets/circleNormal.png');
        
        // Remove texture wrapping for both textures
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        normalMap.wrapS = THREE.ClampToEdgeWrapping;
        normalMap.wrapT = THREE.ClampToEdgeWrapping;
        
        // Create materials using custom shaders
        this.targetBumpMaterial = new THREE.ShaderMaterial({
            vertexShader: window.shaders.bumpMapVertex,
            fragmentShader: window.shaders.bumpMapFragment,
            uniforms: THREE.UniformsUtils.merge([
                THREE.UniformsLib['lights'],
                {
                    diffuseMap: { value: texture },
                    normalMap: { value: normalMap },
                    spotLightPosition: { value: new THREE.Vector3() },
                    spotLightDirection: { value: new THREE.Vector3() },
                    spotLightAngle: { value: this.spotlightManager.spotlight.angle },
                    spotLightIntensity: { value: this.spotlightManager.spotlight.intensity },
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
                    geometryType: { value: 1 },
                    ambientIntensity: { value: this.spotlightManager.ambientIntensity }
                }
            ]),
            lights: true
        });

        this.targetSimpleMaterial = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.8,
            metalness: 0.1
        });

        const mesh = new THREE.Mesh(geometry, this.targetSimpleMaterial);
        mesh.rotation.x = -Math.PI / 2;
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        this.meshes = [mesh];
        this.originalTexture = texture;

        const shape = new CANNON.Plane();
        const body = new CANNON.Body({
            mass: 0,
            material: groundMat,
            type: CANNON.Body.STATIC,
            collisionResponse: true
        });
        body.addShape(shape);
        body.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
        this.world.addBody(body);
        this.bodies = [body];

        this.zones = [{
            name: 'target',
            radius: radius,
            body: body
        }];

        // Add toon materials
        this.targetToonMaterial = new THREE.ShaderMaterial({
            vertexShader: window.shaders.toonVertexShader,
            fragmentShader: window.shaders.toonFragmentShader,
            uniforms: THREE.UniformsUtils.merge([
                THREE.UniformsLib['lights'],
                {
                    diffuseMap: { value: texture },
                    spotLightPosition: { value: new THREE.Vector3() },
                    spotLightDirection: { value: new THREE.Vector3() },
                    spotLightAngle: { value: this.spotlightManager.spotlight.angle },
                    spotLightIntensity: { value: this.spotlightManager.spotlight.intensity },
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
                    geometryType: { value: 1 },
                    ambientIntensity: { value: this.spotlightManager.ambientIntensity },
                    emissiveColor: { value: new THREE.Color(0x000000) }
                }
            ]),
            lights: true
        });
    }

    update() {
        this.time += window.animation_multiplier * 0.016;
        const offsetX = Math.sin(this.time * this.oscillationSpeed) * this.oscillationAmplitude;
        
        const offsetZ = this.gameMode === 'challenge' ? 
            Math.sin(this.time / 2 * this.oscillationSpeed) * this.oscillationAmplitude / 3 : 
            0;
        
        // Update positions
        this.meshes.forEach(mesh => {
            mesh.position.x = offsetX;
            mesh.position.z = offsetZ;
            
            // Update shader uniforms if using any custom shader
            if ((this.shaderState === 1 || this.shaderState === 2) && mesh.material.type === 'ShaderMaterial') {
                this.updateMeshUniforms(mesh);
            }
        });
        
        this.bodies.forEach(body => {
            body.position.x = offsetX;
            body.position.z = offsetZ;
        });

        // Update flat ground shader uniforms
        if (this.updateGroundUniforms && (this.shaderState === 1 || this.shaderState === 2)) {
            // Update main ground uniforms based on shader state
            if (this.shaderState === 1) {
                this.updateGroundUniforms();
                if (this.bumpMaterial.uniforms) {
                    this.bumpMaterial.uniforms.ambientIntensity.value = this.spotlightManager.ambientIntensity;
                }
            } else if (this.shaderState === 2) {
                // Update toon shader uniforms
                this.updateMeshUniforms(this.flatGround);
            }
        }

        // Update second ground shader uniforms
        if ((this.shaderState === 1 || this.shaderState === 2) && this.secondGround.material.type === 'ShaderMaterial') {
            this.updateMeshUniforms(this.secondGround);
        }
    }
    
    updateMeshUniforms(mesh) {
        if (!mesh.material.uniforms) return;

        // Main spotlight
        const spotlightPos = this.spotlightManager.spotlight.position.clone();
        const spotlightDir = new THREE.Vector3();
        spotlightDir.subVectors(
            this.spotlightManager.spotlightTarget.position,
            this.spotlightManager.spotlight.position
        ).normalize();

        mesh.material.uniforms.spotLightPosition.value.copy(spotlightPos);
        mesh.material.uniforms.spotLightDirection.value.copy(spotlightDir);
        mesh.material.uniforms.spotLightAngle.value = this.spotlightManager.spotlight.angle;
        mesh.material.uniforms.spotLightIntensity.value = 
            this.spotlightManager.spotlight.intensity / 50.0;
        
        mesh.material.uniforms.ambientIntensity.value = this.spotlightManager.ambientIntensity;

        // Additional spotlights
        if (this.spotlightManager.spotlights.length >= 2) {
            // Left spotlight
            const leftSpotlight = this.spotlightManager.spotlights[0];
            const leftPos = leftSpotlight.light.position.clone();
            const leftDir = new THREE.Vector3();
            leftDir.subVectors(
                leftSpotlight.target.position,
                leftSpotlight.light.position
            ).normalize();

            mesh.material.uniforms.spotLight2Position.value.copy(leftPos);
            mesh.material.uniforms.spotLight2Direction.value.copy(leftDir);
            mesh.material.uniforms.spotLight2Angle.value = leftSpotlight.light.angle;
            mesh.material.uniforms.spotLight2Intensity.value = leftSpotlight.light.intensity / 50.0;
            mesh.material.uniforms.spotLight2Color.value.copy(leftSpotlight.light.color);

            // Right spotlight
            const rightSpotlight = this.spotlightManager.spotlights[1];
            const rightPos = rightSpotlight.light.position.clone();
            const rightDir = new THREE.Vector3();
            rightDir.subVectors(
                rightSpotlight.target.position,
                rightSpotlight.light.position
            ).normalize();

            mesh.material.uniforms.spotLight3Position.value.copy(rightPos);
            mesh.material.uniforms.spotLight3Direction.value.copy(rightDir);
            mesh.material.uniforms.spotLight3Angle.value = rightSpotlight.light.angle;
            mesh.material.uniforms.spotLight3Intensity.value = rightSpotlight.light.intensity / 50.0;
            mesh.material.uniforms.spotLight3Color.value.copy(rightSpotlight.light.color);
        }
    }

    getCurrentOffset() {
        return Math.sin(this.time * this.oscillationSpeed) * this.oscillationAmplitude;
    }

    getCurrentOffsetX() {
        // Return 0 for classic mode, normal oscillation for challenge mode
        return this.gameMode === 'challenge' ? 
            Math.sin(this.time / 2 * this.oscillationSpeed) * this.oscillationAmplitude / 2 : 
            0;
    }

    highlightZone(radius) {
        const mesh = this.meshes[0];
        
        // Clear any existing highlight timeout
        if (this.highlightTimeout) {
            clearTimeout(this.highlightTimeout);
            this.highlightTimeout = null;
            
            // If we have an original texture and no new highlight is coming,
            // restore it immediately
            if (this.originalTexture) {
                if (this.shaderState === 1 || this.shaderState === 2) {
                    mesh.material.uniforms.diffuseMap.value = this.originalTexture;
                } else {
                    mesh.material.map = this.originalTexture;
                }
                mesh.material.needsUpdate = true;
            }
        }

        // Store original texture if not already stored
        if (!this.originalTexture) {
            this.originalTexture = (this.shaderState === 1 || this.shaderState === 2) ? 
                mesh.material.uniforms.diffuseMap.value : 
                mesh.material.map;
        }

        // Calculate ring index based on radius
        let ringIndex;
        if (radius <= 10) ringIndex = 7;
        else if (radius <= 20) ringIndex = 6;
        else if (radius <= 30) ringIndex = 5;
        else if (radius <= 40) ringIndex = 4;
        else if (radius <= 50) ringIndex = 3;
        else if (radius <= 60) ringIndex = 2;
        else if (radius <= 70) ringIndex = 1;
        else ringIndex = 0;

        // Create highlighted texture
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const textureRadius = canvas.width / 2;
        
        // Colors for the rings (from outer to inner)
        const colors = [
            '#000000', // Black
            '#3388ff', // Blue
            '#66ff66', // Bright Green
            '#00ff00', // Green
            '#ffff00', // Yellow
            '#ffa500', // Orange
            '#ff6600', // Orange-red
            '#ff0000'  // Red
        ];
        
        // Draw all rings normally
        for (let i = 0; i < colors.length; i++) {
            const currentRadius = textureRadius * (1 - i / colors.length);
            ctx.beginPath();
            ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2);
            ctx.fillStyle = colors[i];
            ctx.fill();
        }
        
        // Highlight the specific ring that was hit
        if (ringIndex >= 0 && ringIndex < colors.length) {
            const outerRadius = textureRadius * (1 - ringIndex / colors.length);
            const innerRadius = textureRadius * (1 - (ringIndex + 1) / colors.length);
            
            // Draw highlighted ring
            ctx.beginPath();
            ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
            ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2, true);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; // White overlay
            ctx.fill();
        }
        
        // Update the texture based on material type
        const newTexture = new THREE.CanvasTexture(canvas);
        newTexture.wrapS = THREE.ClampToEdgeWrapping;
        newTexture.wrapT = THREE.ClampToEdgeWrapping;
        
        if (!mesh.originalTexture) {
            // Store original texture based on material type
            mesh.originalTexture = (this.shaderState === 1 || this.shaderState === 2) ? 
                mesh.material.uniforms.diffuseMap.value : 
                mesh.material.map;
        }
        
        // Update texture based on material type
        if (this.shaderState === 1 || this.shaderState === 2) {
            mesh.material.uniforms.diffuseMap.value = newTexture;
        } else {
            mesh.material.map = newTexture;
        }
        mesh.material.needsUpdate = true;
        
        // Set timeout to restore original texture
        this.highlightTimeout = setTimeout(() => {
            if (this.originalTexture) {
                if (this.shaderState === 1 || this.shaderState === 2) {
                    mesh.material.uniforms.diffuseMap.value = this.originalTexture;
                } else {
                    mesh.material.map = this.originalTexture;
                }
                mesh.material.needsUpdate = true;
            }
            this.highlightTimeout = null;
        }, 500);
    }

    toggleShaderState() {
        this.shaderState = (this.shaderState + 1) % 3;
        
        // Update flat ground material
        if (this.shaderState === 0) {
            this.flatGround.material = this.simpleMaterial;
            this.secondGround.material = this.secondGroundSimpleMaterial;
            this.meshes[0].material = this.targetSimpleMaterial;
        } else if (this.shaderState === 1) {
            this.flatGround.material = this.bumpMaterial;
            this.secondGround.material = this.secondGroundBumpMaterial;
            this.meshes[0].material = this.targetBumpMaterial;
        } else { // shaderState === 2
            this.flatGround.material = this.toonMaterial;
            this.secondGround.material = this.secondGroundToonMaterial;
            this.meshes[0].material = this.targetToonMaterial;
        }
    }


} 