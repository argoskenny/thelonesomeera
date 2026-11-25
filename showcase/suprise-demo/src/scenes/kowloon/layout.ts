import type { WalkSurface,Obstacle } from '../../shared/types';
export const LEVELS=[14,28,42,56,70];
export const BRIDGES=[{y:28,z:-18,covered:true},{y:42,z:-44,covered:false},{y:56,z:-26,covered:true},{y:14,z:-62,covered:false},{y:70,z:-83,covered:true}];
export const STAIRS=[{x:-12,z0:0,z1:-24,y0:28,y1:42,w:2.8},{x:14,z0:-50,z1:-74,y0:42,y1:56,w:2.8},{x:-10,z0:24,z1:48,y0:28,y1:14,w:3}];
export function stairHeight(s:typeof STAIRS[number],z:number){const t=Math.max(0,Math.min(1,(z-s.z0)/(s.z1-s.z0)));return s.y0+(s.y1-s.y0)*t;}
// Use the same stairwell openings for the visible slab and the walking floor.
export function gallerySlabs(y:number,side:number){
 const x=side===-1?-12:14,z=y===14&&side===-1?-29:-44,d=y===14&&side===-1?164:134;
 const stair=STAIRS.find(s=>s.y1===y&&s.y1>s.y0&&s.x===x);
 if(!stair)return[{x,z,w:4,d,y}];
 const lo=Math.min(stair.z0,stair.z1)+.1,hi=Math.max(stair.z0,stair.z1)+.1,edge=(4-stair.w)/2;
 return[
  {x,z:(z-d/2+lo)/2,w:4,d:lo-(z-d/2),y},
  {x,z:(hi+z+d/2)/2,w:4,d:z+d/2-hi,y},
  {x:x-2+edge/2,z:(lo+hi)/2,w:edge,d:hi-lo,y},
  {x:x+2-edge/2,z:(lo+hi)/2,w:edge,d:hi-lo,y},
 ];
}
export function makeSurfaces():WalkSurface[]{return[
 {x:-18,z:8.5,w:16,d:7,y:28},{x:-16.5,z:17.5,w:19,d:13,y:28},
 ...LEVELS.flatMap(y=>[-1,1].flatMap(side=>gallerySlabs(y,side))),
 ...BRIDGES.map(({y,z})=>({x:1,y,z,w:30,d:3.8})),
 ...STAIRS.map(s=>({x:s.x,z:(s.z0+s.z1)/2,w:s.w,d:Math.abs(s.z1-s.z0)+.3,y:s.y0,heightAt:(_x:number,z:number)=>stairHeight(s,z)})),
 {x:-10,z:50,w:8,d:6,y:14},{x:1,z:-44,w:24,d:142,y:0},
 {x:13,z:3,w:10,d:10,y:42}
 ];}
export function openSpans(start:number,end:number,holes:[number,number][]){let spans:[number,number][]=[[start,end]];for(const [lo,hi]of holes){spans=spans.flatMap(([a,b])=>hi<=a||lo>=b?[[a,b]]:([[a,Math.max(a,lo)],[Math.min(b,hi),b]] as [number,number][]).filter(([c,d])=>d>c));}return spans;}
export const shopObstacles:Obstacle[]=[
 {x:-26.1,z:8.5,w:.2,d:7,minY:28,h:34},{x:-9.9,z:8.5,w:.2,d:7,minY:28,h:34},{x:-18,z:5,w:16,d:.25,minY:28,h:34},
 {x:-18,z:8.5,w:16,d:7,minY:31.7,h:31.9},{x:-22.8,z:6.9,w:5.7,d:1.1,minY:28,h:29.1},
 ];
