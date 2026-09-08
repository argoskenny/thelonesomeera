import './style.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {createNightSky} from './night-sky';
import {CharacterSystem} from './characters';
import { CollisionWorld } from './collision.mjs';
import { MarketAudio } from './audio';
import {t,translatePage,changeLocale,getLocale,type MessageKey} from './i18n';
import {bakeStaticLighting,enableStaticLighting,type Lamp} from './static-lighting';

const $=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const canvas=$<HTMLCanvasElement>('world'), start=$<HTMLButtonElement>('start'), menu=$('menu'),hud=$('hud'),map=$<HTMLCanvasElement>('map'), mapCtx=map.getContext('2d')!;
const base=import.meta.env.BASE_URL, coarse=matchMedia('(pointer:coarse)').matches;
let renderer:THREE.WebGLRenderer;
let characters:CharacterSystem;
let ready=false,playing=false,hasStarted=false,dragLook=false,lastFrame=0,frames=0,fps=60,fpsTime=0,walkTime=0,lastRender=0;
let yaw=-Math.PI/2,pitch=0,quality='auto',pixelRatio=1;
const keys=new Set<string>(), touchMove={x:0,y:0}, player={x:-38,z:-34};
let collision:CollisionWorld, buildings:any[]=[],layout:any={stalls:[]};
const scene=new THREE.Scene();scene.background=createNightSky();scene.fog=new THREE.FogExp2('#12202b',.008);
const camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,.08,160);camera.rotation.order='YXZ';
const audio=new MarketAudio(()=>notice('audioError'));
let loadPhase:MessageKey='prepare',loadProgress=0,activeNotice:MessageKey|null=null;
let lighting:Awaited<ReturnType<typeof bakeStaticLighting>>|null=null;
function notice(message:MessageKey){activeNotice=message;$('notice').textContent=t(message);$('notice').hidden=false;setTimeout(()=>$('notice').hidden=true,5500);}
try{const saved=JSON.parse(localStorage.getItem('rong-an-settings')||'{}');audio.muted=saved.muted===true;audio.volume=typeof saved.volume==='number'?Math.max(0,Math.min(1,saved.volume)):.65;quality=['auto','low','high'].includes(saved.quality)?saved.quality:'auto';}catch{/* Private browsing can reject storage. */}
function save(){try{localStorage.setItem('rong-an-settings',JSON.stringify({muted:audio.muted,volume:audio.volume,quality}));}catch{/* Keep settings for this session. */}}
function soundUI(){ $('mute').innerHTML=`${t('sound')} <span>${t(audio.muted?'off':'on')}</span>`;$('mute').setAttribute('aria-pressed',String(audio.muted));$<HTMLInputElement>('volume').value=String(Math.round(audio.volume*100));audio.apply();save();}
function refreshLanguage(){
  translatePage();$('title').textContent=t('title');$('description').textContent=t(hasStarted?'paused':'description');
  start.textContent=t(start.dataset.retry?'retry':ready?(hasStarted?'resume':'start'):'loading');
  $('load-text').textContent=t(loadPhase)+(loadPhase==='progress'?` ${loadProgress}%`:'');
  $('district').textContent=region();if(activeNotice)$('notice').textContent=t(activeNotice);soundUI();
}
$('language').onclick=()=>{changeLocale();refreshLanguage();};
refreshLanguage();$<HTMLSelectElement>('quality').value=quality;
$('mute').onclick=()=>{audio.muted=!audio.muted;soundUI();if(playing)void audio.start();};
$('volume').oninput=()=>{audio.volume=Number($<HTMLInputElement>('volume').value)/100;audio.muted=audio.volume===0;soundUI();};
$('quality').onchange=()=>{quality=$<HTMLSelectElement>('quality').value;resize();save();};
const credits=$<HTMLDialogElement>('credits');$('credits-open').onclick=()=>credits.showModal();$('credits-close').onclick=()=>credits.close();credits.addEventListener('click',e=>{if(e.target===credits){const r=credits.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)credits.close();}});

