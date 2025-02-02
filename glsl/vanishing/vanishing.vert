uniform float vanishProgress;
varying vec3 vPosition;
varying vec3 vNormal;

void main() {
    // Scale the object based on vanish progress
    vec3 pos = position * (1.0 - vanishProgress * 0.5);
    
    vPosition = pos;
    vNormal = normal;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}