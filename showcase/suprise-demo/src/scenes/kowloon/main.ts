import * as T from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { assetUrl } from '../../shared/assets';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { Navigation } from '../../shared/navigation';
import { bindNavigationUI } from '../../shared/navigation-ui';
import { mountUI,toast } from '../../shared/ui';
import { loadMaterials } from './materials';
import { buildWorld } from './world';
import { createAtmosphere } from './atmosphere';
import { KowloonAudio } from './audio';
import { views,bounds } from './views';
import '../../shared/experience.css';
import './style.css';

mountUI({className:'kowloon',description:'KOWLOON 九龍茶餐廳，可自由探索的立體霓虹樓城',brand:'<span class="kowloon-seal">九</span><span class="wordmark">KOWLOON<small>九龍茶餐廳 · 城中有城</small></span>',homeLabel:'回到茶餐廳露臺',title:'A little light, still on.',subtitle:'九龍 · 一盞奶茶，一座城',exploreLabel:'走進九龍',soundLabel:'開啟樓城環境音',soundTip:'環境音',otherScene:{href:'../vertigo/',label:'懸城'},locationPrompt:'樓與樓之間，總有一盞燈。',views,moodAttribute:'weather',moods:[{key:'amber',label:'雨歇'},{key:'blue',label:'夜深'}],loadingName:'KOWLOON',loadingCopy:'水滾了。先坐一會。'});
const $=<E extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as E;
const mobile=matchMedia('(pointer:coarse)').matches||innerWidth<760,reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
async function init(){
  const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.15:1.5));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.98;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  renderer.info.autoReset=false;
  const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label','九龍樓城 3D 場景。WASD 移動、拖曳或滑鼠轉頭，F 切換飛行，Q 與 E 升降。');$('canvas-wrap').append(canvas);
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(mobile?72:70,innerWidth/innerHeight,.2,2800);camera.position.copy(views[0].position);
  scene.fog=new T.FogExp2(0x7c9aa8,.005);
  $('loading-bar').style.width='12%';
  const [materials,hdr]=await Promise.all([loadMaterials(renderer),new HDRLoader().loadAsync(assetUrl('shared','sky.hdr'))]);
  const pmrem=new T.PMREMGenerator(renderer),env=pmrem.fromEquirectangular(hdr);scene.environment=env.texture;scene.environmentIntensity=.27;scene.background=new T.Color(0x9bb8c8);hdr.dispose();
  const hemi=new T.HemisphereLight(0xa5c5d8,0x6e4d30,.68);scene.add(hemi);
  const sun=new T.DirectionalLight(0xd6ecff,3.3);sun.position.set(16,125,-40);sun.target.position.set(-8,28,12);sun.castShadow=true;sun.shadow.mapSize.set(mobile?1024:4096,mobile?1024:4096);Object.assign(sun.shadow.camera,{left:-52,right:52,top:85,bottom:-85,near:1,far:230});sun.shadow.normalBias=.025;sun.shadow.bias=-.00012;scene.add(sun,sun.target);
  $('loading-bar').style.width='35%';
  const world=buildWorld(scene,materials,mobile),atmosphere=createAtmosphere(scene,materials,mobile),audio=new KowloonAudio();
  atmosphere.update(0,0);world.update(0,camera);
  const probeTarget=new T.WebGLCubeRenderTarget(mobile?128:256,{type:T.HalfFloatType}),probe=new T.CubeCamera(.15,500,probeTarget);probe.position.set(-13,30,14);
  atmosphere.wet.visible=atmosphere.root.visible=false;probe.update(renderer,scene);atmosphere.wet.visible=atmosphere.root.visible=true;
  const localEnv=pmrem.fromCubemap(probeTarget.texture);for(const mat of[materials.steel,materials.floor,materials.aluminum,materials.windowGlass]){mat.envMap=localEnv.texture;mat.envMapIntensity=.9;mat.needsUpdate=true;}probeTarget.dispose();pmrem.dispose();
  // Cache static architecture shadows to keep the dense courtyard affordable.
  renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
  const nav=new Navigation(camera,canvas,world.obstacles,views,bounds,world.surfaces,true);nav.setMode('walk');bindNavigationUI(nav);
  const changed=nav.onChange;nav.onChange=()=>{changed();$('explore').textContent=nav.active?'暫停探索':'走進九龍';if(nav.active&&document.pointerLockElement!==canvas&&!matchMedia('(pointer:coarse)').matches)$('movement-help').textContent='WASD 移動 · 拖曳環顧 · Shift 加速 · F 切換 · Q / E 升降';};nav.onChange();
  const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
  const ao=new GTAOPass(scene,camera,innerWidth,innerHeight);ao.enabled=!mobile;ao.blendIntensity=.8;ao.updateGtaoMaterial({radius:.5,thickness:.35,samples:8,distanceExponent:1.4});ao.updatePdMaterial({radius:3,samples:8,rings:2});
  const aoRender=ao.render.bind(ao);ao.render=(...args)=>{const hidden=[atmosphere.root,atmosphere.wet];hidden.forEach(o=>o.visible=false);try{aoRender(...args);}finally{hidden.forEach(o=>o.visible=true);}};composer.addPass(ao);
  composer.addPass(new UnrealBloomPass(new T.Vector2(innerWidth,innerHeight),.2,.45,1.25));composer.addPass(new OutputPass());if(!mobile)composer.addPass(new SMAAPass());
  const menu=$('locations'),locationButton=$('location');const close=()=>{menu.hidden=true;locationButton.setAttribute('aria-expanded','false');};
  locationButton.addEventListener('click',()=>{menu.hidden=!menu.hidden;locationButton.setAttribute('aria-expanded',String(!menu.hidden));});
  document.addEventListener('pointerdown',e=>{if(!(e.target as HTMLElement).closest('.location-control'))close();});document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
  function goTo(i:number){nav.setMode(i===5?'fly':'walk');nav.goTo(i);$('location-number').textContent=`0${i+1}`;$('location-name').textContent=views[i].name;document.querySelectorAll<HTMLElement>('[data-view]').forEach(el=>el.setAttribute('aria-current',String(Number(el.dataset.view)===i)));close();}
  document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b=>b.addEventListener('click',()=>goTo(Number(b.dataset.view))));$('home').addEventListener('click',()=>goTo(0));
  let targetMood=0,mood=0;
  document.querySelectorAll<HTMLButtonElement>('[data-weather]').forEach(b=>b.addEventListener('click',()=>{targetMood=Number(b.dataset.weather==='blue');document.querySelectorAll('[data-weather]').forEach(el=>el.setAttribute('aria-pressed',String(el===b)));}));
  $('sound').addEventListener('click',async()=>{try{const enabled=await audio.toggle();$('sound').setAttribute('aria-pressed',String(enabled));$('sound').setAttribute('aria-label',enabled?'關閉樓城環境音':'開啟樓城環境音');}catch{toast('目前無法開啟環境音，請稍後再試。');}});
  if(!document.fullscreenEnabled)$('fullscreen').hidden=true;
  $('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else{await Promise.race([$('experience').requestFullscreen().then(()=>true),new Promise<boolean>(resolve=>setTimeout(()=>resolve(false),2000))]);if(!document.fullscreenElement)toast('這個瀏覽器尚未啟用全螢幕，可將視窗放大瀏覽。');}}catch{toast('目前瀏覽器不支援全螢幕。');}});document.addEventListener('fullscreenchange',()=>$('fullscreen').setAttribute('aria-pressed',String(!!document.fullscreenElement)));
  $('photo').addEventListener('click',()=>{composer.render();canvas.toBlob(blob=>{if(!blob){toast('暫時無法儲存照片。');return;}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`KOWLOON-${Date.now()}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),15000);toast('照片已下載。');},'image/png');});
  let elapsed=0,last=performance.now(),fps=60,lost=false;
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;toast('繪圖連線中斷，正在恢復。');});canvas.addEventListener('webglcontextrestored',()=>location.reload());
  document.addEventListener('visibilitychange',()=>{last=performance.now();audio.setPageVisible();});
  function animate(now:number){requestAnimationFrame(animate);if(document.hidden||lost){last=now;return;}const raw=(now-last)/1000,dt=Math.min(raw,.05);last=now;elapsed+=dt;nav.update(dt);mood=T.MathUtils.lerp(mood,targetMood,1-Math.exp(-dt*.65));
    (scene.fog as T.FogExp2).density=.005+mood*.0018;
    (scene.fog as T.FogExp2).color.set(0x7c9aa8).lerp(new T.Color(0x273b4b),mood);(scene.background as T.Color).set(0x9bb8c8).lerp(new T.Color(0x243849),mood);
    sun.intensity=3.3-mood*2.8;hemi.intensity=.68-mood*.3;scene.environmentIntensity=.27-mood*.16;
    atmosphere.update(reduced?0:elapsed,mood);world.update(reduced?0:elapsed,camera);renderer.info.reset();composer.render();if(raw>0&&raw<.5)fps=T.MathUtils.lerp(fps,1/raw,.025);

  }
  window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);});
  $('loading-bar').style.width='80%';atmosphere.update(0,0);world.update(0,camera);await renderer.compileAsync(scene,camera);composer.render();$('loading-bar').style.width='100%';requestAnimationFrame(animate);setTimeout(()=>{$('loading').classList.add('done');setTimeout(()=>$('loading').hidden=true,1100);},150);
  Object.defineProperty(window,'kowloon',{value:{get state(){return {ready:true,camera:camera.position.toArray(),rotation:camera.rotation.toArray().slice(0,3),mode:nav.mode,active:nav.active,mood:targetMood?'blue':'amber',fps:Math.round(fps),...world.stats,walkSurfaces:world.surfaces.length,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles};}}});
}
init().catch(e=>{console.error(e);$('loading').hidden=true;$('error').hidden=false;$('error-copy').textContent='請確認瀏覽器已開啟硬體加速，並重新載入場景。';});
