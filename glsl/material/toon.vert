// The following are automatically included by Three.js:
//
// Matrix uniforms:
//   uniform mat4 modelMatrix;
//   uniform mat4 modelViewMatrix;
//   uniform mat4 projectionMatrix;
//   uniform mat3 normalMatrix;
//
// Attributes:
//   attribute vec3 position;
//   attribute vec3 normal;
//   attribute vec2 uv;

// === These includes are only used for shadow mapping and not anything else ===
// common: Required by other shadow includes
#include <common>
// Adds shadow map related varying variables and functions for vertex shader
#include <shadowmap_pars_vertex>

// Light uniforms
uniform vec3 spotLightPosition;
uniform vec3 spotLight2Position;
uniform vec3 spotLight3Position;
uniform vec3 spotLightDirection;
uniform vec3 spotLight2Direction;
uniform vec3 spotLight3Direction;
uniform float spotLightAngle;
uniform int geometryType;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vWorldPosition;

void main() {
    // Normal calculations
    vec3 transformedNormal = normalMatrix * normal;
    vNormal = normalize(transformedNormal);
    
    // Handle UVs based on geometryType
    if (geometryType == 1) {
        vUv = uv - 0.5;
        vUv *= 2.0;
        vUv = vUv * 0.5 + 0.5;
    } else if (geometryType == 0) {
        vUv = uv * 4.0;
    } else {
        vUv = uv;
    }
    
    // Position calculations using Three.js provided matrices and attributes
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    
    gl_Position = projectionMatrix * mvPosition;
    
    // Calculates shadow coordinates and assigns to varyings
    #include <shadowmap_vertex>
}