import * as THREE from 'three';
import { Navigation } from '../../shared/navigation';
import { bindNavigationUI } from '../../shared/navigation-ui';
import type { SceneView } from '../../shared/types';
import { toast } from '../../shared/ui';
import { addOrchard } from './orchard';
import { addValley } from './valley';
import { addPromenade } from './promenade';
import { addPlots } from './plots';
import { bridgeZ, deckHeight, walkable } from './crossing';
import { addVisitors, visitorObstacles } from './visitors';
import { addFallingPetals } from './petals';
import { RiverAmbience } from './ambience';
import './style.css';

const el = (id: string) => document.getElementById(id)!;
const touch = matchMedia('(pointer: coarse)').matches;
const portrait = () => innerWidth / innerHeight < .92;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const v = (x: number, y: number, z: number) => new THREE.Vector3(x,y,z);
const openingTarget = () => portrait() ? v(-3.4,6.55,-17) : v(-7.62,6.4,-17);
const views: SceneView[] = [
  { name:'櫻堤入口', label:'櫻堤入口', position:v(0,1.65,14), target:openingTarget() },
  { name:'花下望溪', label:'花下望溪', position:v(-2.7,1.7,-18), target:v(-12.3,1.52,-26.5) },
  { name:'山麓回望', label:'山麓回望', position:v(2.7,1.7,-64), target:v(-1.85,3.65,-42) },
  { name:'小橋看花', label:'小橋看花', position:v(-16.5,deckHeight+1.7,bridgeZ), target:v(-9.4,3.85,-72) },
  { name:'溪上鳥瞰', label:'溪上鳥瞰', position:v(-13.5,9.35,4), target:v(-.8,2.65,-26) },
];

function fail(message: string) {
  el('loading').hidden = true;
  el('error-text').textContent = message;
  el('error').hidden = false;
}

function setUpControls(nav: Navigation, renderer: THREE.WebGLRenderer, draw: () => void) {
  bindNavigationUI(nav);
  const navChange = nav.onChange;
  const locations = el('locations'), button = el('location');
  function closeMenu() {
    locations.hidden = true;
    button.setAttribute('aria-expanded','false');
  }
  nav.onChange = () => {
    navChange();
    el('explore').textContent = nav.active ? '暫停漫遊' : '開始漫遊';
    el('controls-hint').textContent = touch ? '左手移動 · 右手滑動環顧' : 'WASD 移動 · 滑鼠環顧 · F 切換模式';
    if (nav.active) {
      closeMenu();
      if (!touch && !document.pointerLockElement) el('movement-help').textContent = 'WASD 移動 · 拖曳環顧 · F 切換模式 · Esc 暫停';
    }
  };
  nav.onChange();
  views.forEach((view,index) => {
    const item = document.createElement('button');
    item.textContent = view.label;
    item.setAttribute('aria-current',String(index===0));
    item.addEventListener('click', () => {
      views[0].target.copy(openingTarget());
      nav.setMode(view.name==='溪上鳥瞰'?'fly':'walk');
      nav.goTo(index);
      el('current-spot').textContent = view.name;
      locations.querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-current',String(i===index)));
      closeMenu();
      button.focus({preventScroll:true});
    });
    locations.append(item);
  });
  button.addEventListener('click',()=>{
    locations.hidden = !locations.hidden;
    button.setAttribute('aria-expanded',String(!locations.hidden));
  });
  document.addEventListener('pointerdown',event=>{if (!(event.target as Element).closest('.spots')) closeMenu();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!locations.hidden){closeMenu();button.focus();}});

  const ambience = new RiverAmbience();
  const audio = el('audio');
  audio.addEventListener('click',async()=>{
    try {
      const enabled = await ambience.toggle();
      audio.setAttribute('aria-pressed',String(enabled));
      audio.setAttribute('aria-label',enabled?'關閉河畔環境音':'開啟河畔環境音');
    } catch { toast('瀏覽器目前無法播放環境音。'); }
  });
  document.addEventListener('visibilitychange',()=>ambience.update());
  const fullscreen = el('fullscreen');
  fullscreen.hidden = !document.fullscreenEnabled;
  fullscreen.addEventListener('click',async()=>{
    try {
      if(document.fullscreenElement) await document.exitFullscreen();
      else await el('experience').requestFullscreen();
    } catch { toast('瀏覽器目前無法切換全螢幕。'); }
  });
  document.addEventListener('fullscreenchange',()=>{
    const full=!!document.fullscreenElement;
    fullscreen.setAttribute('aria-pressed',String(full));
    fullscreen.setAttribute('aria-label',full?'離開全螢幕':'進入全螢幕');
  });
  el('photo').addEventListener('click',()=>{
    draw();
    renderer.domElement.toBlob(blob=>{
      if(!blob) {toast('這次未能儲存照片，請再試一次。');return;}
      const link=document.createElement('a');
      const url=URL.createObjectURL(blob);
      link.href=url;link.download='櫻川散步-'+Date.now()+'.png';link.click();
      setTimeout(()=>URL.revokeObjectURL(url),15000);toast('已儲存目前風景。');
    });
  });
}

