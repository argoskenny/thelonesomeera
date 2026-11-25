import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { Navigation } from '../src/shared/navigation.ts';
import { STAIRS,makeSurfaces,gallerySlabs,shopObstacles } from '../src/scenes/kowloon/layout.ts';
import { views,bounds } from '../src/scenes/kowloon/views.ts';

function controls(position,target){
 globalThis.window=new EventTarget();
 globalThis.document=Object.assign(new EventTarget(),{hidden:false,pointerLockElement:null});
 globalThis.matchMedia=()=>({matches:false});
 const canvas=Object.assign(new EventTarget(),{focus(){},setPointerCapture(){}});
 canvas.requestPointerLock=()=>{document.pointerLockElement=canvas;document.dispatchEvent(new Event('pointerlockchange'));return Promise.resolve();};
 const camera=new T.PerspectiveCamera();camera.position.copy(position);
 const nav=new Navigation(camera,canvas,shopObstacles,[{name:'route',label:'route',position,target}],bounds,makeSurfaces());
 nav.start();
 const key=(type,code)=>{const e=new Event(type,{cancelable:true});Object.defineProperties(e,{code:{value:code},target:{value:{closest:()=>null}}});window.dispatchEvent(e);};
 return {camera,nav,walk(code,seconds){key('keydown',code);for(let i=0;i<seconds*60;i++)nav.update(1/60);key('keyup',code);for(let i=0;i<30;i++)nav.update(1/60);}};
}
for(const [i,s]of STAIRS.entries())test(`Kowloon stair ${i+1} connects both floors in both directions`,()=>{
 const dir=Math.sign(s.z1-s.z0),start=s.z0-dir;
 const {camera,nav,walk}=controls(new T.Vector3(s.x,s.y0+1.7,start),new T.Vector3(s.x,s.y0+1.7,start+dir*10));
 walk('KeyW',11);
 assert.ok((camera.position.z-s.z1)*dir>1,`Reached ${camera.position.toArray()}`);
 assert.ok(Math.abs(camera.position.y-s.y1-1.7)<.01);assert.equal(nav.mode,'walk');
 walk('KeyS',11);
 assert.ok((camera.position.z-s.z0)*dir<0,`Returned ${camera.position.toArray()}`);
 assert.ok(Math.abs(camera.position.y-s.y0-1.7)<.01);
});

test('Kowloon upper slabs leave real stairwell openings and retain a landing',()=>{
 for(const s of STAIRS.filter(s=>s.y1>s.y0)){
  const slabs=gallerySlabs(s.y1,Math.sign(s.x));
  const inside=(x,z)=>slabs.some(p=>Math.abs(x-p.x)<=p.w/2&&Math.abs(z-p.z)<=p.d/2);
  assert.equal(inside(s.x,(s.z0+s.z1)/2),false);
  assert.equal(inside(s.x,s.z1-.5),true);
 }
});

test('Kowloon walking viewpoints land on their own floor without teleporting',()=>{
 for(const view of views.slice(0,5)){
  const {camera,nav}=controls(view.position,view.target);
  assert.ok(camera.position.distanceTo(view.position)<.01,`${view.name}: ${camera.position.toArray()}`);
  assert.equal(nav.mode,'walk');
 }
});
