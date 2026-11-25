import { Vector3,CatmullRomCurve3 } from 'three';
import type { WalkSurface } from '../../shared/types';
export const TERRACE={x:-36,z:74,w:32,d:34,y:60};
export const STAIR={x:-24,w:5,z0:23,z1:57,y0:40,y1:60,steps:68};
export function stairHeight(z:number){return 40+Math.max(0,Math.min(1,(z-23)/34))*20;}
export const ringPoints=Array.from({length:241},(_,i)=>{const t=i/240*Math.PI*2;return new Vector3(10+126*Math.cos(t),47,-70+70*Math.sin(t));});
export const linkPoints=new CatmullRomCurve3([new Vector3(19,40,20),new Vector3(60,44,-20),new Vector3(110,48,-60),new Vector3(160,50,-110)]).getPoints(140);
export function pathHeight(points:Vector3[],width:number,x:number,z:number){let best=Infinity,y:number|undefined;
 for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],dx=b.x-a.x,dz=b.z-a.z,l=dx*dx+dz*dz,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/l)),d=(x-a.x-dx*t)**2+(z-a.z-dz*t)**2;if(d<best){best=d;y=a.y+(b.y-a.y)*t;}}
 return best<=(width/2)**2?y:undefined;
}
export function pathSurface(points:Vector3[],width:number):WalkSurface{const xs=points.map(p=>p.x),zs=points.map(p=>p.z),minX=Math.min(...xs)-width,maxX=Math.max(...xs)+width,minZ=Math.min(...zs)-width,maxZ=Math.max(...zs)+width;return{x:(minX+maxX)/2,z:(minZ+maxZ)/2,w:maxX-minX,d:maxZ-minZ,y:points[0].y,heightAt:(x,z)=>pathHeight(points,width-.4,x,z)};}
export const walkSurfaces:WalkSurface[]=[TERRACE,{x:STAIR.x,z:40,w:5,d:34.5,y:60,heightAt:(_x,z)=>stairHeight(z)},{x:-4,z:20,w:48,d:12,y:40},pathSurface(ringPoints,9),pathSurface(linkPoints,7),{x:165,z:-110,w:42,d:24,y:50},{x:135,z:-300,w:125,d:80,y:130}];

export const citadelTowers=[[135,-307,26,23,163],[103,-288,15,15,91],[167,-290,16,17,111],[103,-325,14,16,123],[169,-329,16,16,140],[130,-273,16,14,75],[194,-310,11,11,77],[80,-307,12,12,83]];
export const citadelObstacles=citadelTowers.map(([x,z,w,d,h])=>({x,z,w,d,minY:130,h:130+h}));
