import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {MarketPeople} from '../src/npc-behavior.mjs';
import {CollisionWorld} from '../src/collision.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url)));
const data=read('public/data/colliders.json'),layout=read('public/data/layout.json'),catalog=read('public/data/crowd-catalog.json'),staff=read('public/data/staff-placements.json');
const seedRandom=seed=>()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
const create=seed=>new MarketPeople(data,layout,seedRandom(seed),{catalog,staff,visitorCount:102});
test('44 distinct designs, one skinned primitive each, five distinct walk clips',()=>{
 assert.equal(catalog.filter(s=>s.role==='visitor').length,32);assert.equal(catalog.filter(s=>s.role==='vendor').length,12);
 const hashes=new Set();for(const asset of catalog){const b=fs.readFileSync(new URL('../'+asset.glb,import.meta.url));const hash=crypto.createHash('sha256').update(b).digest('hex');assert.equal(hash,asset.sha256);hashes.add(hash);const g=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)));assert.equal(g.meshes.length,1);assert.equal(g.meshes[0].primitives.length,1);assert.equal(g.skins[0].joints.length,16);assert.ok(g.meshes[0].primitives[0].attributes.COLOR_0!==undefined);const walks=g.animations.filter(a=>a.name.startsWith('Walk'));assert.equal(walks.length,5);assert.equal(new Set(walks.map(a=>JSON.stringify(a.samplers))).size,5);assert.equal(g.animations.length,8);assert.ok(asset.triangles<2000);}
 assert.equal(hashes.size,44);
});
test('every stall and commercial/service building has staff; all six areas receive pedestrians',()=>{
 const b=create(51),visitors=b.people.filter(p=>p.role==='visitor');assert.equal(visitors.length,102);assert.equal(b.people.length,256);assert.equal(new Set(b.people.map(p=>p.assetId)).size,44);
 const ids=new Set(b.people.filter(p=>p.role==='vendor').map(p=>p.home.id));for(const s of layout.stalls)assert.ok(ids.has(s.id));for(const shop of read('public/data/buildings.json').filter(b=>!['residential','townhouse','heritage'].includes(b.shop_kind)))assert.ok(ids.has(shop.id));for(let i=0;i<6;i++)assert.equal(visitors.filter(p=>p.spawnZone===i).length,17);
});
test('full crowd: 15 minute simulation preserves collision and staffing while browsing continues',()=>{
 for(const seed of [2,51]){
 const b=create(seed),world=new CollisionWorld(data.boxes,data.bounds,.24);let player={x:-38,z:-34};
 for(let i=0;i<18000;i++){
  player=world.move(player.x,player.z,(Math.floor(i/1200)%2?-1:1)*.06,0,(x,z)=>b.blocked(x,z,.24,null,null));b.update(.05,player);
  if(i%20)continue;
  for(const p of b.people){assert.equal(b.world.blocked(p.x,p.z),false,`static collision ${p.id}`);assert.equal(b.blocked(p.x,p.z,p.radius,p,player),false,`dynamic collision ${p.id}`);if(p.role==='vendor')assert.ok(Math.hypot(p.x-p.home.x,p.z-p.home.z)<=.241);}
 }
 const visitors=b.people.filter(p=>p.role==='visitor');assert.ok(b.departures>300);assert.ok(visitors.every(p=>p.moved>20),'A pedestrian did not explore');assert.ok(visitors.filter(p=>p.visits>2).length>=95,'Too many pedestrians failed to browse');console.log(`seed ${seed}: ${b.visits} stops, ${b.departures} departures, ${visitors.filter(p=>p.visits>2).length}/102 repeat shoppers`);
 }
});
