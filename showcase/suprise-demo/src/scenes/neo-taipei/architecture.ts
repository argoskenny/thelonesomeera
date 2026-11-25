import * as T from 'three';
import { GeometryBatch,vec,seededRandom } from '../../shared/geometry';
import type { Materials } from './materials';
import { sign } from './signs';
import { citadelTowers } from './layout';
export function tower(b:GeometryBatch,m:Materials,x:number,z:number,w:number,d:number,h:number,seed:number,base=0){
 const rand=seededRandom(seed),levels=1+Math.floor(rand()*3),glow=rand()>.5?m.cyan:m.pink;
 for(let j=0;j<levels;j++){const bh=h/levels,bw=w*(1-j*.15),bd=d*(1-j*.13),y=base+j*bh;
 b.box(bw,bh,bd,x,y+bh/2,z,m.iron);
 if(seed%5===0){for(let yy=y+5;yy<y+bh;yy+=8){b.box(bw+3,.35,bd*.35,x,yy,z+bd*.4,m.iron);b.box(bw+3,.06,.08,x,yy+.3,z+bd*.58,m.cyan);}}
 if(seed%6===0){b.box(1.6,bh,bd+1.5,x+bw*.38,y+bh*.5,z,m.steel);for(let yy=y+4;yy<y+bh;yy+=4)b.box(1.7,.07,bd+1.6,x+bw*.38,yy,z,m.amber);}

 for(const [dx,dz,ry,fw]of[[0,bd/2+.03,0,bw],[0,-bd/2-.03,Math.PI,bw],[bw/2+.03,0,Math.PI/2,bd],[-bw/2-.03,0,-Math.PI/2,bd]]){const g=new T.PlaneGeometry(fw-.6,bh-.8);const uv=g.getAttribute('uv');for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*fw/26+seed*.173,uv.getY(i)*bh/42+j*.23);b.add(g,m.windows[seed%6],x+dx,y+bh/2,z+dz,new T.Euler(0,ry,0));}
 // Facade ribs, service cores and setbacks break the repeating window grid.
 if(seed%3!==0)b.box(bw*.16,bh,bd+.18,x+bw*.2,y+bh/2,z,m.iron);
 for(let yy=y+6;yy<y+bh;yy+=12)b.box(bw+.5,.22,bd+.5,x,yy,z,m.steel);
 for(const dx of[-bw/2,bw/2])for(const dz of[-bd/2,bd/2])b.box(.36,bh,.36,x+dx,y+bh/2,z+dz,m.steel);
 if(j===levels-1||rand()>.5){b.box(bw+.4,.18,.15,x,y+bh-.15,z+bd/2+.12,glow);b.box(.12,bh*.64,.16,x-bw/2+.4,y+bh*.65,z+bd/2+.13,glow);}
 b.box(bw+.9,.65,bd+.9,x,y+bh,z,m.iron);
 }
 for(let i=0;i<3;i++){const xx=x+(rand()-.5)*w*.5,zz=z+(rand()-.5)*d*.5;b.box(w*.15,1.4,d*.19,xx,base+h+1,zz,m.steel);b.cylinder(.55,.55,.18,xx,base+h+1.8,zz,m.iron);}
 if(rand()>.2){const ah=5+rand()*18;b.cylinder(.09,.2,ah,x,base+h+ah/2,z,m.steel,8);b.sphere(.19,x,base+h+ah,z,m.pink);}
 if(seed%4===0){for(let k=0;k<3;k++)b.box(.18,h*.7,.2,x-w*.35+k*w*.35,base+h*.58,z+d/2+.24,glow);}
 if(seed%7===0){b.box(w*1.18,2,d*.35,x,base+h*.69,z+d*.5,m.steel);b.box(w*.95,.13,.14,x,base+h*.69,z+d*.68,glow);}
 if(seed%3===0&&h>65){const titles=['記憶修復','零時診所','夢境交換','晶核科技','電氣街','新台北','ORBITAL'];sign(b,m,x+w/2-1.5,base+h*.58,z+d/2+.5,3.8,24,titles[seed%titles.length],seed%2?'#53dcff':'#ff55d9',true);}
}
export function buildCitadel(b:GeometryBatch,m:Materials){
 const root={x:135,z:-300};b.box(125,4,80,root.x,128,root.z,m.iron);
 for(const [x,z,w,d,h]of citadelTowers){
 tower(b,m,x,z,w,d,h,Math.round(x),130);b.cylinder(.12,w*.32,30,x,130+h+15,z,m.steel,6);for(const side of[-1,1])b.box(.25,h*.84,.35,x+side*w*.38,130+h*.55,z+d/2+.4,m.cyan);b.box(.45,h*.9,.45,x,130+h*.5,z+d/2+.4,m.pink);}
 for(let x=78;x<197;x+=12){b.box(6,8,12,x,134,-263,m.steel);b.box(4,.3,.2,x,138,-256.8,m.cyan);}
}
