import * as THREE from 'three';
import { GeometryBatch,vec,seededRandom } from '../../shared/geometry';
import type { Obstacle, WalkSurface } from '../../shared/types';
import type { CityMaterials } from './materials';
import { balcony,airConditioner,awning,cageLamp,plant,roomInterior } from './props';

export type Tower={x:number;z:number;width:number;depth:number;floors:number;angle:number;seed:number;hero?:boolean;distant?:boolean};
export function tower(t:Tower,m:CityMaterials,parent:THREE.Object3D,obstacles:Obstacle[],surfaces:WalkSurface[]){
  const b=new GeometryBatch(true),detail=new GeometryBatch(true),rand=seededRandom(t.seed),base=6.4,fh=3.2,height=t.floors*fh;
  const world=(x:number,y:number,z:number)=>vec(x,y,z).applyAxisAngle(vec(0,1,0),t.angle).add(vec(t.x,0,t.z));
  function solid(x:number,y:number,z:number,w:number,h:number,d:number){const p=world(x,y,z),swap=Math.abs(Math.sin(t.angle))>.5;obstacles.push({x:p.x,z:p.z,w:swap?d:w,d:swap?w:d,minY:y-h/2,h:y+h/2});}
  const wall=m.walls[t.seed%8],bays=Math.round(t.width/3.5),bw=t.width/bays;
  b.at(t.x,t.z,t.angle,()=>{
    // Thick side walls and a recessed building core leave real depth behind the facade openings.
    b.box(t.width,height,t.depth-4.7,0,base+height/2,-(t.depth+4.7)/2,wall);
    solid(0,base+height/2,-(t.depth+4.7)/2,t.width,height,t.depth-4.7);
    for(const sign of[-1,1]){b.box(.28,height,4.7,sign*(t.width/2-.14),base+height/2,-2.35,wall);solid(sign*(t.width/2-.14),base+height/2,-2.35,.28,height,4.7);}
    b.box(t.width+.8,5.6,t.depth+.7,0,3.5,-t.depth/2,m.concrete);
    solid(0,3.5,-t.depth/2,t.width+.8,5.6,t.depth+.7);
    for(let f=0;f<t.floors;f++){
      const y=base+f*fh;
      b.box(t.width+.11,.14,4.6,0,y-.07,-2.22,m.concrete);
      if(t.hero&&f===13){solid(0,y-.07,-2.22,t.width,.14,4.6);const p=world(0,y,-2.22);surfaces.push({x:p.x,z:p.z,w:4.6,d:t.width,y});}
      for(let j=0;j<bays;j++){
        const x=-t.width/2+bw*(j+.5),index=f*bays+j,windowW=1.12+(j%3)*.13,windowH=1.72+(index%3)*.1;
        const heroDoor=t.hero&&f===13&&j===Math.floor(bays/2);
        const projection=(!t.hero && (j+t.seed)%3===0 && f>2 && f<t.floors-2)?[.28,.78,1.12][Math.floor(f/4)%3]:0;
        const localWall=m.walls[(t.seed+j+(f%7===0?2:0))%8];
        const aperture=heroDoor?1.46:windowW,openingBottom=heroDoor?0:.63,openingH=heroDoor?2.75:windowH;
        const pier=(bw-aperture)/2;
        for(const sign of[-1,1])b.box(pier,fh,.26,x+sign*(aperture+ pier)/2,y+fh/2,-.12+projection,localWall);
        if(openingBottom)b.box(aperture,openingBottom,.26,x,y+openingBottom/2,-.12+projection,localWall);
        const lintel=fh-openingBottom-openingH;
        b.box(aperture,lintel,.26,x,y+fh-lintel/2,-.12+projection,localWall);
        if(projection>0){for(const side of[-1,1])b.box(.10,fh,projection,x+side*(bw/2-.05),y+fh/2,projection/2-.1,localWall);b.box(bw+.1,.13,projection+.25,x,y-.04,projection/2,m.concrete);}
        if(t.hero&&f===13){for(const sign of[-1,1]){const pw=(bw-aperture)/2;b.box(pw,1.05,.02,x+sign*(aperture+pw)/2,y+.525,.027,m.teal);}}
        if(heroDoor){
          roomInterior(b,m);
          for(const sx of[-2.4,2.4])solid(sx,49.55,-2.2,.12,3.08,4.6);
          solid(0,49.55,-4.42,4.8,3.08,.13);solid(0,51.13,-2.2,4.8,.14,4.6);
          for(const sign of[-1,1])solid(x+sign*(aperture+pier)/2,y+fh/2,-.12,pier,fh,.26);
          solid(x,y+fh-lintel/2,-.12,aperture,lintel,.26);
          continue;
        }
        // Solid collision lives at the facade, behind projecting frames and sills.
        solid(x,y+fh/2,-.13+projection,bw,fh,.28);
        const wy=y+.63+windowH/2,lit=rand()<.29;
        b.box(windowW,.065,.37,x,y+.61,.025+projection,m.concrete);
        b.box(windowW,windowH,.045,x,wy,-.21+projection,lit?m.litWindows[Math.floor(rand()*5)]:m.glass);
        for(const sign of[-1,1])b.box(.047,windowH+.09,.10,x+sign*windowW/2,wy,-.08+projection,m.wood);
        for(const yy of[wy-windowH/2,wy+windowH/2,wy+.09])b.box(windowW,.042,.10,x,yy,-.055+projection,m.wood);
        b.box(.038,windowH,.08,x+(j%2?.1:-.1),wy,-.055+projection,m.wood);
        if(lit){
          // Recessed curtain strips break the uniform window glow; no silhouettes or people.
          b.box(windowW*.23,windowH,.033,x-windowW*.36,wy,-.16+projection,m.linen);
          if(index%4===0)b.box(windowW*.17,windowH*.62,.04,x+windowW*.38,wy+.3,-.15+projection,m.cloth[t.seed%5]);
        }
        if(!t.distant&&!(t.hero&&f===13)){
          if((f+j+t.seed)%4===0)balcony(detail,m,x,y,.08+projection,bw-.12,index+t.seed,Math.abs(y-49)<15);
          if((f*3+j+t.seed)%3===0)airConditioner(detail,m,x+windowW*.59,y+.25,.36+projection,index);
          if((index+t.seed)%11===0)awning(detail,m,x,y+2.83,.03+projection,bw-.2,.81,index);
          if((index+t.seed)%17===0)plant(detail,m,x,y+.67,.31+projection,index+1);
        }else if(index%5===0)b.box(.8,.52,.44,x+1,y+.38,.24+projection,m.paintedMetal[(index+t.seed)%4]);
      }
      // Exposed floor edges, irregular repairs and narrow expansion seams.
      if(f%3===0)b.box(t.width+.08,.09,.09,0,y+.02,.075,m.concrete);
    }
    for(let j=0;j<=bays;j++){
      const x=-t.width/2+j*bw;
      if(j%2===0){
        b.cylinder(.055,.055,height-.5,x,base+height/2,.16,m.rust,8);
        for(let f=1;f<t.floors;f+=3)b.torus(.07,.017,x,base+f*fh,.16,m.iron);
      }else if(!t.distant){
        detail.tube([vec(x,base+1,.18),vec(x+.11,base+height*.4,.21),vec(x-.12,base+height*.8,.15),vec(x,base+height-.3,.22)],.022,m.black,25);
      }
    }
    // Side elevations remain fully modeled when flying around or viewing from above.
    for(const side of[-1,1])for(let f=0;f<t.floors;f++)for(let k=0;k<Math.floor(t.depth/3.5);k++){
      const sy=base+f*fh+1.55,sz=-2-k*3.5,sx=side*(t.width/2+.015);
      b.box(.04,1.65,1.15,sx,sy,sz,(f+k+t.seed)%6===0?m.litWindows[(k+f)%5]:m.glass);
      for(const dy of[-.86,.86])b.box(.10,.055,1.25,sx,sy+dy,sz,m.aluminum);
      b.box(.07,1.7,.045,sx,sy,sz,m.aluminum);
      if((f+k)%8===0)b.box(.5,.5,.8,sx+side*.24,sy-.94,sz,m.paintedMetal[k%4]);
    }
    // The rear elevations are modeled too, so the city remains complete during free flight.
    for(let f=0;f<t.floors;f++)for(let j=0;j<bays;j++){
      const x=-t.width/2+bw*(j+.5),y=base+f*fh+1.58,z=-t.depth-.025;
      b.box(1.2,1.75,.04,x,y,z,(f+j+t.seed)%5===0?m.litWindows[(f+j)%5]:m.glass);
      for(const dx of[-.63,0,.63])b.box(.043,1.84,.08,x+dx,y,z-.035,m.aluminum);
      for(const dy of[-.91,.91])b.box(1.3,.05,.08,x,y+dy,z-.035,m.aluminum);
      if((f+j+t.seed)%7===0)b.box(.8,.5,.46,x+.7,y-.97,z-.23,m.paintedMetal[j%4]);
    }
    // Roof extensions, water tanks and aerials create a broken, inhabited skyline.
    const roof=base+height;b.box(t.width+.45,.22,t.depth+.3,0,roof,-t.depth/2,m.concrete);
    for(const sign of[-1,1])b.box(.19,.63,t.depth,sign*t.width/2,roof+.32,-t.depth/2,m.walls[(t.seed+1)%8]);
    b.box(t.width,.63,.19,0,roof+.32,-t.depth,m.walls[(t.seed+1)%8]);
    const shackW=t.width*.5,shackH=2.7+(t.seed%3)*.3;
    b.box(shackW,shackH,4.5,-t.width*.12,roof+shackH/2,-4.1,m.paintedMetal[t.seed%4]);
    awning(b,m,-t.width*.12,roof+shackH+.07,-6.5,shackW+.5,5,t.seed);
    b.box(1.1,1.4,.045,-t.width*.12,roof+1.45,-1.81,m.litWindows[t.seed%5]);
    b.cylinder(.91,.91,1.55,t.width*.29,roof+1.1,-t.depth*.64,m.aluminum,20);
    for(const dy of[.46,1.10,1.76])b.torus(.92,.025,t.width*.29,roof+dy,-t.depth*.64,m.rust);
    b.cylinder(.04,.04,5,-t.width*.33,roof+2.5,-t.depth+.9,m.iron,8);
    for(const yy of[3.2,4.1,4.7])b.box(1.8,.029,.029,-t.width*.33,roof+yy,-t.depth+.9,m.aluminum);
    if(t.hero){
      cageLamp(b,m,1.02,50.04,.12);cageLamp(b,m,-3.9,50.24,.12);
      for(const xx of[1.88,2.05,2.27]){
        b.cylinder(.05,.05,15,xx,49.5,.20,m.rust,10);
        b.tube([vec(xx,56.6,.2),vec(xx+.2,57,.35),vec(xx+1.5,57,.35)],.05,m.rust,12);
      }
      b.box(.32,.49,.14,2.35,49.48,.22,m.iron,.015);
      b.box(.17,.16,.035,2.35,49.58,.31,m.glass);b.cylinder(.033,.033,.016,2.35,49.37,.31,m.black,10,new THREE.Euler(Math.PI/2,0,0));
      airConditioner(b,m,2.75,52.12,.45,1);
      for(let i=0;i<5;i++)b.tube([vec(5,51.7+i*.04,.18),vec(1,51.1+i*.08,.55),vec(-3,51.5+i*.045,.28),vec(-7,51.2+i*.06,.28)],.016,m.black,24);
      plant(b,m,-2.65,48.05,.8,240);
    }
  });
  // Detail was authored in local coordinates while the main batch held the transform.
  const root=new THREE.Group();root.name=`tower-${t.seed}`;b.flush(root);parent.add(root);
  const props=new THREE.Group();props.position.set(t.x,0,t.z);props.rotation.y=t.angle;detail.flush(props);parent.add(props);
  return {root,props,center:vec(t.x,49,t.z),floors:t.floors,windows:t.floors*bays};
}
