import * as THREE from "three";
import * as CANNON from "cannon-es";
import { TextureLoader } from 'three';

import { SpotlightManager } from './spotlight.js';
import { CameraManager } from './camera.js';
import { ObjectManager } from './controls.js';
import { soundManager } from './sounds.js';

import { KeyboardControls } from './keyboardControls.js';
import { createTextWithBalls } from './assembleNames.js';

import { Ball } from './ball.js';
import { Cube } from './cube.js';
import { Ground } from './ground.js';
import { Bouncer } from './bouncer.js';
import { Map } from './map.js';
import { 
    tennisBall,
    metal,
    rubberMat,
    addContactMaterials,     
    cubeMat,
    groundMat,
    balloonMat
} from './material.js';
const highscore = localStorage.getItem('highscore') || 0; 

const bonusBallTexture = new THREE.TextureLoader().load('assets/star.png');
bonusBallTexture.wrapS = THREE.RepeatWrapping;
bonusBallTexture.wrapT = THREE.RepeatWrapping;

// ============================ Initialization ============================
const { waterWaveVertex, waterWaveFragment, vanishingVertexShader, vanishingFragmentShader } = window.shaders;

const startScreen = document.getElementById('startScreen');
let gameStarted = false;

let score = 0;
let timeRemaining = 60;
const scoreDisplay = document.createElement('div');
const timerDisplay = document.createElement('div');
const energyPanel = document.createElement('div');

initializeDisplays(scoreDisplay, energyPanel);

const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true; 
renderer.domElement.style.cursor = `url('assets/cursor.png'), auto`;
renderer.domElement.addEventListener('click', onMouseClick);
document.body.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(5, 5, 15);

const spotlightManager = new SpotlightManager(scene);
const cameraManager = new CameraManager(renderer);
const objectManager = new ObjectManager();

const textureLoader = new TextureLoader();
scene.dayColor = new THREE.Color(0x87CEEB);
scene.nightColor = new THREE.Color(0x000000);
scene.background = scene.dayColor;
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);
const ground = new Ground(scene, world, 'classic', spotlightManager);

const balls = [];
const cubes = [];

let ballCounter = 0;

const clock = new THREE.Clock();


const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
addContactMaterials(world);
const map = new Map(scene, world, spotlightManager);
window.animation_multiplier = parseFloat(localStorage.getItem('animation_multiplier')) || 1.0;
window.current_fps = parseInt(localStorage.getItem('current_fps')) || 60;
window.stopTimer = false;
const bouncer = new Bouncer(scene, world, 0, -0.2, 90);
bouncer.add(scene, world);
const keyboardControls = new KeyboardControls(
    bouncer, 
    cameraManager, 
    spotlightManager,
    document,
    spawnCube,
    ground,
    map,
    cubes,
    balls,
    scene,
);
window.addEventListener('resize', onWindowResize);
let gameMode = null; // 'classic' or 'challenge'
soundManager.createVolumeControl();

let pendingMerges = [];

let initialSpotlightEnabled = true;

const spotlightCheckbox = document.getElementById('spotlightEnabled');
spotlightCheckbox.addEventListener('change', (event) => {
    initialSpotlightEnabled = event.target.checked;
});

const fpsSelector = document.getElementById('fpsMode');
fpsSelector.value = window.current_fps.toString();

fpsSelector.addEventListener('change', (event) => {
    const fps = parseInt(event.target.value);
    window.current_fps = fps;
    switch(fps) {
        case 30:
            window.animation_multiplier = 2.0;
            break;
        case 120:
            window.animation_multiplier = 0.5;
            break;
        default: // 60 FPS
            window.animation_multiplier = 1.0;
            break;
    }
});


//===================================== Map ========================================
animate();

document.getElementById('classicMode').addEventListener('click', () => {
    document.documentElement.requestFullscreen().then(() => {
        startGameMode('classic');
    }).catch(err => {
        console.log(`Error attempting to enable fullscreen: ${err.message}`);
        startGameMode('classic');
    });
});

document.getElementById('challengeMode').addEventListener('click', () => {
    document.documentElement.requestFullscreen().then(() => {
        startGameMode('challenge');
    }).catch(err => {
        console.log(`Error attempting to enable fullscreen: ${err.message}`);
        startGameMode('challenge');
    });
});

document.getElementById('playAgainBtn').addEventListener('click', () => {
    const gameOverScreen = document.getElementById('gameOverScreen');
    gameOverScreen.style.display = 'none';
    startScreen.style.display = 'flex';
    spotlightCheckbox.checked = true;
    initialSpotlightEnabled = true;
    reloadPage();
});




