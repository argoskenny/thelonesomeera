import * as T from 'three';
import { GeometryBatch, seededRandom, vec } from '../../shared/geometry';
import type { Obstacle } from '../../shared/types';

function roofSurface(width: number, depth: number, lower: number, rise: number, hip: number) {
  const positions:number[]=[],uv:number[]=[],indices:number[]=[];
  const divisions=Math.max(8,Math.ceil(width/1.4));
  // Each end of the eave sweeps upward, while the drainage field falls more steeply at the ridge.
  function point(f:number,t:number,side:number) {
    const x=f*(width/2-hip*t);
    const bend=Math.pow(Math.max(0,(Math.abs(f)-.73)/.27),2)*Math.min(rise*.17,.30);
    return vec(x,lower+rise*(.64*t+.36*t*t)+bend*(1-.6*t),side*depth*.5*(1-t));
  }
  for(const side of [-1,1]){
    const first=positions.length/3;
    for(let j=0;j<=5;j++)for(let i=0;i<=divisions;i++){
      const f=i/divisions*2-1,p=point(f,j/5,side);positions.push(p.x,p.y,p.z);uv.push(p.x*.72,j/5*depth*.42);
      if(i&&j){const n=first+j*(divisions+1)+i;indices.push(n,n-1,n-divisions-1,n-1,n-divisions-2,n-divisions-1);}
    }
  }
  for(const side of [-1,1]){
    const a=point(side,0,-1),b=point(side,0,1),tip=point(side,1,1);
    const n=positions.length/3;positions.push(...a.toArray(),...b.toArray(),...tip.toArray());uv.push(0,0,depth,0,depth/2,rise);indices.push(n,n+1,n+2);
  }
  const geo=new T.BufferGeometry();
  geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();
  return {geo,point};
}

function tiles() {
  const c=document.createElement('canvas'); c.width=c.height=256;
  const ctx=c.getContext('2d')!,rng=seededRandom(14993);
  ctx.fillStyle='#454749';ctx.fillRect(0,0,256,256);
  for(let j=0;j<8;j++)for(let i=0;i<8;i++){
    const v=82+rng()*12,p=i*32,q=j*32;
    const grad=ctx.createLinearGradient(p,0,p+32,0);
    for(const [offset,factor] of [[0,.55],[.12,.66],[.24,.91],[.51,1.04],[.71,.97],[.77,1.24],[.88,1.02],[.99,.64]]) {
      const b=Math.round(v*factor);grad.addColorStop(offset,'rgb('+b+','+(b+1)+','+(b+4)+')');
    }
    ctx.fillStyle=grad;ctx.fillRect(p,q,32,32);ctx.fillStyle='rgba(18,18,23,.26)';ctx.fillRect(p,q,32,1.5);
  }
  const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;
}

