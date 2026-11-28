import * as T from 'three';
import { Navigation } from '../../shared/navigation';
import { bindNavigationUI } from '../../shared/navigation-ui';
import type { Obstacle, SceneView, WalkSurface } from '../../shared/types';
import { toast } from '../../shared/ui';
import { createKeep } from './keep';
import { createGardens } from './gardens';
import { createRampart } from './rampart';
import { createNorthSteps } from './north-steps';
import { createFoothills, lightCourtyard } from './atmosphere';
import { createPhotographicRender } from './photography';
import './style.css';

const el = (id: string) => document.getElementById(id)!;
const v = (x: number, y: number, z: number) => new T.Vector3(x, y, z);
const views: SceneView[] = [
  { name: '石垣外庭', label: '石垣外庭', position: v(46, 1.7, 40), target: v(0, 21.3, 0) },
  { name: '西側城道', label: '西側城道', position: v(-46, 1.7, 19), target: v(0, 16.8, 0) },
  { name: '北門內庭', label: '北門內庭', position: v(15, 1.7, -44.5), target: v(-0.5, 15.8, 0) },
  { name: '天守屋脊', label: '天守屋脊', position: v(-29, 36, -26), target: v(0, 22.5, 0) },
  { name: '櫓門小徑', label: '櫓門小徑', position: v(5, 1.7, -35), target: v(13.5, 3.4, -48) },
  { name: '登城石階', label: '登城石階', position: v(-21, 1.7, -20.5), target: v(4.1, 9.2, -20.5) },
];
const lenses = [32, 49, 53, 52, 59, 58];
function verticalFov(aspect: number, focalAngle: number) {
  // Keep the entire keep in frame when the short side of the screen becomes its width.
  const minimumWidth = T.MathUtils.degToRad(36.5);
  return Math.max(focalAngle, T.MathUtils.radToDeg(2 * Math.atan(Math.tan(minimumWidth / 2) / aspect)));
}
function showError(message: string) {
  el('loading').hidden = true;
  el('error-text').textContent = message;
  el('error').hidden = false;
}

