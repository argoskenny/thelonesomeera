import * as T from 'three';
import { GeometryBatch,vec,seededRandom } from '../../shared/geometry';
import { airConditioner,balcony,awning,laundry,plant } from '../vertigo/props';
import type { Materials } from './materials';
import type { Obstacle } from '../../shared/types';
export type Building={x:number;z:number;w:number;d:number;floors:number;angle:number;seed:number;hero?:boolean;far?:boolean};
export function atlasPlane(b:GeometryBatch,m:Materials,x:number,y:number,z:number,w:number,h:number,index:number,lit=true,angle=0){const g=new T.PlaneGeometry(w,h),uv=g.attributes.uv,col=index%4,row=Math.floor(index/4)%4;for(let i=0;i<uv.count;i++)uv.setXY(i,(col+.012+uv.getX(i)*.976)/4,(row+.012+uv.getY(i)*.976)/4);b.add(g,lit?m.windowMat:m.darkRoom,x,y,z,new T.Euler(0,angle,0));}
export function building(t:Building,m:Materials,parent:T.Object3D,obstacles:Obstacle[]){
 const root=new T.Group(),b=new GeometryBatch(true),detail=new GeometryBatch(true),rand=seededRandom(t.seed),fh=3.5,h=t.floors*fh,bays=Math.round(t.w/3),bw=t.w/bays,depth=t.hero?7.3:1.3;
 root.position.set(t.x,0,t.z);root.rotation.y=t.angle;parent.add(root);
 const world=(x:number,z:number)=>vec(x,0,z).applyAxisAngle(vec(0,1,0),t.angle).add(vec(t.x,0,t.z));
 const solid=(x:number,z:number,w:number,d:number,minY:number,top:number)=>{const p=world(x,z),swap=Math.abs(Math.sin(t.angle))>.5;obstacles.push({x:p.x,z:p.z,w:swap?d:w,d:swap?w:d,minY,h:top});};
 b.box(t.w,h,t.d-depth,0,h/2,-(t.d+depth)/2,m.walls[t.seed%8]);solid(0,-(t.d+depth)/2,t.w,t.d-depth,0,h);
 for(const side of[-1,1]){b.box(.25,h,depth,side*(t.w/2-.125),h/2,-depth/2,m.walls[t.seed%8]);solid(side*(t.w/2-.125),-depth/2,.25,depth,0,h);}
 for(let f=0;f<t.floors;f++){const y=f*fh,shop=t.hero&&(f===8||f===9);
 if(!(t.hero&&f===9))b.box(t.w+.16,.16,depth+.06,0,y-.08,-depth/2,m.concrete);
 if(shop)continue;
 for(let j=0;j<bays;j++){const x=-t.w/2+(j+.5)*bw,index=f*bays+j+t.seed,ww=1.22+(j%3)*.18,wh=1.85+(index%3)*.1,sill=.68,mat=m.walls[(t.seed+j+Math.floor(f/5))%8],projection=t.far?0:((j+t.seed)%4===0?(.12+Math.floor(f/4)%3*.26):0),pier=(bw-ww)/2;
 for(const side of[-1,1])b.box(pier,fh,.27,x+side*(ww+pier)/2,y+fh/2,projection,mat);
 b.box(ww,sill,.27,x,y+sill/2,projection,mat);b.box(ww,fh-sill-wh,.27,x,y+sill+wh+(fh-sill-wh)/2,projection,mat);
 if(projection>0)for(const side of[-1,1])b.box(.14,fh,projection+.6,x+side*(ww/2+.07),y+fh/2,projection/2-.3,mat);
 const wy=y+sill+wh/2,lit=rand()>.3;atlasPlane(b,m,x,wy,projection-.62,ww+.05,wh+.05,index,lit);
 for(const side of[-1,1])b.box(.07,wh+.1,.63,x+side*ww/2,wy,projection-.23,m.wood);
 for(const yy of[wy-wh/2,wy+wh/2,wy+.1])b.box(ww+.14,.06,.16,x,yy,projection+.01,m.wood);
 b.box(.045,wh,.1,x+(j%2?.12:-.12),wy,projection+.01,m.aluminum);b.box(ww+.28,.08,.42,x,y+sill-.04,projection+.06,m.concrete);
 if(!t.far){b.plane(ww,wh,x,wy,projection-.05,m.windowGlass);if(index%3!==0){for(let dx=-ww/2;dx<=ww/2;dx+=.24)detail.box(.022,wh+.2,.022,x+dx,wy,projection+.25,m.iron);for(const dy of[-wh*.46,wh*.05,wh*.46])detail.box(ww+.14,.028,.028,x,wy+dy,projection+.25,m.iron);}
 if(index%5===0)balcony(detail,m,x,y,projection+.15,bw-.15,index,Math.abs(y-29)<25);
 if(index%3===0)airConditioner(detail,m,x+ww*.63,y+.32,projection+.28,index);
 if(index%11===1)awning(detail,m,x,y+3.12,projection+.12,bw+.1,.85,index);
 if(index%13===4)laundry(detail,m,x,y+2.2,projection+.65,index);
 if(index%23===5)plant(detail,m,x,y+.75,projection+.3,index);
 }else if(index%5===0)b.box(.8,.5,.43,x+.7,y+.25,projection+.23,m.paintedMetal[index%4]);
 solid(x,projection,bw,.3,y,y+fh);
 }
 if(f%2===0)b.box(t.w+.2,.1,.18,0,y+.02,.16,m.concrete);
 }
 for(let j=0;j<=bays;j++){const x=-t.w/2+j*bw+.15;if(j%2===0){b.cylinder(.065,.065,h,x,h/2,.27,m.rust,8);for(let y=2;y<h;y+=4){b.torus(.075,.015,x,y,.27,m.iron);b.box(.12,.05,.15,x,y,.15,m.iron);}}else if(!t.far)detail.tube([vec(x,1,.2),vec(x-.15,h*.3,.27),vec(x+.12,h*.6,.25),vec(x,h,.18)],.027,m.black,28);}
 // Complete secondary elevations remain visible during free flight.
 for(const side of[-1,1])for(let f=0;f<t.floors;f++)for(let k=0;k<Math.floor(t.d/3.5);k++){const z=-2-k*3.5,x=side*(t.w/2+.03),y=f*fh+1.6;atlasPlane(b,m,x,y,z,1.25,1.8,f+k+t.seed,(f+k)%3!==0,side*Math.PI/2);b.box(.08,1.86,.035,x,y,z,m.aluminum);for(const dy of[-.93,.93])b.box(.1,.05,1.35,x,y+dy,z,m.wood);if((f+k)%7===0)b.box(.48,.55,.8,x+side*.25,y-1.05,z,m.paintedMetal[k%4]);}
 for(let f=0;f<t.floors;f++)for(let j=0;j<bays;j++){const x=-t.w/2+(j+.5)*bw,y=f*fh+1.6;atlasPlane(b,m,x,y,-t.d-.03,1.3,1.8,f+j+t.seed,(f+j)%4===0,Math.PI);b.box(.05,1.86,.1,x,y,-t.d-.06,m.wood);}
 b.box(t.w+.45,.25,t.d+.4,0,h+.12,-t.d/2,m.concrete);
 for(const z of[.1,-t.d-.1]){b.box(t.w+.4,.7,.2,0,h+.6,z,m.walls[t.seed%8]);b.box(t.w+.48,.08,.3,0,h+.99,z,m.concrete);}
 for(const side of[-1,1])b.box(.2,.7,t.d,side*(t.w/2+.1),h+.6,-t.d/2,m.walls[t.seed%8]);
 b.box(t.w*.48,2.7,4,-t.w*.15,h+1.6,-4,m.paintedMetal[t.seed%4]);awning(b,m,-t.w*.15,h+3,-6,t.w*.5+1,4.8,t.seed);
 b.box(.85,1.9,.07,-t.w*.15,h+1.2,-1.96,m.wood);b.sphere(.04,-t.w*.15+.3,h+1.15,-1.9,m.aluminum);
 for(let i=0;i<3;i++){const x=-t.w*.34+i*1.3;airConditioner(b,m,x,h+.3,-t.d+2.3,t.seed+i);b.tube([vec(x,h+.45,-t.d+2),vec(x,h+.42,-8),vec(t.w*.25,h+.42,-8)],.035,m.rust,12);}
 if(!t.far){laundry(b,m,0,h+2,-t.d*.62,t.seed);for(const x of[-3,3])b.box(.035,2.3,.035,x,h+1.4,-t.d*.62,m.iron);}
 b.cylinder(.85,.85,1.6,t.w*.3,h+1.1,-t.d*.65,m.aluminum,20);for(const yy of[h+.4,h+1.1,h+1.8])b.torus(.86,.035,t.w*.3,yy,-t.d*.65,m.iron);
 b.cylinder(.025,.04,5,-t.w*.35,h+2.6,-t.d+1,m.iron,8);for(let i=0;i<4;i++)b.box(1.7-i*.25,.025,.025,-t.w*.35,h+3+i*.4,-t.d+1,m.aluminum);
 b.flush(root);const props=new T.Group();detail.flush(props);root.add(props);return{root,props,windows:bays*t.floors,center:vec(t.x,40,t.z)};
}
