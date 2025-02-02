uniform float time;
uniform float xs, zs, h;
uniform vec2 uvScale;
varying vec2 vUv;
varying float vElevation;

void main() {
    vec4 t = vec4(position, 1.0);
    
    // Primary wave motion
    float wave1 = h * sin(3.0 * time + xs * position.x + zs * position.z);
    
    // Secondary overlapping waves for more complexity
    float wave2 = (h * 0.3) * sin(4.0 * time + xs * position.x * 0.8);
    float wave3 = (h * 0.2) * sin(2.5 * time + zs * position.z * 0.6);
    
    // Combine waves
    float elevation = wave1 + wave2 + wave3;
    t.y += elevation;
    
    vElevation = elevation;
    vUv = uv * uvScale + vec2(time * 0.05);  // Slow constant UV movement
    gl_Position = projectionMatrix * modelViewMatrix * t;
} 