import * as THREE from 'three';

const fract=(v:number)=>v-Math.floor(v);
const hash=(x:number,y:number)=>fract(Math.sin(x*127.1+y*311.7)*43758.5453123);
export function noise(x:number,y:number):number {
  const i=Math.floor(x),j=Math.floor(y),fx=fract(x),fy=fract(y);
  const u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);
  return THREE.MathUtils.lerp(THREE.MathUtils.lerp(hash(i,j),hash(i+1,j),u),THREE.MathUtils.lerp(hash(i,j+1),hash(i+1,j+1),u),v);
}
export function smoothstep(a:number,b:number,v:number){const t=THREE.MathUtils.clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);}
export function makeTexture(size:number, pixel:(x:number,y:number)=>number[]) {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
  const ctx=canvas.getContext('2d')!;const data=ctx.createImageData(size,size);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const c=pixel(x,y),i=(y*size+x)*4;data.data[i]=c[0];data.data[i+1]=c[1];data.data[i+2]=c[2];data.data[i+3]=255;
  }
  ctx.putImageData(data,0,0);const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;
}
export function metricUV(geometry:THREE.BufferGeometry,scale=3){
  const p=geometry.attributes.position,n=geometry.attributes.normal,uv=geometry.attributes.uv;
  for(let i=0;i<p.count;i++){
    const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i)),nz=Math.abs(n.getZ(i));
    if(ny>=nx&&ny>=nz) uv.setXY(i,p.getX(i)/scale,p.getZ(i)/scale);
    else if(nx>=nz) uv.setXY(i,p.getZ(i)/scale,p.getY(i)/scale);
    else uv.setXY(i,p.getX(i)/scale,p.getY(i)/scale);
  }
  return geometry;
}