// ============================ Mouse Click ============================
function onMouseClick(event) {
    if (keyboardControls.menuState != 3) {
        return;
    }
    keyboardControls.currentMenu = objectManager;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, cameraManager.getActiveCamera());
    
    const meshes = [];
    scene.traverse((object) => {
        if (object.isMesh) {
            meshes.push(object);
        }
    });
    
    const intersects = raycaster.intersectObjects(meshes, true);

    // Clear previous selection if we click empty space
    if (intersects.length === 0) {
        if (objectManager.selectedObject) {
            if (objectManager.selectedObject.material.type === 'ShaderMaterial') {
                // Safely handle shader material deselection
                const uniforms = objectManager.selectedObject.material.uniforms;
                if (uniforms && uniforms.emissiveColor) {
                    uniforms.emissiveColor.value.setHex(0x000000);
                }
            } else {
                objectManager.selectedObject.material.emissive.setHex(0x000000);
            }
            objectManager.clearSelection();
        }
        return;
    }

    // Clear previous selection before selecting new object
    if (objectManager.selectedObject) {
        if (objectManager.selectedObject.material.type === 'ShaderMaterial') {
            // Safely handle shader material deselection
            const uniforms = objectManager.selectedObject.material.uniforms;
            if (uniforms && uniforms.emissiveColor) {
                uniforms.emissiveColor.value.setHex(0x000000);
            }
        } else {
            objectManager.selectedObject.material.emissive.setHex(0x000000);
        }
        objectManager.clearSelection();
    }

    for (const intersect of intersects) {
        let currentObject = intersect.object;
        
        // Check if it's a map object or game object
        const isMapObject = currentObject.userData.parent && 
            ['Fence', 'Lamp', 'Barrel'].includes(
                currentObject.userData.parent.type
            );
        
        const instance = currentObject.userData.parent;
        
        if (isMapObject || (instance && (instance instanceof Ball || instance instanceof Cube || instance instanceof Bouncer))) {
            objectManager.selectedObject = currentObject;
            
            // Handle highlighting based on material type
            if (currentObject.material.type === 'ShaderMaterial') {
                if (!currentObject.material.uniforms.emissiveColor) {
                    currentObject.material.uniforms.emissiveColor = { value: new THREE.Color(0x000000) };
                }
                currentObject.material.uniforms.emissiveColor.value.setHex(0x404040);
            } else {
                currentObject.material.emissive.setHex(0x404040);
            }
            
            objectManager.createControls(currentObject);
            
            // Show object type in message overlay
            if (isMapObject) {
                keyboardControls.messageOverlay.textContent = `Selected: ${instance.type}`;
                keyboardControls.messageOverlay.style.display = 'block';
                setTimeout(() => {
                    keyboardControls.messageOverlay.style.display = 'none';
                }, 1000);
            } else {
                keyboardControls.messageOverlay.textContent = `Selected: ${instance instanceof Ball ? 'Ball' : instance instanceof Cube ? 'Cube' : 'Bouncer'}`;
                keyboardControls.messageOverlay.style.display = 'block';
                setTimeout(() => {
                    keyboardControls.messageOverlay.style.display = 'none';
                }, 1000);
            }
            return;
        }
    }
}




// ============================ Water ============================
const waterTexture = textureLoader.load("./assets/water2.jpg");
waterTexture.wrapS = THREE.RepeatWrapping;
waterTexture.wrapT = THREE.RepeatWrapping;
waterTexture.repeat.set(8, 8);

const waterUniforms = {
    time: { value: 0.0 },
    xs: { value: 1.0 },
    zs: { value: 0.5 },
    h: { value: 0.3 },
    uTexture: { value: waterTexture },
    uvScale: { value: [2, 2] }
};

const stationaryWaterUniforms = {
    time: { value: 0.0 },
    xs: { value: 1.0 },
    zs: { value: 0.5 },
    h: { value: 0.3 },
    uTexture: { value: waterTexture },
    uvScale: { value: [2, 2] }
};

const dynamicShaderMaterial = new THREE.ShaderMaterial({
    vertexShader: waterWaveVertex,
    fragmentShader: waterWaveFragment,
    uniforms: waterUniforms,
    transparent: true,
    wireframe: false,
    side: THREE.DoubleSide
});

const stationaryShaderMaterial = new THREE.ShaderMaterial({
    vertexShader: waterStationaryVertex,
    fragmentShader: waterStationaryFragment,
    uniforms: stationaryWaterUniforms,
    transparent: true,
    wireframe: false,
    side: THREE.DoubleSide
});

const planeGeometry = new THREE.PlaneGeometry(2500, 2500, 128, 128);
planeGeometry.rotateX(-Math.PI / 2); 

const plane = new THREE.Mesh(planeGeometry, stationaryShaderMaterial);
scene.add(plane);
plane.position.set(0, -1, -1300);

function switchWaterShader() {
    const currentMaterial = plane.material;
    plane.material = (currentMaterial === dynamicShaderMaterial) ? 
        stationaryShaderMaterial : dynamicShaderMaterial;
    ground.useDynamicShader = (plane.material === dynamicShaderMaterial);
}

// Expose the function to window object
window.switchWaterShader = switchWaterShader;


// ============================ Energy Calculation ============================
function calculateEnergy(ball) {
    const body = ball.getBody();
    const mass = body.mass;
    const velocity = body.velocity;
    const height = body.position.y;
    const g = Math.abs(world.gravity.y); 

    const speed = Math.sqrt(
        velocity.x * velocity.x + 
        velocity.y * velocity.y + 
        velocity.z * velocity.z
    );
    const kineticEnergy = 0.5 * mass * speed * speed;

    const potentialEnergy = mass * g * height;

    return {
        kinetic: kineticEnergy,
        potential: potentialEnergy,
        total: kineticEnergy + potentialEnergy
    };
}




