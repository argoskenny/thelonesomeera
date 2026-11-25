import * as THREE from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { Navigation } from '../../shared/navigation';
import { bindNavigationUI } from '../../shared/navigation-ui';
import { svg,toast } from '../../shared/ui';
import { assetUrl } from '../../shared/assets';
import { loadMaterials } from './materials';
import { buildCity } from './world';
import { views,bounds } from './views';
import { mountCityUI } from './ui';
import { CityAudio } from './audio';
import { createWeather } from './weather';
import '../../shared/experience.css';
import './style.css';

mountCityUI();
const $=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const mobile=matchMedia('(pointer:coarse)').matches||innerWidth<760;
const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
const climates={
  dusk:{fog:0x8196a5,density:.0065,exposure:1.12,environment:.62,ambient:1.3,sun:1.7,light:1,ocean:0x365d61,seaSun:0xc4d6e6},
  rain:{fog:0x374956,density:.009,exposure:1.08,environment:.30,ambient:.74,sun:.55,light:1.25,ocean:0x182a37,seaSun:0x8396ac},
  mist:{fog:0xa2b4bb,density:.014,exposure:1.17,environment:.83,ambient:1.8,sun:1.4,light:.65,ocean:0x748e86,seaSun:0xd3dedc},
};
type Climate=keyof typeof climates;

