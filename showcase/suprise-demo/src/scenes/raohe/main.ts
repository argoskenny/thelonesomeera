import * as T from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Navigation } from '../../shared/navigation';
import { bindNavigationUI } from '../../shared/navigation-ui';
import type { SceneView, WalkSurface } from '../../shared/types';
import { toast } from '../../shared/ui';
import { NightAudio } from '../night-market/audio';
import { buildCity } from './city';
import { ContactShadows } from './contact-shadows';
import { buildGate } from './gate';
import { buildStalls } from './stalls';
import { buildStreet } from './street';
import { buildWeather } from './weather';
import { captureStreetLight, lightMarket } from './lighting';
import './style.css';

const element=(id:string)=>document.getElementById(id)!;
const portrait=()=>innerWidth/innerHeight<.9;
const touch=matchMedia('(pointer:coarse)').matches;
const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
const v=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
function entrance(){
  return portrait()?{position:v(.08,1.7,12.5),target:v(-.15,2.42,-17)}:
    {position:v(.85,1.7,8.65),target:v(-3.88,2.94,-17)};
}
const views:SceneView[]=[
  {name:'夜市入口',label:'夜市入口',...entrance()},
  {name:'牌樓燈下',label:'牌樓燈下',position:v(-.68,1.7,-4.2),target:v(.8,3.82,-10.6)},
  {name:'街邊攤前',label:'街邊攤前',position:v(.54,1.7,-18.6),target:v(-3.7,1.48,-20.2)},
  {name:'長街回望',label:'長街回望',position:v(-.86,1.7,-49),target:v(.29,2.03,-28)},
  {name:'雨棚上方',label:'雨棚上方',position:v(-1.1,6.9,-18.7),target:v(.9,4.35,-7)},
];
const surfaces:WalkSurface[]=[
  {x:0,z:-32,w:5.05,d:98,y:0},
  {x:0,z:-9.13,w:10.8,d:2.85,y:0},
  {x:0,z:12.55,w:10.6,d:4.5,y:0},
  {x:0,z:-77.8,w:10.6,d:5.3,y:0},
];

function showError(message:string){
  element('loading').hidden=true;
  element('error-text').textContent=message;
  element('error').hidden=false;
}