// ============================ Ball Spawning ============================
function mergeBall(position, scene, world) {
    const size = 15; // Bigger than normal balls
    // Pass ground's current shader state to merged balls
    const currentShaderState = ground.shaderState;
    const mergedBall = new Ball(size, tennisBall, position.x, position.y, position.z, true, currentShaderState);
    mergedBall.add(scene, world);
    
    // Set up userData for the merged ball
    mergedBall.getBody().userData = { parent: mergedBall };
    
    // Add ball properties
    mergedBall.ballId = ++ballCounter;
    mergedBall.initialEnergy = calculateEnergy(mergedBall).total;
    mergedBall.material = 'tennisBall';
    
    // Create energy display
    const ballDiv = document.createElement('div');
    ballDiv.id = `ball-${mergedBall.ballId}`;
    ballDiv.style.marginBottom = '10px';
    energyPanel.appendChild(ballDiv);
    mergedBall.energyDisplay = ballDiv;
    
    // Set body properties
    mergedBall.getBody().ballType = 'tennisBall';
    mergedBall.getBody().bounceCount = 0;
    mergedBall.getBody().shouldRemove = false;
    mergedBall.getBody().lastBounceTime = 0;
    mergedBall.getBody().hasScored = false;
    
    // Add collision handlers
    mergedBall.getBody().addEventListener("collide", handleBallCollision);
    
    // Add ground collision handler
    mergedBall.getBody().addEventListener("collide", (event) => {
        const collidedMaterial = event.body.material;
        const collidedBody = event.body;
        const impactVelocity = event.contact.getImpactVelocityAlongNormal();
        
        if (collidedMaterial === groundMat) {
            const velocity = mergedBall.getBody().velocity;
            const currentTime = performance.now();
            const timeSinceLastBounce = currentTime - mergedBall.getBody().lastBounceTime;
            
            if (velocity.y < 0 && timeSinceLastBounce > 500) {
                mergedBall.getBody().bounceCount++;
                mergedBall.getBody().lastBounceTime = currentTime;

                if (mergedBall.getBody().bounceCount === 1 && !mergedBall.getBody().hasScored) {
                    const ballX = mergedBall.getBody().position.x;
                    const ballZ = mergedBall.getBody().position.z;
                    
                    const groundCenterX = ground.getCurrentOffset();
                    const groundCenterZ = ground.getCurrentOffsetX();
                    
                    const dx = ballX - groundCenterX;
                    const dz = ballZ - groundCenterZ;
                    const distance = Math.sqrt(dx * dx + dz * dz);
                    
                    let points = 0;
                    let scoreText = '';
                    let radius = null;
                    
                    // Triple the points for merged balls
                    if (distance < 10) {
                        points = 300;
                        scoreText = '+300';
                        radius = 10; 
                        soundManager.playSound('point8');
                    } else if (distance < 20) {
                        points = 180;
                        scoreText = '+180';
                        radius = 20; 
                        soundManager.playSound('point7');
                    } else if (distance < 30) {
                        points = 150;
                        scoreText = '+150';
                        radius = 30;  
                        soundManager.playSound('point6');
                    } else if (distance < 40) {
                        points = 120;
                        scoreText = '+120';
                        radius = 40;  
                        soundManager.playSound('point5');
                    } else if (distance < 50) {
                        points = 90;
                        scoreText = '+90';
                        radius = 50;  
                        soundManager.playSound('point4');
                    } else if (distance < 60) {
                        points = 60;
                        scoreText = '+60';
                        radius = 60; 
                        soundManager.playSound('point3');
                    } else if (distance < 70) {
                        points = 30;
                        scoreText = '+30';
                        radius = 70;  
                        soundManager.playSound('point2');
                    } else if (distance < 80) {
                        points = 0;
                        scoreText = '+0';
                    }
                    
                    if (points > 0) {
                        showScorePopup(scoreText, new THREE.Vector3(ballX, 0.1, ballZ));
                        score += points;
                        scoreDisplay.textContent = `Score: ${score}`;
                        mergedBall.getBody().hasScored = true;
                    }
                    
                    if (radius) {
                        ground.highlightZone(radius);
                    }
                }
                
                if (mergedBall.getBody().bounceCount >= 2) {
                    mergedBall.getBody().shouldRemove = true;
                }
            }
        }
    });
    
    balls.push(mergedBall);
    return mergedBall;
}

function handleBallCollision(event) {
    const ball = this.userData.parent;
    const collidedBody = event.body;
    const cube = collidedBody.userData?.parent;
    
    // Check if the collision is between a ball and a cube
    if (collidedBody.isCube && 
        !ball.isBeingRemoved && 
        !collidedBody.isBeingRemoved && 
        !ball.vanishingMaterial && 
        !cube.vanishingMaterial) {  // Check for vanishing materials
        
        // Mark both objects for immediate removal
        ball.isBeingRemoved = true;
        collidedBody.isBeingRemoved = true;
        
        // Queue the merge for next frame
        pendingMerges.push({
            ball: ball,
            cube: collidedBody.userData.parent,
            position: {
                x: (this.position.x + collidedBody.position.x) / 2,
                y: (this.position.y + collidedBody.position.y) / 2,
                z: (this.position.z + collidedBody.position.z) / 2
            }
        });
    }
}

