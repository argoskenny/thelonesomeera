import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { Navigation } from '../src/shared/navigation.ts';
import { walkSurfaces,ringPoints,linkPoints,pathHeight,stairHeight } from '../src/scenes/neo-taipei/layout.ts';

test('Neo Taipei curved roads have walkable lanes and reject the void inside the ring',()=>{
 for(let i=0;i<ringPoints.length;i+=4){const p=ringPoints[i];assert.ok(Math.abs(pathHeight(ringPoints,9,p.x,p.z)-47)<1e-6);}
 assert.equal(pathHeight(ringPoints,9,10,-70),undefined);
 assert.equal(pathHeight(ringPoints,9,150,-70),undefined);
 for(let i=0;i<linkPoints.length;i++){const p=linkPoints[i];assert.ok(Math.abs(pathHeight(linkPoints,7,p.x,p.z)-p.y)<1e-6);if(i)assert.ok(Math.abs(p.y-linkPoints[i-1].y)<.35);}
});

test('Neo Taipei balcony, stair and lower promenade support walking in both directions',()=>{
 globalThis.window=new EventTarget();globalThis.document=Object.assign(new EventTarget(),{hidden:false,pointerLockElement:null});globalThis.matchMedia=()=>({matches:false});
 const canvas=Object.assign(new EventTarget(),{focus(){},setPointerCapture(){}});canvas.requestPointerLock=()=>{document.pointerLockElement=canvas;document.dispatchEvent(new Event('pointerlockchange'));return Promise.resolve();};
 const camera=new T.PerspectiveCamera();camera.position.set(-24,61.7,60);const views=[{name:'stairs',label:'stairs',position:camera.position.clone(),target:new T.Vector3(-24,61.7,0)}];
 const nav=new Navigation(camera,canvas,[],views,{minX:-330,maxX:370,minZ:-610,maxZ:160,maxY:440},walkSurfaces);nav.start();
 function key(type,code){const e=new Event(type,{cancelable:true});Object.defineProperties(e,{code:{value:code},target:{value:{closest:()=>null}}});window.dispatchEvent(e);}
 function walk(code,seconds){key('keydown',code);for(let i=0;i<seconds*60;i++)nav.update(1/60);key('keyup',code);}
 walk('KeyW',16);assert.ok(camera.position.z<23);assert.equal(camera.position.y,41.7);assert.equal(nav.mode,'walk');
 walk('KeyS',16);assert.ok(camera.position.z>57);assert.equal(camera.position.y,61.7);
 assert.equal(stairHeight(57),60);assert.equal(stairHeight(23),40);
});

test('Neo Taipei garden link meets the promenade and garden at matching heights',()=>{
 const start=linkPoints[0],end=linkPoints.at(-1);assert.equal(start.y,40);assert.equal(end.y,50);
 assert.ok(start.x<20&&start.z>=14&&start.z<=26);assert.ok(end.x>=144&&end.x<=186&&end.z>=-122&&end.z<=-98);
});

test('Neo Taipei citadel arrival is outside the tower walls and supported by the plaza',async()=>{
 const { citadelObstacles }=await import('../src/scenes/neo-taipei/layout.ts');const x=151,z=-274;
 assert.ok(!citadelObstacles.some(o=>Math.abs(x-o.x)<o.w/2+.2&&Math.abs(z-o.z)<o.d/2+.2));
 assert.ok(walkSurfaces.some(s=>s.y===130&&Math.abs(x-s.x)<s.w/2&&Math.abs(z-s.z)<s.d/2));
});
