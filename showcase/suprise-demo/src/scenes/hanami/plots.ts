import * as T from 'three';
import { seededRandom } from '../../shared/geometry';
import { Instances, surface, texture, V } from './promenade-geometry';

type Plot = { x: number; z: number; width: number; length: number; yaw: number; rows: number };
const gardens: Plot[] = [
  {x:20.8,z:-64,width:3.25,length:8.1,yaw:.035,rows:4},
  {x:21.0,z:-25,width:3.2,length:6.5,yaw:-.045,rows:4},
  {x:20.7,z:8,width:3.15,length:6.8,yaw:.055,rows:4},
  {x:58.7,z:-63.3,width:5.2,length:12,yaw:-.19,rows:6},
  {x:60.4,z:6,width:5.8,length:10.4,yaw:.21,rows:7},
  {x:-56,z:-49,width:5.9,length:11.2,yaw:.14,rows:7},
  {x:-57.9,z:28.5,width:4.8,length:10.1,yaw:-.29,rows:5},
];

// On the village side the first two vertices of the wide meadow ribbon
// determine the shoulder slope. The opposite bank is level.
function ground(x: number) {
  if (x < 0) return -1.56;
  return -.79 - 1.2 * T.MathUtils.clamp((x - 13.51) / (330 / 16), 0, 1);
}

function bedPoint(plot: Plot, along: number, across: number) {
  const angle = plot.yaw;
  const side = (across - .5) * plot.width + .10 * Math.sin(along * 4.7 + plot.z);
  const long = (along - .5) * plot.length;
  const x = plot.x + side * Math.cos(angle) + long * Math.sin(angle);
  const z = plot.z - side * Math.sin(angle) + long * Math.cos(angle);
  const inRow = (across * plot.rows) % 1;
  const profile = Math.min(1, Math.sin(Math.PI * inRow) ** 2 * 1.35);
  const ends = Math.min(1, (1 - Math.abs(along * 2 - 1)) * 11);
  const shoulder = ends * profile * (.142 + .013 * Math.sin(z * 2.3 + x));
  return V(x,ground(x) + .018 + shoulder,z);
}

type Strip = { positions: number[]; uvs: number[]; index: number[] };
function band(data: Strip, plot: Plot, start: number, end: number, across: number, plastic: boolean) {
  const base = data.positions.length / 3;
  const depth = Math.ceil(plot.length / .61);
  for (let j = 0; j <= depth; j++) for (let i = 0; i <= across; i++) {
    const a = plastic ? .035 + .93 * j / depth : j / depth;
    const b = T.MathUtils.lerp(start, end, i/across);
    const p = bedPoint(plot, a, b);
    if (plastic) p.y += .006 + .002 * Math.sin(i * 1.8 + j * 4);
    data.positions.push(p.x,p.y,p.z);
    data.uvs.push(p.x / 1.42,p.z / 1.42);
    if (i === across || j === depth) continue;
    const k = base + j * (across + 1) + i;
    data.index.push(k,k + across + 1,k + 1,k + across + 1,k + across + 2,k + 1);
  }
}

