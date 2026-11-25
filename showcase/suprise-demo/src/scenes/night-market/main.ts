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
import { nightMaterials } from './materials';
import { loadScooters } from './scooters';
import { buildNightMarket } from './world';
import { districtBounds,buildings } from './district';
import { mountDistrictMap } from './map';
import { mountNightUI,nightViews } from './ui';
import { NightAudio } from './audio';
import { assetUrl } from '../../shared/assets';
import '../../shared/experience.css';
import './style.css';

mountNightUI();
const $=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const mobile=matchMedia('(pointer:coarse)').matches||innerWidth<760;
const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
const climates={
  rain:{fog:0x10222a,density:.009,exposure:1.03,environment:.23,ambient:.42,light:1,sign:1,wet:1,steam:.29},
  late:{fog:0x070e19,density:.010,exposure:.86,environment:.12,ambient:.24,light:.80,sign:.91,wet:.88,steam:.10},
  mist:{fog:0x1c3035,density:.024,exposure:1.12,environment:.25,ambient:.50,light:1.1,sign:1,wet:1,steam:.40},
};
type Climate=keyof typeof climates;

async function init(){
  let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:true});}
  catch{throw new Error('瀏覽器未能啟用 WebGL 2。請開啟硬體加速，或改用新版 Chrome、Safari、Firefox。');}
  renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.35:1.6));renderer.setSize(innerWidth,innerHeight);
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.03;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.info.autoReset=false;
  $('canvas-wrap').appendChild(renderer.domElement);renderer.domElement.tabIndex=0;
  renderer.domElement.setAttribute('aria-label','第一人稱 3D 環境：點擊畫面以滑鼠轉頭，WASD 移動，F 切換地面行走與自由飛行，Esc 釋放滑鼠');
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x081620);scene.fog=new THREE.FogExp2(0x10222a,.009);
  const camera=new THREE.PerspectiveCamera(mobile?69:52,innerWidth/innerHeight,.08,320);camera.position.copy(nightViews[0].position);
  $('loading-bar').style.width='12%';
  const [materials,scooterAssets]=await Promise.all([nightMaterials(renderer),loadScooters()]);$('loading-bar').style.width='40%';
  // A low-intensity HDR supplies plausible rough metal reflections; the visible sky is true nighttime.
  const hdr=await new HDRLoader().loadAsync(assetUrl('shared','sky.hdr'));hdr.mapping=THREE.EquirectangularReflectionMapping;scene.environment=hdr;scene.environmentIntensity=.23;scene.environmentRotation.y=1.3;
  const hemi=new THREE.HemisphereLight(0x8196ac,0x8a4f30,.42);scene.add(hemi);
  const moon=new THREE.DirectionalLight(0x91adcb,.37);moon.position.set(-35,65,25);moon.target.position.set(0,0,0);
  moon.castShadow=true;moon.shadow.mapSize.set(mobile?1024:2048,mobile?1024:2048);
  Object.assign(moon.shadow.camera,{left:-90,right:90,top:90,bottom:-90,near:1,far:230});moon.shadow.bias=-.0002;moon.shadow.normalBias=.025;scene.add(moon,moon.target);
  const world=buildNightMarket(scene,materials,mobile,scooterAssets);$('loading-bar').style.width='72%';
  // Capture the actual lanterns and lightboxes into a static, prefiltered reflection probe.
  // Stainless counters then reflect their warm/cool surroundings instead of a daytime HDR.
  const probeTarget=new THREE.WebGLCubeRenderTarget(mobile?128:256,{type:THREE.HalfFloatType});
  const probe=new THREE.CubeCamera(.08,140,probeTarget);probe.position.set(20,2,25);
  world.wet.visible=false;world.update(0);probe.update(renderer,scene);world.wet.visible=true;
  const pmrem=new THREE.PMREMGenerator(renderer),streetReflection=pmrem.fromCubemap(probeTarget.texture);
  for(const material of[...world.scooterMaterials,materials.steel,materials.aluminum,materials.iron,materials.shutter,materials.darkGlass,materials.broth]){material.envMap=streetReflection.texture;material.envMapIntensity=1.6;material.needsUpdate=true;}
  probeTarget.dispose();pmrem.dispose();
  const signIntensities=world.signMats.map(m=>m.emissiveIntensity);
  const nav=new Navigation(camera,renderer.domElement,world.obstacles,nightViews,districtBounds,[{x:(districtBounds.minX+districtBounds.maxX)/2,z:(districtBounds.minZ+districtBounds.maxZ)/2,w:districtBounds.maxX-districtBounds.minX,d:districtBounds.maxZ-districtBounds.minZ,y:.06}]);
  const updateMap=mountDistrictMap(camera,index=>document.querySelector<HTMLButtonElement>(`[data-view="${index}"]`)?.click());
  const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
  const ao=new GTAOPass(scene,camera,innerWidth,innerHeight);ao.blendIntensity=.65;ao.enabled=!mobile;
  ao.updateGtaoMaterial({radius:.45,thickness:.3,distanceExponent:1.2,samples:8});
  ao.updatePdMaterial({radius:5,samples:8,rings:2});
  const transparentObjects:THREE.Object3D[]=[];
  scene.traverse(object=>{if(object instanceof THREE.Mesh&&!Array.isArray(object.material)&&object.material.transparent)transparentObjects.push(object);});
  const renderAO=ao.render.bind(ao);
  ao.render=(...args)=>{const visibility=transparentObjects.map(o=>o.visible);transparentObjects.forEach(o=>o.visible=false);try{renderAO(...args);}finally{transparentObjects.forEach((o,i)=>o.visible=visibility[i]);}};
  composer.addPass(ao);
  const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.30,.55,1.05);composer.addPass(bloom);composer.addPass(new OutputPass());
  const grade=new ShaderPass({uniforms:{tDiffuse:{value:null},uTime:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`uniform sampler2D tDiffuse;uniform float uTime;varying vec2 vUv;void main(){vec3 c=texture2D(tDiffuse,vUv).rgb;
    float l=dot(c,vec3(.2126,.7152,.0722));c=mix(vec3(l),c,1.065);c*=vec3(.99,1.,1.015);
    float vignette=smoothstep(.30,.83,distance(vUv,vec2(.5)));c*=1.-vignette*.27;
    float grain=fract(sin(dot(vUv*1445.,vec2(12.9898,78.233))+uTime)*43758.5453);c+=(grain-.5)*.012;gl_FragColor=vec4(c,1.);}`});
  composer.addPass(grade);composer.addPass(new SMAAPass());
  let climate:Climate='rain';
  const color=new THREE.Color();
  function atmosphere(dt:number){
    const t=climates[climate],a=1-Math.exp(-dt*2.3),fog=scene.fog as THREE.FogExp2;
    const altitude=THREE.MathUtils.clamp((camera.position.y-12)/50,0,1);
    fog.color.lerp(color.set(t.fog),a);fog.density=THREE.MathUtils.lerp(fog.density,t.density*(1-altitude*.55),a);
    renderer.toneMappingExposure=THREE.MathUtils.lerp(renderer.toneMappingExposure,t.exposure+altitude*.12,a);
    scene.environmentIntensity=THREE.MathUtils.lerp(scene.environmentIntensity,t.environment,a);hemi.intensity=THREE.MathUtils.lerp(hemi.intensity,t.ambient+altitude*.3,a);
    world.lights.forEach(l=>l.intensity=THREE.MathUtils.lerp(l.intensity,(l.userData.power??38)*t.light*.72,a));
    world.bounce.value=THREE.MathUtils.lerp(world.bounce.value,t.light,a);
    world.signMats.forEach((m,i)=>m.emissiveIntensity=THREE.MathUtils.lerp(m.emissiveIntensity,signIntensities[i]*t.sign,a));
    world.wet.material.uniforms.uWet.value=THREE.MathUtils.lerp(world.wet.material.uniforms.uWet.value,t.wet,a);
    world.steam.material.opacity=THREE.MathUtils.lerp(world.steam.material.opacity,t.steam,a);
  }
  document.querySelectorAll<HTMLButtonElement>('[data-weather]').forEach(button=>button.addEventListener('click',()=>{climate=button.dataset.weather as Climate;document.querySelectorAll('[data-weather]').forEach(el=>el.setAttribute('aria-pressed',String(el===button)));}));
  bindNavigationUI(nav);
  const menu=$('locations'),locationButton=$('location');
  const closeMenu=()=>{menu.hidden=true;locationButton.setAttribute('aria-expanded','false');};
  locationButton.addEventListener('click',()=>{menu.hidden=!menu.hidden;locationButton.setAttribute('aria-expanded',String(!menu.hidden));});
  document.addEventListener('pointerdown',e=>{if(!(e.target as HTMLElement).closest('.location-control'))closeMenu();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
  function goTo(index:number){nav.goTo(index);$('location-number').textContent=`0${index+1}`;$('location-name').textContent=nightViews[index].name;document.querySelectorAll('[data-view]').forEach(el=>el.setAttribute('aria-current',String(Number((el as HTMLElement).dataset.view)===index)));closeMenu();}
  document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b=>b.addEventListener('click',()=>goTo(Number(b.dataset.view))));$('home').addEventListener('click',()=>goTo(0));
  const sound=new NightAudio();$('sound').addEventListener('click',async()=>{try{const active=await sound.toggle();$('sound').setAttribute('aria-pressed',String(active));$('sound').setAttribute('aria-label',active?'關閉夜市環境聲':'開啟夜市環境聲');toast(active?'雨滴與巷弄的聲音，已開啟。':'已關閉環境聲。');}catch{toast('無法開啟音訊，請稍後重試。');}});
  if(!document.fullscreenEnabled)$('fullscreen').hidden=true;
  $('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('experience').requestFullscreen();}catch{toast('目前瀏覽器不支援全螢幕。');}});
  document.addEventListener('fullscreenchange',()=>{$('fullscreen').setAttribute('aria-pressed',String(!!document.fullscreenElement));$('fullscreen').setAttribute('aria-label',document.fullscreenElement?'離開全螢幕':'全螢幕');});
  $('photo').addEventListener('click',()=>{const photoClimate=climate;composer.render();renderer.domElement.toBlob(blob=>{
    if(!blob){toast('照片未能儲存，請再試一次。');return;}
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`NIGHTFALL-${photoClimate}-${Date.now()}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),15000);
    $('photo-flash').classList.remove('flash');void $('photo-flash').offsetWidth;$('photo-flash').classList.add('flash');toast('把夜色帶走。照片已下載。');
  },'image/png');});
  let elapsed=0,last=performance.now(),frames=0,frameAccum=0,adjusted=false,suspended=false,fps=60;
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();suspended=true;toast('繪圖連線中斷，正在恢復。');});renderer.domElement.addEventListener('webglcontextrestored',()=>location.reload());
  document.addEventListener('visibilitychange',()=>{last=performance.now();});
  function animate(now:number){
    requestAnimationFrame(animate);if(document.hidden||suspended){last=now;return;}
    const raw=(now-last)/1000,dt=Math.min(raw,.05);last=now;elapsed+=dt;
    nav.update(dt);camera.position.y=Math.max(.4,camera.position.y);atmosphere(dt);world.update(reduced?0:elapsed,camera);updateMap();grade.uniforms.uTime.value=reduced?0:elapsed;
    ao.enabled=!mobile&&camera.position.y<20;renderer.info.reset();composer.render();frames++;frameAccum+=raw;if(raw>0&&raw<.5)fps=THREE.MathUtils.lerp(fps,1/raw,.02);
    if(!adjusted&&frameAccum>8){if(frames/frameAccum<28){renderer.setPixelRatio(1);composer.setPixelRatio(1);}adjusted=true;}
  }
  window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);});
  $('loading-bar').style.width='90%';await renderer.compileAsync(scene,camera);world.update(0);composer.render();renderer.shadowMap.autoUpdate=false;
  $('loading-bar').style.width='100%';requestAnimationFrame(animate);setTimeout(()=>{$('loading').classList.add('done');setTimeout(()=>$('loading').hidden=true,1300);},150);
  Object.defineProperty(window,'nightfall',{value:{get layout(){return {bounds:districtBounds,buildings:buildings.map(b=>({...b})),obstacles:world.obstacles.map(o=>({...o})),views:nightViews.map(v=>({name:v.name,position:v.position.toArray()}))};},get state(){return {ready:true,mode:nav.mode,active:nav.active,pointerLocked:document.pointerLockElement===renderer.domElement,direction:camera.getWorldDirection(new THREE.Vector3()).toArray(),climate,camera:camera.position.toArray(),fps:Math.round(fps),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,pixelRatio:renderer.getPixelRatio(),...world.stats};}}});
}
init().catch(error=>{console.error(error);$('loading').hidden=true;$('error').hidden=false;$('error-copy').textContent=error.message?.includes('WebGL')?error.message:'部分場景素材未能載入，請重新整理後再試一次。';});
