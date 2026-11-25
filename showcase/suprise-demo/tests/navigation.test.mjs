import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { Navigation } from '../src/shared/navigation.ts';

function setup({height=0,obstacles=[],surfaces,position=[0,height+1.7,2],allowDragFallback=false}={}){
  globalThis.window=new EventTarget();
  globalThis.document=Object.assign(new EventTarget(),{hidden:false,pointerLockElement:null});
  globalThis.matchMedia=()=>({matches:false});
  const canvas=Object.assign(new EventTarget(),{focus(){},setPointerCapture(){}});
  canvas.requestPointerLock=()=>{document.pointerLockElement=canvas;document.dispatchEvent(new Event('pointerlockchange'));return Promise.resolve();};
  document.exitPointerLock=()=>{document.pointerLockElement=null;document.dispatchEvent(new Event('pointerlockchange'));};
  const camera=new THREE.PerspectiveCamera();camera.position.fromArray(position);
  const views=[{name:'test',label:'test',position:camera.position.clone(),target:new THREE.Vector3(0,position[1],-10)}];
  const nav=new Navigation(camera,canvas,obstacles,views,{minX:-20,maxX:20,minZ:-20,maxZ:20,maxY:100},surfaces??[{x:0,z:0,w:10,d:10,y:height}],allowDragFallback);
  const key=(type,code)=>{const e=new Event(type,{cancelable:true});Object.defineProperties(e,{code:{value:code},target:{value:{closest:()=>null}}});window.dispatchEvent(e);};
  const tick=(seconds=1)=>{for(let i=0;i<seconds*60;i++)nav.update(1/60);};
  const look=(x,y)=>{const e=new Event('mousemove');Object.assign(e,{movementX:x,movementY:y});document.dispatchEvent(e);};
  return {nav,camera,key,tick,look,canvas};
}

test('pointer lock enables mouse look without holding a button; Escape clears held movement',()=>{
  const {nav,camera,key,tick,look}=setup();nav.start();assert.equal(nav.active,true);
  const before=camera.quaternion.clone();look(90,-40);tick();assert.ok(before.angleTo(camera.quaternion)>.1);
  key('keydown','KeyW');tick();key('keydown','Escape');const stop=camera.position.clone();tick();assert.deepEqual(camera.position,stop);assert.equal(nav.active,false);
  nav.start();tick();assert.deepEqual(camera.position,stop);
});

test('walking stays at eye height on an elevated floor and cannot leave a ledge',()=>{
  const {nav,camera,key,tick}=setup({height:48});nav.start();key('keydown','KeyE');key('keydown','KeyW');tick(6);
  assert.equal(camera.position.y,49.7);assert.ok(camera.position.z>=-5.08);
});

test('sprinting cannot tunnel through thin walls',()=>{
  const {nav,camera,key,tick}=setup({obstacles:[{x:0,z:0,w:10,d:.05,h:4}]});nav.start();key('keydown','KeyW');key('keydown','ShiftRight');tick(3);
  assert.ok(camera.position.z>=.21);
});

test('walking climbs and descends steps',()=>{
  const surfaces=[{x:0,z:2,w:4,d:4,y:0},{x:0,z:-.5,w:4,d:1.2,y:.25},{x:0,z:-2,w:4,d:2.2,y:.5}];
  const {nav,camera,key,tick}=setup({surfaces});nav.start();key('keydown','KeyW');tick(1.8);key('keyup','KeyW');assert.ok(camera.position.y>2.1);
  key('keydown','KeyS');tick(1.8);assert.equal(camera.position.y,1.7);
});

test('flight follows pitch and permits elevation; switching back lands on supported ground',()=>{
  const {nav,camera,key,tick,look}=setup();nav.start();key('keydown','KeyF');key('keyup','KeyF');look(0,-160);key('keydown','KeyW');tick();key('keyup','KeyW');assert.ok(camera.position.y>2.5);
  const y=camera.position.y;key('keydown','KeyE');tick();key('keyup','KeyE');assert.ok(camera.position.y>y+3);
  nav.setMode('walk');assert.equal(nav.mode,'walk');assert.equal(camera.position.y,1.7);
});