function cropPlant(onion: boolean) {
  const g = new T.BufferGeometry(), p: number[] = [], c: number[] = [];
  const leaves = onion ? 6 : 7;
  const low = new T.Color(onion ? '#a8ac7a' : '#526542');
  const mid = new T.Color(onion ? '#739777' : '#78944f');
  const tip = new T.Color(onion ? '#8c9e78' : '#89a262');
  const vein = new T.Color(onion ? '#91a08b' : '#c2bb8a');
  function triangle(a:T.Vector3,b:T.Vector3,d:T.Vector3,ca:T.Color,cb:T.Color,cd:T.Color) {
    p.push(...a.toArray(),...b.toArray(),...d.toArray());
    c.push(...ca.toArray(),...cb.toArray(),...cd.toArray());
  }
  for (let i = 0; i < leaves; i++) {
    const angle = 2.39996 * i, s = Math.sin(angle), t = Math.cos(angle);
    const outer = 1 - i / (leaves + 1);
    const reach = onion ? .10 + outer * .12 : .035 + outer * .16;
    const height = onion ? .30 + .13 * Math.cos(i * 2) : .12 + .09 * (1 - outer);
    const width = onion ? .007 : .025 + outer * .033;
    const start = V(s*.014,0,t*.014);
    const rib = V(s*reach*.48,height*.84,t*reach*.48);
    const a = V(rib.x - t*width,height*(onion?.76:.92),rib.z + s*width);
    const b = V(rib.x + t*width,height*(onion?.76:.96),rib.z - s*width);
    const end = V(s*reach,height*(onion?.84:.79),t*reach);
    triangle(start,a,rib,low,mid,vein);
    triangle(rib,b,start,vein,mid,low);
    triangle(a,end,rib,mid,tip,vein);
    triangle(rib,end,b,vein,tip,mid);
  }
  g.setAttribute('position',new T.Float32BufferAttribute(p,3));
  g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.computeVertexNormals();
  return g;
}

export function addPlots(scene: T.Scene) {
  const group = new T.Group();
  group.name = 'Village kitchen gardens';
  scene.add(group);
  const pool = new Instances(group), random = seededRandom(33895);
  const soil = surface('#ac8969',texture('hanami/promenade-soil.webp'));
  const film = new T.MeshStandardMaterial({color:'#393c37',roughness:.57,metalness:.05});
  const leaves = new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide});
  const bamboo = surface('#b6a582');
  leaves.userData.castShadow = false;
  const rosette = cropPlant(false), onions = cropPlant(true);
  const beds: Strip = {positions:[],uvs:[],index:[]}, covers: Strip = {positions:[],uvs:[],index:[]};

  gardens.forEach((plot, n) => {
    band(beds,plot,0,1,plot.rows*6,false);
    for(let i=0;i<plot.rows;i++) {
      const c = (i+.5)/plot.rows;
      if((i+n)%4===1) band(covers,plot,(i+.19)/plot.rows,(i+.81)/plot.rows,5,true);
      if ((n+i)%6===3) continue;
      const onion = (n+i)%4===2;
      const count = Math.floor(plot.length / (onion ? .34 : .55));
      for(let j=0;j<count;j++) {
        if(random()<.085) continue;
        const a = .07+.86*(j+.25+random()*.5)/count;
        const p = bedPoint(plot,a,c+(random()-.5)*.07/plot.rows);
        const scale = .66+random()*.48;
        const color = new T.Color(.68+random()*.28,.78+random()*.15,.61+random()*.24);
        pool.add(onion?onions:rosette,leaves,p.x,p.y+.007,p.z,scale,scale,scale,random()*2*Math.PI,0,0,color);
      }
    }
    // Light bamboo A-frames are only installed on the few climbing-crop rows.
    if(n%2===0) {
      const row = (plot.rows-1.5)/plot.rows;
      let last: T.Vector3 | undefined;
      for(const a of [.15,.49,.86]){
        const apex = bedPoint(plot,a,row);apex.y += .98;
        for(const dir of [-1,1]) {
          const foot = bedPoint(plot,a+.02*dir,row+dir*.34/plot.rows);
          pool.rod(bamboo,foot,apex,.026);
        }
        if(last) pool.rod(bamboo,last,apex,.029);
        last=apex;
      }
    }
  });
  for(const [strip,mat] of [[beds,soil],[covers,film]] as const) {
    const g=new T.BufferGeometry();
    g.setAttribute('position',new T.Float32BufferAttribute(strip.positions,3));
    g.setAttribute('uv',new T.Float32BufferAttribute(strip.uvs,2));
    g.setIndex(strip.index);g.computeVertexNormals();
    const mesh=new T.Mesh(g,mat);mesh.receiveShadow=true;group.add(mesh);
  }
  pool.flush();
}
