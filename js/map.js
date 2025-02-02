import * as THREE from "three";
import * as CANNON from "cannon-es";
import { TextureLoader } from 'three';
import {sand} from './material.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class Map {
    constructor(scene, world, spotlightManager) {
        this.scene = scene;
        this.boat;
        this.boat_uniform = Math.PI / 1570;
        this.sign = 1;
        this.uniforms;
        this.fenceMeshes = [];
        this.boatMeshes = []; 
        this.lightHouseMeshes = []; 
        this.shaderState = 0;
        this.spotlightManager = spotlightManager;  
        this.lampMeshes = [];  
        this.barrelMeshes = [];
        this.dockMeshes = [];
        this.cartMeshes = [];
        this.isWaveShader = false;
        this.loadIsland(scene, world);
    }

    addParentReference(node, objectType) {
        if (node.isMesh) {
            if (objectType === 'Barrel') {
                // For barrels, swap Y and Z dimensions
                node.userData.parent = {
                    getMesh: () => node,
                    getBody: () => null,
                    setX: (x) => { node.position.x = x; },
                    setY: (y) => { node.position.z = y; },  // Y maps to Z
                    setZ: (z) => { node.position.y = -z; },  // Z maps to Y
                    rotX: (x) => { 
                        node.rotation.x = x * Math.PI / 180;
                        node.quaternion.setFromEuler(node.rotation);
                    },
                    rotY: (y) => { 
                        node.rotation.z = y * Math.PI / 180;  // Y rotation maps to Z
                        node.quaternion.setFromEuler(node.rotation);
                    },
                    rotZ: (z) => { 
                        node.rotation.y = z * Math.PI / 180;  // Z rotation maps to Y
                        node.quaternion.setFromEuler(node.rotation);
                    },
                    type: objectType
                };
            } else if (objectType === 'Fence') {
                // For fences, swap X and Z dimensions
                node.userData.parent = {
                    getMesh: () => node,
                    getBody: () => null,
                    setX: (x) => { node.position.z = x; },  // X maps to Z
                    setY: (y) => { node.position.y = y; },
                    setZ: (z) => { node.position.x = -z; },  // Z maps to X
                    rotX: (x) => { 
                        node.rotation.z = x * Math.PI / 180;  // X rotation maps to Z
                        node.quaternion.setFromEuler(node.rotation);
                    },
                    rotY: (y) => { 
                        node.rotation.y = y * Math.PI / 180;
                        node.quaternion.setFromEuler(node.rotation);
                    },
                    rotZ: (z) => { 
                        node.rotation.x = z * Math.PI / 180;  // Z rotation maps to X
                        node.quaternion.setFromEuler(node.rotation);
                    },
                    type: objectType
                };
            } else {
                // Default behavior for other objects
                node.userData.parent = {
                    getMesh: () => node,
                    getBody: () => null,
                    setX: (x) => { node.position.x = x; },
                    setY: (y) => { node.position.y = y; },
                    setZ: (z) => { node.position.z = z; },
                    rotX: (x) => { 
                        node.rotation.x = x * Math.PI / 180;
                        node.quaternion.setFromEuler(node.rotation);
                    },
                    rotY: (y) => { 
                        node.rotation.y = y * Math.PI / 180;
                        node.quaternion.setFromEuler(node.rotation);
                    },
                    rotZ: (z) => { 
                        node.rotation.z = z * Math.PI / 180;
                        node.quaternion.setFromEuler(node.rotation);
                    },
                    type: objectType
                };
            }
        }
    }

    toggleShaderState() {
        this.shaderState = (this.shaderState + 1) % 3;
        
        // Function to create toon material
        const createToonMaterial = (texture) => {
            return new THREE.ShaderMaterial({
                vertexShader: window.shaders.toonVertexShader,
                fragmentShader: window.shaders.toonFragmentShader,
                uniforms: THREE.UniformsUtils.merge([
                    THREE.UniformsLib['lights'],
                    {
                        diffuseMap: { value: texture },
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
        };

        // Toggle fence materials
        this.fenceMeshes.forEach(mesh => {
            if (this.shaderState === 0) {
                mesh.material = mesh.simpleMaterial;
            } else if (this.shaderState === 1) {
                mesh.material = mesh.bumpMaterial;
            } else {
                // Create toon material if it doesn't exist
                if (!mesh.toonMaterial) {
                    mesh.toonMaterial = createToonMaterial(mesh.simpleMaterial.map);
                }
                mesh.material = mesh.toonMaterial;
            }
        });
        
        // Toggle boat materials
        this.boatMeshes.forEach(mesh => {
            if (this.shaderState === 0) {
                mesh.material = mesh.simpleMaterial;
            } else if (this.shaderState === 1) {
                mesh.material = mesh.bumpMaterial;
            } else {
                if (!mesh.toonMaterial) {
                    mesh.toonMaterial = createToonMaterial(mesh.simpleMaterial.map);
                }
                mesh.material = mesh.toonMaterial;
            }
        });
        
        // Toggle lighthouse materials
        this.lightHouseMeshes.forEach(mesh => {
            if (this.shaderState === 0) {
                mesh.material = mesh.simpleMaterial;
            } else if (this.shaderState === 1) {
                mesh.material = mesh.bumpMaterial;
            } else {
                if (!mesh.toonMaterial) {
                    mesh.toonMaterial = createToonMaterial(mesh.simpleMaterial.map);
                }
                mesh.material = mesh.toonMaterial;
            }
        });
        
        // Toggle sand material
        if (this.sandMesh) {
            if (this.shaderState === 0) {
                this.sandMesh.material = this.sandMesh.simpleMaterial;
            } else if (this.shaderState === 1) {
                this.sandMesh.material = this.sandMesh.bumpMaterial;
            } else {
                if (!this.sandMesh.toonMaterial) {
                    this.sandMesh.toonMaterial = createToonMaterial(this.sandMesh.simpleMaterial.map);
                }
                this.sandMesh.material = this.sandMesh.toonMaterial;
            }
        }

        // Toggle lamp materials
        this.lampMeshes.forEach(mesh => {
            if (this.shaderState === 0) {
                mesh.material = mesh.simpleMaterial;
            } else if (this.shaderState === 1) {
                mesh.material = mesh.bumpMaterial;
            } else {
                if (!mesh.toonMaterial) {
                    mesh.toonMaterial = createToonMaterial(mesh.simpleMaterial.map);
                }
                mesh.material = mesh.toonMaterial;
            }
        });

        // Add barrel materials toggle
        this.barrelMeshes.forEach(mesh => {
            if (this.shaderState === 0) {
                mesh.material = mesh.simpleMaterial;
            } else if (this.shaderState === 1) {
                mesh.material = mesh.bumpMaterial;
            } else {
                if (!mesh.toonMaterial) {
                    mesh.toonMaterial = createToonMaterial(mesh.simpleMaterial.map);
                }
                mesh.material = mesh.toonMaterial;
            }
        });

        // Add dock materials toggle
        this.dockMeshes.forEach(mesh => {
            if (this.shaderState === 0) {
                mesh.material = mesh.simpleMaterial;
            } else if (this.shaderState === 1) {
                mesh.material = mesh.bumpMaterial;
            } else {
                if (!mesh.toonMaterial) {
                    mesh.toonMaterial = createToonMaterial(mesh.simpleMaterial.map);
                }
                mesh.material = mesh.toonMaterial;
            }
        });

        // Add cart materials toggle
        this.cartMeshes.forEach(mesh => {
            if (this.shaderState === 0) {
                mesh.material = mesh.simpleMaterial;
            } else if (this.shaderState === 1) {
                mesh.material = mesh.bumpMaterial;
            } else {
                if (!mesh.toonMaterial) {
                    mesh.toonMaterial = createToonMaterial(mesh.simpleMaterial.map);
                }
                mesh.material = mesh.toonMaterial;
            }
        });
    }

    loadIsland(scene, world) {
        const textureLoader = new TextureLoader();
        
        // Sand ground with bump mapping
        const planeGeometrys = new THREE.PlaneGeometry(2500, 2500);
        const sandTexture = textureLoader.load('./assets/sand.jpg');
        const sandNormalMap = textureLoader.load('./assets/sandNormal.png');
        
        sandTexture.wrapS = THREE.RepeatWrapping;
        sandTexture.wrapT = THREE.RepeatWrapping;
        sandTexture.repeat.set(1, 1);
        
        sandNormalMap.wrapS = THREE.RepeatWrapping;
        sandNormalMap.wrapT = THREE.RepeatWrapping;
        sandNormalMap.repeat.set(1, 1);

        // Create bump mapped material for sand
        const sandBumpMaterial = new THREE.ShaderMaterial({
            vertexShader: window.shaders.bumpMapVertex,
            fragmentShader: window.shaders.bumpMapFragment,
            uniforms: THREE.UniformsUtils.merge([
                THREE.UniformsLib['lights'],
                {
                    diffuseMap: { value: sandTexture },
                    normalMap: { value: sandNormalMap },
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
                    spotLightColor: { value: new THREE.Color(0xffffff) },    
                    spotLight2Color: { value: new THREE.Color(0xffaaaa) },   
                    spotLight3Color: { value: new THREE.Color(0xaaffaa) }, 
                    geometryType: { value: 0 }  // Flat ground mode
                }
            ]),
            lights: true
        });

        const sandSimpleMaterial = new THREE.MeshStandardMaterial({ 
            map: sandTexture,
            roughness: 0.8,
            metalness: 0.2
        });

        const planeMesh = new THREE.Mesh(planeGeometrys, sandSimpleMaterial);
        planeMesh.receiveShadow = true;
        planeMesh.rotation.x = -Math.PI / 2;
        planeMesh.position.set(0, -20, -1300);
        planeMesh.bumpMaterial = sandBumpMaterial;
        planeMesh.simpleMaterial = sandSimpleMaterial;
        
        scene.add(planeMesh);
        this.sandMesh = planeMesh;

        const planeShape = new CANNON.Plane();
        const planeBody = new CANNON.Body({ mass: 0, material: sand });
        planeBody.addShape(planeShape);
        planeBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); 
        planeBody.position.set(0, -20, -1300);

        world.addBody(planeBody);

        //Boat
        const loader = new GLTFLoader();
		loader.load('assets/models/fishing_boat.glb', (gltf) => {
            const model = gltf.scene;
            this.boat = model;
            model.scale.set(15, 15, 15);
            model.position.x = 235;
            model.position.y = -3;
            model.position.z = -180;
            model.rotateY(Math.PI / 2);
            scene.add(model);

            model.traverse((node) => {
                if (node.isMesh) {
                    node.bumpMaterial = new THREE.ShaderMaterial({
                        vertexShader: window.shaders.bumpMapVertex,
                        fragmentShader: window.shaders.bumpMapFragment,
                        uniforms: THREE.UniformsUtils.merge([
                            THREE.UniformsLib['lights'],
                            {
                                diffuseMap: { value: node.material.map },
                                normalMap: { value: node.material.normalMap },
                                normalScale: { value: new THREE.Vector2(1.0, 1.0) },
                                spotLightPosition: { value: new THREE.Vector3() },
                                spotLightDirection: { value: new THREE.Vector3() },
                                spotLightAngle: { value: Math.PI / 6 },
                                spotLightIntensity: { value: 1.0 },
                                spotLightColor: { value: new THREE.Color(0xffffff) },
                                geometryType: { value: 1 }
                            }
                        ]),
                        lights: true
                    });

                    node.simpleMaterial = new THREE.MeshStandardMaterial({
                        map: node.material.map,
                        normalMap: node.material.normalMap,
                        normalScale: new THREE.Vector2(1, 1),
                        roughness: 0.8,
                        metalness: 0.2
                    });

                    // Start with simple material
                    node.material = node.simpleMaterial;
                    node.castShadow = true;
                    node.receiveShadow = true;
                    this.boatMeshes.push(node);
                }
            });
        }, undefined, (e) => {
            console.error(e);
        });   
        
        //LightHouse
		loader.load('assets/models/lighthouse.glb', (gltf) => {
            const model = gltf.scene;
            model.scale.set(4, 4, 4);
            model.position.x = -250;
            model.position.y = 0;
            model.position.z = -450;
            model.rotateY(Math.PI / 3);
            scene.add(model);

            model.traverse((node) => {
                if (node.isMesh) {
                    node.bumpMaterial = new THREE.ShaderMaterial({
                        vertexShader: window.shaders.bumpMapVertex,
                        fragmentShader: window.shaders.bumpMapFragment,
                        uniforms: THREE.UniformsUtils.merge([
                            THREE.UniformsLib['lights'],
                            {
                                diffuseMap: { value: node.material.map },
                                normalMap: { value: node.material.normalMap },
                                normalScale: { value: new THREE.Vector2(1.0, 1.0) },
                                spotLightPosition: { value: new THREE.Vector3() },
                                spotLightDirection: { value: new THREE.Vector3() },
                                spotLightAngle: { value: Math.PI / 6 },
                                spotLightIntensity: { value: 1.0 },
                                spotLightColor: { value: new THREE.Color(0xffffff) },
                                geometryType: { value: 1 }
                            }
                        ]),
                        lights: true
                    });

                    node.simpleMaterial = new THREE.MeshStandardMaterial({
                        map: node.material.map,
                        normalMap: node.material.normalMap,
                        normalScale: new THREE.Vector2(1, 1),
                        roughness: 0.8,
                        metalness: 0.2
                    });

                    node.material = node.simpleMaterial;
                    node.castShadow = true;
                    node.receiveShadow = true;
                    this.lightHouseMeshes.push(node);
                }
            });
        }, undefined, (e) => {
            console.error(e);
        });

        // Add Fences
        for (let i = 0; i < 9; i++) {
            if (i==5) continue;
            loader.load('assets/models/fence.glb', (gltf) => {
                const model = gltf.scene;
                // Load textures
                const woodTexture = textureLoader.load('./assets/fence.jpg');
                const normalMap = textureLoader.load('./assets/fenceNormal.jpg');
                
                model.traverse((node) => {
                    if (node.isMesh) {
                        // Create both materials but start with simple
                        node.bumpMaterial = new THREE.ShaderMaterial({
                            vertexShader: window.shaders.bumpMapVertex,
                            fragmentShader: window.shaders.bumpMapFragment,
                            uniforms: THREE.UniformsUtils.merge([
                                THREE.UniformsLib['lights'],
                                {
                                    diffuseMap: { value: woodTexture },
                                    normalMap: { value: normalMap },
                                    normalScale: { value: new THREE.Vector2(1.0, 1.0) },
                                    spotLightPosition: { value: new THREE.Vector3() },
                                    spotLightDirection: { value: new THREE.Vector3() },
                                    spotLightAngle: { value: Math.PI / 6 },
                                    spotLightIntensity: { value: 1.0 },
                                    spotLightColor: { value: new THREE.Color(0xffffff) },
                                    geometryType: { value: 1 }
                                }
                            ]),
                            lights: true
                        });

                        node.simpleMaterial = new THREE.MeshStandardMaterial({
                            map: woodTexture,
                            normalMap: normalMap,
                            normalScale: new THREE.Vector2(1, 1),
                            color: 0x888888,
                            roughness: 0.8,
                            metalness: 0.2
                        });

                        // Start with simple material
                        node.material = node.simpleMaterial;
                        node.castShadow = true;
                        node.receiveShadow = true;
                        
                        // Store the mesh for later material updates
                        this.addParentReference(node, 'Fence');
                        this.fenceMeshes.push(node);
                    }
                });
                
                model.scale.set(5, 5, 5);
                model.position.x = (i - 3.5) * 88;
                model.position.y = -19;
                model.position.z = -80;
                model.rotateY(Math.PI / 2);
                
                scene.add(model);
            }, undefined, (e) => {
                console.error(e);
            });
        }

        // Add Lamp
        loader.load('assets/models/lamp.glb', (gltf) => {
            const model = gltf.scene;

            
            model.traverse((node) => {
                if (node.isMesh) {
                    // Create bump material
                    node.bumpMaterial = new THREE.ShaderMaterial({
                        vertexShader: window.shaders.bumpMapVertex,
                        fragmentShader: window.shaders.bumpMapFragment,
                        uniforms: THREE.UniformsUtils.merge([
                            THREE.UniformsLib['lights'],
                            {
                                diffuseMap: { value: node.material.map },
                                normalMap: { value: node.material.normalMap },
                                normalScale: { value: new THREE.Vector2(1.0, 1.0) },
                                spotLightPosition: { value: new THREE.Vector3() },
                                spotLightDirection: { value: new THREE.Vector3() },
                                spotLightAngle: { value: Math.PI / 6 },
                                spotLightIntensity: { value: 1.0 },
                                spotLightColor: { value: new THREE.Color(0xffffff) },
                                geometryType: { value: 1 }
                            }
                        ]),
                        lights: true
                    });

                    // Create simple material
                    node.simpleMaterial = new THREE.MeshStandardMaterial({
                        map: node.material.map,
                        normalMap: node.material.normalMap,
                        normalScale: new THREE.Vector2(1, 1),
                        roughness: 0.8,
                        metalness: 0.2
                    });

                    // Start with simple material
                    node.material = node.simpleMaterial;
                    node.castShadow = true;
                    node.receiveShadow = true;
                    
                    // Store the mesh for later material updates
                    this.addParentReference(node, 'Lamp');
                    this.lampMeshes.push(node);
                }
            });
            
            model.scale.set(35, 35, 35  );
            model.position.set(-180, 0, -40);
            
            scene.add(model);
        }, undefined, (e) => {
            console.error(e);
        });

        // Add Barrel after the lamp loading
        loader.load('assets/models/barrel2.glb', (gltf) => {
            const model = gltf.scene;
            
            model.traverse((node) => {
                if (node.isMesh) {
                    // Create bump material
                    node.bumpMaterial = new THREE.ShaderMaterial({
                        vertexShader: window.shaders.bumpMapVertex,
                        fragmentShader: window.shaders.bumpMapFragment,
                        uniforms: THREE.UniformsUtils.merge([
                            THREE.UniformsLib['lights'],
                            {
                                diffuseMap: { value: node.material.map },
                                normalMap: { value: node.material.normalMap },
                                normalScale: { value: new THREE.Vector2(1.0, 1.0) },
                                spotLightPosition: { value: new THREE.Vector3() },
                                spotLightDirection: { value: new THREE.Vector3() },
                                spotLightAngle: { value: Math.PI / 6 },
                                spotLightIntensity: { value: 1.0 },
                                spotLightColor: { value: new THREE.Color(0xffffff) },
                                geometryType: { value: 1 }
                            }
                        ]),
                        lights: true
                    });

                    // Create simple material
                    node.simpleMaterial = new THREE.MeshStandardMaterial({
                        map: node.material.map,
                        normalMap: node.material.normalMap,
                        normalScale: new THREE.Vector2(1, 1),
                        roughness: 0.8,
                        metalness: 0.2
                    });

                    // Start with simple material
                    node.material = node.simpleMaterial;
                    node.castShadow = true;
                    node.receiveShadow = true;
                    
                    // Store the mesh for later material updates
                    this.addParentReference(node, 'Barrel');
                    this.barrelMeshes.push(node);
                }
            });
            
            model.scale.set(0.5, 0.5, 0.5);
            model.position.set(-140, 0, -40); // Position near the lamp
            
            scene.add(model);
        }, undefined, (e) => {
            console.error(e);
        });

        // Add second barrel (exact copy of the first one)
        loader.load('assets/models/barrel2.glb', (gltf) => {
            const model = gltf.scene;
            
            model.traverse((node) => {
                if (node.isMesh) {
                    // Create bump material
                    node.bumpMaterial = new THREE.ShaderMaterial({
                        vertexShader: window.shaders.bumpMapVertex,
                        fragmentShader: window.shaders.bumpMapFragment,
                        uniforms: THREE.UniformsUtils.merge([
                            THREE.UniformsLib['lights'],
                            {
                                diffuseMap: { value: node.material.map },
                                normalMap: { value: node.material.normalMap },
                                normalScale: { value: new THREE.Vector2(1.0, 1.0) },
                                spotLightPosition: { value: new THREE.Vector3() },
                                spotLightDirection: { value: new THREE.Vector3() },
                                spotLightAngle: { value: Math.PI / 6 },
                                spotLightIntensity: { value: 1.0 },
                                spotLightColor: { value: new THREE.Color(0xffffff) },
                                geometryType: { value: 1 }
                            }
                        ]),
                        lights: true
                    });

                    // Create simple material
                    node.simpleMaterial = new THREE.MeshStandardMaterial({
                        map: node.material.map,
                        normalMap: node.material.normalMap,
                        normalScale: new THREE.Vector2(1, 1),
                        roughness: 0.8,
                        metalness: 0.2
                    });

                    // Start with simple material
                    node.material = node.simpleMaterial;
                    node.castShadow = true;
                    node.receiveShadow = true;
                    
                    this.addParentReference(node, 'Barrel');
                    this.barrelMeshes.push(node);
                }
            });
            
            model.scale.set(0.5, 0.5, 0.5);
            model.position.set(200, 0, -40);
            
            scene.add(model);
        }, undefined, (e) => {
            console.error(e);
        });

        // Add Dock near the boat
        loader.load('assets/models/dock.glb', (gltf) => {
            const model = gltf.scene;
            
            model.traverse((node) => {
                if (node.isMesh) {
                    // Create bump material
                    node.bumpMaterial = new THREE.ShaderMaterial({
                        vertexShader: window.shaders.bumpMapVertex,
                        fragmentShader: window.shaders.bumpMapFragment,
                        uniforms: THREE.UniformsUtils.merge([
                            THREE.UniformsLib['lights'],
                            {
                                diffuseMap: { value: node.material.map },
                                normalMap: { value: node.material.normalMap },
                                normalScale: { value: new THREE.Vector2(1.0, 1.0) },
                                spotLightPosition: { value: new THREE.Vector3() },
                                spotLightDirection: { value: new THREE.Vector3() },
                                spotLightAngle: { value: Math.PI / 6 },
                                spotLightIntensity: { value: 1.0 },
                                spotLightColor: { value: new THREE.Color(0xffffff) },
                                geometryType: { value: 1 }
                            }
                        ]),
                        lights: true
                    });

                    // Create simple material
                    node.simpleMaterial = new THREE.MeshStandardMaterial({
                        map: node.material.map,
                        normalMap: node.material.normalMap,
                        normalScale: new THREE.Vector2(1, 1),
                        roughness: 0.8,
                        metalness: 0.2
                    });

                    // Start with simple material
                    node.material = node.simpleMaterial;
                    node.castShadow = true;
                    node.receiveShadow = true;
                    
                    // Store the mesh for later material updates
                    this.dockMeshes.push(node);
                }
            });
            
            model.scale.set(12, 12, 12);
            model.position.set(95, -6, -232); // Same position as boat
            
            scene.add(model);
        }, undefined, (e) => {
            console.error(e);
        });

        // Add Cart
        loader.load('assets/models/cart.glb', (gltf) => {
            const model = gltf.scene;
            
            model.traverse((node) => {
                if (node.isMesh) {
                    // Create bump material
                    node.bumpMaterial = new THREE.ShaderMaterial({
                        vertexShader: window.shaders.bumpMapVertex,
                        fragmentShader: window.shaders.bumpMapFragment,
                        uniforms: THREE.UniformsUtils.merge([
                            THREE.UniformsLib['lights'],
                            {
                                diffuseMap: { value: node.material.map },
                                normalMap: { value: node.material.normalMap },
                                normalScale: { value: new THREE.Vector2(1.0, 1.0) },
                                spotLightPosition: { value: new THREE.Vector3() },
                                spotLightDirection: { value: new THREE.Vector3() },
                                spotLightAngle: { value: Math.PI / 6 },
                                spotLightIntensity: { value: 1.0 },
                                spotLightColor: { value: new THREE.Color(0xffffff) },
                                geometryType: { value: 1 }
                            }
                        ]),
                        lights: true
                    });

                    // Create simple material
                    node.simpleMaterial = new THREE.MeshStandardMaterial({
                        map: node.material.map,
                        normalMap: node.material.normalMap,
                        normalScale: new THREE.Vector2(1, 1),
                        roughness: 0.8,
                        metalness: 0.2
                    });

                    // Start with simple material
                    node.material = node.simpleMaterial;
                    node.castShadow = true;
                    node.receiveShadow = true;
                    
                    this.cartMeshes.push(node);
                }
            });
            
            model.scale.set(35, 35, 35);
            model.position.set(-180, 0, 20); // Position near the lamp
            model.rotateY(Math.PI / 4); // Rotate 45 degrees
            
            scene.add(model);
        });
    }

    updateUniforms() {
        //Sand
        if (this.shaderState === 0 || !this.sandMesh) return;

        const mesh = this.sandMesh;
        if (mesh.material.type === 'ShaderMaterial') {
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
        
        //Fences
        if (this.shaderState === 0) return;

        this.fenceMeshes.forEach(mesh => {
            if (mesh.material.type === 'ShaderMaterial') {
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
                mesh.material.uniforms.spotLightColor.value.copy(this.spotlightManager.spotlight.color);

                if (mesh.material.uniforms.ambientIntensity) {
                    mesh.material.uniforms.ambientIntensity.value = this.spotlightManager.ambientIntensity;
                }
            }
        });

        //Boats, lighthouse and Lamp
        if (this.shaderState === 0) return;

        [...this.boatMeshes, ...this.lightHouseMeshes, ...this.lampMeshes, ...this.barrelMeshes, ...this.dockMeshes, ...this.cartMeshes].forEach(mesh => {
            if (mesh.material.type === 'ShaderMaterial') {
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
                if (mesh.material.uniforms.ambientIntensity) {
                    mesh.material.uniforms.ambientIntensity.value = this.spotlightManager.ambientIntensity;
                }
            }
        });
    }

    animate() {
        if (!this.boat) return;  // Add safety check for boat

        // Adjust boat swing speed based on shader and FPS
        let swingMultiplier = this.isWaveShader ? 1.5 : 0.5;  
        swingMultiplier *= window.animation_multiplier;  // Apply global animation multiplier
        
        // Use fixed time step instead of variable angle
        const angleStep = (Math.PI / 400) * swingMultiplier;
        
        // Update rotation based on direction
        if (this.boat.rotation.z > Math.PI / 12) {
            this.sign = -1;
        } else if (this.boat.rotation.z < -Math.PI / 12) {
            this.sign = 1;
        }
        
        this.boat.rotation.z += angleStep * this.sign;

        if (this.shaderState > 0) {
            this.updateUniforms();
        }
    }
}