async function init() {
  const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
  renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.03;
  const detailLimit=touch?1.35:1.65;
  let resolution=Math.min(devicePixelRatio,detailLimit);
  renderer.setPixelRatio(resolution);renderer.setSize(innerWidth,innerHeight);
  const canvas=renderer.domElement;
  canvas.tabIndex=0;
  canvas.setAttribute('aria-label','饒河街夜市 3D 漫遊。WASD 移動，F 切換飛行，Esc 暫停。');
  element('stage').append(canvas);
  const scene=new T.Scene();
  scene.background=new T.Color(0x12161e);
  scene.fog=new T.FogExp2(0x272431,.0105);
  const fieldOfView=()=>portrait()?71:47;
  const camera=new T.PerspectiveCamera(fieldOfView(),innerWidth/innerHeight,.075,440);
  camera.position.copy(views[0].position);
  camera.lookAt(views[0].target);

  // Synchronous builders enqueue texture loads. Wait for the last one before
  // capturing the street for the metalwork and showing the first frame.
  const ready=new Promise<void>((resolve,reject)=>{
    T.DefaultLoadingManager.onLoad=resolve;
    T.DefaultLoadingManager.onError=(url)=>reject(new Error('無法載入場景材質 '+url.split('/').pop()));
  });
  T.DefaultLoadingManager.itemStart('raohe-construction');
  const streetPromise=buildStreet(scene,renderer,touch);
  buildCity(scene);buildStalls(scene);buildGate(scene);
  const weather=buildWeather(scene,reduced);
  T.DefaultLoadingManager.itemEnd('raohe-construction');
  const [street]=await Promise.all([streetPromise,ready]);
  lightMarket(scene);
  T.DefaultLoadingManager.onLoad=()=>{};
  T.DefaultLoadingManager.onError=()=>{};
  weather.update(0,camera);
  captureStreetLight(renderer,scene,street.road);
  renderer.shadowMap.needsUpdate=true;
  const target=new T.WebGLRenderTarget(innerWidth,innerHeight,{type:T.HalfFloatType,depthTexture:new T.DepthTexture(innerWidth,innerHeight)});
  const composer=new EffectComposer(renderer,target);
  composer.setSize(innerWidth,innerHeight);
  composer.addPass(new RenderPass(scene,camera));
  composer.addPass(new ContactShadows(camera));
  composer.addPass(new UnrealBloomPass(new T.Vector2(innerWidth,innerHeight),.28,.46,1.02));
  composer.addPass(new OutputPass());

  const pillars=[-3.949,3.949].map(x=>({x,z:-9,w:1.04,d:.88,h:4.65}));
  const nav=new Navigation(camera,canvas,pillars,views,{minX:-11,maxX:11,minZ:-85,maxZ:18,maxY:25},surfaces,true);
  bindNavigationUI(nav);
  const changed=nav.onChange;
  nav.onChange=()=>{
    changed();
    element('explore').textContent=nav.active?'暫停':'開始漫遊';
    element('controls-hint').textContent=touch?'左手移動 · 右手滑動環顧':'WASD 移動 · 滑鼠環顧 · F 切換模式';
    if(nav.active && !touch && document.pointerLockElement!==canvas){
      element('movement-help').textContent='WASD 移動 · 拖曳環顧 · F 切換模式 · Esc 暫停';
    }
    if(nav.active) closeMenu();
  };
  const menu=element('locations'),location=element('location');
  function closeMenu(){menu.hidden=true;location.setAttribute('aria-expanded','false');}
  const goTo=(index:number)=>{
    if(index===0) Object.assign(views[0],entrance());
    nav.setMode(index===4?'fly':'walk');nav.goTo(index);
    element('current-spot').textContent=views[index].name;
    menu.querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-current',String(i===index)));
    closeMenu();location.focus({preventScroll:true});
  };
  views.forEach((view,index)=>{
    const button=document.createElement('button');button.type='button';button.textContent=view.name;
    button.setAttribute('aria-current',String(index===0));
    button.addEventListener('click',()=>goTo(index));menu.append(button);
  });
  location.addEventListener('click',()=>{
    menu.hidden=!menu.hidden;location.setAttribute('aria-expanded',String(!menu.hidden));
  });
  document.addEventListener('pointerdown',e=>{if(!(e.target as Element).closest('.spots')) closeMenu();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){closeMenu();location.focus();}});
  nav.onChange();

  const fullscreen=element('fullscreen');
  fullscreen.hidden=!document.fullscreenEnabled;
  fullscreen.addEventListener('click',async()=>{
    try{
      if(document.fullscreenElement)await document.exitFullscreen();
      else await element('experience').requestFullscreen();
    }catch{toast('目前瀏覽器無法切換全螢幕。');}
  });
  document.addEventListener('fullscreenchange',()=>{
    const active=!!document.fullscreenElement;
    fullscreen.setAttribute('aria-pressed',String(active));
    fullscreen.setAttribute('aria-label',active?'離開全螢幕':'進入全螢幕');
  });
  const audio=new NightAudio();
  element('audio').addEventListener('click',async()=>{
    try{
      const enabled=await audio.toggle();
      element('audio').setAttribute('aria-pressed',String(enabled));
      element('audio').setAttribute('aria-label',enabled?'關閉夜市環境音':'開啟夜市環境音');
    }catch{toast('目前無法開啟環境音。');}
  });
  element('photo').addEventListener('click',()=>{
    composer.render();
    canvas.toBlob(blob=>{
      if(!blob){toast('無法儲存照片，請再試一次。');return;}
      const a=document.createElement('a'),url=URL.createObjectURL(blob);
      a.href=url;a.download='饒河街夜市-'+Date.now()+'.png';a.click();
      setTimeout(()=>URL.revokeObjectURL(url),15000);toast('已儲存目前視角。');
    });
  });
  let previousPortrait=portrait();
  function resize(){
    const newPortrait=portrait();
    if(newPortrait!==previousPortrait&&!nav.active&&camera.position.distanceTo(views[0].position)<.01){
      Object.assign(views[0],entrance());nav.goTo(0);
    }
    previousPortrait=newPortrait;
    camera.aspect=innerWidth/innerHeight;camera.fov=fieldOfView();camera.updateProjectionMatrix();
    renderer.setPixelRatio(resolution);renderer.setSize(innerWidth,innerHeight);
    composer.setPixelRatio(resolution);composer.setSize(innerWidth,innerHeight);street.invalidate();
  }
  window.addEventListener('resize',resize);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();renderer.setAnimationLoop(null);showError('瀏覽器的 3D 繪圖已中斷，請重新載入饒河街。');});

  let last=0,elapsed=0,frameCount=0,windowStart=0;
  let draws=0,triangles=0;
  renderer.info.autoReset=false;
  renderer.setAnimationLoop((now:number)=>{
    const dt=last?Math.min((now-last)/1000,.1):0;last=now;
    if(document.hidden){windowStart=0;frameCount=0;return;}
    elapsed+=dt;nav.update(dt);weather.update(elapsed,camera);street.update(reduced?0:elapsed);
    renderer.info.reset();composer.render();
    draws=renderer.info.render.calls;triangles=renderer.info.render.triangles;
    if(!windowStart)windowStart=now;
    if(++frameCount>=45){
      const average=(now-windowStart)/frameCount;
      if(average>43 && resolution>.76){resolution=Math.max(.75,resolution*.85);resize();}
      frameCount=0;windowStart=0;
    }
  });
  composer.render();element('loading').hidden=true;
  Object.assign(window,{raohe:{get state(){return {position:camera.position.toArray(),direction:camera.getWorldDirection(new T.Vector3()).toArray(),mode:nav.mode,active:nav.active,pointerLocked:document.pointerLockElement===canvas,draws,triangles,resolution};}}});
}
init().catch(error=>{console.error(error);showError(error instanceof Error&&error.message.startsWith('無法載入')?error.message:'請開啟支援 WebGL 2 的瀏覽器，並確認已啟用硬體加速。');});