async function init() {
  const renderer = new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.NoToneMapping;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate=false;
  let pixelRatio=Math.min(devicePixelRatio,touch?1.42:1.65);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(innerWidth,innerHeight);
  const canvas=renderer.domElement;
  canvas.tabIndex=0;
  canvas.setAttribute('aria-label','櫻川散步 3D 環境。點擊開始移動，Esc 暫停。');
  el('stage').append(canvas);
  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0xc3d1d8);
  scene.fog=new THREE.FogExp2(0xb8c7ca,.0023);
  const fieldOfView=()=>portrait()?61:43;
  const camera=new THREE.PerspectiveCamera(fieldOfView(),innerWidth/innerHeight,.065,1650);
  camera.position.copy(views[0].position);
  camera.lookAt(views[0].target);

  scene.add(new THREE.HemisphereLight(0xf2f6ff,0xc7b7ab,2.27));
  const sun=new THREE.DirectionalLight(0xfff5ed,1.25);
  sun.castShadow=true;
  const extent=touch?20:25;
  Object.assign(sun.shadow.camera,{left:-extent,right:extent,top:extent,bottom:-extent,near:1,far:140});
  sun.shadow.mapSize.setScalar(touch?1536:3072);
  sun.shadow.radius=3;
  sun.shadow.intensity=.60;
  sun.shadow.bias=-.00012;
  sun.shadow.normalBias=.017;
  scene.add(sun,sun.target);
  let shadowZ=Infinity;
  function moveSun() {
    const section=Math.round((camera.position.z-7)/18)*18;
    if(section===shadowZ) return;
    shadowZ=section;
    sun.position.set(-36,58,section+22);
    sun.target.position.set(0,0,section);
    renderer.shadowMap.needsUpdate=true;
  }
  moveSun();

  // TextureLoader.load used by the ground builders returns before decoding.
  // Also wait for those textures before opening the scene and baking its shadows.
  const manager=THREE.DefaultLoadingManager;
  const decoded=new Promise<void>((resolve,reject)=>{
    manager.onLoad=resolve;
    manager.onError=url=>reject(new Error('無法載入場景素材 '+url.split('/').pop()));
  });
  manager.itemStart('hanami-construction');
  const waterUpdate=addPromenade(scene);
  addPlots(scene);
  const petalsUpdate=addFallingPetals(scene);
  const builders=Promise.all([addOrchard(scene),addValley(scene),addVisitors(scene)]);
  manager.itemEnd('hanami-construction');
  await Promise.all([builders, decoded]);
  const nav=new Navigation(camera,canvas,visitorObstacles,views,
    {minX:-37,maxX:27,minZ:-110,maxZ:35,maxY:22},walkable,true);
  const draw=()=>renderer.render(scene,camera);
  setUpControls(nav,renderer,draw);
  let lastPortrait=portrait();
  function resize() {
    camera.aspect=innerWidth/innerHeight;
    camera.fov=fieldOfView();camera.updateProjectionMatrix();
    renderer.setPixelRatio(pixelRatio);renderer.setSize(innerWidth,innerHeight);
    if (lastPortrait!==portrait() && !nav.active && camera.position.distanceTo(views[0].position)<.01) {
      views[0].target.copy(openingTarget());
      nav.goTo(0);
    }
    lastPortrait=portrait();
  }
  window.addEventListener('resize',resize);
  canvas.addEventListener('webglcontextlost',event=>{
    event.preventDefault();renderer.setAnimationLoop(null);
    fail('3D 繪圖已中斷，請重新載入櫻花步道。');
  });
  let last=0,elapsed=0,windowStart=0,frames=0;
  petalsUpdate(0);waterUpdate(0);draw();el('loading').hidden=true;
  renderer.setAnimationLoop((now:number)=>{
    if(document.hidden){last=0;return;}
    const dt=last?Math.min(.1,(now-last)/1000):0;
    last=now;
    nav.update(dt);moveSun();
    if(!reducedMotion.matches){elapsed+=dt;waterUpdate(elapsed);petalsUpdate(elapsed);}
    draw();
    if(!windowStart)windowStart=now;
    if(++frames>=65){
      if((now-windowStart)/frames>42 && pixelRatio>.88){pixelRatio=Math.max(.88,pixelRatio*.87);resize();}
      frames=0;windowStart=now;
    }
  });
  Object.assign(window,{hanami:{get state(){return {
    position:camera.position.toArray(),direction:camera.getWorldDirection(new THREE.Vector3()).toArray(),
    mode:nav.mode,active:nav.active,draws:renderer.info.render.calls,triangles:renderer.info.render.triangles,
  };}}});
}
init().catch(error=>{
  console.error(error);
  fail(error instanceof Error && error.message.startsWith('無法載入') ? error.message : '無法開啟櫻花步道。請使用支援 WebGL 2 的瀏覽器，並開啟硬體加速。');
});
