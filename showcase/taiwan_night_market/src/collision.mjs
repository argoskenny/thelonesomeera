/** Static circle vs geometry-derived AABBs. Coordinates are glTF/Three X,Z. */
export class CollisionWorld {
  constructor(boxes, bounds = [-66, -59, 66, 59], radius = .24) {
    this.boxes = boxes; this.bounds = bounds; this.radius = radius; this.cellSize = 3; this.grid = new Map();
    boxes.forEach((b, id) => { for(let x=Math.floor(b[0]/3); x<=Math.floor(b[2]/3); x++) for(let z=Math.floor(b[1]/3);z<=Math.floor(b[3]/3);z++) { const key=`${x},${z}`; if(!this.grid.has(key))this.grid.set(key,[]);this.grid.get(key).push(id); }});
  }
  blocked(x,z) {
    const r=this.radius,b=this.bounds;
    if(x-r<b[0]||z-r<b[1]||x+r>b[2]||z+r>b[3])return true;
    const seen=new Set();
    for(let i=Math.floor((x-r)/3);i<=Math.floor((x+r)/3);i++)for(let j=Math.floor((z-r)/3);j<=Math.floor((z+r)/3);j++)for(const id of this.grid.get(`${i},${j}`)||[]){
      if(seen.has(id))continue;seen.add(id);const a=this.boxes[id];
      const dx=x-Math.max(a[0],Math.min(x,a[2])), dz=z-Math.max(a[1],Math.min(z,a[3]));
      if(dx*dx+dz*dz<r*r)return true;
    }return false;
  }
  move(x,z,dx,dz,dynamicBlocked=(_x,_z)=>false){
    // Small substeps prevent tunneling through a thin pole or stall under low FPS.
    const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.08));
    for(let i=0;i<steps;i++){if(!this.blocked(x+dx/steps,z)&&!dynamicBlocked(x+dx/steps,z))x+=dx/steps;if(!this.blocked(x,z+dz/steps)&&!dynamicBlocked(x,z+dz/steps))z+=dz/steps;}return {x,z};
  }
}
