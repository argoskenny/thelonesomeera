import * as THREE from 'three';
import { seededRandom } from '../../shared/geometry';
export function createWeather(scene:THREE.Scene,mobile:boolean){
  const rand=seededRandom(746),count=mobile?500:1300,positions=new Float32Array(count*6),origins=new Float32Array(count*3);
  for(let i=0;i<count;i++){origins[i*3]=-10+rand()*21;origins[i*3+1]=rand()*105;origins[i*3+2]=48-rand()*200;}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  const material=new THREE.LineBasicMaterial({color:0xadbcc2,transparent:true,opacity:0,depthWrite:false});
  const rain=new THREE.LineSegments(geometry,material);rain.frustumCulled=false;scene.add(rain);
  return {material,update(time:number){rain.visible=material.opacity>.002;if(!rain.visible)return;for(let i=0;i<count;i++){const x=origins[i*3],y=(origins[i*3+1]-time*12)%105,z=origins[i*3+2],yy=y<0?y+105:y;positions.set([x,yy,z,x+.075,yy+.65,z-.045],i*6);}geometry.attributes.position.needsUpdate=true;}};
}
