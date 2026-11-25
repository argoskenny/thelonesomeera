import * as THREE from 'three';
import type { Obstacle, SceneView, WalkSurface } from './types';

export type NavigationBounds={minX:number;maxX:number;minZ:number;maxZ:number;maxY:number};
export type MovementMode='walk'|'fly';
const EYE_HEIGHT=1.7, STEP_HEIGHT=.35, MAX_DROP=.5, RADIUS=.19;
const movementKeys=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight','KeyQ','KeyE','Space','ShiftLeft','ShiftRight']);

export class Navigation {
  active=false;
  mode:MovementMode='walk';
  private keys=new Set<string>();
  private touchPointer:number|null=null;
  private pointer={x:0,y:0};
  private yaw=0;
  private pitch=0;
  private velocity=new THREE.Vector3();
  private touchMove={x:0,y:0};
  private touchElevation=0;
  private requesting=false;
  private transition:{from:THREE.Vector3;to:THREE.Vector3;rotation:THREE.Quaternion;target:THREE.Quaternion;elapsed:number}|null=null;
  onChange:()=>void=()=>{};
  onError:(message:string)=>void=()=>{};

  constructor(private camera:THREE.PerspectiveCamera,private canvas:HTMLCanvasElement,private obstacles:Obstacle[],private viewpoints:SceneView[],private bounds:NavigationBounds={minX:-65,maxX:65,minZ:-60,maxZ:65,maxY:35},private surfaces:WalkSurface[]=[{x:0,z:0,w:130,d:130,y:0}],private allowDragFallback=false){
    camera.lookAt(viewpoints[0].target);this.syncAngles();
    window.addEventListener('keydown',e=>{
      if((e.target as HTMLElement).closest('button,input,select,textarea,a,[contenteditable="true"]'))return;
      if(e.code==='Escape'){this.pause();return;}
      if(!this.active)return;
      if(e.code==='KeyF'&&!e.repeat){e.preventDefault();this.setMode(this.mode==='walk'?'fly':'walk');}
      if(movementKeys.has(e.code)){e.preventDefault();this.keys.add(e.code);}
    });
    window.addEventListener('keyup',e=>this.keys.delete(e.code));
    window.addEventListener('blur',()=>this.pause());
    document.addEventListener('visibilitychange',()=>{if(document.hidden)this.pause();});
    document.addEventListener('pointerlockchange',()=>{
      this.requesting=false;
      if(document.pointerLockElement===canvas)this.activate();else this.deactivate();
    });
    document.addEventListener('pointerlockerror',()=>this.lockError());
    document.addEventListener('mousemove',e=>{
      if(this.active&&document.pointerLockElement===canvas)this.look(e.movementX,e.movementY);
    });
    canvas.addEventListener('pointerdown',e=>{
      if(e.pointerType==='touch'){
        if(this.touchPointer!==null)return;
        if(!this.active)this.activate();
        this.touchPointer=e.pointerId;this.pointer={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);
      }else if(e.button===0){
        if(!this.active)this.start();
        if(this.active&&this.allowDragFallback&&document.pointerLockElement!==canvas){this.touchPointer=e.pointerId;this.pointer={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);}
      }
    });
    canvas.addEventListener('pointermove',e=>{
      if(!this.active||e.pointerId!==this.touchPointer)return;
      this.look(e.clientX-this.pointer.x,e.clientY-this.pointer.y);this.pointer={x:e.clientX,y:e.clientY};
    });
    const stop=(e:PointerEvent)=>{if(e.pointerId===this.touchPointer)this.touchPointer=null;};
    canvas.addEventListener('pointerup',stop);canvas.addEventListener('pointercancel',stop);canvas.addEventListener('lostpointercapture',stop);
  }
  private syncAngles(){const e=new THREE.Euler().setFromQuaternion(this.camera.quaternion,'YXZ');this.yaw=e.y;this.pitch=e.x;}
  private look(x:number,y:number){this.yaw-=x*.0023;this.pitch=THREE.MathUtils.clamp(this.pitch-y*.0023,-Math.PI/2+.03,Math.PI/2-.03);}
  private clearInput(){this.keys.clear();this.velocity.set(0,0,0);this.touchMove={x:0,y:0};this.touchElevation=0;this.touchPointer=null;}
  private deactivate(){this.active=false;this.clearInput();this.onChange();}
  private activate(){
    if(this.active)return;
    this.transition=null;this.syncAngles();this.clearInput();
    if(this.mode==='walk'&&!this.land()){this.mode='fly';this.onError('這裡沒有可行走的地面，已切換自由飛行。');}
    this.active=true;this.canvas.focus({preventScroll:true});this.onChange();
  }
  private lockError(){
    if(!this.requesting)return;
    this.requesting=false;
    if(this.allowDragFallback){this.activate();this.onError('已啟用拖曳環顧。WASD 移動，拖曳滑鼠轉頭。');return;}
    this.deactivate();this.onError('無法鎖定滑鼠，請再次點擊畫面；若持續失敗，請用支援滑鼠鎖定的瀏覽器開啟。');
  }
  start(){
    if(this.active||this.requesting)return;
    if(matchMedia('(pointer:coarse)').matches){this.activate();return;}
    this.requesting=true;
    try{
      if(!this.canvas.requestPointerLock){this.lockError();return;}
      const result=this.canvas.requestPointerLock();
      if(result)result.catch(()=>this.lockError());
    }catch{this.lockError();}
  }
  pause(){if(document.pointerLockElement===this.canvas)document.exitPointerLock();this.deactivate();}
  setMode(mode:MovementMode){
    if(mode===this.mode)return;
    this.transition=null;this.clearInput();
    if(mode==='walk'&&!this.land()){this.onError('找不到可站立的位置，請先飛回步道上方。');return;}
    this.mode=mode;this.onChange();
  }
  goTo(index:number){
    const v=this.viewpoints[index];if(!v)return;
    this.pause();const target=this.camera.clone();target.position.copy(v.position);target.lookAt(v.target);
    this.transition={from:this.camera.position.clone(),to:v.position.clone(),rotation:this.camera.quaternion.clone(),target:target.quaternion.clone(),elapsed:0};
  }
  setTouchElevation(value:number){this.touchElevation=this.active?THREE.MathUtils.clamp(value,-1,1):0;}
  setTouch(x:number,y:number){this.touchMove=this.active?{x,y}:{x:0,y:0};}
  private blocked(x:number,y:number,z:number){
    return this.obstacles.some(o=>y-.12>(o.minY??0)&&y-EYE_HEIGHT+.08<(o.h??6.8)&&Math.abs(x-o.x)<o.w/2+RADIUS&&Math.abs(z-o.z)<o.d/2+RADIUS);
  }
  private ground(x:number,z:number,feet:number){
    let height:number|undefined;
    for(const s of this.surfaces){
      if(Math.abs(x-s.x)>s.w/2+.08||Math.abs(z-s.z)>s.d/2+.08)continue;
      const y=s.heightAt?s.heightAt(x,z):s.y;
      if(y===undefined||!Number.isFinite(y)||y>feet+STEP_HEIGHT||y<feet-MAX_DROP)continue;
      if(height===undefined||y>height)height=y;
    }
    return height;
  }
  private land(){
    const p=this.camera.position;let best:THREE.Vector3|undefined,bestScore=Infinity;
    for(const s of this.surfaces){
      // Try the closest point, centre and inset corners so a prop cannot trap a landing.
      const xs=[THREE.MathUtils.clamp(p.x,s.x-s.w/2+.25,s.x+s.w/2-.25),s.x,s.x-s.w/2+.25,s.x+s.w/2-.25];
      const zs=[THREE.MathUtils.clamp(p.z,s.z-s.d/2+.12,s.z+s.d/2-.12),s.z,s.z-s.d/2+.12,s.z+s.d/2-.12];
      const candidates=xs.flatMap(x=>zs.map(z=>({x,z})));
      // Irregular coastlines can have unsupported centres and corners. Search
      // around the flyer too, so landing finds nearby land instead of a far pier.
      if(s.heightAt)for(const radius of[1,2,4,8,16,32,64,128,256,512,1024])for(let i=0;i<24;i++){
        const angle=i/24*Math.PI*2,x=p.x+Math.cos(angle)*radius,z=p.z+Math.sin(angle)*radius;
        if(Math.abs(x-s.x)<=s.w/2&&Math.abs(z-s.z)<=s.d/2)candidates.push({x,z});
      }
      for(const {x,z} of candidates){
        const floor=s.heightAt?s.heightAt(x,z):s.y;
        if(floor===undefined||!Number.isFinite(floor))continue;
        const y=floor+EYE_HEIGHT;
        if(x<this.bounds.minX||x>this.bounds.maxX||z<this.bounds.minZ||z>this.bounds.maxZ||this.blocked(x,y,z))continue;
        const score=(x-p.x)**2+(z-p.z)**2+((y-p.y)*.5)**2;
        if(score<bestScore){bestScore=score;best=new THREE.Vector3(x,y,z);}
      }
    }
    if(!best)return false;p.copy(best);return true;
  }
  update(dt:number){
    if(this.transition){
      const t=this.transition;t.elapsed+=dt;const f=Math.min(t.elapsed/(matchMedia('(prefers-reduced-motion:reduce)').matches?.01:1.8),1),s=f*f*(3-2*f);
      this.camera.position.lerpVectors(t.from,t.to,s);this.camera.quaternion.slerpQuaternions(t.rotation,t.target,s);this.syncAngles();if(f===1)this.transition=null;
    }
    if(!this.active)return;
    this.camera.rotation.set(this.pitch,this.yaw,0,'YXZ');
    const k=this.keys,forward=Number(k.has('KeyW')||k.has('ArrowUp'))-Number(k.has('KeyS')||k.has('ArrowDown'))-this.touchMove.y;
    const side=Number(k.has('KeyD')||k.has('ArrowRight'))-Number(k.has('KeyA')||k.has('ArrowLeft'))+this.touchMove.x;
    const vertical=Number(k.has('KeyE')||k.has('Space'))-Number(k.has('KeyQ'))+this.touchElevation;
    const motion=new THREE.Vector3(side,0,-forward);
    if(this.mode==='fly'){motion.applyQuaternion(this.camera.quaternion);motion.y+=vertical;}
    else motion.applyAxisAngle(new THREE.Vector3(0,1,0),this.yaw);
    if(motion.lengthSq()>1)motion.normalize();
    motion.multiplyScalar((this.mode==='fly'?5:2.5)*(k.has('ShiftLeft')||k.has('ShiftRight')?2.4:1));
    this.velocity.lerp(motion,1-Math.exp(-dt*12));
    // Substeps prevent sprinting through thin walls or skipping stair treads.
    const count=Math.max(1,Math.ceil(this.velocity.length()*dt/.1)),step=dt/count,p=this.camera.position;
    for(let i=0;i<count;i++){
      if(this.mode==='fly')p.addScaledVector(this.velocity,step);
      else for(const axis of ['x','z'] as const){
        const next=p.clone();next[axis]+=this.velocity[axis]*step;
        const ground=this.ground(next.x,next.z,p.y-EYE_HEIGHT);
        if(ground!==undefined&&!this.blocked(next.x,ground+EYE_HEIGHT,next.z)){p[axis]=next[axis];p.y=ground+EYE_HEIGHT;}
      }
      p.x=THREE.MathUtils.clamp(p.x,this.bounds.minX,this.bounds.maxX);p.z=THREE.MathUtils.clamp(p.z,this.bounds.minZ,this.bounds.maxZ);
      if(this.mode==='fly')p.y=THREE.MathUtils.clamp(p.y,.45,this.bounds.maxY);
    }
  }
}
