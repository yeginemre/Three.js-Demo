uniform float vanishProgress;
uniform vec3 color;
varying vec3 vPosition;
varying vec3 vNormal;

void main() {
    // Calculate rim lighting effect
    vec3 viewDirection = normalize(cameraPosition - vPosition);
    float rim = 1.0 - max(dot(viewDirection, vNormal), 0.0);
    
    // Combine rim effect with vanishing progress
    float opacity = (1.0 - vanishProgress) * (0.5 + rim * 0.5);
    
    // Add some color pulsing during vanishing
    vec3 pulseColor = mix(color, vec3(1.0), sin(vanishProgress * 3.14159 * 2.0) * 0.5 + 0.5);
    
    gl_FragColor = vec4(pulseColor, opacity);
}