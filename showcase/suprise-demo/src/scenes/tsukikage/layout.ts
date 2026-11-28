import type { NavigationBounds } from '../../shared/navigation';
import type { Obstacle, WalkSurface } from '../../shared/types';
import { eastApron, eastTurn, eastWing, eastWingTip, onStrip, stagePoint, westBridge, type DeckStrip, type FloorPoint } from './stage-plan.ts';

export const bounds: NavigationBounds = { minX: -14.85, maxX: 14.85, minZ: -11.80, maxZ: 13.88, maxY: 14.68 };
export const obstacles: Obstacle[] = [];
type Point = [x:number,y:number,z:number];

function deck(x0:number,x1:number,z0:number,z1:number,y:number):WalkSurface {
  return {x:(x0+x1)/2,z:(z0+z1)/2,w:x1-x0,d:z1-z0,y};
}
function solid(x:number,z:number,w:number,d:number,minY:number,h:number) {
  obstacles.push({x,z,w,d,minY,h});
}

function cutFloor([a,b,c,d]:DeckStrip):WalkSurface {
  const corners=[a,b,d,c];
  const xs=corners.map(p=>p[0]),zs=corners.map(p=>p[1]);
  return {
    ...deck(Math.min(...xs),Math.max(...xs),Math.min(...zs),Math.max(...zs),2.50),
    heightAt(x,z) {
      for(let i=0;i<4;i++) {
        const p=corners[i],q=corners[(i+1)%4],dx=q[0]-p[0],dz=q[1]-p[1];
        if(dx*(z-p[1])-dz*(x-p[0])>.015*Math.hypot(dx,dz))return;
      }
      return 2.5;
    }
  };
}
function guard(a:FloorPoint,b:FloorPoint,width:number,minY:number,maxY:number) {
  const dx=b[0]-a[0],dz=b[1]-a[1],n=Math.ceil(Math.hypot(dx,dz)/.21);
  for(let i=0;i<n;i++) {
    const t=(i+.5)/n;
    solid(a[0]+dx*t,a[1]+dz*t,Math.abs(dx)/n+width,Math.abs(dz)/n+width,minY,maxY);
  }
}

function staircase(low:Point,high:Point,width:number,count:number):WalkSurface {
  const [x,y,z]=low,dx=high[0]-x,dz=high[2]-z,rise=high[1]-y;
  const run=Math.hypot(dx,dz),ux=dx/run,uz=dz/run;
  const rx=-uz,rz=ux;
  const extentX=Math.abs(dx)+width*Math.abs(rx),extentZ=Math.abs(dz)+width*Math.abs(rz);
  // The yawed balustrades need short segments: one bounding box would also block the aisle.
  for(const sign of [-1,1])for(let i=0;i<count;i++) {
    const t=(i+.5)/count;
    solid(x+dx*t+rx*sign*(width/2-.05),z+dz*t+rz*sign*(width/2-.05),
      .065+Math.abs(dx)/count,.065+Math.abs(dz)/count,y+rise*i/count+.10,y+rise*(i+1)/count+.96);
  }
  return {
    x:x+dx/2,z:z+dz/2,w:extentX,d:extentZ,y,
    heightAt(px,pz) {
      const along=(px-x)*ux+(pz-z)*uz, across=(px-x)*rx+(pz-z)*rz;
      if(along<-.045||along>run+.045||Math.abs(across)>width/2-.13)return;
      // Floors match the top face of each tread, including the higher nose at the riser.
      const tread=Math.min(count,Math.max(0,Math.floor(along/run*count)+1));
      return y+rise*tread/count;
    }
  };
}

const lower=staircase([4.6,.2,9.0],[4.6,2.5,4.15],2.50,14);
const grand=staircase([4.7,2.5,2.8],[10,7.9,-8.2],2.90,32);
const arrival=staircase([12.93,6.7,11.90],[12.93,7.9,8.70],1.86,8);
const steppingStones=[
  [1.78,8.6],[1.13,8.02],[.6,7.53],[-.01,7.04],[-.77,6.59],[-1.52,6.39],[-2.23,6.42],
  [-2.96,6.19],[-3.6,5.94],[-4.33,5.83],[-5.05,5.68],[-5.71,5.51],[-6.31,5.21],[-6.91,5.18]
];
const garden:WalkSurface = {
  ...deck(-13.74,13.74,-10.7,12.81,.115),
  heightAt(x,z) {
    if(x < -13.74||x>13.74||z< -10.7||z>12.81)return;
    if(Math.abs(x-4.6)<1.35&&z>4.15&&z<8.99)return;
    const center=-3.45+1.35*Math.sin(z*.37-.6)+.43*Math.cos(z*.71);
    const halfWidth=1.61+.35*Math.sin(z*.49+1)+.2*Math.cos(z*.93);
    if(Math.abs(x-center)<halfWidth+.08)return;
    return .115;
  }
};

