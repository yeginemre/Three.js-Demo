uniform float time;
uniform float xs, zs, h;
uniform vec2 uvScale;
varying vec2 vUv;

void main() {
    vec4 t = vec4(position, 1.0);
    t.y += h * sin(time + xs * position.x)
         + h * sin(time + zs * position.z);
    vUv = uv * uvScale;
    gl_Position = projectionMatrix * modelViewMatrix * t;
}