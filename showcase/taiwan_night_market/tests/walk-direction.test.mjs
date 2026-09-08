import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {AnimationMixer,Vector3} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
test('exported walk cycles bend knees forward while keeping forward-walking foot contact',async()=>{
 const catalog=JSON.parse(fs.readFileSync(new URL('../public/data/crowd-catalog.json',import.meta.url)));
 for(const spec of catalog){
  const bytes=fs.readFileSync(new URL('../'+spec.glb,import.meta.url));const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');const mixer=new AnimationMixer(gltf.scene);
  for(const clip of gltf.animations.filter(a=>a.name.startsWith('Walk'))){
   const action=mixer.clipAction(clip).play();const stance=[];
   for(let i=0;i<24;i++){
    mixer.setTime(clip.duration*i/24);gltf.scene.updateMatrixWorld(true);
    for(const side of ['1','-1']){
     const get=name=>gltf.scene.getObjectByName((name+'.'+side).replace('.','')).getWorldPosition(new Vector3());
     const hip=get('thigh'),knee=get('shin'),ankle=get('foot');
     const t=(knee.y-hip.y)/(ankle.y-hip.y),lineZ=hip.z+(ankle.z-hip.z)*t;
     assert.ok(knee.z>lineZ+.001,`${spec.id}/${clip.name}: knee bent behind hip-ankle line`);
     assert.ok(ankle.y>.12&&ankle.y<.26,`${spec.id}/${clip.name}: invalid foot height`);
     if(side==='1'&&i<12)stance.push(ankle.z);
    }
   }
   // Model faces +Z; planted foot travels toward -Z relative to the advancing body.
   assert.ok(stance.at(-1)<stance[0]-.12,`${spec.id}/${clip.name}: gait reversed`);action.stop();
  }
 }
});
