import * as THREE from 'three';
export type Lamp = {position:THREE.Vector3;color:THREE.Color};

let groundMap:THREE.DataTexture;
// Large road triangles need a light map: vertex-only lighting misses their centres.
function bakeGroundMap(lamps:Lamp[]){
  const size=256, data=new Uint8Array(size*size*4);
  for(let z=0;z<size;z++)for(let x=0;x<size;x++){
    const wx=(x+.5)/size*140-70,wz=(z+.5)/size*126-63;let r=0,g=0,b=0;
    for(const lamp of lamps){const dx=lamp.position.x-wx,dy=lamp.position.y-.12,dz=lamp.position.z-wz,d2=dx*dx+dy*dy+dz*dz;if(d2>=169||dy<=0)continue;
      const d=Math.sqrt(Math.max(.01,d2));const strength=8*(dy/d)*Math.pow(1-Math.pow(d/13,4),2)/(Math.max(Math.pow(d,1.6),.5)*Math.PI);
      r+=lamp.color.r*strength;g+=lamp.color.g*strength;b+=lamp.color.b*strength;
    }
    const i=(z*size+x)*4;data[i]=Math.min(255,Math.round(r/3*255));data[i+1]=Math.min(255,Math.round(g/3*255));data[i+2]=Math.min(255,Math.round(b/3*255));data[i+3]=255;
  }
  const texture=new THREE.DataTexture(data,size,size);texture.minFilter=texture.magFilter=THREE.LinearFilter;texture.needsUpdate=true;return texture;
}

/** Bake every fixed lamp once. No camera position or distance-based activation. */
export async function bakeStaticLighting(root:THREE.Object3D, lamps:Lamp[]){
  const range=13, grid=new Map<string,Lamp[]>(), meshes:THREE.Mesh[]=[];
  for(const lamp of lamps){const p=lamp.position;const key=`${Math.floor(p.x/range)},${Math.floor(p.y/range)},${Math.floor(p.z/range)}`;const list=grid.get(key)||[];list.push(lamp);grid.set(key,list);}
  root.traverse(o=>{if((o as THREE.Mesh).isMesh)meshes.push(o as THREE.Mesh);});
  const point=new THREE.Vector3(), normal=new THREE.Vector3(), normalMatrix=new THREE.Matrix3();
  let vertices=0, energy=0;
  for(let m=0;m<meshes.length;m++){
    const mesh=meshes[m], geometry=mesh.geometry, positions=geometry.getAttribute('position'), normals=geometry.getAttribute('normal');
    const values=new Float32Array(positions.count*3);normalMatrix.getNormalMatrix(mesh.matrixWorld);
    // Candidate lights for the whole mesh, culled once using its bounding box.
    geometry.computeBoundingBox();const box=geometry.boundingBox!.clone().applyMatrix4(mesh.matrixWorld).expandByScalar(range);
    const nearby:Lamp[]=[];
    for(let x=Math.floor(box.min.x/range);x<=Math.floor(box.max.x/range);x++)for(let y=Math.floor(box.min.y/range);y<=Math.floor(box.max.y/range);y++)for(let z=Math.floor(box.min.z/range);z<=Math.floor(box.max.z/range);z++)nearby.push(...(grid.get(`${x},${y},${z}`)||[]));
    for(let i=0;i<positions.count;i++){
      point.fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld);normal.fromBufferAttribute(normals,i).applyNormalMatrix(normalMatrix);
      let r=0,g=0,b=0;
      for(const lamp of nearby){const dx=lamp.position.x-point.x,dy=lamp.position.y-point.y,dz=lamp.position.z-point.z,d2=dx*dx+dy*dy+dz*dz;if(d2>=range*range)continue;
        const distance=Math.sqrt(Math.max(d2,.01));const cosine=Math.max(0,(normal.x*dx+normal.y*dy+normal.z*dz)/distance);
        // Same fixed local intensity as the former light pool, with a smooth spatial falloff.
        const cutoff=Math.pow(1-Math.pow(distance/range,4),2);
        const irradiance=8*cosine*cutoff/(Math.max(Math.pow(distance,1.6),.5)*Math.PI);
        r+=lamp.color.r*irradiance;g+=lamp.color.g*irradiance;b+=lamp.color.b*irradiance;
      }
      const at=i*3;values[at]=Math.min(r,3);values[at+1]=Math.min(g,3);values[at+2]=Math.min(b,3);energy+=values[at]+values[at+1]+values[at+2];
    }
    geometry.setAttribute('staticLight',new THREE.BufferAttribute(values,3));vertices+=positions.count;
    if(m%35===0)await new Promise<void>(resolve=>setTimeout(resolve,0));
  }
  groundMap=bakeGroundMap(lamps);
  return {mode:'static-all-on',lamps:lamps.length,vertices,energy};
}
export function enableStaticLighting(material:THREE.Material){
  material.onBeforeCompile=shader=>{
    shader.uniforms.groundLightMap={value:groundMap};
    shader.vertexShader='attribute vec3 staticLight;\nvarying vec3 vStaticLight;\nvarying vec3 vStaticWorld;\nvarying float vStaticNormalY;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvStaticLight = staticLight;\nvStaticWorld = (modelMatrix * vec4(position, 1.0)).xyz;\nvStaticNormalY = normalize(mat3(modelMatrix) * normal).y;');
    shader.fragmentShader='uniform sampler2D groundLightMap;\nvarying vec3 vStaticLight;\nvarying vec3 vStaticWorld;\nvarying float vStaticNormalY;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>','vec3 fixedLight = vStaticLight;\nif (vStaticWorld.y < 0.45 && vStaticNormalY > 0.7) fixedLight = texture2D(groundLightMap, (vStaticWorld.xz + vec2(70.0, 63.0)) / vec2(140.0, 126.0)).rgb * 3.0;\noutgoingLight += diffuseColor.rgb * fixedLight;\n#include <opaque_fragment>');
  };
  material.customProgramCacheKey=()=> 'market-static-all-on-v1';
}