export const surfaces:WalkSurface[]=[
  garden,...steppingStones.map(([x,z])=>deck(x-.365,x+.365,z-.27,z+.27,.25)),
  lower,grand,arrival,
  deck(-10.76,12.01,11.69,12.94,6.7), // Front observation gallery and east return landing.
  deck(11.97,13.65,11.9,13.34,6.7),
  deck(12.18,13.84,-8.0,8.70,7.9),
  deck(-13.83,13.83,-10.75,-8.37,7.9),
  deck(8.18,13.83,-8.41,-7.99,7.9),
  deck(-13.84,-12.22,-8.41,11.39,7.9),
  cutFloor([stagePoint(-3.8,-.6),stagePoint(-3.8,3.60),stagePoint(1.8,-.6),stagePoint(1.8,3.60)]),
  cutFloor(eastApron), cutFloor(eastTurn), cutFloor(eastWing), cutFloor(eastWingTip), cutFloor(westBridge),
  deck(3.35,6.18,.48,4.16,2.5),
  deck(-13.4,-11.98,-5.45,6.27,2.5), // West return behind the screened tea pavilion.
  deck(-13.01,-11.91,-7.9,-5.38,2.5),
  deck(-12.94,-5.1,-7.9,-6.67,2.5),
  deck(-5.15,13.79,-7.90,-5.59,2.5),
  deck(-11.69,-5.15,-6.43,-1.94,2.5),
  // The high galleries can also be reached by selecting flight and landing on them.
  deck(-13.83,13.83,-10.77,-9.03,12.00),
  deck(-13.84,-12.12,-9.04,11.97,12.00),
  deck(12.12,13.84,-9.04,11.97,12.00),
  deck(-13.83,13.83,11.93,12.89,12.00)
];

for(const x of [-12.18,12.18]) for(const z of [-8.72,-3.65,3.65,10.68])
  solid(x,z,.46,.50,-.1,14.95);
for(const x of [-3.6,-1.05,1.6])for(const z of [-.35,3.37])
  solid(...stagePoint(x,z),.30,.30,.03,2.21);
for(const t of [.06,.36,.80])for(const side of [.15,.85])
  solid(...onStrip(westBridge,t,side),.19,.19,.03,2.22);
for(const [x,z] of [[3.34,1.18],[3.48,3.91],[6.12,1.28],[6.12,3.89]])solid(x,z,.21,.21,.03,2.23);
for(const x of [-10.61,-5.46,.08,5.7,11.68])solid(x,13.3,.31,.37,0,6.46);
solid(-1.10,1.58,.79,.78,2.5,3.92);
guard([-1.61,.65],[-1.08,.89],.06,2.5,4.09);
guard([-1.08,.89],[-.54,.67],.06,2.5,4.09);
for(const [x,z] of [onStrip(westBridge,.77,.928),onStrip(westBridge,.175,.08),onStrip(eastApron,.20,.09)])
  solid(x,z,.25,.25,2.5,3.73);
for(const z of [-.46,3.46])guard(stagePoint(-3.66,z),stagePoint(1.66,z),.077,2.5,3.15);
for(const [x,a,c] of [[-3.66,2.27,3.46],[-3.66,-.46,.3],[1.66,-.46,1.10]])
  guard(stagePoint(x,a),stagePoint(x,c),.088,2.5,3.15);
for(const side of [.035,.965])guard(onStrip(westBridge,.012,side),onStrip(westBridge,.985,side),.072,2.5,3.44);
guard(onStrip(eastApron,.045,.02),onStrip(eastApron,.96,.02),.072,2.5,3.36);
guard(onStrip(eastWing,0,.05),onStrip(eastWing,0,.97),.072,2.5,3.36);
solid(2.83,4.10,.92,.08,2.50,3.36);
solid(6.11,4.10,.34,.08,2.50,3.36);
guard(onStrip(eastTurn,0,.02),onStrip(eastTurn,.97,.02),.072,2.5,3.36);
solid(.235,11.53,22.39,.104,6.7,7.6);
solid(-.82,-7.22,8.85,.19,2.5,5.41);
solid(-8.545,-6.58,6.65,.14,2.5,6.03);
solid(-8.545,-1.73,6.65,.14,2.5,6.03);
solid(-11.82,-4.175,.14,4.89,2.5,6.03);
solid(-5.22,-3.22,.14,3.06,2.5,6.03);
solid(-8.425,-4.255,2.52,1.0,2.5,2.90);

for(const [x,z,w,d,h] of [
  [-7.96,4.1,1.2,1.0,1.1],[-6.85,4.57,.70,.62,.6],[-8.24,3.39,.70,.68,.7],
  [-5.85,.18,.85,1.04,.8],[-2.85,-2.02,1.03,.86,1.0],[.55,.17,.95,.65,.9],
  [-1.06,5.1,.91,.70,.8],[-5.66,7.76,1.32,.92,.9],[-6.43,7.53,.66,.72,.6],[-5.42,8.48,.75,.72,.6],
  [-4.94,-5.58,.99,.94,.9],[-6.50,10.18,1.0,.8,.8],[2.50,-3,.76,.64,.7],
  [8.1,5.62,1.11,.89,.9],[8.65,5.77,.63,.68,.6],[-10.22,-3.7,1.22,1.05,1.0],
  [-9.35,1.65,.49,.49,3.2],[-7.35,6.05,.78,.78,1.51],[-8.15,.48,.75,.75,.65]
])solid(x,z,w,d,0,h);