function spawnBall() {
    soundManager.playSound('spawn');

    const spawnZ = 80;
    const spawnX = Math.random() * 30;
    const spawnHeight = Math.random() * 60 + 80;
    
    const random = Math.random();
    let ballType, newBall;
    
    // Pass ground's current shader state to new balls
    const currentShaderState = ground.shaderState;
    
    if (random < 0.25) {
        ballType = 'tennisBall';
        newBall = new Ball(4, tennisBall, spawnX, spawnHeight, spawnZ, false, currentShaderState);
    } else if (random < 0.5) {
        ballType = 'metal';
        newBall = new Ball(4, metal, spawnX, spawnHeight, spawnZ, false, currentShaderState);
    } else if (random < 0.75) {
        ballType = 'rubber';
        newBall = new Ball(4, rubberMat, spawnX, spawnHeight, spawnZ, false, currentShaderState);
    } else {
        ballType = 'balloon';
        newBall = new Ball(4, balloonMat, spawnX, spawnHeight, spawnZ, false, currentShaderState);
    }
    
    newBall.add(scene, world);
    
    // Set up userData for the new ball
    newBall.getBody().userData = { parent: newBall };
    
    const initialEnergy = calculateEnergy(newBall);
    
    newBall.ballId = ++ballCounter;
    newBall.initialEnergy = initialEnergy.total;
    newBall.material = ballType;
    
    const ballDiv = document.createElement('div');
    ballDiv.id = `ball-${newBall.ballId}`;
    ballDiv.style.marginBottom = '10px';
    energyPanel.appendChild(ballDiv);
    newBall.energyDisplay = ballDiv;
    
    newBall.getBody().ballType = ballType;
    newBall.getBody().bounceCount = 0;
    newBall.getBody().shouldRemove = false;
    newBall.getBody().lastBounceTime = 0;
    newBall.getBody().hasScored = false;

    // ============================ Ball Collision ============================

    newBall.getBody().addEventListener("collide", handleBallCollision);

    newBall.getBody().addEventListener("collide", (event) => {
        const collidedMaterial = event.body.material;
        const collidedBody = event.body;
        const impactVelocity = event.contact.getImpactVelocityAlongNormal();
        
        if (collidedMaterial === groundMat) {
            const velocity = newBall.getBody().velocity;
            const currentTime = performance.now();
            const timeSinceLastBounce = currentTime - newBall.getBody().lastBounceTime;
            
            if (velocity.y < 0 && timeSinceLastBounce > 500) {
                newBall.getBody().bounceCount++;
                newBall.getBody().lastBounceTime = currentTime;

                if (newBall.getBody().bounceCount === 1 && !newBall.getBody().hasScored) {
                    const ballX = newBall.getBody().position.x;
                    const ballZ = newBall.getBody().position.z;
                    
                    const groundCenterX = ground.getCurrentOffset();
                    const groundCenterZ = ground.getCurrentOffsetX();
                    
                    const dx = ballX - groundCenterX;
                    const dz = ballZ - groundCenterZ;
                    const distance = Math.sqrt(dx * dx + dz * dz);
                    
                    let points = 0;
                    let scoreText = '';
                    let radius = null;
                    soundManager.playSound('dropBall');
                    
                    if (distance < 10) {
                        points = 100;
                        scoreText = '+100';
                        radius = 10; 
                        soundManager.playSound('point8');
                    } else if (distance < 20) {
                        points = 60;
                        scoreText = '+60';
                        radius = 20; 
                        soundManager.playSound('point7');
                    } else if (distance < 30) {
                        points = 50;
                        scoreText = '+50';
                        radius = 30;  
                        soundManager.playSound('point6');
                    } else if (distance < 40) {
                        points = 40;
                        scoreText = '+40';
                        radius = 40;  
                        soundManager.playSound('point5');
                    } else if (distance < 50) {
                        points = 30;
                        scoreText = '+30';
                        radius = 50;  
                        soundManager.playSound('point4');
                    } else if (distance < 60) {
                        points = 20;
                        scoreText = '+20';
                        radius = 60; 
                        soundManager.playSound('point3');
                    } else if (distance < 70) {
                        points = 10;
                        scoreText = '+10';
                        radius = 70;  
                        soundManager.playSound('point2');
                    } else if (distance < 80) {
                        points = 0;
                        scoreText = '+0';
                    }
                    
                    if (points > 0) {
                        showScorePopup(scoreText, new THREE.Vector3(ballX, 0.1, ballZ));
                        score += points;
                        scoreDisplay.textContent = `Score: ${score}`;
                        newBall.getBody().hasScored = true;
                    }
                    
                    // Highlight the zone if we hit one
                    if (radius) {
                        ground.highlightZone(radius);
                    }
                }
                
                if (newBall.getBody().bounceCount >= 2) {
                    newBall.getBody().shouldRemove = true;
                }
            }
        }

        // ============================ Bouncer Collision ============================

        if (collidedBody === bouncer.getBody()) {
            if (impactVelocity > 0.1) {
                const bouncerMaterial = bouncer.getCurrentMaterial();
                
                if (bouncerMaterial === 'sand') {
                    soundManager.playSound('sandHit', {
                        volume: Math.min(impactVelocity / 30, 1.0)
                    });
                }  
                if (newBall.getBody().ballType === 'balloon') {
                    soundManager.playSound('balloonHit', {
                        volume: Math.min(impactVelocity / 20, 1.0)
                    });
                } else if (newBall.getBody().ballType === 'metal') {
                    soundManager.playSound('metalHit', {
                        volume: Math.min(impactVelocity / 20, 1.0)
                    });
                } else if (newBall.getBody().ballType === 'rubber') {
                    soundManager.playSound('rubberHit', {
                        volume: Math.min(impactVelocity / 10, 1.0)
                    });
                } else {
                    soundManager.playSound('tennisHit', {
                        volume: Math.min(impactVelocity / 10, 1.0)
                    });
                }
            }
        } else {
            soundManager.playSound('ballDrop', {
                volume: Math.min(impactVelocity / 10, 1.0)
            });
        }
    });

    return newBall;
}


