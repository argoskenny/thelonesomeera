import * as T from 'three';

// The balconies overlap in projection. Bake their short-range occlusion in
// world space so shaded recesses survive camera motion and offscreen occluders.
export class HallOcclusion {
  private readonly cell=.32;
  private readonly origin=[-19,-3.52,-16.32];
  private readonly size=[119,73,109];
  private readonly filled=new Uint8Array(119*73*109);
  private readonly matrix=new T.Matrix4();
  add(x:number,y:number,z:number,w:number,h:number,d:number,q:T.Quaternion){
    const sides=[w,h,d].sort((a,b)=>b-a);
    if(sides[0]<.75 || sides[1]<.19)return;
    const m=this.matrix.makeRotationFromQuaternion(q).elements,s=this.cell;
    const dx=Math.abs(m[0])*w/2+Math.abs(m[4])*h/2+Math.abs(m[8])*d/2;
    const dy=Math.abs(m[1])*w/2+Math.abs(m[5])*h/2+Math.abs(m[9])*d/2;
    const dz=Math.abs(m[2])*w/2+Math.abs(m[6])*h/2+Math.abs(m[10])*d/2;
    const [ox,oy,oz]=this.origin,[nx,ny,nz]=this.size;
    const start=(pos:number,extent:number,origin:number)=>Math.max(0,Math.floor((pos-extent-origin)/s)-1);
    const end=(pos:number,extent:number,origin:number,count:number)=>Math.min(count-1,Math.ceil((pos+extent-origin)/s)+1);
    const x1=start(x,dx,ox),x2=end(x,dx,ox,nx),y1=start(y,dy,oy),y2=end(y,dy,oy,ny),z1=start(z,dz,oz),z2=end(z,dz,oz,nz);
    for(let k=z1;k<=z2;k++)for(let j=y1;j<=y2;j++)for(let i=x1;i<=x2;i++){
      const px=ox+(i+.5)*s-x,py=oy+(j+.5)*s-y,pz=oz+(k+.5)*s-z;
      if(Math.abs(m[0]*px+m[1]*py+m[2]*pz)<=w/2+s*.36 &&
        Math.abs(m[4]*px+m[5]*py+m[6]*pz)<=h/2+s*.36 &&
        Math.abs(m[8]*px+m[9]*py+m[10]*pz)<=d/2+s*.36)this.filled[i+nx*(j+ny*k)]=1;
    }
  }
  bake(){
    const [nx,ny,nz]=this.size,luma=new Uint8Array(this.filled.length);luma.fill(255);
    const radii=[.48,.82,1.34,2.16,3.35],weights=[1,.85,.65,.43,.25];
    const probes=Array.from({length:18},(_,index)=>{
      const y=(index+.5)/18*2-1,a=index*2.39996,r=Math.sqrt(1-y*y);
      return radii.map(length=>{
        const t=length/this.cell;
        return Math.round(Math.cos(a)*r*t)+nx*(Math.round(y*t)+ny*Math.round(Math.sin(a)*r*t));
      });
    });
    for(let z=6;z<nz-6;z++)for(let y=6;y<ny-6;y++)for(let x=6;x<nx-6;x++){
      const id=x+nx*(y+ny*z);let blocked=0;
      for(const offsets of probes){
        for(let i=0;i<offsets.length;i++)if(this.filled[id+offsets[i]]){blocked+=weights[i];break;}
      }
      luma[id]=Math.round(255*(1-blocked/probes.length));
    }
    const texture=new T.Data3DTexture(luma,nx,ny,nz);
    texture.format=T.RedFormat;texture.type=T.UnsignedByteType;texture.minFilter=texture.magFilter=T.LinearFilter;
    texture.unpackAlignment=1;texture.needsUpdate=true;
    return {texture,origin:new T.Vector3(...this.origin as [number,number,number]),extent:new T.Vector3(nx*this.cell,ny*this.cell,nz*this.cell)};
  }
}
