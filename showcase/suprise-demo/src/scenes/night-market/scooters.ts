import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { assetUrl } from '../../shared/assets';
import { buildings,toWorld } from './district';

const palette=[['black','#191e23'],['white','#eeeae3'],['blue','#2864ba'],['red','#b91f32'],['pink','#e9afc5']] as const;

/** Merge the 413 source parts by material, then instance them across the district.
 * Both LODs retain the source's rubber, metal, lenses, saddle and separate paint edges.
 */
export async function loadScooters(){
  const loader=new GLTFLoader();
  const assets=await Promise.all(['near','far'].map(level=>loader.loadAsync(assetUrl('night-market',`scooter/${level}.glb`))));
  return assets.map(({scene})=>{
    scene.updateMatrixWorld(true);
    const bounds=new THREE.Box3().setFromObject(scene),center=bounds.getCenter(new THREE.Vector3());
    const normalize=new THREE.Matrix4().makeRotationY(Math.PI);
    normalize.multiply(new THREE.Matrix4().makeTranslation(-center.x,-bounds.min.y,-center.z));
    const parts=new Map<THREE.MeshStandardMaterial,THREE.BufferGeometry[]>();
    scene.traverse(object=>{
      if(!(object instanceof THREE.Mesh))return;
      if(Array.isArray(object.material))throw new Error('Unexpected scooter multi-material mesh');
      const geometry=object.geometry.clone().applyMatrix4(object.matrixWorld).applyMatrix4(normalize);
      const flat=geometry.index?geometry.toNonIndexed():geometry;
      if(flat!==geometry)geometry.dispose();
      // The supplied model uses portable PBR factors, with no texture coordinates needed.
      for(const name of Object.keys(flat.attributes))if(name!=='position'&&name!=='normal')flat.deleteAttribute(name);
      const list=parts.get(object.material)??[];list.push(flat);parts.set(object.material,list);
    });
    const result=[...parts].map(([source,geometries])=>{
      const geometry=mergeGeometries(geometries);geometries.forEach(g=>g.dispose());
      const material=source.clone(),paint=/^0[12] • Rose/.test(source.name),inner=source.name.startsWith('02');
      if(paint)material.color.setScalar(inner?.67:1);
      geometry.computeBoundingSphere();
      return {geometry,material,paint};
    });
    scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();if(!Array.isArray(o.material))o.material.dispose();}});
    return result;
  });
}

export function createScooters(scene:THREE.Scene,assets:Awaited<ReturnType<typeof loadScooters>>,mobile:boolean){
  const counts:Record<string,number>=Object.fromEntries(palette.map(([name])=>[name,0]));
  const parked=buildings.map(s=>{
    const index=Math.floor(Math.random()*palette.length),[name,hex]=palette[index];counts[name]++;
    const p=toWorld(s,s.width*.37,2.12);
    const matrix=new THREE.Matrix4().compose(new THREE.Vector3(p.x,.075,p.z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),s.angle+(s.id%2?.28:-.25)),new THREE.Vector3(1,1,1));
    return {matrix,color:new THREE.Color(hex),x:p.x,z:p.z};
  });
  const levels=assets.map((parts,level)=>parts.map(({geometry,material,paint})=>{
    const mesh=new THREE.InstancedMesh(geometry,material,parked.length);
    mesh.name=`Scooter ${level===0?'near':'far'} · ${material.name}`;
    mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(mesh);
    return {mesh,paint};
  }));
  const update=(camera:THREE.Vector3)=>{
    const near=mobile?12:20,far=camera.y>18?220:mobile?48:63;
    const visible=[[],[]] as (typeof parked)[];
    for(const scooter of parked){const d=Math.hypot(camera.x-scooter.x,camera.y-1,camera.z-scooter.z);if(d<far)visible[d<near?0:1].push(scooter);}
    levels.forEach((parts,level)=>parts.forEach(({mesh,paint})=>{
      mesh.count=visible[level].length;
      visible[level].forEach((s,i)=>{mesh.setMatrixAt(i,s.matrix);if(paint)mesh.setColorAt(i,s.color);});
      mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
    }));
  };
  return {update,materials:assets.flatMap(parts=>parts.map(p=>p.material)),counts};
}
