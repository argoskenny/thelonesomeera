import * as T from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { Navigation } from '../../shared/navigation';
import { bindNavigationUI } from '../../shared/navigation-ui';
import { assetUrl } from '../../shared/assets';
import { toast } from '../../shared/ui';
import { loadMaterials } from './materials';
import { buildBase } from './world';
import { createEffects } from './effects';
import { LaunchSequence } from './launch';
import { createSky } from './sky';
import { LaunchAudio } from './audio';
import { views,bounds,consolePosition } from './views';
import { mountLaunchUI } from './ui';
import '../../shared/experience.css';
import './style.css';

mountLaunchUI();
const $=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const mobile=matchMedia('(pointer:coarse)').matches||innerWidth<760;
const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
async function init(){
  const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.15:1.5));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  $('canvas-wrap').append(renderer.domElement);renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','海岸火箭發射基地 3D 環境。WASD 移動，F 切換飛行；地面控制台可發射火箭。');
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(mobile?63:43,innerWidth/innerHeight,.5,16000);camera.position.copy(views[0].position);
  scene.fog=new T.FogExp2(0x526574,.00024);
  $('loading-bar').style.width='15%';
  const [materials,sky]=await Promise.all([loadMaterials(renderer),new T.TextureLoader().loadAsync(assetUrl('ignition','sunset.png'))]);
  sky.mapping=T.EquirectangularReflectionMapping;sky.colorSpace=T.SRGBColorSpace;
  const skyDome=createSky(scene,sky);scene.environment=sky;scene.backgroundIntensity=.85;scene.environmentIntensity=1.5;scene.backgroundRotation.y=1.2;scene.environmentRotation.y=1.2;
  const hemi=new T.HemisphereLight(0xb5c5dc,0x514337,1.5);scene.add(hemi);
  const sun=new T.DirectionalLight(0xffbb79,4.2);sun.position.set(-260,98,-200);sun.target.position.set(0,45,0);sun.castShadow=true;sun.shadow.mapSize.set(mobile?1024:2048,mobile?1024:2048);Object.assign(sun.shadow.camera,{left:-165,right:165,top:140,bottom:-110,near:10,far:600});sun.shadow.normalBias=.25;sun.shadow.bias=-.0008;scene.add(sun,sun.target);
  $('loading-bar').style.width='42%';
  const world=buildBase(scene,materials,mobile),launch=new LaunchSequence(),effects=createEffects(scene,world.rocket,mobile),sound=new LaunchAudio();
  const nav=new Navigation(camera,renderer.domElement,world.obstacles,views,bounds,world.surfaces,true);bindNavigationUI(nav);const navigationChange=nav.onChange;nav.onChange=()=>{navigationChange();$('explore').textContent=nav.active?'暫停探索':'探索這個場景';if(nav.active&&document.pointerLockElement!==renderer.domElement)$('movement-help').textContent='WASD 移動 · 拖曳環顧 · F 切換模式 · Q / E 升降 · Esc 退出';};nav.onChange();
  const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
  const ao=new GTAOPass(scene,camera,innerWidth,innerHeight);ao.blendIntensity=.85;ao.enabled=!mobile;ao.updateGtaoMaterial({radius:2.5,thickness:2,distanceExponent:1.3,samples:8});ao.updatePdMaterial({radius:4,samples:8,rings:2});
  const renderAO=ao.render.bind(ao);ao.render=(...args)=>{const hidden=[world.sea,effects.clouds,effects.vent,skyDome];const vis=hidden.map(o=>o.visible);hidden.forEach(o=>o.visible=false);try{renderAO(...args);}finally{hidden.forEach((o,i)=>o.visible=vis[i]);}};composer.addPass(ao);composer.addPass(new UnrealBloomPass(new T.Vector2(innerWidth,innerHeight),.20,.45,1.15));composer.addPass(new OutputPass());if(!mobile)composer.addPass(new SMAAPass());
  const menu=$('locations'),locationButton=$('location');
  const closeMenu=()=>{menu.hidden=true;locationButton.setAttribute('aria-expanded','false');};
  locationButton.addEventListener('click',()=>{menu.hidden=!menu.hidden;locationButton.setAttribute('aria-expanded',String(!menu.hidden));});
  document.addEventListener('pointerdown',e=>{if(!(e.target as HTMLElement).closest('.location-control'))closeMenu();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
  let follow=false;
  function goTo(index:number){follow=false;nav.goTo(index);$('location-number').textContent=`0${index+1}`;$('location-name').textContent=views[index].name;document.querySelectorAll('[data-view]').forEach(el=>el.setAttribute('aria-current',String(Number((el as HTMLElement).dataset.view)===index)));closeMenu();}
  document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b=>b.addEventListener('click',()=>goTo(Number(b.dataset.view))));$('home').addEventListener('click',()=>goTo(0));
  const nearby=()=>camera.position.distanceTo(consolePosition.clone().add(new T.Vector3(0,1.7,0)))<7&&camera.position.y<5;
  const activate=()=>{if(launch.phase!=='standby')return;if(!nearby()){goTo(1);return;}if(launch.start())toast('倒數已啟動。可取消倒數；點火後切換發射觀景點。');};
  $('launch-action').addEventListener('click',activate);
  $('launch-cancel').addEventListener('click',()=>{if(launch.cancel())toast('倒數已取消。');});
  $('launch-reset').addEventListener('click',()=>{launch.reset();world.rocket.position.y=15;world.update(0,0);follow=false;goTo(1);toast('火箭已回到發射台。');});
  $('launch-follow').addEventListener('click',()=>{follow=!follow;if(follow)nav.pause();});
  window.addEventListener('keydown',e=>{if(e.code==='KeyR'&&!e.repeat&&nav.active&&nearby()){e.preventDefault();activate();}});
  const raycaster=new T.Raycaster(),pointer=new T.Vector2();
  // The 3D red switch is clickable/tappable; the accessible panel offers the same action.
  renderer.domElement.addEventListener('pointerdown',e=>{
    if(!nearby()||launch.phase!=='standby')return;
    const r=renderer.domElement.getBoundingClientRect();pointer.set(nav.active&&document.pointerLockElement?0:(e.clientX-r.left)/r.width*2-1,nav.active&&document.pointerLockElement?0:-(e.clientY-r.top)/r.height*2+1);
    raycaster.setFromCamera(pointer,camera);if(raycaster.intersectObject(world.switchMesh).length){e.preventDefault();e.stopImmediatePropagation();activate();}
  },true);
  let blue=false;
  document.querySelectorAll<HTMLButtonElement>('[data-time]').forEach(button=>button.addEventListener('click',()=>{blue=button.dataset.time==='blue';document.querySelectorAll('[data-time]').forEach(el=>el.setAttribute('aria-pressed',String(el===button)));}));
  $('sound').addEventListener('click',async()=>{try{const enabled=await sound.toggle();$('sound').setAttribute('aria-pressed',String(enabled));$('sound').setAttribute('aria-label',enabled?'關閉海風與引擎聲':'開啟海風與引擎聲');}catch{toast('瀏覽器暫時無法開啟聲音。');}});
  if(!document.fullscreenEnabled)$('fullscreen').hidden=true;
  $('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('experience').requestFullscreen();}catch{toast('目前瀏覽器不支援全螢幕。');}});
  document.addEventListener('fullscreenchange',()=>$('fullscreen').setAttribute('aria-pressed',String(!!document.fullscreenElement)));
  $('photo').addEventListener('click',()=>{composer.render();renderer.domElement.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`IGNITION-${launch.phase}-${Date.now()}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),15000);toast('照片已下載。');},'image/png');});
  let elapsed=0,last=performance.now(),fps=60,suspended=false,previousPhase=launch.phase,uiTick=0;
  const stateNames={standby:'STANDBY',countdown:'COUNTDOWN',ignition:'IGNITION',ascent:'LIFTOFF',complete:'FLIGHT COMPLETE'};
  function updateUI(){
    const close=nearby(),standby=launch.phase==='standby';
    $('launch-phase').textContent=stateNames[launch.phase];$('launch-clock').textContent=standby?'T − 10':launch.phase==='countdown'?`T − ${String(launch.countdown).padStart(2,'0')}`:`T + ${String(Math.floor(launch.elapsed-10)).padStart(2,'0')}`;
    $('launch-detail').textContent=standby?(close?'按紅色開關、R 鍵或下方按鈕發射。':'前往地面控制台，啟動發射程序。'):launch.phase==='countdown'?'發射臂撤離中 · 可隨時取消倒數。':launch.phase==='ignition'?'引擎點火 · 推力建立中。':`高度 ${Math.round(launch.altitude).toLocaleString()} m · ${launch.phase==='complete'?'可重置再次發射':'火箭持續上升'}`;
    $('launch-action').innerHTML=standby?(close?'啟動發射 · T − 10 <span aria-hidden="true">↑</span>':'前往發射開關 <span aria-hidden="true">↗</span>'):'發射程序進行中';($('launch-action') as HTMLButtonElement).disabled=!standby;
    document.querySelector('.launch-panel')!.classList.toggle('armed',standby&&close);$('experience').classList.toggle('at-console',close);$('experience').classList.toggle('launching',!standby);
    $('launch-cancel').hidden=launch.phase!=='countdown';$('launch-reset').hidden=standby||launch.phase==='countdown';$('launch-follow').hidden=standby||launch.phase==='countdown';$('launch-follow').setAttribute('aria-pressed',String(follow));
  }
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();suspended=true;toast('繪圖連線中斷，正在恢復。');});renderer.domElement.addEventListener('webglcontextrestored',()=>location.reload());
  document.addEventListener('visibilitychange',()=>{last=performance.now();sound.setPageVisible(!document.hidden);});
  function animate(now:number){
    requestAnimationFrame(animate);if(document.hidden||suspended){last=now;return;}
    const raw=(now-last)/1000,dt=Math.min(raw,.05);last=now;elapsed+=dt;nav.update(dt);launch.update(dt);
    const near=T.MathUtils.clamp(camera.position.y*.025,.18,2);if(Math.abs(camera.near-near)>.02){camera.near=near;camera.updateProjectionMatrix();}
    if(launch.phase==='ignition'&&previousPhase==='countdown'){goTo(2);follow=true;}
    previousPhase=launch.phase;
    world.rocket.position.y=15+launch.altitude;world.rocket.rotation.z=launch.altitude>300?-.012*Math.min(1,(launch.altitude-300)/900):0;
    skyDome.position.copy(camera.position);world.update(reduced?0:elapsed,launch.arm);effects.update(elapsed,launch);sound.update(launch.throttle,launch.altitude);
    if(follow&&!nav.active)camera.lookAt(0,Math.max(65,launch.altitude+68),0);
    if(nav.active)follow=false;
    const a=1-Math.exp(-dt*2);scene.backgroundIntensity=T.MathUtils.lerp(scene.backgroundIntensity,blue?.38:.85,a);scene.environmentIntensity=T.MathUtils.lerp(scene.environmentIntensity,blue?.70:1.5,a);sun.intensity=T.MathUtils.lerp(sun.intensity,blue?.35:4.2,a);hemi.intensity=T.MathUtils.lerp(hemi.intensity,blue?.65:1.5,a);
    skyDome.material.uniforms.uIntensity.value=scene.backgroundIntensity;
    if(uiTick++%6===0)updateUI();composer.render();if(raw>0&&raw<.5)fps=T.MathUtils.lerp(fps,1/raw,.025);
  }
  window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);});
  $('loading-bar').style.width='85%';await renderer.compileAsync(scene,camera);effects.update(0,launch);world.update(0,0);composer.render();$('loading-bar').style.width='100%';requestAnimationFrame(animate);setTimeout(()=>{$('loading').classList.add('done');setTimeout(()=>$('loading').hidden=true,1200);},150);
  Object.defineProperty(window,'ignition',{value:{get state(){return {ready:true,phase:launch.phase,elapsed:launch.elapsed,altitude:launch.altitude,throttle:launch.throttle,arm:launch.arm,nearConsole:nearby(),follow,camera:camera.position.toArray(),mode:nav.mode,active:nav.active,fps:Math.round(fps),...world.stats};}}});
}
init().catch(error=>{console.error(error);$('loading').hidden=true;$('error').hidden=false;$('error-copy').textContent='場景未能載入，請確認瀏覽器已開啟硬體加速後重新整理。';});