function resize(){if(!renderer)return;pixelRatio=quality==='low'?.75:quality==='high'?Math.min(devicePixelRatio,1.75):Math.min(devicePixelRatio,coarse?1:1.35);renderer.setPixelRatio(pixelRatio);renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}
window.addEventListener('resize',resize);
function setPlaying(value:boolean){playing=value;document.body.classList.toggle('playing',value);menu.hidden=value;hud.hidden=!value;keys.clear();touchMove.x=touchMove.y=0;$('joystick').querySelector<HTMLElement>('i')!.style.transform='';dragLook=false;if(!value){audio.pause();$('title').textContent=t('title');$('description').textContent=t('paused');start.textContent=t('resume');$('pause-options').hidden=false;start.focus();}else{hasStarted=true;$('notice').hidden=true;void audio.start();}}
function pause(){if(document.pointerLockElement)document.exitPointerLock();setPlaying(false);}
start.onclick=()=>{if(!ready){if(start.dataset.retry)location.reload();return;}setPlaying(true);if(!coarse){try{const p=canvas.requestPointerLock();p?.catch(()=>{dragLook=true;notice('dragHelp');});}catch{dragLook=true;notice('dragHelp');}}};
$('pause').onclick=pause;$('reset').onclick=()=>{const spawn=[{x:-38,z:-34},{x:-38,z:-35},{x:-39,z:-34},{x:-40,z:-34}].find(p=>!collision.blocked(p.x,p.z)&&!characters.blocked(p.x,p.z));if(!spawn)return;player.x=spawn.x;player.z=spawn.z;yaw=-Math.PI/2;pitch=0;walkTime=0;updateCamera();notice('resetDone');};
document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement&&playing&&!coarse)pause();});
document.addEventListener('pointerlockerror',()=>{if(playing){dragLook=true;notice('dragHelp');}});
window.addEventListener('keydown',e=>{if(e.code==='Escape'&&playing){pause();return;}if(!playing)return;if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight','ShiftLeft','ShiftRight'].includes(e.code)){e.preventDefault();keys.add(e.code);}});
window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();if(playing)pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing)pause();});
function look(dx:number,dy:number){yaw-=dx*.0023;pitch=THREE.MathUtils.clamp(pitch-dy*.0023,-1.25,1.25);}
document.addEventListener('mousemove',e=>{if(playing&&document.pointerLockElement===canvas)look(e.movementX,e.movementY);});
let dragId=-1,dragX=0,dragY=0;
canvas.addEventListener('pointerdown',e=>{if(!playing||document.pointerLockElement)return;dragId=e.pointerId;dragX=e.clientX;dragY=e.clientY;canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(playing&&e.pointerId===dragId&&!document.pointerLockElement){look(e.clientX-dragX,e.clientY-dragY);dragX=e.clientX;dragY=e.clientY;}});
canvas.addEventListener('pointerup',()=>dragId=-1);canvas.addEventListener('pointercancel',()=>dragId=-1);
function bindPad(id:string,move:boolean){const pad=$(id);let pointer=-1,x=0,y=0;pad.onpointerdown=e=>{if(!playing||pointer!==-1)return;pointer=e.pointerId;pad.setPointerCapture(pointer);const r=pad.getBoundingClientRect();x=move?r.left+r.width/2:e.clientX;y=move?r.top+r.height/2:e.clientY;if(move)update(e);};function update(e:PointerEvent){if(e.pointerId!==pointer||!playing)return;const dx=e.clientX-x,dy=e.clientY-y;if(move){const length=Math.hypot(dx,dy),factor=Math.min(1,36/Math.max(1,length));touchMove.x=dx*factor/36;touchMove.y=dy*factor/36;pad.querySelector<HTMLElement>('i')!.style.transform=`translate(${dx*factor}px,${dy*factor}px)`;}else{look(dx*1.3,dy*1.3);x=e.clientX;y=e.clientY;}}pad.onpointermove=update;const end=(e:PointerEvent)=>{if(e.pointerId!==pointer)return;pointer=-1;if(move){touchMove.x=touchMove.y=0;pad.querySelector<HTMLElement>('i')!.style.transform='';}};pad.onpointerup=end;pad.onpointercancel=end;pad.onlostpointercapture=end;}
bindPad('joystick',true);bindPad('look-pad',false);
function updateCamera(){camera.position.set(player.x,1.75+(playing&&!matchMedia('(prefers-reduced-motion: reduce)').matches?Math.sin(walkTime*10)*.015:0),player.z);camera.rotation.set(pitch,yaw,0);}
function region(){return t(player.z<-29?'north':player.z>29?'south':player.x<-37?'west':player.x>37?'east':'central');}
function drawMap(){const c=mapCtx;c.clearRect(0,0,320,320);c.save();c.beginPath();c.arc(160,160,158,0,Math.PI*2);c.clip();c.translate(160,160);const scale=2.18;c.scale(scale,scale);c.fillStyle='#101b20';c.fillRect(-80,-80,160,160);c.fillStyle='#485456';for(const b of buildings){c.save();c.translate(b.position[0],-b.position[1]);c.rotate(-b.rotation_z);c.fillRect(-b.width/2,-b.depth,b.width,b.depth);c.restore();}c.fillStyle='#bc8265';for(const s of layout.stalls)c.fillRect(s.position[0]-1,-s.position[1]-.7,2,1.4);c.strokeStyle='#9daea646';c.lineWidth=.35;for(const z of [-34,0,34]){c.beginPath();c.moveTo(-48,z);c.lineTo(48,z);c.stroke();}c.translate(player.x,player.z);c.rotate(-yaw);c.fillStyle='#e9b768';c.strokeStyle='#111b20';c.lineWidth=1.1;c.beginPath();c.moveTo(0,-4.5);c.lineTo(3.2,3.5);c.lineTo(0,2);c.lineTo(-3.2,3.5);c.closePath();c.fill();c.stroke();c.restore();c.fillStyle='#f4eedf';c.font='bold 20px sans-serif';c.textAlign='center';c.fillText('N',160,27);}

