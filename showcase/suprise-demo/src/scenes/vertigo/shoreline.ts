import * as THREE from 'three';
export type ShoreRock={x:number;z:number;outline:THREE.Vector2[]};
export type ImpactSite={x:number;z:number;nx:number;nz:number};
const SEA_LEVEL=.05;

/** Intersect the actual deformed rock mesh with mean sea level, not its bounding box. */
export function rockShoreline(g:THREE.BufferGeometry,x:number,y:number,z:number):ShoreRock{
  const p=g.attributes.position,index=g.index,points:THREE.Vector2[]=[];
  const count=index?index.count:p.count;
  for(let i=0;i<count;i+=3){
    for(let edge=0;edge<3;edge++){
      const a=index?index.getX(i+edge):i+edge,b=index?index.getX(i+(edge+1)%3):i+(edge+1)%3;
      const ay=p.getY(a)+y-SEA_LEVEL,by=p.getY(b)+y-SEA_LEVEL;
      if((ay<0)===(by<0))continue;
      const f=ay/(ay-by);points.push(new THREE.Vector2(x+THREE.MathUtils.lerp(p.getX(a),p.getX(b),f),z+THREE.MathUtils.lerp(p.getZ(a),p.getZ(b),f)));
    }
  }
  points.sort((a,b)=>Math.atan2(a.y-z,a.x-x)-Math.atan2(b.y-z,b.x-x));
  return {x,z,outline:points.filter((p,i)=>i===0||p.distanceToSquared(points[i-1])>.0001)};
}

/** Union all rock footprints, then compute the distance to exposed shoreline. */
export function createShoreline(rocks:ShoreRock[]){
  const width=512,height=640,min=new THREE.Vector2(-105,-190),size=new THREE.Vector2(210,270),sx=size.x/width,sz=size.y/height;
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d')!;ctx.fillStyle='white';
  for(const rock of rocks){
    if(rock.outline.length<3)continue;ctx.beginPath();
    rock.outline.forEach((p,i)=>{const u=(p.x-min.x)/sx,v=(p.y-min.y)/sz;if(i===0)ctx.moveTo(u,v);else ctx.lineTo(u,v);});ctx.closePath();ctx.fill();
  }
  const mask=ctx.getImageData(0,0,width,height).data,distance=new Float32Array(width*height),diagonal=Math.hypot(sx,sz);
  for(let i=0;i<distance.length;i++)distance[i]=mask[i*4+3]>100?0:1000;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const i=y*width+x;let d=distance[i];if(x)d=Math.min(d,distance[i-1]+sx);if(y)d=Math.min(d,distance[i-width]+sz);if(x&&y)d=Math.min(d,distance[i-width-1]+diagonal);if(y&&x<width-1)d=Math.min(d,distance[i-width+1]+diagonal);distance[i]=d;
  }
  for(let y=height-1;y>=0;y--)for(let x=width-1;x>=0;x--){
    const i=y*width+x;let d=distance[i];if(x<width-1)d=Math.min(d,distance[i+1]+sx);if(y<height-1)d=Math.min(d,distance[i+width]+sz);if(x<width-1&&y<height-1)d=Math.min(d,distance[i+width+1]+diagonal);if(x&&y<height-1)d=Math.min(d,distance[i+width-1]+diagonal);distance[i]=d;
  }
  const pixels=new Uint8Array(width*height*4);
  for(let i=0;i<distance.length;i++){pixels[i*4]=Math.round(Math.min(distance[i]/20,1)*255);pixels[i*4+1]=mask[i*4+3]>100?255:0;pixels[i*4+3]=255;}
  const texture=new THREE.DataTexture(pixels,width,height);texture.minFilter=texture.magFilter=THREE.LinearFilter;texture.generateMipmaps=false;texture.needsUpdate=true;
  const read=(x:number,z:number)=>distance[THREE.MathUtils.clamp(z,0,height-1)*width+THREE.MathUtils.clamp(x,0,width-1)];
  const sites:ImpactSite[]=[];
  // Only exposed edges facing the navigable channel emit impacts; covered overlaps do not.
  for(let z=-145;z<61;z+=3.8){
    const row=Math.round((z-min.y)/sz),middle=Math.round(-min.x/sx);
    for(const side of[-1,1])for(let step=1;step<86;step++){
      const col=middle+side*step;if(mask[(row*width+col)*4+3]<100)continue;
      const outside=col-side,nx=read(outside+2,row)-read(outside-2,row),nz=read(outside,row+2)-read(outside,row-2),len=Math.hypot(nx,nz)||1;
      sites.push({x:min.x+(outside+.5)*sx,z:min.y+(row+.5)*sz,nx:nx/len,nz:nz/len});break;
    }
  }
  return {texture,min,size,sites};
}
export type Shoreline=ReturnType<typeof createShoreline>;
