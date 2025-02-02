// === These includes are only used for shadow mapping and not anything else ===
// Required utilities and constants used by other shadow includes
#include <common>
// Required for shadow depth packing/unpacking functions
#include <packing>
// Adds shadow map uniforms and varyings
#include <lights_pars_begin>
// Adds shadow map sampling functions
#include <shadowmap_pars_fragment>
// Adds getShadowMask() function used for shadow calculations
#include <shadowmask_pars_fragment>

uniform sampler2D diffuseMap;
uniform vec3 spotLightPosition;
uniform vec3 spotLight2Position;
uniform vec3 spotLight3Position;
uniform vec3 spotLightDirection;
uniform vec3 spotLight2Direction;
uniform vec3 spotLight3Direction;
uniform float spotLightAngle;
uniform float spotLightIntensity;
uniform float spotLight2Intensity;
uniform float spotLight3Intensity;
uniform int geometryType;
uniform vec3 spotLightColor;
uniform vec3 spotLight2Color;
uniform vec3 spotLight3Color;
uniform float ambientIntensity;
uniform vec3 emissiveColor;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vWorldPosition;

// Toon shading for spotlights
float getToonShading(float intensity) {
    if (intensity > 0.7) return 1.0;
    else if (intensity > 0.4) return 0.8;
    else if (intensity > 0.2) return 0.6;
    else if (intensity > 0.1) return 0.4;
    else return 0.2;
}

// Separate function for ambient steps
float getAmbientToonShading(float intensity) {
    if (intensity >= 0.8) return 1.0;
    else if (intensity >= 0.6) return 0.8;
    else if (intensity >= 0.4) return 0.65;
    else if (intensity >= 0.2) return 0.5;
    else return 0.0;
}

float calculateSpotlight(vec3 lightPos, vec3 lightDir, float intensity, vec3 normal) {
    vec3 dirToLight = normalize(lightPos - vWorldPosition);
    float spotEffect = dot(normalize(lightDir), -dirToLight);
    float spotCutoff = cos(spotLightAngle);
    
    float distance = length(lightPos - vWorldPosition);
    float attenuation = 1.0 / (1.0 + 0.003 * distance + 0.00005 * distance * distance);
    
    float diffuse = max(dot(normal, dirToLight), 0.0);
    diffuse = diffuse * 0.7 + 0.3;
    
    if (spotEffect > spotCutoff) {
        float spotIntensity = smoothstep(spotCutoff, spotCutoff + 0.1, spotEffect);
        return diffuse * spotIntensity * intensity * attenuation;
    }
    return 0.0;
}

void main() {
    vec3 normal = normalize(vNormal);

    // Calculate spotlight contributions
    float mainLight = calculateSpotlight(spotLightPosition, spotLightDirection, spotLightIntensity * 1.2, normal);
    float leftLight = calculateSpotlight(spotLight2Position, spotLight2Direction, spotLight2Intensity * 1.2, normal);
    float rightLight = calculateSpotlight(spotLight3Position, spotLight3Direction, spotLight3Intensity * 1.2, normal);
    
    // Calculate spotlight and ambient separately
    float spotlightTotal = mainLight + leftLight + rightLight;
    float spotToon = getToonShading(spotlightTotal);
    
    // Get ambient contribution in distinct steps
    float ambientToon = getAmbientToonShading(ambientIntensity);
    
    // Get base color from texture
    vec4 texColor = texture2D(diffuseMap, vUv);
    
    // Mix spotlight colors
    vec3 spotlightColor = spotLightColor * mainLight +
                         spotLight2Color * leftLight +
                         spotLight3Color * rightLight;
    
    // Edge detection (rim lighting)
    vec3 viewDir = normalize(vViewPosition);
    float rim = 1.0 - max(dot(viewDir, normal), 0.0);
    rim = smoothstep(0.6, 1.0, rim);
    
    // Get shadow mask from Three.js includes
    float shadowMask = getShadowMask();
    
    // Combine spotlight and ambient contributions with shadows
    vec3 finalColor = texColor.rgb * (
        spotlightColor * spotToon * 1.2 * shadowMask +  // Spotlight contribution with shadows
        vec3(1.0) * ambientToon                         // Stepped ambient contribution
    );
    
    // Apply rim darkening
    finalColor *= (1.0 - rim * 0.4);
    
    // Add emissive color for 3D objects
    if (geometryType == 2) {
        finalColor += emissiveColor;
    }
    
    // Quantize colors for more cartoon-like look
    finalColor = floor(finalColor * 3.0) / 3.0;
    
    gl_FragColor = vec4(finalColor, 1.0);
}