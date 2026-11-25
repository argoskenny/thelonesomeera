import { Navigation, type MovementMode } from './navigation';
import { toast } from './ui';

export function bindNavigationUI(nav:Navigation){
  const $=(id:string)=>document.getElementById(id)!;
  const touch=matchMedia('(pointer:coarse)').matches;
  const update=()=>{
    $('experience').classList.toggle('walking',nav.active);
    $('intro').setAttribute('aria-hidden',String(nav.active));
    $('explore').textContent=nav.active?'暫停探索':'點擊開始 FPS 探索';
    $('walk-instructions').hidden=!nav.active;
    $('walk-instructions').querySelector('span')!.textContent=nav.mode==='walk'?'地面行走':'自由飛行';
    $('movement-help').textContent=touch?'左側搖桿移動 · 滑動畫面轉頭':`WASD 移動 · 滑鼠轉頭 · Shift 加速 · F 切換${nav.mode==='fly'?' · Q / E 升降':''} · Esc 釋放滑鼠`;
    $('crosshair').hidden=!nav.active;
    $('joystick').hidden=!nav.active||!touch;
    $('elevation').hidden=!nav.active||!touch||nav.mode!=='fly';
    $('controls-hint').textContent=nav.active?'Esc 釋放滑鼠 · F 切換模式':'點擊畫面開始 · WASD 移動';
    $('mode-status').textContent=nav.mode==='walk'?'沿地面與階梯行走':'自由飛行 · Q / E 升降';
    document.querySelectorAll<HTMLButtonElement>('[data-movement]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.movement===nav.mode)));
    ($('joystick').firstElementChild as HTMLElement).style.transform='';
  };
  nav.onChange=update;nav.onError=toast;
  $('explore').addEventListener('click',()=>nav.active?nav.pause():nav.start());
  document.querySelectorAll<HTMLButtonElement>('[data-movement]').forEach(b=>b.addEventListener('click',()=>nav.setMode(b.dataset.movement as MovementMode)));
  const joystick=$('joystick');let pointer:number|null=null;
  const move=(e:PointerEvent)=>{
    const r=joystick.getBoundingClientRect();let x=(e.clientX-r.left-r.width/2)/36,y=(e.clientY-r.top-r.height/2)/36;const length=Math.hypot(x,y);if(length>1){x/=length;y/=length;}
    nav.setTouch(x,y);(joystick.firstElementChild as HTMLElement).style.transform=`translate(${x*28}px,${y*28}px)`;
  };
  joystick.addEventListener('pointerdown',e=>{e.preventDefault();pointer=e.pointerId;joystick.setPointerCapture(e.pointerId);move(e);});
  joystick.addEventListener('pointermove',e=>{if(e.pointerId===pointer)move(e);});
  const reset=()=>{pointer=null;nav.setTouch(0,0);(joystick.firstElementChild as HTMLElement).style.transform='';};
  joystick.addEventListener('pointerup',reset);joystick.addEventListener('pointercancel',reset);joystick.addEventListener('lostpointercapture',reset);
  document.querySelectorAll<HTMLButtonElement>('[data-elevation]').forEach(b=>{
    b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);nav.setTouchElevation(Number(b.dataset.elevation));});
    const stop=()=>nav.setTouchElevation(0);b.addEventListener('pointerup',stop);b.addEventListener('pointercancel',stop);b.addEventListener('lostpointercapture',stop);
  });
  update();
}
