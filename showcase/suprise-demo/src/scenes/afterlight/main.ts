import * as THREE from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { loadMaterials } from './materials';
import { createWorld } from './world';
import { Navigation } from '../../shared/navigation';
import { bindNavigationUI } from '../../shared/navigation-ui';
import { views } from './views';
import { assetUrl } from '../../shared/assets';
import { Soundscape } from './audio';
import { mountAfterlightUI } from './ui';
import { toast } from '../../shared/ui';
import '../../shared/experience.css';

mountAfterlightUI();
const $=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const mobile=matchMedia('(pointer:coarse)').matches||innerWidth<760;
const reduceMotion=matchMedia('(prefers-reduced-motion:reduce)').matches;

const atmospheres={
  sunset:{sun:0xffd5a0,intensity:3.6,ambient:0x91a8b7,ambientStrength:.85,ground:0x8a7553,fog:0xc6b5a5,density:.0042,exposure:.91,environment:.68,background:.68,water:0x41635f,ocean:0x365d61,rotation:2.4},
  blue:{sun:0x9fb9e4,intensity:.35,ambient:0x6c8dbc,ambientStrength:.8,ground:0x535b67,fog:0x4b607a,density:.005,exposure:.76,environment:.42,background:.21,water:0x213c4a,ocean:0x182a37,rotation:2.4},
  mist:{sun:0xffe8c4,intensity:1.05,ambient:0xc1d0cc,ambientStrength:1,ground:0x969d90,fog:0xc8d1cc,density:.014,exposure:1.04,environment:.85,background:1.05,water:0x657e75,ocean:0x748e86,rotation:2.4},
};
type TimeKey=keyof typeof atmospheres;