async function init() {
  const compact = matchMedia('(pointer: coarse)').matches;
  const renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  const pixelRatio = Math.min(devicePixelRatio, compact ? 1.45 : 1.7);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(innerWidth, innerHeight);
  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', '白壁天守 3D 環境。點擊進入漫遊，WASD 移動，F 切換步行與飛行。');
  el('stage').append(canvas);
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    renderer.setAnimationLoop(null);
    showError('瀏覽器的 3D 繪圖已中斷，請重新載入場景。');
  });

  const scene = new T.Scene();
  const aspect = innerWidth / innerHeight;
  let focalAngle = lenses[0];
  const camera = new T.PerspectiveCamera(verticalFov(aspect, focalAngle), aspect, .12, 750);
  camera.position.copy(views[0].position);
  camera.lookAt(views[0].target);
  const texturesLoaded = new Promise<void>((resolve, reject) => {
    T.DefaultLoadingManager.onLoad = resolve;
    T.DefaultLoadingManager.onError = (url) => reject(new Error('無法載入材質 ' + url.split('/').pop()));
  });
  const geometryKey = 'shirasagi-construction';
  T.DefaultLoadingManager.itemStart(geometryKey);
  const lighting = lightCourtyard(scene, compact);
  const keep = createKeep();
  keep.position.y = 10.6;
  keep.scale.y = .90;
  const gardens = createGardens();
  const northSteps = createNorthSteps();
  scene.add(keep, gardens, createRampart(), northSteps.group, createFoothills());
  T.DefaultLoadingManager.itemEnd(geometryKey);
  await Promise.all([texturesLoaded, lighting]);

  const film = createPhotographicRender(renderer, scene, camera);
  const surfaces: WalkSurface[] = [{ x: 0, z: 0, w: 132, d: 132, y: 0,
    heightAt: (x, z) => Math.abs(x) < 19.24 && Math.abs(z) < 17.24 ? undefined : 0 }, ...northSteps.surfaces];
  const obstacles: Obstacle[] = [
    { x: 0, z: 0, w: 38.5, d: 34.5, h: 10.6 },
    ...northSteps.obstacles,
    ...gardens.userData.obstacles,
  ];
  const nav = new Navigation(camera, canvas, obstacles, views, {
    minX: -66, maxX: 66, minZ: -66, maxZ: 66, maxY: 62,
  }, surfaces, true);
  bindNavigationUI(nav);
  const menu = el('locations'), locationButton = el('location');
  let preset: number | null = 0;
  function closeMenu() {
    menu.hidden = true;
    locationButton.setAttribute('aria-expanded', 'false');
  }
  function updateLocation() {
    el('current-spot').textContent = preset === null ? '自由視角' : views[preset].name;
    menu.querySelectorAll('button').forEach((b, i) => b.setAttribute('aria-current', String(i === preset)));
  }
  const updateShared = nav.onChange;
  nav.onChange = () => {
    updateShared();
    el('explore').textContent = nav.active ? '暫停' : '開始漫遊';
    el('controls-hint').textContent = compact ? '左手移動 · 右手滑動環顧' : 'WASD 移動 · 滑鼠環顧 · F 切換模式';
    if (nav.active) {
      closeMenu();
      if (!compact && document.pointerLockElement !== canvas) {
        el('movement-help').textContent = 'WASD 移動 · 拖曳環顧 · F 切換模式 · Esc 暫停';
      }
    }
    requestFrame();
  };
  function selectView(index: number) {
    // Cutting between viewpoints prevents a straight tween through the masonry.
    nav.pause();
    camera.position.copy(views[index].position);
    nav.setMode(index === 3 ? 'fly' : 'walk');
    camera.lookAt(views[index].target);
    focalAngle = lenses[index];
    resize();
    preset = index;
    updateLocation();
    closeMenu();
    locationButton.focus({ preventScroll: true });
    el('toast').classList.remove('visible');
    requestFrame();
  }
  views.forEach((view, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = view.name;
    button.addEventListener('click', () => selectView(i));
    menu.append(button);
  });
  updateLocation();
  locationButton.addEventListener('click', () => {
    menu.hidden = !menu.hidden;
    locationButton.setAttribute('aria-expanded', String(!menu.hidden));
  });
  document.addEventListener('pointerdown', e => {
    if (!(e.target as Element).closest('.spots')) closeMenu();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !menu.hidden) {
      closeMenu();
      locationButton.focus();
    }
  });

  const fullscreen = el('fullscreen');
  fullscreen.hidden = !document.fullscreenEnabled;
  fullscreen.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await el('experience').requestFullscreen();
    } catch { toast('目前瀏覽器無法切換全螢幕。'); }
  });
  document.addEventListener('fullscreenchange', () => {
    fullscreen.setAttribute('aria-label', document.fullscreenElement ? '離開全螢幕' : '進入全螢幕');
  });
  el('photo').addEventListener('click', () => {
    draw();
    canvas.toBlob(blob => {
      if (!blob) { toast('無法儲存照片，請再試一次。'); return; }
      const anchor = document.createElement('a'), url = URL.createObjectURL(blob);
      anchor.download = '白壁天守-' + Date.now() + '.png';
      anchor.href = url;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 15000);
      toast('已儲存目前視角。');
    });
  });

  let lastTime = 0, dirty = true, slowFrames = 0, quality = pixelRatio;
  function requestFrame() { dirty = true; }
  function draw() { film.draw(); }
  function resize() {
    camera.aspect = innerWidth / innerHeight;
    camera.fov = verticalFov(camera.aspect, focalAngle);
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(quality);
    renderer.setSize(innerWidth, innerHeight);
    film.resize();
    requestFrame();
  }
  window.addEventListener('resize', resize);
  window.addEventListener('pageshow', requestFrame);
  document.addEventListener('visibilitychange', requestFrame);
  nav.onChange();
  const direction = new T.Vector3(), lensDirection = new T.Vector3();
  renderer.setAnimationLoop((time) => {
    const elapsed = lastTime ? (time-lastTime)/1000 : 0;
    lastTime = time;
    if (document.hidden || (!dirty && !nav.active)) return;
    nav.update(Math.min(elapsed, .1));
    if (nav.active && preset !== null) {
      const view = views[preset];
      lensDirection.subVectors(view.target, view.position).normalize();
      if (camera.position.distanceToSquared(view.position) > .015 ||
          lensDirection.dot(camera.getWorldDirection(direction)) < .9995) {
        preset = null;
        focalAngle = 58;
        updateLocation();
      }
    }
    // The opening photograph uses a longer lens. Gently widen it once the
    // visitor leaves a viewpoint so nearby steps and paths stay in view.
    const walkingFov = verticalFov(camera.aspect, focalAngle);
    if (Math.abs(camera.fov-walkingFov) > .03) {
      camera.fov = T.MathUtils.lerp(camera.fov, walkingFov, 1-Math.exp(-elapsed*4.8));
      camera.updateProjectionMatrix();
    }
    if (nav.active && elapsed > .048) slowFrames++;
    else slowFrames = Math.max(0, slowFrames - 1);
    if (slowFrames >= 36 && quality > .8) {
      quality = Math.max(.8, quality * .85);
      slowFrames = 0;
      resize();
    }
    draw();
    dirty = false;
  });
  // Mirror the existing scenes' read-only inspection surface for camera and WebGL checks.
  Object.assign(window, { shirasagi: { get state() {
    return { position: camera.position.toArray(), direction: camera.getWorldDirection(direction).toArray(),
      active: nav.active, mode: nav.mode, draws: renderer.info.render.calls,
      triangles: renderer.info.render.triangles, quality };
  } } });
  draw();
  el('loading').hidden = true;
}
init().catch(error => {
  console.error(error);
  showError(error instanceof Error && error.message.startsWith('無法載入') ?
    error.message : '無法開啟 3D 場景，請確認瀏覽器支援 WebGL 2 並已啟用硬體加速。');
});
