import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {MarketPeople} from '../src/npc-behavior.mjs';
import {CollisionWorld} from '../src/collision.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../public/data/colliders.json',import.meta.url)));
const layout=JSON.parse(fs.readFileSync(new URL('../public/data/layout.json',import.meta.url)));
function seeded(seed){return ()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);}
test('exported characters contain only their rig and skinned body, with four animated clips',()=>{
 const manifest=JSON.parse(fs.readFileSync(new URL('../assets/characters-v1/manifest.json',import.meta.url)));
 assert.equal(manifest.characters.length,4);
 for(const asset of manifest.characters){const b=fs.readFileSync(new URL('../'+asset.glb,import.meta.url));assert.equal(crypto.createHash('sha256').update(b).digest('hex'),asset.sha256);const g=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)));assert.equal(g.meshes.length,1);assert.equal(g.skins.length,1);assert.equal(g.skins[0].joints.length,16);assert.deepEqual(g.animations.map(a=>a.name).sort(),['Browse','Idle','Walk','Wave']);for(const p of g.meshes[0].primitives){assert.ok(p.attributes.JOINTS_0!==undefined);assert.ok(p.attributes.WEIGHTS_0!==undefined);}for(const clip of g.animations){assert.ok(clip.channels.length>=16);assert.ok(g.accessors[clip.samplers[0].input].max[0]>1);} }
});
test('15 minute seeded strolls avoid geometry, player and one another; vendors stay home',()=>{
 for(const seed of [123,49,891]){const system=new MarketPeople(data,layout,seeded(seed)),world=new CollisionWorld(data.boxes,data.bounds,.24);let player={x:-38,z:-34};
 for(let i=0;i<18000;i++){// The player repeatedly walks across the initial street, through NPC traffic.
 const direction=Math.floor(i/1500)%2? -1:1;player=world.move(player.x,player.z,direction*.06,0,(x,z)=>system.blocked(x,z,.24,null,null));system.update(.05,player);
 for(const [index,p] of system.people.entries()){assert.equal(system.world.blocked(p.x,p.z),false,p.id+' hit geometry');assert.ok(Math.hypot(p.x-player.x,p.z-player.z)>=.659,p.id+' hit player');if(p.role==='vendor')assert.ok(Math.hypot(p.x-p.home.x,p.z-p.home.z)<=.241);for(const other of system.people.slice(index+1))assert.ok(Math.hypot(p.x-other.x,p.z-other.z)>=.839);}}
 assert.ok(system.departures>10);for(const p of system.people.filter(p=>p.role==='visitor'))assert.ok(p.visits>5,p.id+' never browsed');
 }
});
test('player cannot tunnel through an NPC when a frame has large movement',()=>{const world=new CollisionWorld([],[-10,-10,10,10],.24);const result=world.move(-3,0,6,0,(x,z)=>Math.hypot(x,z)<.66);assert.ok(result.x<=-.66);});
