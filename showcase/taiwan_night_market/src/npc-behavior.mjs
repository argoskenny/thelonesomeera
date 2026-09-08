import {CollisionWorld} from './collision.mjs';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
/** Navigation is restricted to road corridors, with every edge checked against exported geometry. */
export class RoadNavigation {
 constructor(world){this.world=world;this.nodes=new Map();for(let x=-44;x<=44;x+=.5)for(let z=-36;z<=36;z+=.5)if(this.onRoad(x,z)&&!world.blocked(x,z))this.nodes.set(`${x},${z}`,{x,z});}
 onRoad(x,z){return (x>=-43.5&&x<=43.5&&[-34,0,34].some(a=>Math.abs(z-a)<=1.5))||(z>=-35.5&&z<=35.5&&[-42,-14,14,42].some(a=>Math.abs(x-a)<=1.5));}
 clear(a,b){const steps=Math.ceil(distance(a,b)/.12);for(let i=0;i<=steps;i++){const t=steps?i/steps:0,x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t;if(!this.onRoad(x,z)||this.world.blocked(x,z))return false;}return true;}
 nearest(p){let best=null,d=Infinity;const x=Math.round(p.x*2)/2,z=Math.round(p.z*2)/2;for(let dx=-1;dx<=1;dx+=.5)for(let dz=-1;dz<=1;dz+=.5){const n=this.nodes.get(`${x+dx},${z+dz}`);if(!n)continue;const v=distance(n,p);if(v<d&&this.clear(p,n)){best=n;d=v;}}return best;}
 path(from,to){const start=this.nearest(from),end=this.nearest(to);if(!start||!end)return [];const key=p=>`${p.x},${p.z}`,goal=key(end),open=new Map([[key(start),start]]),cost=new Map([[key(start),0]]),prev=new Map();let reached=false;
 while(open.size){let current=null,score=Infinity;for(const [k,n] of open){const f=cost.get(k)+distance(n,end);if(f<score){current=n;score=f;}}const k=key(current);open.delete(k);if(k===goal){reached=true;break;}for(const dx of [-.5,0,.5])for(const dz of [-.5,0,.5]){if(!dx&&!dz)continue;const nk=`${current.x+dx},${current.z+dz}`,n=this.nodes.get(nk);if(!n||!this.clear(current,n))continue;const g=cost.get(k)+Math.hypot(dx,dz);if(g<(cost.get(nk)??Infinity)){cost.set(nk,g);prev.set(nk,k);open.set(nk,n);}}}
 if(!reached)return [];const raw=[to];let k=goal;while(k!==key(start)){raw.push(this.nodes.get(k));k=prev.get(k);}raw.push(start);raw.reverse();const smooth=[];let anchor=from;for(let i=0;i<raw.length;){let j=raw.length-1;while(j>i&&!this.clear(anchor,raw[j]))j--;smooth.push(raw[j]);anchor=raw[j];i=j+1;}return smooth;
 }
}
/** Sequential spatial updates mean later actors always see earlier actors' new positions. */
class PeopleGrid {
 constructor(){this.cells=new Map();}
 key(x,z){return `${Math.floor(x/2)},${Math.floor(z/2)}`;}
 add(p){const k=this.key(p.x,p.z);if(p.cell===k)return;if(p.cell)this.cells.get(p.cell)?.delete(p);if(!this.cells.has(k))this.cells.set(k,new Set());this.cells.get(k).add(p);p.cell=k;}
 blocked(x,z,r,except){const a=Math.floor(x/2),b=Math.floor(z/2);for(let i=a-1;i<=a+1;i++)for(let j=b-1;j<=b+1;j++)for(const p of this.cells.get(`${i},${j}`)||[])if(p!==except&&(x-p.x)**2+(z-p.z)**2<(r+p.radius)**2)return true;return false;}
}
export class MarketPeople {
 constructor(data,layout,random=Math.random,options={}){
  this.random=random;this.world=new CollisionWorld(data.boxes,data.bounds,.42);this.nav=new RoadNavigation(this.world);this.visits=0;this.departures=0;this.grid=new PeopleGrid();this.reservations=new Map();this.time=0;this.pathBudget=2;
  this.goals=layout.stalls.map(s=>({x:s.position[0]+Math.sin(s.angle)*1.05,z:-s.position[1]+Math.cos(s.angle)*1.05,yaw:Math.atan2(-Math.sin(s.angle),-Math.cos(s.angle)),stall:s.id})).filter(p=>!this.world.blocked(p.x,p.z)&&this.nav.nearest(p));
  const make=(id,x,z,role,asset={},home=null)=>({id,assetId:asset.id||id,x,z,role,radius:.42,scale:asset.scale||.92,gait:asset.gait||'Walk',yaw:home?.yaw??Math.PI,state:'idle',clip:'Idle',timer:1+random()*(options.catalog?14:2),path:[],target:null,home:home||{x,z,yaw:Math.PI,tangent:{x:1,z:0},minOffset:-.2,maxOffset:.2},blockedTime:0,speed:asset.age==='elder'?.44+random()*.12:asset.age==='child'?.52+random()*.14:.55+random()*.23,visits:0,moved:0,cell:null});
  this.people=[];
  const add=p=>{if(this.world.blocked(p.x,p.z)||this.grid.blocked(p.x,p.z,.42,null))throw Error(`Invalid character spawn: ${p.id}`);this.people.push(p);this.grid.add(p);};
  if(options.catalog){
   const vendors=options.catalog.filter(s=>s.role==='vendor'),visitors=options.catalog.filter(s=>s.role==='visitor');
   const uniform={convenience:'vendor_04',bakery:'vendor_07',bread:'vendor_07',florist:'vendor_08',clothes:'vendor_06',tailor:'vendor_06',drinks:'vendor_02',bubbletea:'vendor_02',luwei:'vendor_lin',ice:'vendor_mei',darts:'vendor_05',balloons:'vendor_05',pinball:'vendor_05'};
   for(const [i,h] of options.staff.homes.entries()){const asset=vendors.find(v=>v.id===uniform[h.business])||vendors[i%vendors.length];add(make(`staff_${h.id}`,h.x,h.z,'vendor',asset,h));}
   // Stratified random placement covers all six blocks and their perimeter, with no fixed clusters.
   const zones=Array.from({length:6},()=>[]);
   for(const n of this.nav.nodes.values()){const col=n.x<-14?0:n.x<14?1:2,row=n.z<0?0:1;zones[row*3+col].push(n);}
   for(let i=0;i<(options.visitorCount??102);i++){let spawn=null;for(let attempt=0;attempt<500;attempt++){const pool=zones[i%6],n=pool[Math.floor(random()*pool.length)];if(distance(n,{x:-38,z:-34})<1.5||this.grid.blocked(n.x,n.z,.63,null))continue;spawn=n;break;}if(!spawn)throw Error(`Crowd spawn area ${i%6} has no space`);const asset=visitors[i%visitors.length];const p=make(`visitor_${i}`,spawn.x,spawn.z,'visitor',asset);p.yaw=random()*Math.PI*2;p.spawnZone=i%6;add(p);}
  }else{
   add(make('visitor_mina',-34.5,-34.5,'visitor'));add(make('visitor_bao',-29,-34.5,'visitor'));add(make('vendor_lin',-36,-29.8,'vendor'));add(make('vendor_mei',-32,-29.8,'vendor'));
  }
 }
 blocked(x,z,r,except,player){return !!(player&&(x-player.x)**2+(z-player.z)**2<(r+.24)**2)||this.grid.blocked(x,z,r,except);}
 release(p){if(p.target&&this.reservations.get(p.target.stall)===p.id)this.reservations.delete(p.target.stall);}
 choose(p){
  if(this.pathBudget<=0)return;this.pathBudget--;this.release(p);
  const candidates=this.goals.filter(g=>g.stall!==p.target?.stall&&distance(p,g)>1.5&&distance(p,g)<24&&!this.reservations.has(g.stall));
  for(let i=0;i<Math.min(5,candidates.length);i++){const g=candidates.splice(Math.floor(this.random()*candidates.length),1)[0],path=this.nav.path(p,g);if(path.length){p.target=g;this.reservations.set(g.stall,p.id);p.path=path;p.state='walking';p.clip=p.gait;p.blockedTime=0;return;}}
  p.state='idle';p.clip='Idle';p.timer=1+this.random()*2;
 }
 update(dt,player){
  dt=Math.min(dt,.05);this.time+=dt;this.pathBudget=2;
  for(const p of this.people){
   if(p.state!=='walking'){
    p.timer-=dt;if(p.timer>0)continue;
    if(p.role==='visitor'){if(this.pathBudget<=0)continue;if(p.state==='browsing')this.departures++;this.choose(p);}
    else if(this.random()<.35){const h=p.home,t=h.minOffset+this.random()*(h.maxOffset-h.minOffset);p.path=[{x:h.x+h.tangent.x*t,z:h.z+h.tangent.z*t}];p.state='walking';}
    else{p.state=this.random()<.65?'greeting':'idle';p.clip=p.state==='greeting'?'Wave':'Idle';p.timer=2.4+this.random()*5;p.yaw=p.home.yaw;}
    continue;
   }
   const target=p.path[0];
   if(!target){if(p.role==='visitor'){p.state='browsing';p.clip='Browse';p.yaw=p.target.yaw;p.timer=4+this.random()*6;p.visits++;this.visits++;}else{p.state='greeting';p.clip='Wave';p.yaw=p.home.yaw;p.timer=3+this.random()*4;}continue;}
   const d=distance(p,target);if(d<.045){p.path.shift();continue;}
   const step=Math.min(d,p.speed*dt),vx=(target.x-p.x)/d,vz=(target.z-p.z)/d;
   let moved=false;
   // Prefer the same passing side; perpendicular steps let two opposing pedestrians yield.
   for(const offset of p.role==='vendor'?[0]:[0,.7,-.7,1.35,-1.35]){
    const c=Math.cos(offset),s=Math.sin(offset),x=p.x+(vx*c-vz*s)*step,z=p.z+(vx*s+vz*c)*step;
    if(p.role==='vendor'&&distance({x,z},p.home)>.24)continue;
    if(this.world.blocked(x,z)||this.blocked(x,z,p.radius,p,player)||(p.role==='visitor'&&!this.nav.onRoad(x,z)))continue;
    p.yaw=Math.atan2(x-p.x,z-p.z);p.x=x;p.z=z;p.moved+=step;this.grid.add(p);moved=true;break;
   }
   p.clip=moved?p.gait:'Idle';p.blockedTime=moved?Math.max(0,p.blockedTime-dt*.25):p.blockedTime+dt;
   if(p.blockedTime>3){this.release(p);p.path=[];p.state='idle';p.clip='Idle';p.timer=.5+this.random();p.blockedTime=0;}
  }
 }
 snapshot(){return {visits:this.visits,departures:this.departures,reachableStalls:this.goals.length,visitors:this.people.filter(p=>p.role==='visitor').length,workers:this.people.filter(p=>p.role==='vendor').length,people:this.people.map(p=>({id:p.id,assetId:p.assetId,role:p.role,x:p.x,z:p.z,yaw:p.yaw,state:p.state,clip:p.clip,stall:p.target?.stall,workplace:p.role==='vendor'?p.home.id:undefined,visits:p.visits,moved:p.moved,spawnZone:p.spawnZone}))};}
}