async function init(){
  let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:true});}
  catch{throw new Error('瀏覽器未能啟用 WebGL 2。請開啟硬體加速，或改用新版 Chrome、Safari、Firefox。');}
  renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.2:1.6));renderer.setSize(innerWidth,innerHeight);
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.info.autoReset=false;
  $('canvas-wrap').appendChild(renderer.domElement);renderer.domElement.tabIndex=0;
  renderer.domElement.setAttribute('aria-label','第一人稱 3D 環境：點擊畫面以滑鼠轉頭，WASD 移動，F 切換地面行走與自由飛行，Esc 釋放滑鼠');
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x8196a5);scene.fog=new THREE.FogExp2(0x8196a5,.0065);
  const camera=new THREE.PerspectiveCamera(mobile?72:62,innerWidth/innerHeight,.06,550);camera.position.copy(views[0].position);
  $('loading-bar').style.width='12%';
  const materials=await loadMaterials(renderer);$('loading-bar').style.width='32%';
  const hdr=await new HDRLoader().loadAsync(assetUrl('shared','sky.hdr'));hdr.mapping=THREE.EquirectangularReflectionMapping;scene.environment=hdr;scene.environmentIntensity=.62;scene.environmentRotation.y=2.4;
  const hemi=new THREE.HemisphereLight(0xc6d8ea,0x3d4243,1.3);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xc4d6e6,1.7);sun.position.set(40,125,35);sun.target.position.set(-8,45,-15);
  sun.castShadow=true;sun.shadow.mapSize.set(mobile?1024:2048,mobile?1024:2048);
  Object.assign(sun.shadow.camera,{left:-44,right:44,top:54,bottom:-54,near:1,far:240});sun.shadow.bias=-.0001;sun.shadow.normalBias=.026;scene.add(sun,sun.target);
  const world=buildCity(scene,materials,mobile);$('loading-bar').style.width='72%';
  // A local probe reflects the actual warm windows and blue canyon on wet metal and floors.
  const probeTarget=new THREE.WebGLCubeRenderTarget(mobile?64:128,{type:THREE.HalfFloatType});
  const probe=new THREE.CubeCamera(.07,240,probeTarget);probe.position.set(-12.7,49.3,20);probe.update(renderer,scene);
  const pmrem=new THREE.PMREMGenerator(renderer),reflection=pmrem.fromCubemap(probeTarget.texture);
  for(const mat of[materials.floor,materials.rust,materials.iron,materials.glass]){mat.envMap=reflection.texture;mat.envMapIntensity=1.2;mat.needsUpdate=true;}
  probeTarget.dispose();pmrem.dispose();
  const weather=createWeather(scene,mobile);
  const nav=new Navigation(camera,renderer.domElement,world.obstacles,views,bounds,world.surfaces);
  const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
  const ao=new GTAOPass(scene,camera,innerWidth,innerHeight);ao.blendIntensity=.77;ao.enabled=!mobile;
  ao.updateGtaoMaterial({radius:.64,thickness:.6,distanceExponent:1.3,samples:8});ao.updatePdMaterial({radius:5,samples:8,rings:2});
  const renderAO=ao.render.bind(ao);ao.render=(...args)=>{world.sea.visible=false;world.surf.visible=false;try{renderAO(...args);}finally{world.sea.visible=true;world.surf.visible=true;}};
  composer.addPass(ao);
  const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.18,.55,1.05);composer.addPass(bloom);composer.addPass(new OutputPass());
  const grade=new ShaderPass({uniforms:{tDiffuse:{value:null},uTime:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`uniform sampler2D tDiffuse;uniform float uTime;varying vec2 vUv;void main(){vec3 c=texture2D(tDiffuse,vUv).rgb;float l=dot(c,vec3(.2126,.7152,.0722));c=mix(vec3(l),c,1.025);c*=vec3(1.018,1.,.99);float vignette=smoothstep(.26,.81,distance(vUv,vec2(.5)));c*=1.-vignette*.23;float grain=fract(sin(dot(vUv*1445.,vec2(12.9898,78.233))+uTime)*43758.5453);c+=(grain-.5)*.007;gl_FragColor=vec4(c,1.);}`});
  composer.addPass(grade);composer.addPass(new SMAAPass());
  let climate:Climate='dusk';const color=new THREE.Color();
  function atmosphere(dt:number){
    const t=climates[climate],a=1-Math.exp(-dt*2.3),fog=scene.fog as THREE.FogExp2;
    fog.color.lerp(color.set(t.fog),a);(scene.background as THREE.Color).copy(fog.color);fog.density=THREE.MathUtils.lerp(fog.density,t.density*(1-THREE.MathUtils.clamp((camera.position.y-70)/70,0,1)*.52),a);
    renderer.toneMappingExposure=THREE.MathUtils.lerp(renderer.toneMappingExposure,t.exposure,a);
    scene.environmentIntensity=THREE.MathUtils.lerp(scene.environmentIntensity,t.environment,a);hemi.intensity=THREE.MathUtils.lerp(hemi.intensity,t.ambient,a);sun.intensity=THREE.MathUtils.lerp(sun.intensity,t.sun,a);
    world.sea.material.uniforms.waterColor.value.lerp(color.set(t.ocean),a);
    world.sea.material.uniforms.sunColor.value.lerp(color.set(t.seaSun),a);
    world.lights.forEach(l=>l.intensity=THREE.MathUtils.lerp(l.intensity,l.userData.power*t.light,a));
    weather.material.opacity=THREE.MathUtils.lerp(weather.material.opacity,climate==='rain'?.18:0,a);
    materials.floor.roughness=THREE.MathUtils.lerp(materials.floor.roughness,climate==='rain'?.20:.36,a);
  }
  document.querySelectorAll<HTMLButtonElement>('[data-weather]').forEach(button=>button.addEventListener('click',()=>{climate=button.dataset.weather as Climate;document.querySelectorAll('[data-weather]').forEach(el=>el.setAttribute('aria-pressed',String(el===button)));}));
  bindNavigationUI(nav);
  const menu=$('locations'),locationButton=$('location');
  const closeMenu=()=>{menu.hidden=true;locationButton.setAttribute('aria-expanded','false');};
  locationButton.addEventListener('click',()=>{menu.hidden=!menu.hidden;locationButton.setAttribute('aria-expanded',String(!menu.hidden));});
  document.addEventListener('pointerdown',e=>{if(!(e.target as HTMLElement).closest('.location-control'))closeMenu();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
  function goTo(index:number){nav.goTo(index);$('location-number').textContent=`0${index+1}`;$('location-name').textContent=views[index].name;document.querySelectorAll('[data-view]').forEach(el=>el.setAttribute('aria-current',String(Number((el as HTMLElement).dataset.view)===index)));closeMenu();}
  document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b=>b.addEventListener('click',()=>goTo(Number(b.dataset.view))));$('home').addEventListener('click',()=>goTo(0));
  const sound=new CityAudio();$('sound').addEventListener('click',async()=>{try{const active=await sound.toggle();$('sound').setAttribute('aria-pressed',String(active));$('sound').setAttribute('aria-label',active?'關閉風與潮聲':'開啟風與潮聲');toast(active?'風與遠方的海，已開啟。':'已關閉環境聲。');}catch{toast('無法開啟音訊，請稍後重試。');}});
  if(!document.fullscreenEnabled)$('fullscreen').hidden=true;
  $('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('experience').requestFullscreen();}catch{toast('目前瀏覽器不支援全螢幕。');}});
  document.addEventListener('fullscreenchange',()=>{$('fullscreen').setAttribute('aria-pressed',String(!!document.fullscreenElement));$('fullscreen').setAttribute('aria-label',document.fullscreenElement?'離開全螢幕':'全螢幕');});
  $('photo').addEventListener('click',()=>{const photoClimate=climate;composer.render();renderer.domElement.toBlob(blob=>{
    if(!blob){toast('照片未能儲存，請再試一次。');return;}
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`VERTIGO-${photoClimate}-${Date.now()}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),15000);
    $('photo-flash').classList.remove('flash');void $('photo-flash').offsetWidth;$('photo-flash').classList.add('flash');toast('留住這一刻。照片已下載。');
  },'image/png');});
  let elapsed=0,last=performance.now(),frames=0,frameAccum=0,adjusted=false,suspended=false,fps=60;
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();suspended=true;toast('繪圖連線中斷，正在恢復。');});renderer.domElement.addEventListener('webglcontextrestored',()=>location.reload());
  document.addEventListener('visibilitychange',()=>{last=performance.now();});
  function animate(now:number){
    requestAnimationFrame(animate);if(document.hidden||suspended){last=now;return;}
    const raw=(now-last)/1000,dt=Math.min(raw,.05);last=now;elapsed+=dt;
    nav.update(dt);camera.position.y=Math.max(.4,camera.position.y);atmosphere(dt);world.update(reduced?0:elapsed,camera);weather.update(reduced?0:elapsed);grade.uniforms.uTime.value=reduced?0:elapsed;
    ao.enabled=!mobile&&camera.position.y<100;renderer.info.reset();composer.render();frames++;frameAccum+=raw;if(raw>0&&raw<.5)fps=THREE.MathUtils.lerp(fps,1/raw,.02);
    if(!adjusted&&frameAccum>8){if(frames/frameAccum<28){renderer.setPixelRatio(1);composer.setPixelRatio(1);}adjusted=true;}
  }
  window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);});
  $('loading-bar').style.width='90%';await renderer.compileAsync(scene,camera);world.update(0,camera);composer.render();renderer.shadowMap.autoUpdate=false;
  $('loading-bar').style.width='100%';requestAnimationFrame(animate);setTimeout(()=>{$('loading').classList.add('done');setTimeout(()=>$('loading').hidden=true,1300);},150);
  Object.defineProperty(window,'vertigo',{value:{get layout(){return {bounds,obstacles:world.obstacles.map(o=>({...o})),views:views.map(v=>({name:v.name,position:v.position.toArray()}))};},get state(){return {ready:true,mode:nav.mode,active:nav.active,pointerLocked:document.pointerLockElement===renderer.domElement,direction:camera.getWorldDirection(new THREE.Vector3()).toArray(),climate,camera:camera.position.toArray(),fps:Math.round(fps),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,pixelRatio:renderer.getPixelRatio(),...world.stats,...world.surfStats};}}});
}
init().catch(error=>{console.error(error);$('loading').hidden=true;$('error').hidden=false;$('error-copy').textContent=error.message?.includes('WebGL')?error.message:'部分場景素材未能載入，請重新整理後再試一次。';});
