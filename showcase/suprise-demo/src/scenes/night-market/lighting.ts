import * as THREE from 'three';
export type StreetLight={position:THREE.Vector3;color:THREE.Color;power:number};
/** Static diffuse bounce field. Built once, shared by every detailed PBR surface.
 * The nearby point-light pool adds specular/contact detail without a city-size shader.
 * Radiance is spatially interpolated, and does not replace any albedo/normal/roughness map.
 */
export function bakeStreetBounce(root:THREE.Object3D,sites:StreetLight[]){
  const climate={value:1},cells=new Map<number,THREE.Vector3>(),nearby=new Map<number,StreetLight[]>();
  const field=(x:number,y:number,z:number)=>{
    const key=(x+100)+(z+100)*256+y*65536;
    let result=cells.get(key);if(result)return result;
    result=new THREE.Vector3();
    const gx=Math.floor(x/12),gz=Math.floor(z/12),gkey=gx+32+(gz+32)*64;
    let candidates=nearby.get(gkey);
    if(!candidates){candidates=sites.filter(s=>Math.abs(s.position.x-(gx*12+6))<26&&Math.abs(s.position.z-(gz*12+6))<26);nearby.set(gkey,candidates);}
    for(const site of candidates){
      const dx=x-site.position.x,dy=y-site.position.y,dz=z-site.position.z,ds=dx*dx+dy*dy+dz*dz;
      if(ds>324)continue;
      const fade=1-Math.sqrt(ds)/18,energy=site.power/(ds+3)*fade*fade*.44;
      result.x+=site.color.r*energy;result.y+=site.color.g*energy;result.z+=site.color.b*energy;
    }
    cells.set(key,result);return result;
  };
  const materials=new Set<THREE.MeshStandardMaterial>();
  root.traverse(object=>{
    if(!(object instanceof THREE.Mesh)||!(object.material instanceof THREE.MeshStandardMaterial))return;
    const mat=object.material;if(mat.transparent||mat.emissiveIntensity>.3&&mat.emissive.getHex()!==0)return;
    const geometry=object.geometry,p=geometry.attributes.position,n=geometry.attributes.normal,colors=new Float32Array(p.count*3);
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),y=Math.max(0,p.getY(i)),z=p.getZ(i),ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z),fx=x-ix,fy=y-iy,fz=z-iz;
      let r=0,g=0,bl=0;
      for(let dx=0;dx<=1;dx++)for(let dy=0;dy<=1;dy++)for(let dz=0;dz<=1;dz++){
        const c=field(ix+dx,iy+dy,iz+dz),w=(dx?fx:1-fx)*(dy?fy:1-fy)*(dz?fz:1-fz);r+=c.x*w;g+=c.y*w;bl+=c.z*w;
      }
      const facing=.7+.3*Math.max(0,n.getY(i));colors[i*3]=r*facing;colors[i*3+1]=g*facing;colors[i*3+2]=bl*facing;
    }
    geometry.setAttribute('streetBounce',new THREE.BufferAttribute(colors,3));materials.add(mat);
  });
  materials.forEach(mat=>{
    mat.onBeforeCompile=shader=>{
      shader.uniforms.uDistrictClimate=climate;
      shader.vertexShader='attribute vec3 streetBounce; varying vec3 vStreetBounce;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvStreetBounce = streetBounce;');
      shader.fragmentShader='varying vec3 vStreetBounce; uniform float uDistrictClimate;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * vStreetBounce * uDistrictClimate * (1.0 - metalnessFactor);');
    };
    mat.customProgramCacheKey=()=> 'nightfall-static-bounce-v1';mat.needsUpdate=true;
  });
  return climate;
}