// ============================ Score Popup ============================

function showScorePopup(text, position) {
    const popup = document.createElement('div');
    popup.style.position = 'fixed';
    popup.style.color = text.includes('-') ? 'red' : 'green';
    popup.style.fontSize = '24px';
    popup.style.fontWeight = 'bold';
    popup.style.pointerEvents = 'none';
    popup.textContent = text;
    document.body.appendChild(popup);

    const vector = new THREE.Vector3(position.x, position.y, position.z);
    vector.project(cameraManager.getActiveCamera());

    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;

    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;

    let opacity = 1;
    const fadeOut = setInterval(() => {
        opacity -= 0.02;
        popup.style.opacity = opacity;
        popup.style.transform = `translateY(${(1 - opacity) * -50}px)`;
        
        if (opacity <= 0) {
            clearInterval(fadeOut);
            document.body.removeChild(popup);
        }
    }, 16);
}


// ============================ Game Mode ============================

function startGameMode(mode) {
    gameMode = mode;
    startScreen.style.display = 'none';
    gameStarted = true;
    keyboardControls.startGame();
    score = 0;
    timeRemaining = 60;
    scoreDisplay.textContent = `Score: ${score}`;
    timerDisplay.textContent = `Time: ${timeRemaining}`;
    
    restartGame();
    
    // Set initial spotlight state from menu selection
    spotlightManager.setInitialState(initialSpotlightEnabled);
    
    // Position camera for top-down view
    camera.position.set(0, 250, 499);
    camera.lookAt(0, 0, 500);
    
    createTextWithBalls("EMRE YEGİN", 220, 3, -800, scene, 0, 60, 6);
    createTextWithBalls("HAKAn ÇAKICı", 220, 3, -600, scene, 1, 60, 6);
    createTextWithBalls("KUTAY AÇICı", 220, 3, -700, scene, 2, 60, 6);
    // Clear energy panel and reset ball counter
    energyPanel.innerHTML = '';
    ballCounter = 0;

    // Update ground's game mode
    ground.gameMode = mode;

    // Start both background music and ocean sound
    soundManager.playSound('ocean');

   if (ground.shaderState === 2) {
    soundManager.playSound('cartoon');
   } else if (ground.shaderState === 1) {
    soundManager.playSound('bump');
   } else {
    soundManager.playSound('bgMusic');
   }
    // Store the ball spawning interval ID
    let ballSpawnInterval;

    // Start ball spawning
    setTimeout(() => {

        const newBall = spawnBall();
        balls.push(newBall);
        
        ballSpawnInterval = setInterval(() => {
            if (keyboardControls.isPaused) {
                return;
            }
            const newBall = spawnBall();
            balls.push(newBall);
            
            if (balls.length > 10) {
                const oldBall = balls.shift();
                scene.remove(oldBall.getMesh());
                world.removeBody(oldBall.getBody());
            }
        }, 3000);
    }, 5000);

    // Update timer section to clear the ball spawning
    const timerInterval = setInterval(() => {
        if (keyboardControls.isPaused) {
            return;
        }
        if (!window.stopTimer) {  // Check the global variable
            timeRemaining--;
        }
        timerDisplay.textContent = `Time: ${timeRemaining}`;
        
        if (timeRemaining === 3) {
            soundManager.playSound('countdown');
        }
        
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            clearInterval(ballSpawnInterval);
            
            // Stop both background music and ocean sound when game ends
            if (soundManager.sounds){            
                if (soundManager.sounds.bgMusic) {
                soundManager.sounds.bgMusic.pause();
                soundManager.sounds.bgMusic.currentTime = 0;
                }
                if(soundManager.sounds.ocean) {
                soundManager.sounds.ocean.pause();
                soundManager.sounds.ocean.currentTime = 0;
                }
                if (soundManager.sounds.bump) {
                soundManager.sounds.bump.pause();
                soundManager.sounds.bump.currentTime = 0;
                }
                if (soundManager.sounds.cartoon) {
                soundManager.sounds.cartoon.pause();
                soundManager.sounds.cartoon.currentTime = 0;
                }
            }


            // Show game over screen
            const gameOverScreen = document.getElementById('gameOverScreen');
            const finalScoreDisplay = document.getElementById('finalScore');
            const highScore = document.getElementById('highScore');
            finalScoreDisplay.textContent = `Final Score: ${score}`;
            if (score > highscore) {
                localStorage.setItem('highscore', score);
                highScore.textContent = `New High Score: ${score}`;
            } else {
                highScore.textContent = `High Score: ${highscore}`;
            }
            gameOverScreen.style.display = 'flex';
            gameStarted = false;
            keyboardControls.endGame();
            
            // Clean up the game state
            balls.forEach(ball => {
                scene.remove(ball.getMesh());
                world.removeBody(ball.getBody());
            });
            balls.length = 0;
            
            // Remove only non-static cubes
            cubes.forEach((cube, index) => {
                if (!cube.isStatic) {  // Only remove if not static
                    scene.remove(cube.getMesh());
                    world.removeBody(cube.getBody());
                }
            });
            energyPanel.innerHTML = '';
        }
    }, 1000);
}


