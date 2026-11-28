import * as T from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';

// Overcast light still darkens at abutting surfaces. Sample the scene depth in
// metres so the eaves, timber joints and stone crevices retain depth on approach.
export function createPhotographicRender(renderer: T.WebGLRenderer, scene: T.Scene, camera: T.PerspectiveCamera) {
  if (!renderer.extensions.has('EXT_color_buffer_float')) {
    return { draw: () => renderer.render(scene, camera), resize: () => {} };
  }
  const size = renderer.getDrawingBufferSize(new T.Vector2());
  const target = new T.WebGLRenderTarget(size.x, size.y, {
    type: T.HalfFloatType, depthTexture: new T.DepthTexture(size.x, size.y),
    samples: Math.min(2, renderer.capabilities.maxSamples),
  });
  const grading = new T.ShaderMaterial({
    depthWrite: false,
    depthTest: false,
    uniforms: {
      frame: { value: target.texture }, depth: { value: target.depthTexture },
      inverseProjection: { value: camera.projectionMatrixInverse },
      zoom: { value: new T.Vector2() },
    },
    vertexShader: `
      varying vec2 st;
      void main(){ st = uv; gl_Position = vec4(position.xy,0.,1.); }`,
    fragmentShader: `
      varying vec2 st;
      uniform sampler2D frame, depth;
      uniform mat4 inverseProjection;
      uniform vec2 zoom;
      vec3 positionAt(vec2 uv, float z) {
        vec4 h = inverseProjection * vec4(uv * 2. - 1., z * 2. - 1., 1.);
        return h.xyz / h.w;
      }
      void main() {
        float z = texture2D(depth, st).r;
        vec3 p = positionAt(st, z);
        vec3 normal = normalize(cross(dFdx(p), dFdy(p)));
        vec3 rgb = texture2D(frame, st).rgb;
        if (z < .99999 && -p.z < 118.) {
          float occlusion = 0.;
          vec2 axis = vec2(.961,.277);
          for (int i = 0; i < 12; i++) {
            float fraction = (float(i)+.72)/12.;
            float reach = .07 + fraction*fraction*2.;
            vec2 sampleUv = clamp(st + axis * reach * zoom / max(.15,-p.z), .0001, .9999);
            vec3 delta = positionAt(sampleUv, texture2D(depth,sampleUv).r) - p;
            float d = length(delta);
            float angle = max(0., (dot(normal,delta)-.029) / max(.012, d));
            occlusion += angle * (1.-smoothstep(reach*.4,reach*1.9,d));
            axis = mat2(-.737,.676,-.676,-.737)*axis;
          }
          rgb *= max(.61, 1.-occlusion*.125);
        }
        gl_FragColor = vec4(rgb,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const quad = new FullScreenQuad(grading);
  renderer.info.autoReset = false;
  function draw() {
    grading.uniforms.zoom.value.set(camera.projectionMatrix.elements[0] * .5, camera.projectionMatrix.elements[5] * .5);
    renderer.info.reset();
    renderer.setRenderTarget(target);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    quad.render(renderer);
  }
  function resize() {
    renderer.getDrawingBufferSize(size);
    target.setSize(size.x, size.y);
  }
  return { draw, resize };
}
