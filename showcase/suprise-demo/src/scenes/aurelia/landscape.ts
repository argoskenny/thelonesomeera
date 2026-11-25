import * as T from 'three';
import { GeometryBatch,seededRandom } from '../../shared/geometry';
import { noise,metricUV } from '../../shared/procedural';
import type { Materials } from './materials';
export type Cliff={x:number;z:number;y:number;rx:number;rz:number;bottom:number};
export const cliffs:Cliff[]=[{x:-42,z:16,y:24,rx:89,rz:88,bottom:-120},{x:92,z:-174,y:116,rx:91,rz:70,bottom:-130},{x:159,z:12,y:24,rx:33,rz:41,bottom:-110},{x:-126,z:-139,y:48,rx:54,rz:48,bottom:-110},{x:210,z:-245,y:91,rx:53,rz:51,bottom:-100},{x:15,z:-117,y:64,rx:43,rz:29,bottom:-110}];
export function buildLandscape(root:T.Object3D,m:Materials){
  const b=new GeometryBatch(),r=seededRandom(561),rock=m.rock.clone();rock.vertexColors=true;rock.color.set(0xffffff);rock.emissive.set(0x68726a);rock.emissiveMap=m.rock.map;rock.emissiveIntensity=.13;rock.roughness=.93;
  function crag(x:number,y:number,z:number,sx:number,sy:number,sz:number,seed:number,ceiling:number){
    const g=new T.IcosahedronGeometry(1,3),p=g.attributes.position,colors=[];
    for(let i=0;i<p.count;i++){const px=p.getX(i),py=p.getY(i),pz=p.getZ(i),n=noise(px*5+seed,pz*5+py*3),k=.82+n*.33+noise(px*14,pz*14+py*3)*.08;
      p.setXYZ(i,px*sx*k,Math.min(py*sy*k,ceiling-y),pz*sz*k);const moss=py>.4?T.MathUtils.smoothstep(noise(px*4+seed,pz*4),.32,.7)*.8:0;
      const c=new T.Color(0xc8c5b5).lerp(new T.Color(0x3e5227),moss);c.multiplyScalar(.67+noise(px*6+seed,py*7+pz*4)*.5);colors.push(c.r,c.g,c.b);
    }g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();b.add(metricUV(g,12),rock,x,y,z);
  }
  for(const [index,c]of cliffs.entries()){
    const g=new T.CylinderGeometry(1,1,1,128,56),p=g.attributes.position,colors=[];
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),z=p.getZ(i),t=p.getY(i)+.5,a=Math.atan2(z,x),radius=Math.hypot(x,z),n=noise(Math.cos(a)*5+index*8,t*12+Math.sin(a)*6);
      const profile=1.35-t*.5+.08*Math.sin(t*8)+.035*Math.sin(t*25),verticalFissures=.13*Math.sin(a*13)+.055*Math.sin(a*31)+.04*Math.sin(a*53),radial=profile+verticalFissures+n*.13;
      const surfaceY=Math.min(c.y-.2,c.bottom+t*(c.y-c.bottom)+(radius>.1?Math.sin(a*11)*2.2:0));
      p.setXYZ(i,x*c.rx*radial,surfaceY,z*c.rz*radial);
      const vegetation=T.MathUtils.smoothstep(t,.85,1.)*.75+Math.max(0,Math.sin(a*13))*noise(a*11,t*8)*.3;
      const color=new T.Color(0xb9b9aa).lerp(new T.Color(0x364823),vegetation);color.multiplyScalar(.85+n*.3);colors.push(color.r,color.g,color.b);
    }g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();b.add(metricUV(g,30),rock,c.x,0,c.z);
    // Fractured, overlapping outcrops create real shadowed depth on every face.
    for(let i=0;i<100;i++){
      const a=r()*Math.PI*2,t=.17+r()*.79,rad=1.45-t*.5+.08*Math.sin(t*8),x=c.x+Math.cos(a)*c.rx*rad,z=c.z+Math.sin(a)*c.rz*rad;
      crag(x,c.bottom+t*(c.y-c.bottom)-4,z,5+r()*9,7+r()*18,5+r()*9,index*100+i,c.y-1);
    }
  }
  b.flush(root);
}