// ============================ Animate ============================

function animate() {
    requestAnimationFrame(animate);
    
    if (!gameStarted) return;
    
    // Handle any pending merges before physics step
    while (pendingMerges.length > 0) {
        const merge = pendingMerges.shift();
        
        // Remove the original objects
        scene.remove(merge.ball.getMesh());
        world.removeBody(merge.ball.getBody());
        scene.remove(merge.cube.getMesh());
        world.removeBody(merge.cube.getBody());
        
        // Remove energy display of the original ball
        if (merge.ball.energyDisplay && merge.ball.energyDisplay.parentNode === energyPanel) {
            energyPanel.removeChild(merge.ball.energyDisplay);
        }
        
        // Remove from tracking arrays
        const ballIndex = balls.indexOf(merge.ball);
        if (ballIndex > -1) balls.splice(ballIndex, 1);
        
        const cubeIndex = cubes.indexOf(merge.cube);
        if (cubeIndex > -1) cubes.splice(cubeIndex, 1);
        
        // Create the merged ball
        mergeBall(merge.position, scene, world);
        
        // Play merge sound instead of spawn sound
        soundManager.playSound('merge');
    }
    
    // Only update physics and animations if not paused
    if (!keyboardControls.isPaused) {
        const timeScale = 4.0 * window.animation_multiplier;
        world.step((1/60) * timeScale);
        
        spotlightManager.update();
        ground.update();
        
        const camera = cameraManager.getActiveCamera();
        
        // Animate cubes
        for (let i = cubes.length - 1; i >= 0; i--) {
            const cube = cubes[i];
            cube.animate();
            cube.updateUniforms(spotlightManager);
            
            if (cube.shouldRemove) {
                if (!cube.vanishingMaterial) {
                    cube.vanishingMaterial = createVanishingMaterial();
                    cube.vanishProgress = 0;
                    cube.getMesh().material = cube.vanishingMaterial;
                }
                
                cube.vanishProgress += 0.02;
                cube.vanishingMaterial.uniforms.vanishProgress.value = cube.vanishProgress;
                cube.vanishingMaterial.uniforms.cameraPosition.value = camera.position;
                
                if (cube.vanishProgress >= 1.0) {
                    scene.remove(cube.getMesh());
                    world.removeBody(cube.getBody());
                    cubes.splice(i, 1);
                }
            }
        }
        
        // Animate balls
        for (let i = balls.length - 1; i >= 0; i--) {
            const ball = balls[i];
            ball.animate();
            ball.updateUniforms(spotlightManager);
            
            if (ball.energyDisplay) {
                const energy = calculateEnergy(ball);
                const energyPercent = ((energy.total / ball.initialEnergy) * 100).toFixed(1);
                const color = energyPercent > 50 ? 'lightgreen' : 
                             energyPercent > 25 ? 'yellow' : 'red';
                
                ball.energyDisplay.innerHTML = `
                    <div style="color: ${color}">
                        Ball ${ball.ballId} (${ball.material})<br>
                        Position: X:${ball.getBody().position.x.toFixed(1)}<br>
                        Energy: ${energyPercent}% <input type="range" 
                            min="0" 
                            max="${100}" 
                            value="${energyPercent}" 
                            style="width: 50%;"
                            readonly><br>
                        KE: ${energy.kinetic.toFixed(1)} J <input type="range" 
                            min="0" 
                            max="${energy.total}" 
                            value="${energy.kinetic}" 
                            style="width: 50%;"
                            readonly><br>
                        PE: ${energy.potential.toFixed(1)} J<input type="range" 
                            min="0" 
                            max="${energy.total}" 
                            value="${energy.potential}" 
                            style="width: 50%;"
                            readonly><br>
                        Total: ${energy.total.toFixed(1)} J<input type="range" 
                            min="0" 
                            max="${ball.initialEnergy}" 
                            value="${energy.total}" 
                            style="width: 50%;"
                            readonly><br><br>
                    </div>
                `;
            }
            
            if (ball.getBody().shouldRemove) {
                if (!ball.vanishingMaterial) {
                    ball.vanishingMaterial = createVanishingMaterial();
                    ball.vanishProgress = 0;
                    ball.getMesh().material = ball.vanishingMaterial;
                    ball.getMesh().castShadow = false;
                    ball.getMesh().receiveShadow = false;
                }
                
                ball.vanishProgress += 0.02;
                ball.vanishingMaterial.uniforms.vanishProgress.value = ball.vanishProgress;
                ball.vanishingMaterial.uniforms.cameraPosition.value = camera.position;
                
                if (ball.vanishProgress >= 1.0) {
                    if (ball.energyDisplay && ball.energyDisplay.parentNode === energyPanel) {
                        energyPanel.removeChild(ball.energyDisplay);
                    }
                    scene.remove(ball.getMesh());
                    world.removeBody(ball.getBody());
                    balls.splice(i, 1);
                }
            }
        }
        
        bouncer.animate();
        bouncer.updateUniforms(spotlightManager);
        const timeValue = clock.getElapsedTime() * 0.5;
        dynamicShaderMaterial.uniforms.time.value = 3 * timeValue;
        stationaryShaderMaterial.uniforms.time.value = timeValue * 10.0;
        map.animate();
    }

    // Always render the scene, even when paused
    renderer.render(scene, cameraManager.getActiveCamera());
}


