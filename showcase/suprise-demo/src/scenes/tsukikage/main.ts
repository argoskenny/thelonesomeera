import * as T from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ContactShadows } from '../raohe/contact-shadows';
import { bindNavigationUI } from '../../shared/navigation-ui';
import { Navigation } from '../../shared/navigation';
import { toast } from '../../shared/ui';
import type { SceneView } from '../../shared/types';
import { buildArchitecture } from './architecture';
import { RyokanAudio } from './audio';
import { Builder } from './builder';
import { buildGarden } from './garden';
import { bounds,obstacles,surfaces } from './layout';
import { captureHall,lightHall } from './lighting';
import { installMaterials } from './materials';
import { buildStage } from './stage';
import { preparePerformer } from './performer';

const byId=(id:string)=>document.getElementById(id)!;
const portrait=()=>innerWidth/innerHeight<.86;
const touch=matchMedia('(pointer:coarse)').matches;
const v=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
function arrival(){return portrait()?{position:v(4.9,8.4,11.85),target:v(-.25,3.46,.12)}:
  {position:v(3.65,8.4,11.77),target:v(-1.02,3.91,-.72)};}
const views:SceneView[]=[
  {name:'高處迴廊',label:'高處迴廊',...arrival()},
  {name:'三味線舞台',label:'三味線舞台',position:v(.16,4.2,2.72),target:v(-1.06,3.40,1.49)},
  {name:'石燈溪庭',label:'石燈溪庭',position:v(.86,1.82,7.42),target:v(-6.55,1.40,3.55)},
  {name:'格子茶室',label:'格子茶室',position:v(-4.15,4.2,-5.86),target:v(-8.55,3.33,-3.5)},
  {name:'大階梯上層',label:'大階梯上層',position:v(10.55,9.6,-9.17),target:v(-1,2.76,1.6)}
];
function failure(message:string){byId('loading').hidden=true;byId('error-text').textContent=message;byId('error').hidden=false;}
async function init(){
  const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
  renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.17;
  let resolution=Math.min(devicePixelRatio,touch?1.25:1.65);
  renderer.setPixelRatio(resolution);renderer.setSize(innerWidth,innerHeight);
  const canvas=renderer.domElement;canvas.tabIndex=0;
  canvas.setAttribute('aria-label','月影之宿 3D 中庭，可步行或自由飛行');
  byId('stage').append(canvas);
  const scene=new T.Scene();scene.background=new T.Color(0x392921);
  scene.fog=new T.FogExp2(0x604535,.014);
  const fov=()=>portrait()?64:(innerWidth/innerHeight>2.0?41.8:47.5);
  const camera=new T.PerspectiveCamera(fov(),innerWidth/innerHeight,.055,75);
  camera.position.copy(views[0].position);camera.lookAt(views[0].target);
  const b=new Builder();
  const [rockMaps]=await Promise.all([installMaterials(b,renderer),preparePerformer()]);
  buildArchitecture(b);buildStage(b);buildGarden(b,rockMaps);b.finish(scene);lightHall(scene,touch,b.occlusion.bake());
  captureHall(renderer,scene);
  const buffer=new T.WebGLRenderTarget(innerWidth,innerHeight,{type:T.HalfFloatType,depthTexture:new T.DepthTexture(innerWidth,innerHeight),samples:touch?0:2});
  const composer=new EffectComposer(renderer,buffer);composer.setSize(innerWidth,innerHeight);
  composer.addPass(new RenderPass(scene,camera));
  composer.addPass(new ContactShadows(camera));
  composer.addPass(new UnrealBloomPass(new T.Vector2(innerWidth,innerHeight),.16,.36,1.25));
  composer.addPass(new OutputPass());
  // A soft photographic toe retains warm detail in the unlit timber recesses.
  composer.addPass(new ShaderPass({
    uniforms:{tDiffuse:{value:null}},
    vertexShader:'varying vec2 frameUV;void main(){frameUV=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`uniform sampler2D tDiffuse;varying vec2 frameUV;
      void main(){
        vec3 c=texture2D(tDiffuse,frameUV).rgb;
        vec3 black=vec3(.081,.056,.043);
        vec3 graded=black+(1.-black)*pow(max(c,vec3(0.)),vec3(.94,.94,.96));
        float grain=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5;
        gl_FragColor=vec4(graded+grain*.003,1.);
      }`
  }));
  const nav=new Navigation(camera,canvas,obstacles,views,bounds,surfaces,true);
  bindNavigationUI(nav);
  const location=byId('location'),menu=byId('locations');
  const closeMenu=()=>{menu.hidden=true;location.setAttribute('aria-expanded','false');};
  const updateNav=nav.onChange;
  nav.onChange=()=>{
    updateNav();byId('explore').textContent=nav.active?'暫停漫遊':'開始漫遊';
    byId('controls-hint').textContent=touch?'左手移動 · 右手滑動環顧':'WASD 移動 · 滑鼠環顧 · F 切換模式';
    if(nav.active){closeMenu();if(!touch&&document.pointerLockElement!==canvas)byId('movement-help').textContent='WASD 移動 · 拖曳環顧 · F 切換模式 · Esc 暫停';}
  };
  function choose(index:number){
    if(index===0)Object.assign(views[0],arrival());nav.goTo(index);
    byId('current-spot').textContent=views[index].name;
    menu.querySelectorAll('button').forEach((btn,i)=>btn.setAttribute('aria-current',String(i===index)));
    closeMenu();location.focus({preventScroll:true});
  }
  views.forEach((view,i)=>{
    const btn=document.createElement('button');btn.type='button';btn.textContent=view.name;btn.setAttribute('aria-current',String(i===0));btn.addEventListener('click',()=>choose(i));menu.append(btn);
  });
  location.addEventListener('click',()=>{menu.hidden=!menu.hidden;location.setAttribute('aria-expanded',String(!menu.hidden));});
  document.addEventListener('pointerdown',e=>{if(!(e.target as Element).closest('.spots'))closeMenu();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){closeMenu();location.focus();}});
  nav.onChange();
  const audio=new RyokanAudio(),sound=byId('audio');
  sound.addEventListener('click',async()=>{
    try{const on=await audio.toggle();sound.setAttribute('aria-pressed',String(on));sound.setAttribute('aria-label',(on?'關閉':'開啟')+'水聲與三味線');}catch{toast('瀏覽器目前無法播放聲音。');}
  });
  const full=byId('fullscreen');full.hidden=!document.fullscreenEnabled;
  full.addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await byId('experience').requestFullscreen();}catch{toast('瀏覽器目前無法切換全螢幕。');}});
  document.addEventListener('fullscreenchange',()=>{full.setAttribute('aria-pressed',String(!!document.fullscreenElement));full.setAttribute('aria-label',document.fullscreenElement?'離開全螢幕':'進入全螢幕');});
  byId('photo').addEventListener('click',()=>{
    composer.render();canvas.toBlob(blob=>{
      if(!blob){toast('照片儲存失敗，請再試一次。');return;}
      const url=URL.createObjectURL(blob),link=document.createElement('a');
      link.download='月影之宿-'+Date.now()+'.png';link.href=url;link.click();setTimeout(()=>URL.revokeObjectURL(url),12000);toast('已儲存目前視角。');
    });
  });
  let wasPortrait=portrait();
  function resize(){
    renderer.setPixelRatio(resolution);renderer.setSize(innerWidth,innerHeight);
    composer.setPixelRatio(resolution);composer.setSize(innerWidth,innerHeight);
    camera.aspect=innerWidth/innerHeight;camera.fov=fov();camera.updateProjectionMatrix();
    if(wasPortrait!==portrait()&&!nav.active&&camera.position.distanceTo(views[0].position)<.01)choose(0);
    wasPortrait=portrait();
  }
  window.addEventListener('resize',resize);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();renderer.setAnimationLoop(null);failure('3D 繪圖已中斷，請重新載入月影之宿。');});
  let previous=0,frames=0,start=0;
  renderer.info.autoReset=false;
  const draw=()=>{renderer.info.reset();composer.render();};
  draw();byId('loading').hidden=true;
  Object.assign(window,{tsukikage:{get state(){return {position:camera.position.toArray(),direction:camera.getWorldDirection(new T.Vector3()).toArray(),active:nav.active,mode:nav.mode,resolution,triangles:renderer.info.render.triangles,calls:renderer.info.render.calls};}}});
  renderer.setAnimationLoop(now=>{
    if(document.hidden){previous=0;start=0;frames=0;return;}
    const dt=previous?Math.min((now-previous)/1000,.12):0;previous=now;
    nav.update(dt);draw();
    if(!start)start=now;
    if(++frames>=50){
      if((now-start)/frames>42 && resolution>.8){resolution=Math.max(.8,resolution*.87);resize();}
      start=0;frames=0;
    }
  });
}
init().catch(e=>{console.error(e);failure('無法載入月影之宿。請確認瀏覽器支援 WebGL 2，並已開啟硬體加速。');});
