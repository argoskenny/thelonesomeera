import * as THREE from "three";
import { generateFern } from "./fern";
import type { MotionState } from "./motion";

const vertexShader = `
  uniform float uTime;
  uniform float uEnergy;
  uniform float uMode;
  uniform float uPointSize;
  uniform vec2 uPointer;
  attribute vec3 color;
  varying vec3 vColor;
  void main(){
    vec3 p=position;
    float height=clamp((p.y+2.6)/5.5,0.0,1.0);
    p.x+=sin(p.y*1.35+uTime*.65+p.z)*.11*uEnergy*height;
    p.z+=sin(p.x*2.4+uTime*.5)*.15*uEnergy*height;
    p.xy+=uPointer*height*.06;
    if(uMode>0.5&&uMode<1.5){p.z+=sin(p.y*1.8+uTime*1.2)*.35*uEnergy;p.x+=cos(p.y+uTime*.7)*.2*uEnergy;}
    if(uMode>1.5){p.x+=sin(uTime*.2+p.y*2.)*.12*uEnergy;p.y+=sin(uTime*.3+p.x)*.15*uEnergy;}
    vec4 mv=modelViewMatrix*vec4(p,1.0);
    gl_Position=projectionMatrix*mv;
    gl_PointSize=clamp(uPointSize*(8.0/-mv.z),1.0,6.0);
    vColor=color;
  }
`;
export function initLab(motion: MotionState) {
  const mount = document.querySelector<HTMLElement>(".organism-mount")!;
  const status = document.querySelector<HTMLElement>(".renderer-status")!;
  const energy = document.querySelector<HTMLInputElement>("#energy")!;
  const complexity = document.querySelector<HTMLInputElement>("#complexity")!;
  const tabs = [...document.querySelectorAll<HTMLButtonElement>("[data-mode]")];
  const regenerate = document.querySelector<HTMLButtonElement>(".regenerate")!;
  let renderer: THREE.WebGLRenderer;
  const fallback = (message: string) => {
    mount.classList.add("is-fallback");
    status.textContent = message;
    [energy, complexity, regenerate, ...tabs].forEach(
      (el) => (el.disabled = true),
    );
  };
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: devicePixelRatio < 2,
      powerPreference: "low-power",
    });
  } catch {
    fallback(
      "Your browser is showing a still botanical specimen. The interactive lab needs WebGL.",
    );
    return () => {};
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
  renderer.setClearColor(0x0b1510, 0);
  mount.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0.25, 10.2);
  const group = new THREE.Group();
  scene.add(group);
  group.rotation.y = -0.13;
  group.rotation.z = -0.06;
  const uniforms = {
    uTime: { value: 0 },
    uEnergy: { value: 0.65 },
    uMode: { value: 0 },
    uPointSize: { value: 2.3 },
    uPointer: { value: new THREE.Vector2() },
  };
  const lineMaterial = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader:
      "varying vec3 vColor;void main(){gl_FragColor=vec4(vColor*1.3,0.68);}",
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const pointsMaterial = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader:
      "varying vec3 vColor;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;float a=pow(1.0-d*2.0,1.5);gl_FragColor=vec4(vColor*1.45,a);}",
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const lines = new THREE.LineSegments(
    new THREE.BufferGeometry(),
    lineMaterial,
  );
  group.add(lines);
  const spores = new THREE.Points(new THREE.BufferGeometry(), pointsMaterial);
  group.add(spores);
  let seed = 76,
    mode = 0,
    generation = 1,
    dirty = true,
    active = false,
    frame = 0,
    last = 0,
    time = 0;
  let rotation = 0,
    dragging = false,
    lastX = 0,
    ownedPointer: number | null = null;
  const pointer = new THREE.Vector2();
  const build = () => {
    const data = generateFern(Number(complexity.value) / 100, seed, mode);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(data.positions, 3),
    );
    geometry.setAttribute("color", new THREE.BufferAttribute(data.colors, 3));
    lines.geometry.dispose();
    lines.geometry = geometry;
    lines.visible = mode !== 2;
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(data.spores, 3),
    );
    const colors = new Float32Array(data.spores.length);
    for (let i = 0; i < colors.length; i += 3) {
      colors[i] = 1.0;
      colors[i + 1] = 0.67 + (i % 7) * 0.025;
      colors[i + 2] = 0.3;
    }
    particleGeometry.setAttribute(
      "color",
      new THREE.BufferAttribute(colors, 3),
    );
    spores.geometry.dispose();
    spores.geometry = particleGeometry;
    uniforms.uMode.value = mode;
    uniforms.uPointSize.value = mode === 2 ? 3.8 : 2.3;
    const names = ["DIGITAL FERN", "TIDAL FRONDS", "SPORE CLOUD"];
    document.querySelector("#specimen-name")!.textContent =
      `SPECIMEN ${String(generation).padStart(3, "0")} — ${names[mode]}`;
    dirty = true;
  };
  const resize = () => {
    const w = mount.clientWidth,
      h = mount.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.position.z = w / h < 1 ? 10.8 : 9.1;
    camera.updateProjectionMatrix();
    dirty = true;
  };
  const observer = new ResizeObserver(resize);
  observer.observe(mount);
  const visible = new IntersectionObserver(
    ([entry]) => {
      active = entry.isIntersecting;
      dirty = true;
    },
    { rootMargin: "100px" },
  );
  visible.observe(mount);
  const onEnergy = () => {
    uniforms.uEnergy.value = Number(energy.value) / 100;
    document.querySelector("#energy-output")!.textContent =
      uniforms.uEnergy.value.toFixed(2);
    dirty = true;
  };
  let rebuildFrame = 0;
  const onComplexity = () => {
    document.querySelector("#complexity-output")!.textContent = (
      Number(complexity.value) / 100
    ).toFixed(2);
    cancelAnimationFrame(rebuildFrame);
    rebuildFrame = requestAnimationFrame(build);
  };
  energy.addEventListener("input", onEnergy);
  complexity.addEventListener("input", onComplexity);
  const choose = (index: number) => {
    mode = index;
    tabs.forEach((tab, i) => {
      tab.setAttribute("aria-selected", String(i === mode));
      tab.tabIndex = i === mode ? 0 : -1;
    });
    document
      .querySelector("#organism-panel")!
      .setAttribute("aria-labelledby", `mode-${mode}`);
    build();
  };
  const cleanupListeners: (() => void)[] = [];
  tabs.forEach((tab, i) => {
    const click = () => choose(i);
    const key = (e: KeyboardEvent) => {
      let target = i;
      if (e.key === "ArrowRight") target = (i + 1) % 3;
      else if (e.key === "ArrowLeft") target = (i + 2) % 3;
      else if (e.key === "Home") target = 0;
      else if (e.key === "End") target = 2;
      else return;
      e.preventDefault();
      choose(target);
      tabs[target].focus();
    };
    tab.addEventListener("click", click);
    tab.addEventListener("keydown", key);
    cleanupListeners.push(() => {
      tab.removeEventListener("click", click);
      tab.removeEventListener("keydown", key);
    });
  });
  const onRegenerate = () => {
    seed += 137;
    generation++;
    build();
  };
  regenerate.addEventListener("click", onRegenerate);
  const down = (e: PointerEvent) => {
    if (!e.isPrimary) return;
    dragging = true;
    lastX = e.clientX;
    ownedPointer = e.pointerId;
    mount.setPointerCapture(e.pointerId);
  };
  const move = (e: PointerEvent) => {
    const bounds = mount.getBoundingClientRect();
    pointer.set(
      (e.clientX - bounds.left) / bounds.width - 0.5,
      -((e.clientY - bounds.top) / bounds.height - 0.5),
    );
    if (dragging && ownedPointer === e.pointerId) {
      rotation += (e.clientX - lastX) * 0.007;
      lastX = e.clientX;
      dirty = true;
    }
  };
  const up = () => {
    dragging = false;
    ownedPointer = null;
  };
  const key = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      rotation += e.key === "ArrowLeft" ? -0.16 : 0.16;
      dirty = true;
    }
  };
  mount.addEventListener("pointerdown", down);
  mount.addEventListener("pointermove", move);
  mount.addEventListener("pointerup", up);
  mount.addEventListener("pointercancel", up);
  mount.addEventListener("lostpointercapture", up);
  mount.addEventListener("keydown", key);
  const lost = (event: Event) => {
    event.preventDefault();
    cancelAnimationFrame(frame);
    fallback(
      "The graphics context was interrupted. Refresh the page to restart the interactive lab.",
    );
  };
  renderer.domElement.addEventListener("webglcontextlost", lost);
  const render = (now: number) => {
    frame = requestAnimationFrame(render);
    const dt = Math.min((now - last) / 1000, 0.04);
    last = now;
    if (!active || document.hidden) return;
    if (motion.paused && !dirty) return;
    if (!motion.paused) time += dt;
    uniforms.uTime.value = time;
    uniforms.uPointer.value.lerp(pointer, 0.03);
    group.rotation.y = motion.paused
      ? rotation
      : THREE.MathUtils.lerp(
          group.rotation.y,
          rotation + Math.sin(time * 0.12) * 0.14,
          0.045,
        );
    group.rotation.z =
      -0.06 + (motion.paused ? 0 : Math.sin(time * 0.17) * 0.025);
    renderer.render(scene, camera);
    dirty = false;
  };
  build();
  resize();
  frame = requestAnimationFrame(render);
  return () => {
    cancelAnimationFrame(frame);
    cancelAnimationFrame(rebuildFrame);
    observer.disconnect();
    visible.disconnect();
    lines.geometry.dispose();
    spores.geometry.dispose();
    lineMaterial.dispose();
    pointsMaterial.dispose();
    renderer.dispose();
    renderer.domElement.remove();
    energy.removeEventListener("input", onEnergy);
    complexity.removeEventListener("input", onComplexity);
    regenerate.removeEventListener("click", onRegenerate);
    cleanupListeners.forEach((fn) => fn());
    mount.removeEventListener("pointerdown", down);
    mount.removeEventListener("pointermove", move);
    mount.removeEventListener("pointerup", up);
    mount.removeEventListener("pointercancel", up);
    mount.removeEventListener("lostpointercapture", up);
    mount.removeEventListener("keydown", key);
  };
}
