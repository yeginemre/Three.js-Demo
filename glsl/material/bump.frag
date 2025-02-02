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

// Uniforms for textures and materials
uniform sampler2D diffuseMap;
uniform sampler2D normalMap;

// Light uniforms
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
uniform vec3 spotLightColor;
uniform vec3 spotLight2Color;
uniform vec3 spotLight3Color;

// Material uniforms
uniform vec2 normalScale;
uniform int geometryType;
uniform float ambientIntensity;
uniform vec3 emissiveColor;

// Varyings from vertex shader
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vWorldPosition;

float calculateSpotlight(vec3 lightPos, vec3 lightDir, float intensity, vec3 normal, vec3 lightColor) {
    vec3 dirToLight = normalize(lightPos - vWorldPosition);
    float spotEffect = dot(normalize(lightDir), -dirToLight);
    float spotCutoff = cos(spotLightAngle);
    
    float distance = length(lightPos - vWorldPosition);
    float attenuation = 1.0 / (1.0 + 0.005 * distance + 0.0001 * distance * distance);
    
    float diffuse = max(dot(normal, dirToLight), 0.0);
    diffuse = pow(diffuse, 0.8);
    
    if (spotEffect > spotCutoff) {
        float spotIntensity = smoothstep(spotCutoff, spotCutoff + 0.1, spotEffect);
        return diffuse * spotIntensity * intensity * attenuation;
    }
    return 0.0;
}

void main() {
    vec3 normalMap = texture2D(normalMap, vUv).xyz * 2.0 - 1.0;
    normalMap.xy *= normalScale;
    normalMap = normalize(normalMap);
    
    vec3 N = normalize(vNormal);
    vec3 normal;
    
    if (geometryType == 2) {
        normal = normalize(N + normalMap * 0.5);
    } else {
        vec3 T = normalize(cross(N, vec3(0.0, 1.0, 0.0)));
        vec3 B = normalize(cross(N, T));
        mat3 TBN = mat3(T, B, N);
        normal = normalize(TBN * normalMap);
    }

    float shadowMask = getShadowMask();

    // Calculate spotlight contributions
    float mainLight = calculateSpotlight(spotLightPosition, spotLightDirection, spotLightIntensity, normal, spotLightColor);
    float leftLight = calculateSpotlight(spotLight2Position, spotLight2Direction, spotLight2Intensity, normal, spotLight2Color);
    float rightLight = calculateSpotlight(spotLight3Position, spotLight3Direction, spotLight3Intensity, normal, spotLight3Color);
    
    vec4 texColor = texture2D(diffuseMap, vUv);
    
    // Apply colored lighting with ambient and shadows
    vec3 mainContrib = spotLightColor * mainLight * shadowMask;
    vec3 leftContrib = spotLight2Color * leftLight * shadowMask;
    vec3 rightContrib = spotLight3Color * rightLight * shadowMask;
    
    vec3 finalColor = texColor.rgb * (ambientIntensity + mainContrib + leftContrib + rightContrib);
    
    // Apply normal mapping influence even in ambient light
    float normalInfluence = dot(normal, vec3(0.0, 1.0, 0.0));
    finalColor *= 0.8 + 0.2 * normalInfluence;
    
    // Only add emissive color for 3D objects (geometryType == 2)
    if (geometryType == 2) {
        finalColor += 5.0 * emissiveColor;
    }
    
    gl_FragColor = vec4(finalColor, 1.0);
}