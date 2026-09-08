import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CollisionWorld} from '../src/collision.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../public/data/colliders.json',import.meta.url)));
test('thin obstacles stop fast movement; tangent movement slides',()=>{const w=new CollisionWorld([[1,-1,1.05,1]],[-10,-10,10,10]);assert.ok(w.move(0,0,5,0).x<.77);const p=w.move(.7,0,1,1.8);assert.ok(p.z>1.7);});
test('circle corners permit passage outside radius, boundaries contain player',()=>{const w=new CollisionWorld([[1,1,2,2]],[-3,-3,3,3]);assert.equal(w.blocked(.8,.8),false);assert.equal(w.blocked(.9,.9),true);assert.ok(w.move(0,0,-9,0).x>=-2.76);});
test('actual scene entry and all central street axes are traversable',()=>{const w=new CollisionWorld(data.boxes,data.bounds,data.radius);assert.equal(w.blocked(-38,-34),false);for(const z of [-34,0,34])for(let x=-38;x<=38;x+=.25)assert.equal(w.blocked(x,z),false,`E/W street blocked at ${x},${z}`);for(const x of [-42,-14,14,42])for(let z=-30;z<=30;z+=.25)assert.equal(w.blocked(x,z),false,`N/S street blocked at ${x},${z}`);});
test('actual scene stalls and building walls block walking',()=>{const w=new CollisionWorld(data.boxes,data.bounds,data.radius);assert.equal(w.blocked(-36,-31.2),true);assert.equal(w.blocked(-34,28.9),true);});