// ============================ Window Resize ============================

function onWindowResize() {
    cameraManager.onWindowResize();
    renderer.setSize(window.innerWidth, window.innerHeight);
}


// ============================ Vanishing Material ============================

function createVanishingMaterial() {
    return new THREE.ShaderMaterial({
        vertexShader: vanishingVertexShader,
        fragmentShader: vanishingFragmentShader,
        uniforms: {
            vanishProgress: { value: 0.0 },
            color: { value: new THREE.Color(0xff0000) },
            cameraPosition: { value: camera.position }
        },
        transparent: true,
        side: THREE.DoubleSide
    });
}


// ============================ UI Elements ============================

function initializeDisplays(scoreDisplay, energyPanel){
    scoreDisplay.style.position = 'fixed';
    scoreDisplay.style.top = '20px';
    scoreDisplay.style.right = '20px';
    scoreDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    scoreDisplay.style.color = 'white';
    scoreDisplay.style.padding = '10px 20px';
    scoreDisplay.style.borderRadius = '5px';
    scoreDisplay.style.fontFamily = 'Arial, sans-serif';
    scoreDisplay.style.fontSize = '24px';
    scoreDisplay.textContent = 'Score: 0';
    document.body.appendChild(scoreDisplay);

    // Add timer display
    timerDisplay.style.position = 'fixed';
    timerDisplay.style.top = '70px'; // Position it below the score
    timerDisplay.style.right = '20px';
    timerDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    timerDisplay.style.color = 'white';
    timerDisplay.style.padding = '10px 20px';
    timerDisplay.style.borderRadius = '5px';
    timerDisplay.style.fontFamily = 'Arial, sans-serif';
    timerDisplay.style.fontSize = '24px';
    timerDisplay.textContent = 'Time: 30';
    document.body.appendChild(timerDisplay);

    energyPanel.style.position = 'fixed';
    energyPanel.style.top = '20px';
    energyPanel.style.left = '20px';
    energyPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    energyPanel.style.color = 'white';
    energyPanel.style.padding = '10px';
    energyPanel.style.borderRadius = '5px';
    energyPanel.style.fontFamily = 'Arial, sans-serif';
    energyPanel.style.fontSize = '14px';
    energyPanel.style.maxHeight = '80vh';
    energyPanel.style.overflowY = 'auto';
    document.body.appendChild(energyPanel);

    // Add cooldown indicator container with label
    const cooldownContainer = document.createElement('div');
    cooldownContainer.style.position = 'fixed';
    cooldownContainer.style.bottom = '20px';
    cooldownContainer.style.left = '20px';
    cooldownContainer.style.width = '200px';

    // Add "Bonus Cube" label
    const cooldownLabel = document.createElement('div');
    cooldownLabel.textContent = 'Bonus Cube';
    cooldownLabel.style.color = 'white';
    cooldownLabel.style.fontFamily = 'Arial, sans-serif';
    cooldownLabel.style.fontSize = '14px';
    cooldownLabel.style.marginBottom = '5px';
    cooldownLabel.style.textAlign = 'center';
    cooldownContainer.appendChild(cooldownLabel);

    // Add cooldown indicator
    const cooldownIndicator = document.createElement('div');
    cooldownIndicator.style.width = '200px';
    cooldownIndicator.style.height = '30px';
    cooldownIndicator.style.backgroundColor = '#4CAF50';  // Start green
    cooldownIndicator.style.borderRadius = '15px';
    cooldownIndicator.style.overflow = 'hidden';
    cooldownIndicator.style.position = 'relative';

    // Add progress bar inside cooldown indicator
    const progressBar = document.createElement('div');
    progressBar.style.width = '0%';
    progressBar.style.height = '100%';
    progressBar.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';  // Dark overlay
    progressBar.style.transition = 'width 0.1s linear';
    progressBar.style.position = 'absolute';
    progressBar.style.top = '0';
    progressBar.style.left = '0';
    cooldownIndicator.appendChild(progressBar);

    // Add cube icon
    const cubeIcon = document.createElement('div');
    cubeIcon.style.position = 'absolute';
    cubeIcon.style.left = '10px';
    cubeIcon.style.top = '50%';
    cubeIcon.style.transform = 'translateY(-50%)';
    cubeIcon.style.width = '20px';
    cubeIcon.style.height = '20px';
    cubeIcon.style.backgroundColor = '#fff';
    cubeIcon.style.borderRadius = '3px';
    cubeIcon.style.zIndex = '1';
    cooldownIndicator.appendChild(cubeIcon);

    cooldownContainer.appendChild(cooldownIndicator);
    document.body.appendChild(cooldownContainer);

    // Store references to cooldown elements
    window.cooldownElements = {
        indicator: cooldownIndicator,
        progressBar: progressBar
    };
}