// All local lights are baked before entry, independent of the player.
const lamps:Lamp[]=[];
async function load(){
 try{
  renderer=new THREE.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance'});renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;resize();
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();if(playing)pause();ready=false;start.disabled=false;start.dataset.retry='1';start.textContent=t('reload');notice('contextError');});
  scene.add(new THREE.HemisphereLight('#a7c1db','#71604c',1.1));const moon=new THREE.DirectionalLight('#a6c4df',.7);moon.position.set(-30,60,20);scene.add(moon);
  const [data,bs,ls,catalog,staff,gltf]=await Promise.all([
    fetch(`${base}data/colliders.json`).then(r=>{if(!r.ok)throw Error('colliders');return r.json();}),
    fetch(`${base}data/buildings.json`).then(r=>{if(!r.ok)throw Error('buildings');return r.json();}),
    fetch(`${base}data/layout.json`).then(r=>{if(!r.ok)throw Error('layout');return r.json();}),
    fetch(`${base}data/crowd-catalog.json`).then(r=>{if(!r.ok)throw Error('crowd catalog');return r.json();}),
    fetch(`${base}data/staff-placements.json`).then(r=>{if(!r.ok)throw Error('staff placements');return r.json();}),
    new GLTFLoader().loadAsync(`${base}models/night-market.glb`,p=>{const ratio=p.total?p.loaded/p.total:Math.min(p.loaded/32750232,1);$('load-bar').style.width=`${Math.floor(ratio*85)}%`;loadPhase='progress';loadProgress=Math.floor(ratio*100);$('load-text').textContent=`${t('progress')} ${loadProgress}%`;})
  ]);
  buildings=bs;layout=ls;collision=new CollisionWorld(data.boxes,data.bounds,data.radius);
  if(collision.blocked(player.x,player.z))throw Error('入口位置被障礙物占用');
  gltf.scene.updateMatrixWorld(true);const remove:THREE.Object3D[]=[];const mats=new Map<THREE.Material,THREE.Material>();
  gltf.scene.traverse(o=>{
    if((o as THREE.Light).isLight){const l=o as THREE.Light;lamps.push({position:o.getWorldPosition(new THREE.Vector3()),color:l.color.clone()});remove.push(o);}
    if((o as THREE.Camera).isCamera)remove.push(o);
    if((o as THREE.Mesh).isMesh){const mesh=o as THREE.Mesh;const convert=(material:THREE.Material)=>{if(mats.has(material))return mats.get(material)!;const m=material as THREE.MeshStandardMaterial;const lm=new THREE.MeshLambertMaterial({name:m.name,color:m.color,map:m.map,emissive:m.emissive,emissiveMap:m.emissiveMap,emissiveIntensity:Math.min(m.emissiveIntensity,1.8),side:m.side,transparent:m.transparent,opacity:m.opacity,alphaTest:m.alphaTest,vertexColors:m.vertexColors});enableStaticLighting(lm);mats.set(material,lm);return lm;};mesh.material=Array.isArray(mesh.material)?mesh.material.map(convert):convert(mesh.material);mesh.geometry.computeBoundingSphere();mesh.castShadow=false;mesh.receiveShadow=false;}
  });remove.forEach(o=>o.removeFromParent());scene.add(gltf.scene);mats.forEach((_,m)=>m.dispose());
  updateCamera();loadPhase='lights';$('load-text').textContent=t('lights');lighting=await bakeStaticLighting(gltf.scene,lamps);$('load-bar').style.width='93%';characters=new CharacterSystem(data,ls,catalog,staff);await characters.load(scene,base);await renderer.compileAsync(scene,camera);renderer.render(scene,camera);
  ready=true;$('loading').hidden=true;start.disabled=false;start.textContent=t('start');requestAnimationFrame(tick);
 }catch(e){console.error('Night market load failed',e);start.disabled=false;start.dataset.retry='1';start.textContent=t('retry');loadPhase='loadError';$('load-text').textContent=t('loadError');$('loading').hidden=false;}
}
function tick(time:number){requestAnimationFrame(tick);if(document.hidden)return;if(!playing&&time-lastRender<100)return;lastRender=time;const dt=Math.min((time-lastFrame)/1000||.016,.05);lastFrame=time;
 if(playing){let forward=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'))-touchMove.y;let strafe=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'))+touchMove.x;const length=Math.hypot(forward,strafe);if(length>1){forward/=length;strafe/=length;}const speed=keys.has('ShiftLeft')||keys.has('ShiftRight')?4.5:2.6;const dx=(-Math.sin(yaw)*forward+Math.cos(yaw)*strafe)*dt*speed,dz=(-Math.cos(yaw)*forward-Math.sin(yaw)*strafe)*dt*speed;const result=collision.move(player.x,player.z,dx,dz,(x:number,z:number)=>characters.blocked(x,z));walkTime+=Math.hypot(result.x-player.x,result.z-player.z);player.x=result.x;player.z=result.z;characters.update(dt,player);updateCamera();}
 if(frames%12===0){$('district').textContent=region();drawMap();audio.setLocation(player.x,player.z);}
 renderer.render(scene,camera);frames++;if(time-fpsTime>2000){fps=frames*1000/(time-fpsTime);frames=0;fpsTime=time;if(playing&&quality==='auto'&&fps<34&&pixelRatio>.8&&time>6000){pixelRatio=Math.max(.8,pixelRatio-.15);renderer.setPixelRatio(pixelRatio);}}
}
// Read-only runtime diagnostics for QA; no teleport or test-only player controls.
Object.defineProperty(window,'nightMarket',{get:()=>({ready,playing,hasStarted,locale:getLocale(),characters:characters?.status,lighting,position:{...player},yaw,pitch,region:region(),fps:Math.round(fps),pixelRatio,drawCalls:renderer?.info.render.calls,triangles:renderer?.info.render.triangles,colliders:collision?.boxes.length,audio:audio.status,dragLook})});
void load();
