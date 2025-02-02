function loadShaderFile(url) {
    const request = new XMLHttpRequest();
    request.open('GET', url, false);
    request.send();
    return request.responseText;
}

const waterWaveVertex = loadShaderFile('glsl/water/wave.vert');
const waterWaveFragment = loadShaderFile('glsl/water/wave.frag');

const waterStationaryVertex = loadShaderFile('glsl/water/stationary.vert');
const waterStationaryFragment = loadShaderFile('glsl/water/stationary.frag');

const vanishingVertexShader = loadShaderFile('glsl/vanishing/vanishing.vert');
const vanishingFragmentShader = loadShaderFile('glsl/vanishing/vanishing.frag');

const bumpMapVertex = loadShaderFile('glsl/material/bump.vert');
const bumpMapFragment = loadShaderFile('glsl/material/bump.frag');

const toonVertexShader = loadShaderFile('glsl/material/toon.vert');
const toonFragmentShader = loadShaderFile('glsl/material/toon.frag');


window.shaders = {
    waterWaveVertex,
    waterWaveFragment,
    waterStationaryVertex,
    waterStationaryFragment,
    vanishingVertexShader,
    vanishingFragmentShader,
    bumpMapVertex,
    bumpMapFragment,
    toonVertexShader,
    toonFragmentShader
};
