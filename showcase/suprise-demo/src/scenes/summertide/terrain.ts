import * as T from 'three';
import { GeometryBatch,vec } from '../../shared/geometry';
import { metricUV } from '../../shared/procedural';
import { terrainHeight,shoreX,roadHeight } from './layout';
import type { Materials } from './materials';
import type { Obstacle } from '../../shared/types';

/** Tessellated ribbons share the exact height field used by first-person walking. */
export function ribbon(scene:T.Object3D,z0:number,z1:number,segments:number,left:(z:number)=>number,right:(z:number)=>number,height:(x:number,z:number)=>number,material:T.Material,cross=1,uvScale=4){
  const g=new T.PlaneGeometry(1,1,cross,segments),p=g.attributes.position,uv=g.attributes.uv;
  for(let j=0;j<=segments;j++){const z=z0+(z1-z0)*j/segments,a=left(z),b=right(z);for(let i=0;i<=cross;i++){const k=j*(cross+1)+i,x=a+(b-a)*i/cross;p.setXYZ(k,x,height(x,z),z);uv.setXY(k,x/uvScale,z/uvScale);}}
  // PlaneGeometry winds from upper-left to lower-left; this parameterization faces up.
  g.computeVertexNormals();g.computeBoundingSphere();const mesh=new T.Mesh(g,material);mesh.receiveShadow=true;scene.add(mesh);return mesh;
}
export function buildTerrain(root:T.Object3D,m:Materials){
  const obstacles:Obstacle[]=[],b=new GeometryBatch(true);
  ribbon(root,-850,950,560,z=>shoreX(z)-45,z=>shoreX(z)+20,(x,z)=>-.5+(x-shoreX(z))*.145,m.sand,28,5);
  ribbon(root,-850,950,560,z=>shoreX(z)+20,z=>shoreX(z)+170,(x,z)=>terrainHeight(x,z),m.green,75,12);
  ribbon(root,-850,950,560,z=>shoreX(z)+170,z=>shoreX(z)+900,(x,z)=>terrainHeight(x,z),m.forest,200,38);
  // A gently curved coast road and broad pedestrian promenade.
  ribbon(root,-650,225,340,z=>shoreX(z)+24,z=>shoreX(z)+30,()=>4.08,m.concrete,2,3);
  ribbon(root,-650,225,340,z=>shoreX(z)+30,z=>shoreX(z)+42,()=>4.1,m.asphalt,2,4);
  for(const d of[30.4,41.6])ribbon(root,-650,225,340,z=>shoreX(z)+d-.08,z=>shoreX(z)+d+.08,()=>4.12,m.white);
  for(let z=-640;z<220;z+=8)ribbon(root,z,z+3,2,z=>shoreX(z)+35.9,z=>shoreX(z)+36.1,()=>4.13,m.white);
  // The main descent is 250 metres long; the lower cross street links it to the bay.
  ribbon(root,-35,225,260,()=>-6.4,()=>6.4,(_,z)=>roadHeight(z)+.06,m.concrete,2,3);
  ribbon(root,-35,225,260,()=>-4.6,()=>4.6,(_,z)=>roadHeight(z)+.08,m.asphalt,2,4);
  ribbon(root,-35,225,260,()=>-.14,()=>.14,(_,z)=>roadHeight(z)+.095,m.yellow);
  for(const x of[-4.35,4.35])ribbon(root,-35,225,260,()=>x-.06,()=>x+.06,(_,z)=>roadHeight(z)+.095,m.white);
  ribbon(root,-39,-25,7,z=>shoreX(z)+25,()=>150,()=>4.12,m.asphalt,40,4);
  for(let x=-60;x<140;x+=8)b.box(3,.018,.12,x,4.14,-32,m.white);
  for(const z of[145,44,-19]){
    // Stop bars and crosswalk paint follow the slope.
    ribbon(root,z,z+.4,2,()=>-4.2,()=>4.2,(_,zz)=>roadHeight(zz)+.105,m.white);
    for(let x=-3.9;x<4;x+=1.2)ribbon(root,z-3.3,z-1,3,()=>x,()=>x+.6,(_,zz)=>roadHeight(zz)+.105,m.white);
  }
  for(let z=-15;z<224;z+=3){const y=roadHeight(z);b.box(.55,.55,3.03,-6.15,y+.27,z,m.concrete);
    b.box(.42,1.28,.48,-6.15,y+.64,z,m.concrete);
    const end=vec(-6.15,roadHeight(z+3)+1.03,z+3);b.tube([vec(-6.15,y+1.03,z),end],.052,m.metal,2);
    for(const dz of[.5,1.5,2.5])b.cylinder(.017,.017,.7,-6.15,roadHeight(z+dz)+.61,z+dz,m.metal,5);
    obstacles.push({x:-6.15,z,w:.6,d:3.05,minY:y-.3,h:roadHeight(z+3)+1.4});
    for(const x of[-5.25,5.25]){b.box(.65,.025,1,x,y+.085,z,m.dark);for(let k=0;k<8;k++)b.box(.57,.035,.028,x,y+.105,z-.43+k*.12,m.metal);}
  }
  // Low seawall, broken by ramps to the sand every hundred metres.
  for(let z=-640;z<210;z+=4){if(Math.abs(((z+1000)%100)-50)<7)continue;const x=shoreX(z)+23.6;b.box(.7,2.1,4.25,x,3.05,z,m.concrete);b.box(.95,.15,4.3,x,4.18,z,m.concrete);}
  // Sloped accessible beach ramps; their height function is returned for navigation.
  const ramps=[];
  for(const z of[-150,-50,50]){const a=shoreX(z)+5,c=shoreX(z)+24;
    ribbon(root,z-3,z+3,6,()=>a,()=>c,(x)=>.225+(x-a)/(c-a)*3.855,m.concrete,24,3);
    ramps.push({x:(a+c)/2,z,w:c-a,d:6,y:0,heightAt:(x:number)=>.225+(x-a)/(c-a)*3.855});
  }
  b.flush(root);return {obstacles,ramps};
}
