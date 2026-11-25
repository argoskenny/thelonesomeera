import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { Navigation } from '../src/shared/navigation.ts';
import { stairFlight,openSpans } from '../src/scenes/aurelia/paths.ts';

test('Aurelia terrace stair can be walked down to the plaza and back up without flying',()=>{
  globalThis.window=new EventTarget();
  globalThis.document=Object.assign(new EventTarget(),{hidden:false,pointerLockElement:null});
  globalThis.matchMedia=()=>({matches:false});
  const canvas=Object.assign(new EventTarget(),{focus(){},setPointerCapture(){}});
  canvas.requestPointerLock=()=>{document.pointerLockElement=canvas;document.dispatchEvent(new Event('pointerlockchange'));return Promise.resolve();};
  const camera=new T.PerspectiveCamera();camera.position.set(-16.5,47.7,65);
  const views=[{name:'terrace',label:'terrace',position:camera.position.clone(),target:new T.Vector3(-16.5,47.7,0)}];
  const surfaces=[{x:-25,z:82,w:34,d:40,y:46},...stairFlight(46,25,62,23.5,7,-16.5),{x:-30,z:2,w:108,d:104,y:25}];
  const obstacles=openSpans(-42,-8,[[-20,-13]]).map(([a,b])=>({x:(a+b)/2,z:62,w:b-a,d:.4,minY:46,h:47.35}));
  const nav=new Navigation(camera,canvas,obstacles,views,{minX:-100,maxX:200,minZ:-200,maxZ:200,maxY:300},surfaces);nav.start();
  function key(type,code){const event=new Event(type,{cancelable:true});Object.defineProperties(event,{code:{value:code},target:{value:{closest:()=>null}}});window.dispatchEvent(event);}
  function walk(code,seconds){key('keydown',code);for(let i=0;i<seconds*60;i++)nav.update(1/60);key('keyup',code);}
  walk('KeyW',18.5);assert.ok(camera.position.z<23.5,JSON.stringify(camera.position));assert.equal(camera.position.y,26.7);assert.equal(nav.mode,'walk');
  walk('KeyS',18.5);assert.ok(camera.position.z>62);assert.equal(camera.position.y,47.7);
});

test('rail openings are merged and clamped, preserving access rather than overlapping it',()=>{
  assert.deepEqual(openSpans(-42,-8,[[-18,-13],[-20,-16],[-50,-40]]),[[-40,-20],[-13,-8]]);
  assert.deepEqual(openSpans(0,10,[[-20,20]]),[]);
});
