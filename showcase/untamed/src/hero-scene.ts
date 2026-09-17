import * as THREE from "three";
import {
  CSS3DObject,
  CSS3DRenderer,
} from "three/addons/renderers/CSS3DRenderer.js";
import { coverFrame, jungleDepth, sampleJourney } from "./hero-state";
import { jungleLayers, maskSVG, svgURL } from "./hero-layers";

const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

const vertex = `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;

export async function createJungleScene(
  host: HTMLElement,
  foreground: HTMLElement,
  failed: () => void,
) {
  const renderer = new THREE.WebGLRenderer({
    antialias: false,
    alpha: false,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor("#172218");
  renderer.domElement.className = "jungle-canvas";
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.append(renderer.domElement);
  const css = new CSS3DRenderer();
  foreground.append(css.domElement);
  const scene = new THREE.Scene(),
    frontScene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  const textures: THREE.Texture[] = [];
  const loader = new THREE.TextureLoader();
  const load = async (url: string) => {
    const texture = await loader.loadAsync(url);
    textures.push(texture);
    return texture;
  };
  const geometry = new THREE.PlaneGeometry(1, 1, 100, 70);
  let material: THREE.ShaderMaterial | undefined;
  const particlesGeometry = new THREE.BufferGeometry();
  let particleMaterial: THREE.ShaderMaterial | undefined;
  let disposed = false;
  const lost = (event: Event) => {
    event.preventDefault();
    failed();
  };
  renderer.domElement.addEventListener("webglcontextlost", lost);
  const destroy = () => {
    if (disposed) return;
    disposed = true;
    renderer.domElement.removeEventListener("webglcontextlost", lost);
    geometry.dispose();
    material?.dispose();
    particlesGeometry.dispose();
    particleMaterial?.dispose();
    textures.forEach((t) => t.dispose());
    renderer.dispose();
    renderer.domElement.remove();
    css.domElement.remove();
  };
  try {
    const [original, plate, ...masks] = await Promise.all([
      load(asset("images/jungle.webp")),
      load(asset("images/jungle-depth.jpg")),
      ...jungleLayers.map((layer) =>
        load(svgURL(maskSVG(layer.path, layer.feather + 9, 65))),
      ),
    ]);
    original.colorSpace = plate.colorSpace = THREE.SRGBColorSpace;
    material = new THREE.ShaderMaterial({
      uniforms: {
        original: { value: original },
        plate: { value: plate },
        masks: { value: masks },
        time: { value: 0 },
        progress: { value: 0 },
      },
      vertexShader: vertex,
      fragmentShader: `
        varying vec2 vUv; uniform sampler2D original,plate,masks[4]; uniform float time,progress;
        float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
        void main(){
          vec2 uv=vUv;
          // Only the waterfall carries a minute vertical flow; rocks remain registered.
          float falls=exp(-pow((uv.x-.727)/.011,4.))*smoothstep(.425,.45,uv.y)*(1.-smoothstep(.56,.595,uv.y));
          uv.y+=sin(uv.y*310.+time*2.5)*.00065*falls;
          float removal=max(max(texture2D(masks[0],uv).a,texture2D(masks[1],uv).a),max(texture2D(masks[2],uv).a,texture2D(masks[3],uv).a));
          vec3 color=mix(texture2D(original,uv).rgb,texture2D(plate,uv).rgb,removal);
          color+=falls*.012*(sin(uv.y*500.+time*4.)*.5+.5);
          float mist=noise(uv*vec2(9.,14.)+vec2(time*.014,-time*.006));
          float basin=exp(-pow((uv.y-.36)/.12,2.));
          color=mix(color,vec3(.47,.53,.41),mist*basin*.075);
          gl_FragColor=vec4(color,1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    scene.add(new THREE.Mesh(geometry, material));
    const fronts = jungleLayers.map((layer) => {
      const element = document.createElement("div");
      element.className = `jungle-plane ${layer.name}`;
      element.style.maskImage = `url("${svgURL(maskSVG(layer.path, layer.feather))}")`;
      const object = new CSS3DObject(element);
      frontScene.add(object);
      return { layer, object, baseX: 0, baseY: 0 };
    });
    const points = new Float32Array(48 * 3);
    for (let i = 0; i < 48; i++) {
      const r = (n: number) => {
        const s = Math.sin((i + 1) * n) * 43758.5453;
        return s - Math.floor(s);
      };
      points.set(
        [(r(127.1) - 0.5) * 24, (r(311.7) - 0.5) * 16, -7 - r(74.7) * 20],
        i * 3,
      );
    }
    particlesGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(points, 3),
    );
    particleMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        time: { value: 0 },
        ratio: { value: renderer.getPixelRatio() },
      },
      vertexShader: `uniform float time,ratio;varying float alpha;void main(){vec3 p=position;p.x+=sin(time*.12+p.z)*.12;p.y+=sin(time*.09+p.x)*.15;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(24./-mv.z,1.,3.)*ratio;alpha=.15+.12*sin(time*.6+position.x);}`,
      fragmentShader: `varying float alpha;void main(){float d=length(gl_PointCoord-.5)*2.;gl_FragColor=vec4(.9,.85,.65,(1.-smoothstep(.15,1.,d))*alpha);}`,
    });
    scene.add(new THREE.Points(particlesGeometry, particleMaterial));
    let width = 1,
      height = 1,
      time = 0;
    const resize = () => {
      width = host.clientWidth;
      height = host.clientHeight;
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      css.setSize(width, height);
      const frame = coverFrame(width, height);
      const focal =
        height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
      const positions = geometry.attributes.position,
        uv = geometry.attributes.uv;
      for (let i = 0; i < positions.count; i++) {
        const u = uv.getX(i),
          y = 1 - uv.getY(i),
          depth = jungleDepth(u, y);
        positions.setXYZ(
          i,
          ((frame.left + u * frame.width - width / 2) * depth) / focal,
          ((height / 2 - frame.top - y * frame.height) * depth) / focal,
          -depth,
        );
      }
      positions.needsUpdate = true;
      geometry.computeBoundingSphere();
      fronts.forEach(({ layer, object }) => {
        object.element.style.width = `${frame.width}px`;
        object.element.style.height = `${frame.height}px`;
        object.scale.setScalar(layer.depth / focal);
        object.position.set(
          ((frame.left + frame.width / 2 - width / 2) * layer.depth) / focal,
          ((height / 2 - frame.top - frame.height / 2) * layer.depth) / focal,
          -layer.depth,
        );
      });
      fronts.forEach((f) => {
        f.baseX = f.object.position.x;
        f.baseY = f.object.position.y;
      });
    };
    resize();
    return {
      resize,
      destroy,
      render(progress: number, dt: number, pointerX: number, pointerY: number) {
        if (disposed) return;
        const pose = sampleJourney(progress, width <= 700);
        time += dt;
        const frame = coverFrame(width, height);
        const focal =
          height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
        const waterfallRay =
          (frame.left + 0.727 * frame.width - width / 2) / focal;
        camera.position.set(
          pose.travel * waterfallRay * 0.2 + pointerX * 0.025,
          pointerY * 0.015,
          -pose.travel,
        );
        camera.rotation.set(
          0,
          -Math.min(0.18, waterfallRay * (width <= 700 ? 0.75 : 0.12)) *
            pose.turn,
          0,
        );
        material!.uniforms.time.value = particleMaterial!.uniforms.time.value =
          time;
        material!.uniforms.progress.value = progress;
        fronts.forEach(({ layer, object, baseX, baseY }, i) => {
          object.rotation.z =
            Math.sin(time * 0.28 + i * 1.7) *
            layer.sway *
            Math.min(1, progress * 12);
          object.position.x = baseX;
          object.position.y = baseY;
        });
        renderer.render(scene, camera);
        css.render(frontScene, camera);
      },
    };
  } catch (error) {
    destroy();
    throw error;
  }
}
