import * as T from 'three';
import { GeometryBatch,vec } from '../../shared/geometry';
import type { Materials } from './materials';

export function house(b:GeometryBatch,m:Materials,x:number,y:number,z:number,w:number,d:number,floors:number,variant:number,detail:boolean){
  const h=floors*3.15,wall=m.walls[variant%m.walls.length],roof=m.roofs[variant%m.roofs.length];
  b.at(x,z,0,()=>{
    b.box(w,8,d,0,-4,0,m.concrete);b.box(w,h,d,0,h/2,0,wall);
    b.box(w+.25,.19,d+.25,0,.18,0,m.concrete);
    for(let f=1;f<floors;f++)b.box(w+.12,.12,d+.12,0,f*3.15,0,m.concrete);
    if(variant%4!==0){
      const rh=1.55,rw=w/2+.48,rz=d/2+.48;
      for(const side of[-1,1]){
        const positions=[0,h+rh,-rz,side*rw,h,-rz,0,h+rh,rz,side*rw,h,rz];
        const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute([0,0,rw/3,0,0,d/3,rw/3,d/3],2));g.setIndex(side===1?[0,2,1,1,2,3]:[0,1,2,1,3,2]);g.computeVertexNormals();b.add(g,roof);
        b.box(.12,.16,d+1,side*rw,h,0,m.white);
        if(detail)for(let zz=-rz;zz<=rz;zz+=.42)b.beam(vec(0,h+rh+.03,zz),vec(side*rw,h+.03,zz),.04,.06,roof);
      }
      b.cylinder(.12,.12,d+1,0,h+rh,0,roof,8,new T.Euler(Math.PI/2,0,0));
      // Solid gable ends close the roof volume.
      for(const side of[-1,1]){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([-w/2,h,side*d/2,w/2,h,side*d/2,0,h+rh-.1,side*d/2],3));g.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,.5,1],2));g.setIndex(side===1?[0,1,2]:[0,2,1]);g.computeVertexNormals();b.add(g,wall);}
    }else{
      b.box(w+.4,.2,d+.4,0,h+.1,0,m.concrete);
      for(const s of[-1,1]){b.box(w+.4,.65,.18,0,h+.5,s*d/2,m.concrete);b.box(.18,.65,d,s*w/2,h+.5,0,m.concrete);}
      b.cylinder(.62,.62,1.4,w*.22,h+.9,0,m.metal,12);b.torus(.62,.035,w*.22,h+1.58,0,m.metal);
      b.box(1.8,.14,2.2,-w*.2,h+.32,0,m.glass,0,new T.Euler(-.25,0,0));
    }
    // Four furnished facades, metal frames, sills, curtains and occasional shutters.
    for(let side=0;side<4;side++){const width=side%2?w:d,depth=side%2?d:w;
      b.at(0,0,(side+1)*Math.PI/2,()=>{
        const n=Math.max(1,Math.floor(width/2.9));
        for(let f=0;f<floors;f++)for(let j=0;j<n;j++){
          const wx=(j-(n-1)/2)*width/n,wy=f*3.15+1.8,face=depth/2+.018;
          if(f===0&&j===0){b.box(1.05,2.25,.07,wx,1.13,face,m.wood);b.box(.7,1.25,.04,wx,1.55,face+.06,m.glass);b.sphere(.038,wx+.36,1.05,face+.1,m.metal);continue;}
          b.box(1.65,1.7,.13,wx,wy,face,m.white);b.plane(1.46,1.5,wx,wy,face+.12,m.window);
          b.box(.055,1.5,.075,wx,wy,face+.13,m.metal);b.box(1.5,.05,.075,wx,wy-.15,face+.13,m.metal);b.box(1.9,.11,.37,wx,wy-.88,face+.08,m.concrete);
          if(detail){if((j+variant)%3===0){b.box(.38,1.75,.09,wx-1.06,wy,face,roof);b.box(.38,1.75,.09,wx+1.06,wy,face,roof);}}
        }
        if(detail){
          const acx=width*.3; b.box(.82,.6,.34,acx,.8,depth/2+.2,m.white);b.cylinder(.22,.22,.035,acx,.8,depth/2+.39,m.dark,16,new T.Euler(Math.PI/2,0,0));
          for(let k=0;k<5;k++)b.box(.72,.025,.02,acx,.56+k*.11,depth/2+.4,m.metal);
          b.tube([vec(acx+.4,.65,depth/2+.15),vec(acx+.6,.4,depth/2+.15),vec(acx+.6,.1,depth/2+.15)],.035,m.white,6);
          b.cylinder(.045,.045,h,width/2-.22,h/2,depth/2+.14,m.metal,6);
        }
      });
    }
    if(detail&&floors>1){
      const by=3.2;b.box(w*.78,.18,1.3,0,by,d/2+.55,m.concrete);
      for(let xx=-w*.38;xx<w*.4;xx+=.28)b.cylinder(.018,.018,1,xx,by+.56,d/2+1.12,m.metal,5);
      b.box(w*.8,.07,.08,0,by+1.04,d/2+1.12,m.metal);
      for(const xx of[-w*.38,w*.38])b.box(.06,1,1.2,xx,by+.55,d/2+.55,m.metal);
    }
    if(detail&&variant%3===0){
      const aw=new T.PlaneGeometry(w*.8,1.55,1,8);aw.rotateX(-Math.PI/2);b.add(aw,roof,0,2.7,d/2+.64,new T.Euler(.14,0,0));
      for(const sx of[-1,1])b.cylinder(.025,.025,2.6,sx*w*.37,1.3,d/2+1.35,m.metal,6);
    }
    if(detail){b.cylinder(.025,.025,2.4,w*.3,h+1.7,d*.25,m.metal,6);for(let j=0;j<4;j++)b.box(.8,.025,.025,w*.3,h+1.6+j*.25,d*.25,m.metal);}
  },y);
}
export function car(b:GeometryBatch,m:Materials,x:number,y:number,z:number,angle:number,index:number){
  b.at(x,z,angle,()=>{const paint=m.carPaint[index%m.carPaint.length];b.box(1.72,.52,3.8,0,.67,0,paint,.18);b.box(1.5,.62,1.95,0,1.18,-.15,paint,.18);
    b.box(1.36,.43,1.98,0,1.24,-.15,m.glass,.08);b.box(1.5,.11,1.4,0,1.52,-.2,paint,.06);
    for(const side of[-1,1]){b.box(.06,.55,.1,side*.72,1.2,-.15,paint);b.box(.2,.16,.27,side*.89,1.13,-.78,paint,.04);for(const zz of[-1.15,1.18]){b.cylinder(.32,.32,.21,side*.8,.38,zz,m.rubber,16,new T.Euler(0,0,Math.PI/2));b.cylinder(.18,.18,.22,side*.82,.38,zz,m.metal,12,new T.Euler(0,0,Math.PI/2));}for(const zz of[-1.9,1.9])b.box(.4,.16,.035,side*.53,.72,zz,zz<0?m.lamp:m.roofs[0]);}
    b.box(.65,.18,.04,0,.58,-1.92,m.white);b.box(1.5,.09,.09,0,.4,-1.92,m.metal);
  },y);
}
