import * as THREE from 'three';
import { TextureLoader } from 'three';

// Array to store text meshes
export let textMeshes = [];

export function createTextWithBalls(text, x, y, z, scene, matIndex, letterSpacing, ballSpacing) {
    const ballRadius = 3;
    
    const reversedText = text.split('').join('');
    const startX = x;

    const letters = {
        'E': [
            [-3,-2], [-1,-2], [1,-2], [3,-2],
            [-3,0],
            [-3,2], [-1,2], [1,2], [3,2],
            [-3,4],     
            [-3,6], [-1,6], [1,6], [3,6]
        ],
        'M': [
            [-3,-2],              [3,-2],
            [-3,0], [-1,0],  [1, 0],     [3,0],
            [-3,2],     [0, 2],         [3,2],
            [-3,4],              [3,4],
            [-3,6],              [3,6]  
        ],
        'R': [
            [-3,-2], [-1,-2], [1,-2], [3,-2],
            [-3,0],                 [3, 0],
            [-3,2], [-1,2], [1,2], [3,2],
            [-3,4], [-1, 4],
                             [1,5],
            [-3,6],              , [3, 6]
        ],
        'Y': [[-3, -2],                 [3, -2],
                        [-1, 0],[1, 0], 
                            [0, 2], 
                            [0, 4], 
                            [0, 6], 
            ],
        'G': [[-3, -2], [-1, -2], [1, -2], [3, -2],
              [-3, 0], 
              [-3, 2],           [1, 2], [3, 2],
              [-3, 4],                  [3, 4],
              [-3, 6], [-1, 6], [1, 6], [3, 6]
        ],
        'İ': [[-3, -5],
              [-3, -2],
              [-3, 0], 
              [-3, 2], 
              [-3, 4],
              [-3, 6], 
        ],
        'N': [[-9, -2],                  [-3, -2],
              [-9, 0], [-7.5,0],         [-3, 0],
              [-9, 2],        [-6, 2]  , [-3, 2],
              [-9, 4],              [-4.5, 4],  [-3, 4],
              [-9, 6],                    [-3, 6]

        ],'H': [[-3, -2],                [3, -2],
              [-3, 0],                   [3, 0],
              [-3, 2], [-1, 2], [1, 2], [3, 2],
              [-3, 4],                   [3, 4],
              [-3, 6],                   [3, 6]
        ],
        'A': [[-3, -2], [-1, -2], [1, -2], [3, -2],
              [-3, 0],                   [3, 0],
              [-3, 2], [-1, 2], [1, 2], [3, 2],
              [-3, 4],                   [3, 4],
              [-3, 6],                   [3, 6]
        ],
        'K': [[-3, -2],                   [3, -2],
              [-3, 0],            [1, 0],             
              [-3, 2], [-1, 2],          
              [-3, 4],           [1, 4],  
              [-3, 6],                   [3, 6]
        ],
        'n': [[-3, -2],                  [3, -2],
        [-3, 0], [-1.5,0],                [3, 0],
        [-3, 2],        [-0, 2]  ,        [3, 2],
        [-3, 4],              [1.5, 4],  [3, 4],
        [-3, 6],                          [3, 6]

        ],'Ç': [[-3, -2], [-1, -2], [1, -2], [3, -2],
              [-3, 0], 
              [-3, 2], 
              [-3, 4], 
              [-3, 6], [-1, 6], [1, 6], [3, 6],
                            [0, 8]
        ],
        'I': [[-3, -2],
        [-3, 0], 
        [-3, 2], 
        [-3, 4],
        [-3, 6], 
        ],'C': [[-9, -2], [-7, -2], [-5, -2], [-3, -2],
              [-9, 0], 
              [-9, 2], 
              [-9, 4], 
              [-9, 6], [-7, 6], [-5, 6], [-3, 6]
        ],
        'ı': [[-9, -2],
        [-9, 0], 
        [-9, 2], 
        [-9, 4],
        [-9, 6], 
        ],
        'U': [[-3, -2],                [3, -2],
        [-3, 0],                   [3, 0],
        [-3, 2],                   [3, 2],
        [-3, 4],                   [3, 4],
        [-3, 6], [-1, 6], [1, 6], [3, 6]
      ],

      'T': [[-3, -2],[-1, -2], [1, -2], [3, -2],
                           [0, 0], 
                           [0, 2], 
                          [0, 4], 
                           [0, 6], 
],
        ' ': []
    };

    // Create a single geometry for instancing
    const sphereGeometry = new THREE.SphereGeometry(ballRadius, 16, 16);
    
    // Create THREE.js materials with textures
    const threeMaterials = [
        new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.3,
            metalness: 0.8
        }),
        new THREE.MeshStandardMaterial({
            color: 0xffff00,
            roughness: 0.8,
            metalness: 0.2
        }),

        new THREE.MeshStandardMaterial({
            color: 0xff0000,
            roughness: 0.4,
            metalness: 0.1
        }),
    ];

    const material = threeMaterials[matIndex];

    reversedText.split('').forEach((char, charIndex) => {
        if (letters[char]) {
            letters[char].forEach(([dx, dz]) => {
                const posX = startX + (charIndex * letterSpacing) + (dx * ballSpacing);
                const posZ = z + (dz * ballSpacing);
                
                // Create mesh with material
                const mesh = new THREE.Mesh(sphereGeometry, material.clone());
                mesh.position.set(posX, y, posZ);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                
                scene.add(mesh);
                textMeshes.push(mesh);
            });
        }
    });
} 