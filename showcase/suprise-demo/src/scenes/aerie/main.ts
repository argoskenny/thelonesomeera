import * as T from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { Navigation } from '../../shared/navigation';
import { bindNavigationUI } from '../../shared/navigation-ui';
import { mountUI,toast } from '../../shared/ui';
import { assetUrl } from '../../shared/assets';
import { loadMaterials } from './materials';
import { buildCity } from './world';
import { createAtmosphere } from './atmosphere';
import { createSkyships } from './skyships';
import { AerieAudio } from './audio';
import { views,bounds } from './views';
import '../../shared/experience.css';
import './style.css';

mountUI({className:'aerie',description:'AERIE 雲上城，可自由探索的空中古典城邦',brand:'<svg class="aerie-emblem" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1"><path d="M24 3v42M3 24h42M24 9l4 11 11 4-11 4-4 11-4-11-11-4 11-4Z"/></svg><span class="wordmark">AERIE</span>',homeLabel:'回到雲端長廊',title:'Above the ordinary.',subtitle:'雲上城 · 在天空與石之間',exploreLabel:'探索這個場景',soundLabel:'開啟風聲與遠方鐘聲',soundTip:'環境音',otherScene:{href:'../vertigo/',label:'懸城'},locationPrompt:'換一個角度，靠近天空。',views,moodAttribute:'weather',moods:[{key:'clear',label:'晴空'},{key:'clouds',label:'雲湧'}],loadingName:'AERIE',loadingCopy:'雲端長廊，正在等你。'});
const $=<E extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as E;
const mobile=matchMedia('(pointer:coarse)').matches||innerWidth<760,reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
async function init(){
  const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.2:1.5));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.88;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label','雲上城 3D 場景。WASD 移動、拖曳或滑鼠轉頭，F 切換飛行，Q 與 E 升降。');$('canvas-wrap').append(canvas);
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(mobile?64:54,innerWidth/innerHeight,.2,2800);camera.position.copy(views[0].position);
  scene.fog=new T.FogExp2(0xa5b8c6,.00235);
  $('loading-bar').style.width='12%';
  const [materials,hdr,panorama]=await Promise.all([loadMaterials(renderer),new HDRLoader().loadAsync(assetUrl('shared','sky.hdr')),new T.TextureLoader().loadAsync(assetUrl('aerie','sky.jpg'))]);panorama.colorSpace=T.SRGBColorSpace;panorama.wrapS=T.RepeatWrapping;panorama.minFilter=T.LinearFilter;panorama.generateMipmaps=false;
  const pmrem=new T.PMREMGenerator(renderer),env=pmrem.fromEquirectangular(hdr);scene.environment=env.texture;scene.environmentIntensity=.36;hdr.dispose();pmrem.dispose();
  const hemi=new T.HemisphereLight(0xc1d6ec,0x5b624c,.85);scene.add(hemi);
  const sun=new T.DirectionalLight(0xffedcf,4.4);sun.position.set(-100,210,105);sun.target.position.set(0,78,-18);sun.castShadow=true;sun.shadow.mapSize.set(mobile?1024:4096,mobile?1024:4096);Object.assign(sun.shadow.camera,{left:-112,right:112,top:110,bottom:-100,near:20,far:430});sun.shadow.normalBias=.085;sun.shadow.bias=-.00015;scene.add(sun,sun.target);
  $('loading-bar').style.width='35%';
  const world=buildCity(scene,materials,mobile),atmosphere=createAtmosphere(scene,mobile,panorama),skyships=createSkyships(scene,materials),audio=new AerieAudio();
  // Static architecture shadows are cached; only vessels move slowly above the city.
  renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
  const nav=new Navigation(camera,canvas,world.obstacles,views,bounds,world.surfaces,true);bindNavigationUI(nav);
  const changed=nav.onChange;nav.onChange=()=>{changed();$('explore').textContent=nav.active?'暫停探索':'探索這個場景';if(nav.active&&document.pointerLockElement!==canvas&&!matchMedia('(pointer:coarse)').matches)$('movement-help').textContent='WASD 移動 · 拖曳環顧 · Shift 加速 · F 切換 · Q / E 升降';};nav.onChange();
  const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
  const ao=new GTAOPass(scene,camera,innerWidth,innerHeight);ao.enabled=!mobile;ao.blendIntensity=1.05;ao.updateGtaoMaterial({radius:1.2,thickness:1.4,samples:8,distanceExponent:1.4});ao.updatePdMaterial({radius:3,samples:8,rings:2});
  const aoRender=ao.render.bind(ao);ao.render=(...args)=>{atmosphere.sky.visible=atmosphere.clouds.visible=false;try{aoRender(...args);}finally{atmosphere.sky.visible=atmosphere.clouds.visible=true;}};composer.addPass(ao);
  composer.addPass(new UnrealBloomPass(new T.Vector2(innerWidth,innerHeight),.13,.35,1.6));composer.addPass(new OutputPass());if(!mobile)composer.addPass(new SMAAPass());
  const menu=$('locations'),locationButton=$('location');const close=()=>{menu.hidden=true;locationButton.setAttribute('aria-expanded','false');};
  locationButton.addEventListener('click',()=>{menu.hidden=!menu.hidden;locationButton.setAttribute('aria-expanded',String(!menu.hidden));});
  document.addEventListener('pointerdown',e=>{if(!(e.target as HTMLElement).closest('.location-control'))close();});document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
  function goTo(i:number){if(i===5)nav.setMode('fly');nav.goTo(i);$('location-number').textContent=`0${i+1}`;$('location-name').textContent=views[i].name;document.querySelectorAll<HTMLElement>('[data-view]').forEach(el=>el.setAttribute('aria-current',String(Number(el.dataset.view)===i)));close();}
  document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b=>b.addEventListener('click',()=>goTo(Number(b.dataset.view))));$('home').addEventListener('click',()=>goTo(0));
  let targetMood=0,mood=0;
  document.querySelectorAll<HTMLButtonElement>('[data-weather]').forEach(b=>b.addEventListener('click',()=>{targetMood=Number(b.dataset.weather==='clouds');document.querySelectorAll('[data-weather]').forEach(el=>el.setAttribute('aria-pressed',String(el===b)));}));
  $('sound').addEventListener('click',async()=>{try{const enabled=await audio.toggle();$('sound').setAttribute('aria-pressed',String(enabled));$('sound').setAttribute('aria-label',enabled?'關閉風聲與遠方鐘聲':'開啟風聲與遠方鐘聲');}catch{toast('目前無法開啟環境音，請稍後再試。');}});
  if(!document.fullscreenEnabled)$('fullscreen').hidden=true;
  $('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('experience').requestFullscreen();}catch{toast('目前瀏覽器不支援全螢幕。');}});document.addEventListener('fullscreenchange',()=>$('fullscreen').setAttribute('aria-pressed',String(!!document.fullscreenElement)));
  $('photo').addEventListener('click',()=>{composer.render();canvas.toBlob(blob=>{if(!blob){toast('暫時無法儲存照片。');return;}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`AERIE-${Date.now()}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),15000);toast('照片已下載。');},'image/png');});
  let elapsed=0,last=performance.now(),fps=60,lost=false;
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;toast('繪圖連線中斷，正在恢復。');});canvas.addEventListener('webglcontextrestored',()=>location.reload());
  document.addEventListener('visibilitychange',()=>{last=performance.now();audio.setPageVisible();});
  function animate(now:number){requestAnimationFrame(animate);if(document.hidden||lost){last=now;return;}const raw=(now-last)/1000,dt=Math.min(raw,.05);last=now;elapsed+=dt;nav.update(dt);mood=T.MathUtils.lerp(mood,targetMood,1-Math.exp(-dt*.65));
    (scene.fog as T.FogExp2).density=.00235+mood*.0017+Math.max(0,58-camera.position.y)*.001;
    sun.intensity=4.4-mood*2;hemi.intensity=.85+mood*.3;
    atmosphere.update(reduced?0:elapsed,mood,camera);skyships.update(reduced?0:elapsed);composer.render();if(raw>0&&raw<.5)fps=T.MathUtils.lerp(fps,1/raw,.025);
  }
  window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);});
  $('loading-bar').style.width='80%';atmosphere.update(0,0,camera);skyships.update(0);await renderer.compileAsync(scene,camera);composer.render();$('loading-bar').style.width='100%';requestAnimationFrame(animate);setTimeout(()=>{$('loading').classList.add('done');setTimeout(()=>$('loading').hidden=true,1100);},150);
  Object.defineProperty(window,'aerie',{value:{get state(){return {ready:true,camera:camera.position.toArray(),rotation:camera.rotation.toArray().slice(0,3),mode:nav.mode,active:nav.active,mood:targetMood?'clouds':'clear',fps:Math.round(fps),...world.stats,walkSurfaces:world.surfaces.length};}}});
}
init().catch(e=>{console.error(e);$('loading').hidden=true;$('error').hidden=false;$('error-copy').textContent='請確認瀏覽器已開啟硬體加速，並重新載入場景。';});
