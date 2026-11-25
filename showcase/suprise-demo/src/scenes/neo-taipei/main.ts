import * as T from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { Navigation } from '../../shared/navigation';
import { bindNavigationUI } from '../../shared/navigation-ui';
import { mountUI,toast } from '../../shared/ui';
import { loadMaterials } from './materials';
import { buildWorld } from './world';
import { createAtmosphere } from './atmosphere';
import { createWater } from './water';
import { createHolograms } from './holograms';
import { createTraffic } from './traffic';
import { NeoAudio } from './audio';
import { views,bounds } from './views';
import '../../shared/experience.css';
import './style.css';

mountUI({className:'neo-taipei',description:'NEO TAIPEI 新台北，可自由探索的雨夜霓虹城市',brand:'<span class="neo-emblem">新</span><span class="wordmark">NEO TAIPEI<small>25°02′ N · 121°33′ E / 2089</small></span>',homeLabel:'回到雨夜露臺',title:'Somewhere, after midnight.',subtitle:'新台北 · 在霓虹與雲霧之間',exploreLabel:'走進新台北',soundLabel:'開啟雨聲與城市環境音',soundTip:'環境音',otherScene:{href:'../night-market/',label:'夜市未眠'},locationPrompt:'循著光，走進城市。',views,moodAttribute:'weather',moods:[{key:'rain',label:'雨夜'},{key:'mist',label:'薄霧'}],loadingName:'NEO TAIPEI',loadingCopy:'最後一盞燈，還為你亮著。'});
const $=<E extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as E;
const mobile=matchMedia('(pointer:coarse)').matches||innerWidth<760,reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
async function init(){
  const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.15:1.5));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  renderer.info.autoReset=false;
  const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label','新台北 3D 場景。WASD 移動、拖曳或滑鼠轉頭，F 切換飛行，Q 與 E 升降。');$('canvas-wrap').append(canvas);
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(mobile?72:66,innerWidth/innerHeight,.2,2800);camera.position.copy(views[0].position);
  scene.fog=new T.FogExp2(0x091426,.0016);
  $('loading-bar').style.width='12%';
  const materials=await loadMaterials(renderer);
  materials.sky.mapping=T.EquirectangularReflectionMapping;
  const pmrem=new T.PMREMGenerator(renderer),env=pmrem.fromEquirectangular(materials.sky);scene.environment=env.texture;scene.environmentIntensity=.48;materials.sky.mapping=T.UVMapping;
  const hemi=new T.HemisphereLight(0x91b9ec,0x283e53,1.7);scene.add(hemi);
  const sun=new T.DirectionalLight(0xb0d9ff,2.1);sun.position.set(-90,160,90);sun.target.position.set(-35,60,65);sun.castShadow=true;sun.shadow.mapSize.set(mobile?1024:2048,mobile?1024:2048);Object.assign(sun.shadow.camera,{left:-50,right:50,top:50,bottom:-50,near:1,far:280});sun.shadow.normalBias=.04;sun.shadow.bias=-.0001;scene.add(sun,sun.target);
  $('loading-bar').style.width='35%';
  const world=buildWorld(scene,materials,mobile),atmosphere=createAtmosphere(scene,materials.sky,mobile),water=createWater(scene,materials,mobile),holograms=createHolograms(scene,materials),traffic=createTraffic(scene,materials,mobile),audio=new NeoAudio();
  atmosphere.update(0,0,camera);water.update(0);holograms.update(0);traffic.update(0);
  // A local reflection probe captures real neon architecture for metal, windows and the shop.
  const probeTarget=new T.WebGLCubeRenderTarget(mobile?128:256,{type:T.HalfFloatType}),probe=new T.CubeCamera(.2,1100,probeTarget);probe.position.set(-30,64,68);
  water.river.visible=water.wet.visible=atmosphere.root.visible=false;probe.update(renderer,scene);water.river.visible=water.wet.visible=atmosphere.root.visible=true;
  const neonEnv=pmrem.fromCubemap(probeTarget.texture);for(const mat of[materials.steel,materials.iron,materials.floor,materials.glass]){mat.envMap=neonEnv.texture;mat.envMapIntensity=1.15;mat.needsUpdate=true;}probeTarget.dispose();pmrem.dispose();
  // Cache static architecture shadows to keep dense foliage affordable.
  renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
  const nav=new Navigation(camera,canvas,world.obstacles,views,bounds,world.surfaces,true);nav.setMode('fly');bindNavigationUI(nav);
  const changed=nav.onChange;nav.onChange=()=>{changed();$('explore').textContent=nav.active?'暫停探索':'走進新台北';if(nav.active&&document.pointerLockElement!==canvas&&!matchMedia('(pointer:coarse)').matches)$('movement-help').textContent='WASD 移動 · 拖曳環顧 · Shift 加速 · F 切換 · Q / E 升降';};nav.onChange();
  const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
  const ao=new GTAOPass(scene,camera,innerWidth,innerHeight);ao.enabled=!mobile;ao.blendIntensity=.55;ao.updateGtaoMaterial({radius:.5,thickness:.35,samples:8,distanceExponent:1.4});ao.updatePdMaterial({radius:3,samples:8,rings:2});
  const aoRender=ao.render.bind(ao);ao.render=(...args)=>{const hidden=[atmosphere.sky,atmosphere.root,water.river,water.wet,water.falls,holograms.root];hidden.forEach(o=>o.visible=false);try{aoRender(...args);}finally{hidden.forEach(o=>o.visible=true);}};composer.addPass(ao);
  composer.addPass(new UnrealBloomPass(new T.Vector2(innerWidth,innerHeight),.28,.5,1.15));composer.addPass(new OutputPass());if(!mobile)composer.addPass(new SMAAPass());
  const menu=$('locations'),locationButton=$('location');const close=()=>{menu.hidden=true;locationButton.setAttribute('aria-expanded','false');};
  locationButton.addEventListener('click',()=>{menu.hidden=!menu.hidden;locationButton.setAttribute('aria-expanded',String(!menu.hidden));});
  document.addEventListener('pointerdown',e=>{if(!(e.target as HTMLElement).closest('.location-control'))close();});document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
  function goTo(i:number){nav.setMode(i===0||i===5?'fly':'walk');nav.goTo(i);$('location-number').textContent=`0${i+1}`;$('location-name').textContent=views[i].name;document.querySelectorAll<HTMLElement>('[data-view]').forEach(el=>el.setAttribute('aria-current',String(Number(el.dataset.view)===i)));close();}
  document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b=>b.addEventListener('click',()=>goTo(Number(b.dataset.view))));$('home').addEventListener('click',()=>goTo(0));
  let targetMood=0,mood=0;
  document.querySelectorAll<HTMLButtonElement>('[data-weather]').forEach(b=>b.addEventListener('click',()=>{targetMood=Number(b.dataset.weather==='mist');document.querySelectorAll('[data-weather]').forEach(el=>el.setAttribute('aria-pressed',String(el===b)));}));
  $('sound').addEventListener('click',async()=>{try{const enabled=await audio.toggle();$('sound').setAttribute('aria-pressed',String(enabled));$('sound').setAttribute('aria-label',enabled?'關閉雨聲與城市環境音':'開啟雨聲與城市環境音');}catch{toast('目前無法開啟環境音，請稍後再試。');}});
  if(!document.fullscreenEnabled)$('fullscreen').hidden=true;
  $('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('experience').requestFullscreen();}catch{toast('目前瀏覽器不支援全螢幕。');}});document.addEventListener('fullscreenchange',()=>$('fullscreen').setAttribute('aria-pressed',String(!!document.fullscreenElement)));
  $('photo').addEventListener('click',()=>{composer.render();canvas.toBlob(blob=>{if(!blob){toast('暫時無法儲存照片。');return;}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`NEOTAIPEI-${Date.now()}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),15000);toast('照片已下載。');},'image/png');});
  let elapsed=0,last=performance.now(),fps=60,lost=false;
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;toast('繪圖連線中斷，正在恢復。');});canvas.addEventListener('webglcontextrestored',()=>location.reload());
  document.addEventListener('visibilitychange',()=>{last=performance.now();audio.setPageVisible();});
  function animate(now:number){requestAnimationFrame(animate);if(document.hidden||lost){last=now;return;}const raw=(now-last)/1000,dt=Math.min(raw,.05);last=now;elapsed+=dt;nav.update(dt);mood=T.MathUtils.lerp(mood,targetMood,1-Math.exp(-dt*.65));
    (scene.fog as T.FogExp2).density=.0016+mood*.0008;
    sun.intensity=2.1+mood*.45;hemi.intensity=1.7+mood*.2;
    atmosphere.update(reduced?0:elapsed,mood,camera);water.update(reduced?0:elapsed);holograms.update(reduced?0:elapsed);traffic.update(reduced?0:elapsed);world.update(reduced?0:elapsed);renderer.info.reset();composer.render();if(raw>0&&raw<.5)fps=T.MathUtils.lerp(fps,1/raw,.025);

  }
  window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);});
  $('loading-bar').style.width='80%';atmosphere.update(0,0,camera);water.update(0);holograms.update(0);traffic.update(0);world.update(0);await renderer.compileAsync(scene,camera);composer.render();$('loading-bar').style.width='100%';requestAnimationFrame(animate);setTimeout(()=>{$('loading').classList.add('done');setTimeout(()=>$('loading').hidden=true,1100);},150);
  Object.defineProperty(window,'neoTaipei',{value:{get state(){return {ready:true,camera:camera.position.toArray(),rotation:camera.rotation.toArray().slice(0,3),mode:nav.mode,active:nav.active,mood:targetMood?'mist':'rain',fps:Math.round(fps),...world.stats,walkSurfaces:world.surfaces.length,waterfalls:water.count,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles};}}});
}
init().catch(e=>{console.error(e);$('loading').hidden=true;$('error').hidden=false;$('error-copy').textContent='請確認瀏覽器已開啟硬體加速，並重新載入場景。';});