let spawnCooldown = false;
const spawnCooldownDuration = 5000; // 5 seconds

function spawnCube() {
    if (spawnCooldown) {
        keyboardControls.messageOverlay.textContent = 'Cube Spawn on Cooldown!';
        keyboardControls.messageOverlay.style.display = 'block';
        setTimeout(() => {
            keyboardControls.messageOverlay.style.display = 'none';
        }, 1000);
        return;
    }

    soundManager.playSound('spawnCube');
    
    // Create cube with current shader state
    const currentShaderState = ground.shaderState;
    const cube = new Cube(30, cubeMat, 0, 70, 0, true);
    
    // Set up shader state before adding to scene
    if (currentShaderState > 0) {
        cube.setShaderState(currentShaderState);
    }
    
    // add to scene and world
    cube.add(scene, world);
    
    // Mark the body as a cube for collision detection
    cube.getBody().isCube = true;
    cube.getBody().userData = { parent: cube };
    
    // Add collision detection for the cube
    cube.getBody().addEventListener("collide", (event) => {
        if (event.body.material === groundMat && !cube.shouldRemove) {
            cube.shouldRemove = true;
            cube.getMesh().castShadow = false;
            cube.getMesh().receiveShadow = false;
            
            score -= 20;
            scoreDisplay.textContent = `Score: ${score}`;
            
            showScorePopup('-20', new THREE.Vector3(
                cube.getBody().position.x,
                cube.getBody().position.y,
                cube.getBody().position.z
            ));
            
            soundManager.playSound('lose');
        }
    });
    
    cubes.push(cube);

    // Handle cooldown
    spawnCooldown = true;
    const startTime = Date.now();
    updateCooldown(startTime);
    
    return cube;
}

// cooldown update function
function updateCooldown(startTime) {
    if (!spawnCooldown) {
        window.cooldownElements.progressBar.style.width = '0%';
        return;
    }

    const elapsed = Date.now() - startTime;
    const remaining = spawnCooldownDuration - elapsed;
    
    if (remaining > 0) {
        const progress = (elapsed / spawnCooldownDuration) * 100;
        window.cooldownElements.progressBar.style.width = `${100 - progress}%`;
        requestAnimationFrame(() => updateCooldown(startTime));
    } else {
        spawnCooldown = false;
        window.cooldownElements.progressBar.style.width = '0%';
    }
}

function restartGame() {
    // Reset camera through GUI controls
    cameraManager.resetCamera();
    // Reset bouncer position and rotation
    bouncer.setX(0);
    bouncer.setY(0);
    bouncer.setZ(90);
    bouncer.resetRotation();
    
    // Reset spotlight through GUI controls
    spotlightManager.resetSpotlight();
}

function reloadPage() {
    // Save high score
    if (score > highscore) {
        localStorage.setItem('highscore', score);
    }
    
    // Save animation and FPS values
    localStorage.setItem('animation_multiplier', window.animation_multiplier.toString());
    localStorage.setItem('current_fps', window.current_fps.toString());
    
    // Reload the page
    window.location.reload();
}

// First, add a property to identify static cubes when creating them
const staticBox = Cube.createBox(
    scene, 
    world, 
    new THREE.Vector3(150, 15, -30),
    cubeMat
);

// Mark it as static
staticBox.isStatic = true;
staticBox.getBody().mass = 0;
staticBox.getBody().updateMassProperties();
cubes.push(staticBox);

const staticBalloonBall = new Ball(4, balloonMat, 150, -5, -30, false, 0);
staticBalloonBall.add(scene, world);

staticBalloonBall.getBody().type = CANNON.Body.STATIC;
staticBalloonBall.getBody().mass = 0;
staticBalloonBall.getBody().updateMassProperties();

balls.push(staticBalloonBall);