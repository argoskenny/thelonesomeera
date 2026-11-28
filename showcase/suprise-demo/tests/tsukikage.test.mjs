import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PerspectiveCamera,Vector3} from 'three';
import {Navigation} from '../src/shared/navigation.ts';
import {bounds,obstacles,surfaces} from '../src/scenes/tsukikage/layout.ts';
import {eastApron,onStrip,stagePoint,westBridge} from '../src/scenes/tsukikage/stage-plan.ts';

function visitor(x,y,z){
  globalThis.window=new EventTarget();
  globalThis.document=new EventTarget();
  globalThis.matchMedia=()=>({matches:true});
  const canvas=Object.assign(new EventTarget(),{focus(){}});
  const camera=new PerspectiveCamera();
  camera.position.set(x,y+1.7,z);
  const view={name:'Gallery',label:'Gallery',position:camera.position.clone(),target:new Vector3(x,y+1.7,z-1)};
  const nav=new Navigation(camera,canvas,obstacles,[view],bounds,surfaces);
  nav.start();
  assert.equal(nav.mode,'walk');
  function walkTo(x,z) {
    const p=camera.position;
    for(let frame=0;frame<1200;frame++) {
      const dx=x-p.x,dz=z-p.z,d=Math.hypot(dx,dz);
      if(d<.032){nav.setTouch(0,0);return;}
      const divisor=Math.max(d,.37);
      nav.setTouch(dx/divisor,dz/divisor);
      nav.update(1/60);
    }
    assert.fail(`Could not walk to ${x}, ${z} from the current point ${p.toArray().map(n=>n.toFixed(2))}`);
  }
  const expectFloor=y=>assert.ok(Math.abs(camera.position.y-1.70-y)<.01,`Expected floor ${y}, got ${camera.position.y-1.70}`);
  return {camera,nav,walkTo,expectFloor};
}

test('the east return connects the arrival gallery and back gallery in both directions',()=>{
  const {walkTo,expectFloor}=visitor(6,6.70,12.41);
  walkTo(12.95,12.41);
  walkTo(12.95,10.49);expectFloor(7.30);
  walkTo(12.95,8.30);expectFloor(7.90);
  walkTo(12.95,-9.32);walkTo(10,-9.32);
  walkTo(12.95,-9.32);walkTo(12.95,8.30);walkTo(12.95,12.41);walkTo(6,12.41);
  expectFloor(6.70);
});
test('the main stair ascends 32 rotated treads and returns to the open stage threshold',()=>{
  const [x,z]=stagePoint(.55,2.40);
  const {walkTo,expectFloor}=visitor(x,2.5,z);
  walkTo(...onStrip(eastApron,.01,.54));walkTo(...onStrip(eastApron,.93,.72));walkTo(3.06,2.71);walkTo(3.60,3.21);
  walkTo(4.70,2.80);walkTo(7.32,-2.65);
  expectFloor(5.20);
  walkTo(10,-8.2);walkTo(10.32,-9.3);expectFloor(7.9);
  walkTo(10,-8.2);walkTo(4.70,2.80);walkTo(3.60,3.21);walkTo(3.06,2.71);walkTo(...onStrip(eastApron,.93,.72));walkTo(...onStrip(eastApron,.01,.54));walkTo(x,z);
  expectFloor(2.50);
});
test('the garden stairs connect the gravel and the stage landing in both directions',()=>{
  const {walkTo,expectFloor}=visitor(4.60,.115,9.7);
  walkTo(4.60,6.66);expectFloor(1.35);
  walkTo(4.60,3.75);expectFloor(2.5);
  walkTo(3.60,3.21);walkTo(3.06,2.71);walkTo(...onStrip(eastApron,.93,.72));walkTo(...onStrip(eastApron,.01,.64));walkTo(...stagePoint(.61,2.68));
  walkTo(...onStrip(eastApron,.01,.64));walkTo(...onStrip(eastApron,.93,.72));walkTo(3.06,2.71);walkTo(3.60,3.21);walkTo(4.6,3.75);walkTo(4.6,9.68);expectFloor(.115);
});
test('the angled west bridge connects both ways between the stage and rear engawa',()=>{
  const [x,z]=stagePoint(-2.45,1.32);
  const {walkTo,expectFloor}=visitor(x,2.5,z);
  walkTo(...onStrip(westBridge,.98,.5));walkTo(...onStrip(westBridge,.035,.5));
  walkTo(-12.82,5.40);walkTo(-12.82,-6.89);walkTo(-5.34,-6.89);
  walkTo(-4.80,-6.89);walkTo(-4.45,-6.10);walkTo(1,-6.10);
  expectFloor(2.50);
  walkTo(-4.45,-6.10);walkTo(-4.80,-6.89);walkTo(-12.82,-6.89);walkTo(-12.82,5.40);
  walkTo(...onStrip(westBridge,.035,.5));walkTo(...onStrip(westBridge,.98,.5));walkTo(x,z);
  expectFloor(2.50);
});
test('the musician and the balcony rail stop walking while fly mode still moves freely',()=>{
  const [x,z]=[-1.10,1.58];
  const {camera,nav}=visitor(x,2.50,z+1.05);
  nav.setTouch(0,-1);
  for(let frame=0;frame<80;frame++)nav.update(1/60);
  assert.ok(camera.position.z>z+.51);
  nav.setMode('fly');nav.setTouch(0,-1);
  for(let frame=0;frame<35;frame++)nav.update(1/60);
  assert.ok(camera.position.z<z-.20);
  const arrival=visitor(3,6.70,12.43);
  arrival.nav.setTouch(0,-1);
  for(let frame=0;frame<90;frame++)arrival.nav.update(1/60);
  assert.ok(arrival.camera.position.z>11.7);
});

test('garden stepping stones cross the water and return to the dry outer bank',()=>{
  const {walkTo,expectFloor}=visitor(2.2,.115,8.96);
  for(const [x,z] of [[1.78,8.6],[.6,7.53],[-.77,6.59],[-2.23,6.42],[-3.6,5.94],[-5.05,5.68],[-6.31,5.21],[-6.91,5.18]])
    walkTo(x,z);
  expectFloor(.25);
  walkTo(-7.13,5.40);walkTo(-7.91,5.31);expectFloor(.115);
});