export function addEnclosure(group:T.Group, obstacles:Obstacle[], rock:T.Texture) {
  const batch=new GeometryBatch();
  const stucco=new T.MeshStandardMaterial({color:0xbdbbb0,roughness:.91});
  const beam=new T.MeshStandardMaterial({color:0x4c4036,roughness:.96});
  const board=new T.MeshStandardMaterial({color:0x635544,roughness:.96});
  const iron=new T.MeshStandardMaterial({color:0x242526,roughness:.71,metalness:.23});
  const whitewash=new T.MeshStandardMaterial({color:0xcfccc0,roughness:.96});
  const granite=new T.MeshStandardMaterial({color:0x908c7f,map:rock,roughness:1});
  const tileMap=tiles();
  const ceramic=new T.MeshStandardMaterial({color:0xb0acac,map:tileMap,bumpMap:tileMap,bumpScale:.045,roughness:.8,side:T.DoubleSide});
  const eave=new T.MeshStandardMaterial({color:0x484748,roughness:.83});
  const ridge=new T.MeshStandardMaterial({color:0x5d5958,roughness:.8});
  function roof(w:number,d:number,y:number,rise:number,hip:number,beams:boolean) {
    const {geo,point}=roofSurface(w,d,y,rise,hip);batch.add(geo,ceramic);
    for(const side of [-1,1]){
      for(let i=0;i<16;i++){
        const p=point(i/8-1,0,side),q=point((i+1)/8-1,0,side);batch.beam(p,q,.12,.14,eave);
      }
      const end=point(side,1,1);
      for(const face of [-1,1])batch.beam(point(side,0,face),end,.16,.13,ridge);
      if(beams)for(let x=-w*.46;x<=w*.46;x+=.53){
        const t=x/(w*.5),p=point(t,0,side);
        batch.beam(p.clone().add(vec(0,-.10,side*.05)),p.clone().add(vec(0,.23,-side*.83)),.085,.11,beam);
      }
    }
    batch.box(Math.max(.2,w-2*hip+.2),.18,.22,0,y+rise+.09,0,ridge);
    if(beams)batch.box(Math.max(.2,w-2*hip+.38),.09,.31,0,y+rise+.22,0,eave);
  }
  function wall(x:number,z:number,length:number,angle:number) {
    batch.at(x,z,angle,()=>{
      batch.box(length,1.13,1.05,0,.56,0,granite);
      batch.box(length,1.46,.72,0,1.79,0,stucco);
      batch.box(length,.10,.85,0,2.5,0,beam);
      batch.box(length,.09,.92,0,1.1,0,whitewash);
      roof(length+.14,1.35,2.61,.47,.3,false);
      const sections=Math.round(length/3.9);
      for(let i=0;i<sections;i++){
        const dx=-length/2+(i+.5)*length/sections;
        for(const face of [-1,1]) {
          batch.box(.13,1.40,.075,dx,1.79,face*.389,whitewash);
          batch.box(.23,.28,.04,dx+1,1.95,face*.365,beam);
          batch.box(.17,.20,.043,dx+1,1.95,face*.369,iron);
        }
      }
    });
    obstacles.push({x,z,w:angle?1.05:length,d:angle?length:1.05,h:3.15});
  }
  wall(-55,2.5,101,Math.PI/2);
  wall(-24,-48,62,0);
  wall(37,-48,34,0);
  // The gate has an open passage. Its two timber leaves are folded against the inner jambs.
  batch.at(13.5,-48,0,()=>{
    for(const x of [-5.35,5.35]){
      batch.box(2.5,3.68,2.65,x,1.84,0,stucco);
      batch.box(2.7,.45,2.8,x,.225,0,granite);
      for(const z of [-1.53,1.53]){
        batch.box(.41,3.73,.41,x*.78,1.865,z,beam);
        batch.box(.52,.13,.52,x*.78,.19,z,iron);
      }
      batch.box(.14,3.03,2.56,x*.74,1.62,0,board);
      for(const z of [-1.1,-.73,-.37,0,.37,.73,1.1])batch.box(.17,2.91,.026,x*.74,1.63,z,beam);
      for(const y of [.51,1.7,2.81])batch.box(.18,.095,2.63,x*.74,y,0,iron);
      obstacles.push({x:13.5+x,z:-48,w:3.0,d:3.5,h:4});
    }
    for(const z of [-1.5,1.5])batch.box(13.2,.43,.42,0,3.68,z,beam);
    batch.box(13.2,.41,3.25,0,3.87,0,board);
    batch.box(12.8,1.48,3.35,0,4.72,0,whitewash);
    for(const face of [-1,1])for(let j=-2;j<=2;j++){
      const x=j*2.34;
      batch.box(.87,.69,.09,x,4.71,face*1.69,beam);
      batch.box(.72,.54,.10,x,4.71,face*1.70,iron);
      for(let i=-2;i<=2;i++)batch.box(.045,.55,.115,x+i*.13,4.71,face*1.70,board);
    }
    roof(15.3,5.63,5.49,1.53,1.75,true);
  });
  obstacles.push({x:13.5,z:-48,w:13.2,d:3.3,minY:3.48,h:7.1});
  // The northeast lookout breaks the long enclosure's silhouette.
  batch.at(52,-48,0,()=>{
    batch.box(7.5,2.1,6.7,0,1.05,0,granite);
    batch.box(6.85,2.76,5.98,0,3.39,0,whitewash);
    for(const side of [-1,1])for(const x of [-2.25,0,2.25]) {
      batch.box(.55,.72,.09,x,3.62,side*3,iron);
      for(const offset of [-.14,0,.14])batch.box(.051,.72,.105,x+offset,3.62,side*3.02,beam);
    }
    roof(8.2,7.39,4.82,1.46,1.55,true);
    batch.box(4.57,1.46,3.95,0,6.29,0,stucco);
    for(const face of [-1,1])for(const x of [-1.35,0,1.35])batch.box(.44,.59,.09,x,6.27,face*2,beam);
    roof(5.86,5.28,7.03,1.61,1.75,true);
  });
  obstacles.push({x:52,z:-48,w:7.5,d:6.7,h:8.8});
  batch.flush(group);
}
