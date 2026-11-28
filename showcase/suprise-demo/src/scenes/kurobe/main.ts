import * as T from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ContactShadows } from '../raohe/contact-shadows';
import { Navigation } from '../../shared/navigation';
import { bindNavigationUI } from '../../shared/navigation-ui';
import { toast } from '../../shared/ui';
import type { Obstacle, SceneView, WalkSurface } from '../../shared/types';
import { buildLandscape, groundHeight } from './landscape';
import { buildBridges, bridgeStart, bridgeEnd } from './bridges';
import { buildRailway } from './railway';
import { buildUndergrowth } from './undergrowth';
import { buildStation, platformHeight } from './station';
import { GorgeAmbience } from './ambience';
import './style.css';

const el=(id:string)=>document.getElementById(id)!;
const v=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
const touch=matchMedia('(pointer:coarse)').matches;
const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;

function spot(name:string,position:T.Vector3,target:T.Vector3):SceneView {
  return {name,label:name,position,target};
}

function navigationSurfaces():WalkSurface[]{
  const dx=bridgeEnd.x-bridgeStart.x,dz=bridgeEnd.z-bridgeStart.z,span=Math.hypot(dx,dz);
  return [
    {x:0,z:-34,w:244,d:200,y:0,heightAt(x,z){
      if(Math.abs(x-52)<1.35 && z>20.3 && z<25.6)return undefined;
      if(x>=-55 && x<=78 && z>=9.55 && z<=20.3)return undefined;
      const h=groundHeight(x,z);
      return h>.06?h:undefined;
    }},
    {x:(bridgeStart.x+bridgeEnd.x)/2,z:(bridgeStart.z+bridgeEnd.z)/2,w:Math.abs(dx)+18,d:Math.abs(dz)+18,y:bridgeStart.y,heightAt(x,z){
      const along=((x-bridgeStart.x)*dx+(z-bridgeStart.z)*dz)/span;
      const across=((z-bridgeStart.z)*dx-(x-bridgeStart.x)*dz)/span;
      return along>=-7 && along<=span+6 && Math.abs(across)<1.83 ? bridgeStart.y : undefined;
    }},
    {x:52,z:22.95,w:2.7,d:5.3,y:platformHeight,heightAt(_x,z){
      return platformHeight-(platformHeight-15.8)*T.MathUtils.clamp((z-20.3)/5.3,0,1);
    }},
    {x:11.5,z:14.925,w:133,d:10.75,y:platformHeight},
    {x:-22.4,z:15.575,w:3.2,d:2.35,y:23.32},
    {x:-17,z:15.575,w:7.6,d:2.35,y:platformHeight,heightAt(x){
      return platformHeight+Math.max(0,Math.min(4.4,4.4*(-13.2-x)/7.6));
    }},
  ];
}

