import * as T from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { noise } from '../../shared/procedural';

export async function lightCourtyard(scene: T.Scene, compact: boolean) {
  const panorama = await new HDRLoader().loadAsync(new URL('../assets/shirasagi/overcast.hdr', document.baseURI).href);
  panorama.mapping = T.EquirectangularReflectionMapping;
  scene.background = new T.Color(0xc6cbd0);
  scene.environment = panorama;
  scene.environmentRotation.y = Math.PI * 2 * .324;
  // This low-frequency exposure field was sampled only in the clear sky of
  // the reference. It follows world directions as the visitor looks around.
  const cloudLight = await new T.TextureLoader().loadAsync(new URL('../assets/shirasagi/cloud-light.webp', document.baseURI).href);
  const skyDome = new T.Mesh(new T.SphereGeometry(1, 48, 24), new T.ShaderMaterial({
    uniforms: { clouds: { value: panorama }, cloudLight: { value: cloudLight } }, side: T.BackSide, depthTest: false, depthWrite: false,
    vertexShader: `
      varying vec3 ray;
      void main() {
        ray = position;
        vec4 clip = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.);
        gl_Position = clip.xyww;
      }`,
    fragmentShader: `
      varying vec3 ray;
      uniform sampler2D clouds, cloudLight;
      void main() {
        vec3 dir = normalize(ray);
        vec2 uv = vec2(fract(atan(dir.z,dir.x) / 6.2831853 + .824),
                       asin(clamp(dir.y,-1.,1.)) / 3.14159265 + .525);
        vec3 source = texture2D(clouds, uv).rgb;
        float ev = log2(max(.001, dot(source, vec3(.2126,.7152,.0722))));
        float brightness = exp2(.66 + .95 * ev);
        vec3 cloud = brightness * mix(vec3(.89,.96,1.11), vec3(1.), smoothstep(.1,1.3,ev));
        vec2 worldUv = vec2(fract(uv.x - .324), uv.y - .025);
        vec3 exposure = (texture2D(cloudLight,worldUv).rgb * 255. - 128.) / 68.;
        gl_FragColor = vec4(cloud * exp2(exposure),1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  }));
  skyDome.frustumCulled = false;
  skyDome.renderOrder = -100;
  scene.add(skyDome);
  scene.environmentIntensity = 0.54;
  scene.fog = new T.FogExp2(0xbfc8d2, 0.0029);

  const sky = new T.HemisphereLight(0xe6eeff, 0x8b806c, 0.63);
  const daylight = new T.DirectionalLight(0xfff9f0, 0.9);
  daylight.position.set(49, 71, -20);
  daylight.target.position.set(0, 8, 0);
  daylight.castShadow = true;
  daylight.shadow.mapSize.setScalar(compact ? 1536 : 3072);
  Object.assign(daylight.shadow.camera, { left: -62, right: 62, top: 60, bottom: -60, near: 12, far: 180 });
  daylight.shadow.normalBias = 0.017;
  daylight.shadow.bias = -0.00017;
  daylight.shadow.radius = 3;
  daylight.shadow.camera.updateProjectionMatrix();
  scene.add(sky, daylight, daylight.target);
}

// A continuous landscape outside the walkshed keeps the horizon at a plausible
// distance when the visitor rises above the surrounding trees and curtain wall.
export function createFoothills() {
  const positions: number[] = [], colors: number[] = [], uvs: number[] = [], indices: number[] = [];
  const segments = 440, rings = 65;
  const canopy = new T.TextureLoader().load(new URL('../assets/summertide/forest.jpg', document.baseURI).href);
  canopy.colorSpace = T.SRGBColorSpace;
  canopy.wrapS = canopy.wrapT = T.RepeatWrapping;
  canopy.anisotropy = 4;
  function profile(x: number, z: number) {
    const r = Math.hypot(x, z);
    const warp = noise(x*.009+2, z*.009+6);
    const near = Math.exp(-((r-195-33*warp)**2)/670) * (7 + 25*noise(x*.016+20,z*.012+31));
    const far = Math.exp(-((r-332-65*warp)**2)/1560) * (18 + 50*noise(x*.008+54,z*.009+47));
    const detail = 0.65*noise(x*.26, z*.26) + 1.85*noise(x*.10,z*.10) + 3.6*noise(x*.03+64,z*.03+8);
    return -3 + near + far + detail*T.MathUtils.smoothstep(r,99,152);
  }
  const base = new T.Color(), bronze = new T.Color(0x666151), pine = new T.Color(0x484e45);
  for (let j = 0; j <= rings; j++) {
    for (let i = 0; i <= segments; i++) {
      const a = i / segments * Math.PI * 2;
      const r = 88 + j * 6.6, x = r*Math.cos(a), z = r*Math.sin(a);
      const height = profile(x,z);
      positions.push(x, height, z);
      uvs.push(x/52, z/52);
      const season = noise(x*.032+118,z*.025+38);
      const variation = noise(x*.096+7,z*.096+64);
      const light = T.MathUtils.clamp(.99 + (profile(x-2,z+1.4)-height)*.065,.75,1.14);
      base.copy(pine).lerp(bronze, season).multiplyScalar(light*(.86+variation*.28));
      colors.push(base.r,base.g,base.b);
      if (i && j) {
        const n = j*(segments+1)+i;
        indices.push(n, n-segments-1, n-1, n-1, n-segments-1, n-segments-2);
      }
    }
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions,3));
  geometry.setAttribute('uv', new T.Float32BufferAttribute(uvs,2));
  geometry.setAttribute('color', new T.Float32BufferAttribute(colors,3));
  geometry.setIndex(indices);
  const material = new T.MeshBasicMaterial({ map: canopy, vertexColors: true, side: T.DoubleSide });
  material.onBeforeCompile = shader => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
      // Keep only the tree crowns' relief. The distant slopes have their own autumn colours.
      vec3 crowns = texture2D(map, vMapUv).rgb;
      float foliage = dot(crowns, vec3(.2126,.7152,.0722));
      diffuseColor.rgb *= .78 + .85 * sqrt(foliage);
    `);
  };
  return new T.Mesh(geometry,material);
}
