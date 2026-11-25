import * as T from 'three';
import { GeometryBatch,vec } from '../../shared/geometry';
import { railing,awning,laundry } from '../vertigo/props';
import type { Materials } from './materials';
import type { Obstacle } from '../../shared/types';
import { LEVELS,BRIDGES,STAIRS,stairHeight,openSpans,gallerySlabs } from './layout';
export function circulation(b:GeometryBatch,m:Materials,obstacles:Obstacle[]){
 const rail=(a:T.Vector3,c:T.Vector3)=>{railing(b,m,a,c,1.05);const x=(a.x+c.x)/2,z=(a.z+c.z)/2,y=Math.min(a.y,c.y);if(Math.abs(a.y-c.y)<.1)obstacles.push({x,z,w:Math.abs(a.x-c.x)+.06,d:Math.abs(a.z-c.z)+.06,minY:y,h:y+1.1});};
 for(const y of LEVELS)for(const side of[-1,1]){const x=side===-1?-12:14,z=y===14&&side===-1?-29:-44,d=y===14&&side===-1?164:134;
 for(const slab of gallerySlabs(y,side)){b.box(slab.w,.25,slab.d,slab.x,y-.125,slab.z,m.concrete);b.box(slab.w,.025,slab.d,slab.x,y+.01,slab.z,m.floor);}
 const holes=BRIDGES.filter(v=>v.y===y).map(v=>[v.z-2.1,v.z+2.1] as [number,number]);if(side===-1&&y===28)holes.push([10.8,24.1]);
 for(const [a,c]of openSpans(z-d/2,z+d/2,holes))rail(vec(x-side*2,y,a),vec(x-side*2,y,c));
 for(let zz=z-d/2;zz<z+d/2;zz+=5){if(STAIRS.some(s=>s.x===x&&s.y1===y&&zz>Math.min(s.z0,s.z1)&&zz<Math.max(s.z0,s.z1)))continue;b.beam(vec(x+side*2,y-2.5,zz),vec(x-side*1.85,y-.25,zz),.13,.18,m.rust);b.box(4.1,.18,.2,x,y-.23,zz,m.iron);}
 }
 for(const v of BRIDGES){const y=v.y,z=v.z;b.box(30,.35,3.8,1,y-.175,z,m.concrete);b.box(30,.035,3.8,1,y+.015,z,m.floor);
 for(const zz of[z-1.9,z+1.9]){rail(vec(-14,y,zz),vec(16,y,zz));b.box(30,.18,.18,1,y-.7,zz,m.iron);b.box(30,.12,.12,1,y-1.8,zz,m.rust);for(let x=-14;x<16;x+=3){b.beam(vec(x,y-.7,zz),vec(x+3,y-1.8,zz),.08,.09,m.rust);b.beam(vec(x,y-1.8,zz),vec(x+3,y-.7,zz),.08,.09,m.rust);}}
 if(v.covered){for(let x=-13;x<16;x+=3){for(const zz of[z-1.75,z+1.75]){b.box(.08,3.1,.08,x,y+1.55,zz,m.wood);b.box(2.9,.6,.08,x+1.5,y+.3,zz,m.paintedMetal[Math.round(x+16)%4]);b.box(2.9,.12,.09,x+1.5,y+2.95,zz,m.wood);b.plane(2.8,2.2,x+1.5,y+1.65,zz,m.windowGlass);b.box(.04,2.2,.06,x+1.5,y+1.65,zz,m.wood);}}
 awning(b,m,1,y+3.3,z-2.2,31,4.5,2);for(let x=-10;x<15;x+=7)b.box(1,.025,.07,x,y+2.95,z,m.bulb);
 }else if(y===42){laundry(b,m,-5,y+2,z+1.9,3);laundry(b,m,5,y+2,z+1.9,1);}
 }
 for(const s of STAIRS){const count=Math.round(Math.abs(s.y1-s.y0)/.25),depth=Math.abs(s.z1-s.z0)/count;
 for(let i=0;i<count;i++){const z=s.z0+(s.z1-s.z0)*(i+.5)/count,y=stairHeight(s,z);b.box(s.w,.09,depth+.02,s.x,y-.045,z,m.iron);b.box(s.w-.12,.02,.035,s.x,y+.01,z-depth*.45,m.aluminum);}
 for(const x of[s.x-s.w/2,s.x+s.w/2]){const a=vec(x,s.y0,s.z0),c=vec(x,s.y1,s.z1);railing(b,m,a,c,1.05);b.beam(a.clone().add(vec(0,-.18,0)),c.clone().add(vec(0,-.18,0)),.13,.16,m.rust);}}
 b.box(8,.24,6,-10,13.88,50,m.concrete);rail(vec(-6,14,47),vec(-6,14,53));rail(vec(-14,14,53),vec(-6,14,53));
 // An inhabited courtyard at the ice-room landing.
 b.box(10,.22,10,13,41.89,3,m.concrete);b.box(10,.025,10,13,42.01,3,m.floor);rail(vec(8,42,-2),vec(8,42,8));
 for(const z of[-2,8])rail(vec(8,42,z),vec(11.7,42,z));
}