test('lost lock and hidden tabs pause and clear touch elevation',()=>{
  const {nav,camera,tick}=setup();nav.start();nav.setMode('fly');nav.setTouchElevation(1);tick();document.exitPointerLock();const before=camera.position.clone();tick();assert.deepEqual(camera.position,before);
  nav.start();tick();assert.deepEqual(camera.position,before);document.hidden=true;document.dispatchEvent(new Event('visibilitychange'));assert.equal(nav.active,false);
});

test('unsupported pointer lock reports failure without activating keyboard capture',()=>{
  const {nav,canvas}=setup();canvas.requestPointerLock=undefined;let error='';nav.onError=value=>error=value;nav.start();assert.equal(nav.active,false);assert.ok(error.includes('無法鎖定滑鼠'));
});

test('opt-in drag fallback supports keyboard travel and mouse look when pointer lock is unavailable',()=>{
  const {nav,canvas,camera,key,tick}=setup({allowDragFallback:true});canvas.requestPointerLock=undefined;nav.start();assert.equal(nav.active,true);
  const initial=camera.position.clone();key('keydown','KeyW');tick(.5);key('keyup','KeyW');assert.ok(camera.position.distanceTo(initial)>.5);
  const before=camera.quaternion.clone();const down=new Event('pointerdown');Object.assign(down,{button:0,pointerType:'mouse',pointerId:1,clientX:100,clientY:100});canvas.dispatchEvent(down);
  const move=new Event('pointermove');Object.assign(move,{pointerId:1,clientX:180,clientY:80});canvas.dispatchEvent(move);tick();assert.ok(before.angleTo(camera.quaternion)>.1);
  key('keydown','Escape');assert.equal(nav.active,false);
});

test('walking and sprinting follow a continuous hill in both directions without stair snapping',()=>{
  const heightAt=(x,z)=>3+z*.28;
  const {nav,camera,key,tick}=setup({position:[0,5.26,2],surfaces:[{x:0,z:0,w:10,d:30,y:3,heightAt}]});
  nav.start();key('keydown','KeyW');key('keydown','ShiftLeft');tick(1);
  assert.ok(camera.position.z<0);assert.ok(Math.abs(camera.position.y-(heightAt(0,camera.position.z)+1.7))<1e-9);
  key('keyup','KeyW');key('keydown','KeyS');tick(1.7);
  assert.ok(camera.position.z>2);assert.ok(Math.abs(camera.position.y-(heightAt(0,camera.position.z)+1.7))<1e-9);
});

test('terrain holes stop walking and landing samples the terrain height after flight',()=>{
  const heightAt=(x,z)=>z<0?undefined:2+z*.3;
  const {nav,camera,key,tick}=setup({position:[0,4.3,2],surfaces:[{x:0,z:5,w:10,d:10,y:0,heightAt}]});
  nav.start();key('keydown','KeyW');tick(3);assert.ok(camera.position.z>=0);
  nav.setMode('fly');key('keydown','KeyE');tick(1);nav.setMode('walk');
  assert.equal(nav.mode,'walk');assert.ok(Math.abs(camera.position.y-(heightAt(camera.position.x,camera.position.z)+1.7))<1e-9);
});

test('landing beside an irregular shoreline finds nearby supported ground instead of a distant deck',()=>{
  const heightAt=(x,z)=>x>1&&x<6&&Math.abs(z)<4?2:undefined;
  const {nav,camera}=setup({position:[0,9,0],surfaces:[{x:0,z:0,w:20,d:20,y:0,heightAt},{x:14,z:14,w:2,d:2,y:0}]});
  nav.start();assert.equal(nav.mode,'walk');assert.ok(camera.position.x>1&&camera.position.x<6);assert.ok(Math.abs(camera.position.z)<4);assert.equal(camera.position.y,3.7);
});