function setupControls(nav:Navigation,views:SceneView[],savePhoto:()=>void){
  bindNavigationUI(nav);
  const menu=el('locations'),trigger=el('location');
  function closeMenu(){menu.hidden=true;trigger.setAttribute('aria-expanded','false');}
  const refresh=nav.onChange;
  nav.onChange=()=>{
    refresh();
    el('explore').textContent=nav.active?'暫停':'開始漫遊';
    el('controls-hint').textContent=touch?'左手移動 · 右手滑動環顧':'WASD 移動 · 滑鼠環顧';
    if(nav.active){
      closeMenu();
      if(!touch && document.pointerLockElement!==document.querySelector('canvas')){
        el('movement-help').textContent='WASD 移動 · 拖曳環顧 · F 切換模式 · Esc 暫停';
      }
    }
  };
  views.forEach((view,i)=>{
    const button=document.createElement('button');
    button.type='button';button.textContent=view.name;button.setAttribute('aria-current',String(i===0));
    button.onclick=()=>{
      nav.setMode('fly');nav.goTo(i);
      [...menu.children].forEach((item,j)=>item.setAttribute('aria-current',String(i===j)));
      el('current-spot').textContent=view.name;closeMenu();trigger.focus({preventScroll:true});
    };
    menu.append(button);
  });
  trigger.onclick=()=>{menu.hidden=!menu.hidden;trigger.setAttribute('aria-expanded',String(!menu.hidden));};
  document.addEventListener('pointerdown',e=>{if(!(e.target as Element).closest('.spots'))closeMenu();});
  document.addEventListener('keydown',e=>{if(e.code==='Escape'&&!menu.hidden){closeMenu();trigger.focus();}});
  nav.setMode('fly');
  el('photo').onclick=savePhoto;
  const fs=el('fullscreen');
  fs.hidden=!document.fullscreenEnabled;
  fs.onclick=async()=>{
    try{if(document.fullscreenElement)await document.exitFullscreen();else await el('experience').requestFullscreen();}
    catch{toast('這個瀏覽器無法切換全螢幕。');}
  };
  document.addEventListener('fullscreenchange',()=>{
    fs.setAttribute('aria-pressed',String(!!document.fullscreenElement));
    fs.setAttribute('aria-label',document.fullscreenElement?'離開全螢幕':'進入全螢幕');
  });
  const ambience=new GorgeAmbience();
  const audio=el('audio') as HTMLButtonElement;
  audio.onclick=async()=>{
    audio.disabled=true;
    try{
      const enabled=await ambience.toggle();
      audio.setAttribute('aria-pressed',String(enabled));audio.setAttribute('aria-label',enabled?'關閉河谷環境音':'開啟河谷環境音');
    }catch{toast('目前無法開啟環境音。');}
    finally{audio.disabled=false;}
  };
  return ambience;
}

function illuminate(scene:T.Scene,touchDevice:boolean){
  scene.fog=new T.FogExp2(0xa7b8b4,.00187);
  const sky=new HDRLoader().load(new URL('../assets/shared/sky.hdr',document.baseURI).href);
  sky.mapping=T.EquirectangularReflectionMapping;
  scene.environment=sky;scene.environmentIntensity=.48;
  scene.background=sky;scene.backgroundIntensity=.80;
  scene.backgroundRotation.y=scene.environmentRotation.y=2.1;
  scene.add(new T.HemisphereLight(0xe9f3ff,0xb6a284,.79));
  const sun=new T.DirectionalLight(0xffebc8,2.15);
  sun.position.set(-85,120,54);sun.target.position.set(-12,0,-27);
  sun.castShadow=true;
  const radius=87;
  Object.assign(sun.shadow.camera,{left:-radius,right:radius,top:radius,bottom:-radius,near:1,far:295});
  sun.shadow.mapSize.setScalar(touchDevice?2048:4096);
  sun.shadow.bias=-.00017;sun.shadow.normalBias=.033;
  scene.add(sun,sun.target);
}

function fail(message:string){
  el('loading').hidden=true;el('error-text').textContent=message;el('error').hidden=false;
}

