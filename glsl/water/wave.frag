uniform sampler2D uTexture;
uniform float time;
varying vec2 vUv;
varying float vElevation;

void main() {
    // Animate UVs slightly for flowing water effect
    vec2 uv = vUv + 0.01 * vec2(
        sin(time + vUv.x * 10.0),
        cos(time + vUv.y * 10.0)
    );
    
    vec4 texColor = texture2D(uTexture, uv);
    
    // Add subtle brightness variation based on wave height
    float brightness = 1.0 + vElevation * 0.3;
    vec3 finalColor = texColor.rgb * brightness;
    
    // Add slight blue tint to darker areas
    finalColor += vec3(0.0, 0.0, 0.1) * (1.0 - brightness);
    
    gl_FragColor = vec4(finalColor, 0.3);
} 