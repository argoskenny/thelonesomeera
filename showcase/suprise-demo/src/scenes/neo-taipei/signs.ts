import * as T from 'three';
import { GeometryBatch } from '../../shared/geometry';
import type { Materials } from './materials';
const cache=new Map<string,T.MeshStandardMaterial>();
export function signTexture(text:string,ink='#5bdcff',vertical=false,sub='NEO TAIPEI · 2089',ramen=false){
 const key=text+ink+vertical+sub;if(cache.has(key))return cache.get(key)!;
 const c=document.createElement('canvas');c.width=vertical?384:1024;c.height=vertical?1536:384;const x=c.getContext('2d')!;
 x.fillStyle='#030910';x.fillRect(0,0,c.width,c.height);x.strokeStyle=ink;x.lineWidth=5;x.strokeRect(14,14,c.width-28,c.height-28);x.textAlign='center';x.textBaseline='middle';x.fillStyle=ink;x.shadowColor=ink;x.shadowBlur=10;
 if(ramen){x.lineWidth=9;x.beginPath();x.ellipse(192,555,112,28,0,0,Math.PI*2);x.moveTo(80,555);x.quadraticCurveTo(102,760,192,760);x.quadraticCurveTo(282,760,304,555);x.stroke();for(let i=0;i<3;i++){x.beginPath();x.moveTo(130+i*60,480);x.bezierCurveTo(90+i*60,430,170+i*60,410,130+i*60,365);x.stroke();}x.font='700 68px sans-serif';x.fillText('深夜拉麵',192,900);x.font='30px monospace';x.fillText('OPEN 24:00',192,1050);}
 else if(vertical){const chars=[...text];x.font='600 190px "Noto Sans TC",sans-serif';chars.forEach((ch,i)=>x.fillText(ch,192,180+i*235));x.font='30px monospace';sub.split(' · ').forEach((line,i)=>x.fillText(line,192,1320+i*52,320));}
 else{x.font=`600 ${Math.min(155,850/[...text].length)}px "Noto Sans TC",sans-serif`;x.fillText(text,512,155,940);x.font='27px monospace';x.fillText(sub,512,305,940);}
 x.shadowBlur=0;x.fillStyle='#10243a2c';for(let y=1;y<c.height;y+=5)x.fillRect(0,y,c.width,1);
 const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
 const mat=new T.MeshStandardMaterial({map,emissiveMap:map,emissive:0xffffff,emissiveIntensity:2.5,roughness:.36,metalness:.2});cache.set(key,mat);return mat;
}
export function sign(b:GeometryBatch,m:Materials,x:number,y:number,z:number,w:number,h:number,text:string,color='#5bdcff',vertical=false,ry=0,sub?:string,ramen=false){b.at(x,z,ry,()=>{b.box(w+.3,h+.3,.4,0,y,0,m.iron,.06);b.plane(w,h,0,y,.22,signTexture(text,color,vertical,sub,ramen));for(const xx of[-w/2,w/2])b.box(.06,h,.07,xx,y,.26,color.includes('ff')?m.pink:m.cyan);});}