async function init(){
  const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
  renderer.toneMappingExposure=.97;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
  renderer.info.autoReset=false;
  const canvas=renderer.domElement;canvas.tabIndex=0;
  canvas.setAttribute('aria-label','黑部峽谷 3D 地形。WASD 移動，Q 和 E 升降，Esc 暫停。');
  el('stage').append(canvas);
  let resolution=Math.min(devicePixelRatio,touch?1.4:1.65);
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(44,1,.08,1600);
  const target=new T.WebGLRenderTarget(1,1,{
    type:T.HalfFloatType,samples:Math.min(touch?2:4,renderer.capabilities.maxSamples),
    depthTexture:new T.DepthTexture(1,1),
  });
  const composer=new EffectComposer(renderer,target);
  composer.addPass(new RenderPass(scene,camera));
  composer.addPass(new ContactShadows(camera));
  composer.addPass(new OutputPass());
  const portrait=()=>innerWidth/innerHeight<.86;
  const overlook=()=>portrait()?spot('車站俯瞰',v(-29,29,24),v(-14,18.4,-4)):
    spot('車站俯瞰',v(-27.6,28.5,19.3),v(-9.1,15.9,-20.3));
  const views=[
    overlook(),
    spot('機車月台',v(-36,platformHeight+1.7,12.9),v(-16,20.1,8)),
    spot('溪畔礫灘',v(-28,Math.max(.25,groundHeight(-28,-23))+1.7,-23),v(11,19,-83)),
    spot('鐵橋橋面',bridgeStart.clone().lerp(bridgeEnd,.24).add(v(0,1.7,0)),bridgeEnd.clone().add(v(1,.3,0))),
    spot('河谷全景',v(54,49,5),v(-29,13,-55)),
  ];
  camera.position.copy(views[0].position);camera.lookAt(views[0].target);
  function resize(){
    camera.fov=portrait()?62:50;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
    renderer.setPixelRatio(resolution);renderer.setSize(innerWidth,innerHeight);
    composer.setPixelRatio(resolution);composer.setSize(innerWidth,innerHeight);
  }
  resize();window.addEventListener('resize',resize);
  const ready=new Promise<void>((resolve,reject)=>{
    T.DefaultLoadingManager.onLoad=resolve;
    T.DefaultLoadingManager.onError=url=>reject(new Error('無法載入場景素材 '+url.split('/').pop()));
  });
  T.DefaultLoadingManager.itemStart('kurobe-scene');
  illuminate(scene,touch);
  const landscape=buildLandscape(scene);
  buildBridges(scene);buildRailway(scene);buildStation(scene);buildUndergrowth(scene);
  T.DefaultLoadingManager.itemEnd('kurobe-scene');
  await ready;
  const obstacles:Obstacle[]=[
    {x:5.75,z:8,w:69.9,d:2.35,h:21.35,minY:17.6},
    {x:30,z:17.8,w:9.1,d:.20,h:platformHeight+2.6},
  ];
  const nav=new Navigation(camera,canvas,obstacles,views,{minX:-120,maxX:120,minZ:-130,maxZ:62,maxY:100},navigationSurfaces(),true);
  const ambience=setupControls(nav,views,()=>{
    composer.render();
    canvas.toBlob(blob=>{
      if(!blob){toast('瀏覽器無法儲存照片。');return;}
      const url=URL.createObjectURL(blob),link=document.createElement('a');
      link.href=url;link.download='黑部峽谷鐵道-'+Date.now()+'.png';link.click();
      setTimeout(()=>URL.revokeObjectURL(url),15000);toast('已儲存目前視角。');
    });
  });
  canvas.addEventListener('webglcontextlost',e=>{
    e.preventDefault();renderer.setAnimationLoop(null);fail('3D 繪圖已中斷，請重新載入場景。');
  });
  let then=0,time=0,windowStart=0,frames=0;
  const direction=new T.Vector3();
  renderer.setAnimationLoop((now:number)=>{
    if(document.hidden){then=0;windowStart=0;frames=0;return;}
    const dt=then?Math.min(.1,(now-then)*.001):0;then=now;
    time+=dt;nav.update(dt);
    if(nav.active&&nav.mode==='fly'){
      const floor=groundHeight(camera.position.x,camera.position.z);
      camera.position.y=Math.max(camera.position.y,floor+.8);
    }
    ambience.update(camera.position.y,camera.position.z);
    landscape.update(reduced?0:time);renderer.info.reset();composer.render();
    if(!windowStart)windowStart=now;
    if(++frames>=60){
      if((now-windowStart)/frames>46&&resolution>.8){resolution=Math.max(.8,resolution*.86);resize();}
      frames=0;windowStart=0;
    }
  });
  composer.render();el('loading').hidden=true;
  Object.assign(window,{kurobe:{get state(){
    return {position:camera.position.toArray(),direction:camera.getWorldDirection(direction).toArray(),active:nav.active,
      mode:nav.mode,draws:renderer.info.render.calls,triangles:renderer.info.render.triangles,resolution};
  }}});
}

init().catch(error=>{
  console.error(error);
  fail(error instanceof Error&&error.message.startsWith('無法載入')?error.message:'請使用支援 WebGL 2 的瀏覽器並開啟硬體加速。');
});