async function init(){
  let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance',preserveDrawingBuffer:true});}
  catch{throw new Error('瀏覽器未能啟用 WebGL 2。請開啟硬體加速，或使用新版 Chrome、Safari、Firefox 再試一次。');}
  renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.35:1.65));
  renderer.info.autoReset=false;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.91;
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  $('canvas-wrap').appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-label','第一人稱 3D 環境：點擊畫面以滑鼠轉頭，WASD 移動，F 切換地面行走與自由飛行，Esc 釋放滑鼠');
  renderer.domElement.tabIndex=0;
  const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0xc6b5a5,.0042);
  const camera=new THREE.PerspectiveCamera(mobile?66:57,innerWidth/innerHeight,.1,1800);camera.position.copy(views[0].position);
  $('loading-bar').style.width='18%';
  const materials=await loadMaterials(renderer);$('loading-bar').style.width='53%';
  const hdr=await new HDRLoader().loadAsync(assetUrl('shared','sky.hdr'));
  hdr.mapping=THREE.EquirectangularReflectionMapping;
  scene.background=hdr;scene.environment=hdr;scene.backgroundIntensity=.68;scene.environmentIntensity=.62;
  scene.backgroundRotation.y=2.4;scene.environmentRotation.y=2.4;
  const sun=new THREE.DirectionalLight(0xffd5a0,3.6);sun.position.set(-36,19,-48);sun.target.position.set(0,0,-4.5);
  sun.castShadow=true;sun.shadow.mapSize.set(mobile?2048:4096,mobile?2048:4096);
  Object.assign(sun.shadow.camera,{left:-34,right:34,top:34,bottom:-34,near:1,far:120});
  sun.shadow.bias=-.00015;sun.shadow.normalBias=.035;sun.shadow.radius=2;
  scene.add(sun,sun.target);
  const hemi=new THREE.HemisphereLight(0x91a8b7,0x8a7553,.85);scene.add(hemi);
  const world=createWorld(scene,materials,mobile);$('loading-bar').style.width='80%';
  // Local, warm light under the benches becomes visible after sunset.
  const accentLights:THREE.PointLight[]=[];
  for(const x of[-11.8,11.8])for(const z of[-12,-4,5]){const light=new THREE.PointLight(0xffb26b,.45,5,2);light.position.set(x,.5,z);scene.add(light);accentLights.push(light);}
  const sculptureLights:THREE.SpotLight[]=[];
  for(const x of[-10,10]){
    const spot=new THREE.SpotLight(0xe8ede4,155,30,.32,.9,2);spot.position.set(x,5.95,0);spot.target.position.set(1,2.3,-6);scene.add(spot,spot.target);sculptureLights.push(spot);
    const fixture=new THREE.Mesh(new THREE.CylinderGeometry(.105,.105,.23,12),materials.dark);fixture.geometry.rotateX(Math.PI/2);fixture.position.copy(spot.position);fixture.lookAt(spot.target.position);scene.add(fixture);
  }
  const navigation=new Navigation(camera,renderer.domElement,world.obstacles,views,undefined,world.surfaces);
  const composer=new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene,camera));
  composer.addPass(new OutputPass());
  const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.1,.45,.93);composer.addPass(bloom);
  const grade=new ShaderPass({
    uniforms:{tDiffuse:{value:null},uTime:{value:0},uBlue:{value:0},uMist:{value:0},uWarm:{value:1}},
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:`uniform sampler2D tDiffuse;uniform float uTime;uniform float uBlue;uniform float uMist;uniform float uWarm;varying vec2 vUv;
      void main(){vec3 c=texture2D(tDiffuse,vUv).rgb;
      c=mix(c,c*vec3(1.07,1.005,.9),uWarm*.65);
      c=mix(c,c*vec3(.72,.86,1.13),uBlue*.62);
      c=mix(c,mix(c,vec3(dot(c,vec3(.2126,.7152,.0722))),.18),uMist);
      float v=smoothstep(.3,.85,distance(vUv,vec2(.5)));c*=1.-v*.19;
      float grain=fract(sin(dot(vUv*1543.,vec2(12.9898,78.233))+uTime)*43758.5453);
      c+=(grain-.5)*.009;gl_FragColor=vec4(c,1.);}`,
  });composer.addPass(grade);composer.addPass(new SMAAPass());
  let currentTime:TimeKey='sunset';let desiredTime:TimeKey='sunset';
  const color=new THREE.Color();
  const mixColor=(c:THREE.Color,target:number,a:number)=>c.lerp(color.setHex(target),a);
  function updateAtmosphere(dt:number){
    const t=atmospheres[desiredTime],a=1-Math.exp(-dt*2.3);
    mixColor(sun.color,t.sun,a);sun.intensity=THREE.MathUtils.lerp(sun.intensity,t.intensity,a);
    mixColor(hemi.color,t.ambient,a);mixColor(hemi.groundColor,t.ground,a);hemi.intensity=THREE.MathUtils.lerp(hemi.intensity,t.ambientStrength,a);
    const fog=scene.fog as THREE.FogExp2;mixColor(fog.color,t.fog,a);fog.density=THREE.MathUtils.lerp(fog.density,t.density,a);
    renderer.toneMappingExposure=THREE.MathUtils.lerp(renderer.toneMappingExposure,t.exposure,a);
    scene.environmentIntensity=THREE.MathUtils.lerp(scene.environmentIntensity,t.environment,a);scene.backgroundIntensity=THREE.MathUtils.lerp(scene.backgroundIntensity,t.background,a);
    mixColor(world.water.material.uniforms.waterColor.value,t.water,a);mixColor(world.water.material.uniforms.sunColor.value,t.sun,a);
    mixColor(world.ocean.material.uniforms.waterColor.value,t.ocean,a);mixColor(world.ocean.material.uniforms.sunColor.value,t.sun,a);
    grade.uniforms.uWarm.value=THREE.MathUtils.lerp(grade.uniforms.uWarm.value,desiredTime==='sunset'?1:0,a);
    grade.uniforms.uBlue.value=THREE.MathUtils.lerp(grade.uniforms.uBlue.value,desiredTime==='blue'?1:0,a);
    grade.uniforms.uMist.value=THREE.MathUtils.lerp(grade.uniforms.uMist.value,desiredTime==='mist'?1:0,a);
    sculptureLights.forEach(l=>l.intensity=THREE.MathUtils.lerp(l.intensity,desiredTime==='blue'?100:155,a));
    accentLights.forEach(l=>l.intensity=THREE.MathUtils.lerp(l.intensity,desiredTime==='blue'?7:.45,a));
  }
  document.querySelectorAll<HTMLButtonElement>('[data-time]').forEach(button=>button.addEventListener('click',()=>{
    desiredTime=button.dataset.time as TimeKey;currentTime=desiredTime;
    document.querySelectorAll('[data-time]').forEach(el=>el.setAttribute('aria-pressed',String(el===button)));
  }));
  bindNavigationUI(navigation);
  const locationButton=$('location'),menu=$('locations');
  const closeMenu=()=>{menu.hidden=true;locationButton.setAttribute('aria-expanded','false');};
  locationButton.addEventListener('click',()=>{menu.hidden=!menu.hidden;locationButton.setAttribute('aria-expanded',String(!menu.hidden));});
  document.addEventListener('pointerdown',e=>{if(!(e.target as HTMLElement).closest('.location-control'))closeMenu();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
  function goTo(index:number){
    navigation.goTo(index);$('location-number').textContent=`0${index+1}`;$('location-name').textContent=views[index].name;
    document.querySelectorAll('[data-view]').forEach(el=>el.setAttribute('aria-current',String(Number((el as HTMLElement).dataset.view)===index)));closeMenu();
  }
  document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b=>b.addEventListener('click',()=>goTo(Number(b.dataset.view))));
  $('home').addEventListener('click',()=>goTo(0));
  const soundscape=new Soundscape();
  $('sound').addEventListener('click',async()=>{try{const active=await soundscape.toggle();$('sound').setAttribute('aria-pressed',String(active));$('sound').setAttribute('aria-label',active?'關閉海浪聲':'開啟海浪聲');toast(active?'海風與潮聲，已開啟。':'已關閉環境聲。');}catch{toast('無法開啟音訊，請稍後重試。');}});
  if(!document.fullscreenEnabled)$('fullscreen').hidden=true;
  $('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('experience').requestFullscreen();}catch{toast('目前瀏覽器不支援全螢幕。');}});
  document.addEventListener('fullscreenchange',()=>{$('fullscreen').setAttribute('aria-pressed',String(!!document.fullscreenElement));$('fullscreen').setAttribute('aria-label',document.fullscreenElement?'離開全螢幕':'全螢幕');});
  $('photo').addEventListener('click',()=>{
    composer.render();
    renderer.domElement.toBlob(blob=>{
      if(!blob){toast('照片未能儲存，請再試一次。');return;}
      const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`AFTERLIGHT-${currentTime}-${Date.now()}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),15000);
      $('photo-flash').classList.remove('flash');void $('photo-flash').offsetWidth;$('photo-flash').classList.add('flash');toast('已留住這一刻。照片已下載。');
    },'image/png');
  });
  // Touch navigation has independent pointer capture, so looking and moving can happen together.
  let elapsed=0,last=performance.now(),frames=0,frameAccum=0,qualityAdjusted=false;
  let suspended=false;
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();suspended=true;toast('繪圖連線中斷，正在恢復。');});
  renderer.domElement.addEventListener('webglcontextrestored',()=>location.reload());
  document.addEventListener('visibilitychange',()=>{last=performance.now();});
  function animate(now:number){
    requestAnimationFrame(animate);if(document.hidden||suspended){last=now;return;}
    const rawDt=(now-last)/1000;const dt=Math.min(rawDt,.05);last=now;elapsed+=dt;
    navigation.update(dt);updateAtmosphere(dt);world.update(reduceMotion?0:elapsed);grade.uniforms.uTime.value=reduceMotion?0:elapsed;
    renderer.info.reset();composer.render();
    // Lower the internal resolution once on slower devices; geometry and materials stay intact.
    frames++;frameAccum+=rawDt;
    if(!qualityAdjusted&&frameAccum>7){if(frames/frameAccum<28){renderer.setPixelRatio(1);composer.setPixelRatio(1);}qualityAdjusted=true;}
  }
  window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);});
  $('loading-bar').style.width='94%';
  await renderer.compileAsync(scene,camera);composer.render();renderer.shadowMap.autoUpdate=false;$('loading-bar').style.width='100%';
  requestAnimationFrame(animate);
  setTimeout(()=>{$('loading').classList.add('done');setTimeout(()=>$('loading').hidden=true,1300);},200);
  // Read-only diagnostic state is useful for automated navigation and rendering checks.
  Object.defineProperty(window,'afterlight',{value:{get state(){return {ready:true,mode:navigation.mode,active:navigation.active,pointerLocked:document.pointerLockElement===renderer.domElement,direction:camera.getWorldDirection(new THREE.Vector3()).toArray(),time:currentTime,camera:camera.position.toArray(),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,pixelRatio:renderer.getPixelRatio()};}},writable:false});
}
init().catch(error=>{console.error(error);$('loading').hidden=true;$('error').hidden=false;$('error-copy').textContent=error.message?.includes('WebGL')?error.message:'部分場景素材未能載入。請確認網路連線後再試一次。';});
