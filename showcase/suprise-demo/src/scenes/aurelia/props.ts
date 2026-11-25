import * as T from 'three';
import { GeometryBatch,vec } from '../../shared/geometry';
import type { Materials } from './materials';
export function lantern(b:GeometryBatch,m:Materials,x:number,y:number,z:number,s=1){
  b.cylinder(.16*s,.38*s,.36*s,x,y+.66*s,z,m.bronze,6);b.cylinder(.35*s,.2*s,.12*s,x,y-.44*s,z,m.bronze,6);
  b.cylinder(.19*s,.27*s,.85*s,x,y+.02*s,z,m.lamp,6);
  for(let i=0;i<6;i++){const a=i*Math.PI/3;b.beam(vec(x+Math.cos(a)*.23*s,y-.4*s,z+Math.sin(a)*.23*s),vec(x+Math.cos(a)*.34*s,y+.5*s,z+Math.sin(a)*.34*s),.035*s,.035*s,m.bronze);}
  b.torus(.15*s,.026*s,x,y+.98*s,z,m.bronze,new T.Euler(),16);b.cylinder(.016,.016,1.3*s,x,y+1.65*s,z,m.bronze,6);
}
export function armillary(b:GeometryBatch,m:Materials,x:number,y:number,z:number,s=1){
  b.cylinder(.47*s,.7*s,.17*s,x,y+.09*s,z,m.gold,32);b.cylinder(.13*s,.32*s,.7*s,x,y+.5*s,z,m.gold,24);
  for(const rot of[new T.Euler(.3,0,.25),new T.Euler(Math.PI/2,.5,0),new T.Euler(0,.5,1.2)])b.torus(.86*s,.035*s,x,y+1.4*s,z,m.gold,rot,64);
  b.sphere(.22*s,x,y+1.4*s,z,m.azure);
  for(let i=0;i<24;i++){const a=i*Math.PI/12;b.beam(vec(x+Math.cos(a)*.83*s,y+1.4*s,z+Math.sin(a)*.83*s),vec(x+Math.cos(a)*.94*s,y+1.4*s,z+Math.sin(a)*.94*s),.018*s,.018*s,m.gold);}
}
export function table(b:GeometryBatch,m:Materials,x:number,y:number,z:number){
  b.cylinder(1.25,1.3,.17,x,y+1.15,z,m.wood,48);
  for(const sx of[-1,1])for(const sz of[-1,1]){b.cylinder(.09,.13,1.1,x+sx*.72,y+.55,z+sz*.72,m.wood,12);b.sphere(.12,x+sx*.72,y+.15,z+sz*.72,m.gold);}
  const cloth=new T.PlaneGeometry(2.35,2.6,18,24),p=cloth.attributes.position;
  for(let i=0;i<p.count;i++){const xx=p.getX(i),zz=p.getY(i),drop=Math.max(0,Math.abs(zz)-.9)*1.3;p.setXYZ(i,xx,y+1.25-drop+Math.sin(xx*11)*.015,zz);}cloth.computeVertexNormals();b.add(cloth,m.cloth,x,0,z);
  for(let i=0;i<3;i++){const yy=y+1.35+i*.15;b.box(.73,.12,.52,x+.35,yy,z+.48,m.paper,0,new T.Euler(0,i*.13,0));b.box(.78,.035,.56,x+.35,yy+.075,z+.48,i===1?m.wood:m.velvet,0,new T.Euler(0,i*.13,0));}
  armillary(b,m,x-.32,y+1.32,z-.2,.75);lantern(b,m,x+.76,y+1.65,z-.38,.26);
  b.cylinder(.14,.14,.24,x+.8,y+1.4,z+.4,m.gold,24);b.torus(.10,.025,x+.97,y+1.44,z+.4,m.gold,new T.Euler(0,Math.PI/2,0),16);
  b.at(x+1.65,z+.6,-.28,()=>{for(const sx of[-1,1])for(const sz of[-1,1])b.cylinder(.04,.06,.65,sx*.35,y+.33,sz*.3,m.wood,8);b.box(.85,.14,.75,0,y+.7,0,m.velvet,.06);b.box(.8,1,.13,0,y+1.22,.37,m.wood,.08);b.box(.65,.75,.07,0,y+1.25,.28,m.velvet,.08);for(const sx of[-1,1])b.cylinder(.045,.045,.85,sx*.4,y+1.2,.4,m.gold,8);});
}
export function bannerMesh(m:Materials,w:number,h:number){
  const g=new T.PlaneGeometry(w,h,16,30),p=g.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),f=(h/2-y)/h;p.setY(i,y-Math.pow(Math.max(0,1-Math.abs(x)/(w/2)),1)*.5*f*f);p.setZ(i,Math.sin(x*5+f*2)*.05*f);}g.computeVertexNormals();
  const material=m.cloth.clone();const time={value:0};material.onBeforeCompile=shader=>{shader.uniforms.clothTime=time;shader.vertexShader='uniform float clothTime;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>\n float freedom=1.-uv.y;transformed.z+=sin(position.x*3.+clothTime*1.3+freedom*3.)*.095*freedom;`);};
  const mesh=new T.Mesh(g,material);mesh.castShadow=true;mesh.receiveShadow=true;return {mesh,update:(t:number)=>time.value=t};
}
