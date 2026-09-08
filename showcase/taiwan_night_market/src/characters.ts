import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {MarketPeople} from './npc-behavior.mjs';
const strides:Record<string,number>={Walk:.17,WalkRelaxed:.145,WalkBrisk:.22,WalkChild:.16,WalkElder:.11};
type Visual={root:THREE.Group,mixer:THREE.AnimationMixer,actions:Map<string,THREE.AnimationAction>,clip:string,pending:number};
export class CharacterSystem {
 behavior:MarketPeople;
 visuals:Visual[]=[];
 private accumulator=0;
 private shadows!:THREE.InstancedMesh;
 private shadowMatrix=new THREE.Matrix4();
 private shadowRotation=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2);
 constructor(data:any,layout:any,catalog:any[],staff:any){this.behavior=new MarketPeople(data,layout,Math.random,{catalog,staff,visitorCount:102});}
 async load(scene:THREE.Scene,base:string){
  const ids=[...new Set(this.behavior.people.map(p=>p.assetId))],loader=new GLTFLoader();
  const assets=new Map(await Promise.all(ids.map(async id=>[id,await loader.loadAsync(`${base}models/crowd/${id}.glb`)] as const)));
  // Geometry, eight animation clips and one vertex-color material are shared by each design.
  const material=new THREE.MeshLambertMaterial({color:0xffffff,vertexColors:true,flatShading:true});
  material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('vec3 outgoingLight =', 'totalEmissiveRadiance += diffuseColor.rgb * 0.18;\n\tvec3 outgoingLight =');};
  material.customProgramCacheKey=()=> 'crowd-ambient-v2';
  for(const gltf of assets.values())gltf.scene.traverse(o=>{if((o as THREE.Mesh).isMesh){const m=o as THREE.Mesh;m.material=material;m.geometry.computeBoundingSphere();m.geometry.boundingSphere!.radius+=.7;}});
  this.shadows=new THREE.InstancedMesh(new THREE.CircleGeometry(.34,10),new THREE.MeshBasicMaterial({color:'#101315',transparent:true,opacity:.25,depthWrite:false}),this.behavior.people.length);this.shadows.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.shadows.frustumCulled=false;scene.add(this.shadows);
  this.visuals=this.behavior.people.map((p,i)=>{
   const gltf=assets.get(p.assetId)!,model=clone(gltf.scene),root=new THREE.Group();root.add(model);model.scale.setScalar(p.scale);scene.add(root);
   model.traverse(o=>{if((o as THREE.SkinnedMesh).isSkinnedMesh){const mesh=o as THREE.SkinnedMesh;mesh.computeBoundingSphere();mesh.boundingSphere!.radius+=.7;}});
   const mixer=new THREE.AnimationMixer(model),actions=new Map<string,THREE.AnimationAction>();
   for(const clip of gltf.animations){const action=mixer.clipAction(clip);if(clip.name.startsWith('Walk')){const stride=strides[clip.name];action.timeScale=p.speed/(2*stride/(.62*clip.duration)*p.scale);}actions.set(clip.name,action);}
   for(const name of ['Idle',p.gait,'Wave','Browse'])if(!actions.has(name))throw Error(`${p.assetId} missing ${name}`);
   actions.get('Idle')!.play();mixer.update(Math.random()*2.4);root.position.set(p.x,.015,p.z);root.rotation.y=p.yaw;
   this.updateShadow(i,root.position,p.scale);return {root,mixer,actions,clip:'Idle',pending:0};
  });this.shadows.instanceMatrix.needsUpdate=true;
 }
 private updateShadow(index:number,position:THREE.Vector3,scale:number){this.shadowMatrix.compose(new THREE.Vector3(position.x,.035,position.z),this.shadowRotation,new THREE.Vector3(scale,scale,scale));this.shadows.setMatrixAt(index,this.shadowMatrix);}
 update(dt:number,player:{x:number,z:number}){
  // All 256 actors keep simulating at 20 Hz, regardless of camera distance.
  this.accumulator+=Math.min(dt,.05);while(this.accumulator>=.05){this.behavior.update(.05,player);this.accumulator-=.05;}
  this.visuals.forEach((v,i)=>{
   const p=this.behavior.people[i],d=Math.hypot(p.x-player.x,p.z-player.z);v.root.position.x=THREE.MathUtils.damp(v.root.position.x,p.x,35,dt);v.root.position.z=THREE.MathUtils.damp(v.root.position.z,p.z,35,dt);
   const delta=Math.atan2(Math.sin(p.yaw-v.root.rotation.y),Math.cos(p.yaw-v.root.rotation.y));v.root.rotation.y+=delta*Math.min(1,dt*7);
   if(v.clip!==p.clip){v.actions.get(v.clip)!.fadeOut(.2);const next=v.actions.get(p.clip)!;next.reset().fadeIn(.2).play();if(p.clip.startsWith('Walk'))next.time=(i*.173)%next.getClip().duration;v.clip=p.clip;}
   v.pending+=dt;const interval=d<28?0:d<60?1/15:1/6;if(v.pending>=interval){v.mixer.update(v.pending);v.pending=0;}
   this.updateShadow(i,v.root.position,p.scale);
  });this.shadows.instanceMatrix.needsUpdate=true;
 }
 blocked(x:number,z:number){return this.behavior.blocked(x,z,.24,null,null);}
 get status(){return {...this.behavior.snapshot(),loaded:this.visuals.length,designs:new Set(this.behavior.people.map(p=>p.assetId)).size,animationTimes:this.visuals.map(v=>v.mixer.time)};}
}
