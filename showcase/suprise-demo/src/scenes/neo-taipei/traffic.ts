import * as T from 'three';
import { GeometryBatch,vec } from '../../shared/geometry';
import type { Materials } from './materials';
export function createTraffic(scene:T.Scene,m:Materials,mobile:boolean){
 const model=new T.Group(),b=new GeometryBatch();b.box(1.7,.45,4.4,0,0,0,m.steel,.19);b.box(1.3,.55,1.8,0,.4,-.3,m.iron,.2);b.box(1.2,.35,1.5,0,.56,-.4,m.glass,.12);b.box(2.8,.12,1.5,0,-.1,1,m.iron,.1);
 for(const x of[-.8,.8]){b.box(.38,.22,.17,x,.08,-2.2,m.amber,.04);b.box(.35,.24,.18,x,0,2.22,m.cyan,.05);b.cylinder(.16,.24,.55,x,-.1,1.8,m.iron,12,new T.Euler(Math.PI/2,0,0));b.cylinder(.035,.15,1.5,x,-.1,2.9,m.cyan,10,new T.Euler(Math.PI/2,0,0));}b.flush(model);
 const root=new T.Group();scene.add(root);const count=mobile?17:30,meshes=model.children.map(o=>{const s=o as T.Mesh,inst=new T.InstancedMesh(s.geometry,s.material,count);inst.instanceMatrix.setUsage(T.DynamicDrawUsage);root.add(inst);return inst;});const dummy=new T.Object3D();
 return{root,update(t:number){for(let i=0;i<count;i++){const a=i/count*Math.PI*2+t*(i%3===0?-.035:.025),lane=i%3;if(lane===0){dummy.position.set(10+126*Math.cos(a),48.1,-70+70*Math.sin(a));dummy.rotation.set(0,Math.atan2(126*Math.sin(a),-70*Math.cos(a)),Math.cos(a)*.025);}else{dummy.position.set(25+(110+lane*35)*Math.cos(a),60+lane*30+Math.sin(a*2+i)*7,-155+(80+lane*25)*Math.sin(a));dummy.rotation.set(0,Math.atan2((110+lane*35)*Math.sin(a),-(80+lane*25)*Math.cos(a)),.06*Math.cos(a));}dummy.scale.setScalar(i%7===0?1.4:1);dummy.updateMatrix();for(const mesh of meshes)mesh.setMatrixAt(i,dummy.matrix);}for(const mesh of meshes)mesh.instanceMatrix.needsUpdate=true;}};
}
