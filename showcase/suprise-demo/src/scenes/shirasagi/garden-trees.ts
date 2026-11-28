import * as T from 'three';
import { seededRandom, vec } from '../../shared/geometry';
import type { Obstacle } from '../../shared/types';

type Random = () => number;
type Limbs = { positions: number[]; normals: number[]; uvs: number[]; indices: number[] };
type Spray = { tip: T.Vector3; direction: T.Vector3; length: number; hue: T.Color; roll: number };
export type GardenTree = { x: number; z: number; height: number; leaves: number; distant?: boolean };

function taperedLimb(batch: Limbs, line: T.Vector3[], widths: number[], sides: number) {
  const first = batch.positions.length / 3;
  const up = vec(0, 1, 0);
  const axis = line[line.length - 1].clone().sub(line[0]).normalize();
  const across = axis.clone().cross(Math.abs(axis.dot(up)) > .86 ? vec(0,0,1) : up).normalize();
  let length = 0;
  for (let j = 0; j < line.length; j++) {
    const tangent = line[Math.min(line.length - 1, j + 1)].clone().sub(line[Math.max(j - 1, 0)]).normalize();
    const side = across.clone().addScaledVector(tangent, -across.dot(tangent)).normalize();
    const normal = tangent.clone().cross(side);
    if (j) length += line[j].distanceTo(line[j - 1]);
    for (let i = 0; i <= sides; i++) {
      const angle = Math.PI * 2 * i / sides;
      const n = side.clone().multiplyScalar(Math.cos(angle)).addScaledVector(normal, Math.sin(angle));
      const p = line[j].clone().addScaledVector(n, widths[j]);
      batch.positions.push(p.x, p.y, p.z);
      batch.normals.push(n.x, n.y, n.z);
      batch.uvs.push(i / sides * Math.max(.25, widths[0] * 6), length * .62);
      if (!j || i === sides) continue;
      const c = first + j * (sides + 1) + i;
      const a = c - sides - 1;
      batch.indices.push(a, a + 1, c, a + 1, c + 1, c);
    }
  }
}

function boughMaterial(file: string) {
  const map=new T.TextureLoader().load(new URL('../assets/shirasagi/grounds/'+file,document.baseURI).href);
  map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  const material=new T.MeshStandardMaterial({map,roughness:.91,side:T.DoubleSide,alphaTest:.18});
  material.onBeforeCompile=shader=>{
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
      #include <map_fragment>
      float leafLuma = dot(diffuseColor.rgb, vec3(.2126,.7152,.0722));
      diffuseColor.rgb = mix(vec3(leafLuma), diffuseColor.rgb, .63) * .68;
    `);
    // An autumn leaf transmits diffuse skylight through its thin blade.
    shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_end>',
      '#include <lights_fragment_end>\n reflectedLight.indirectDiffuse += diffuseColor.rgb * vec3(.34,.29,.24);');
  };
  return material;
}

function treeSkeleton(spec: GardenTree, random: Random, limbs: Limbs, sprays: Spray[]) {
  const { x, z, height: h, leaves: density, distant }=spec;
  const origin=vec(x,0,z);
  const palette=[0xd99476,0xf0b98c,0xc78a67,0xf3ddad,0xdca79c,0xdbbea5,0xecc08a];
  const hue=new T.Color(palette[Math.floor(random()*palette.length)]);
  if (density>.8 && random()<.28) hue.setHex(random()<.5?0xb9be91:0xc5b58c);
  const trunkRadius=h*(.020+random()*.014);
  const spine=[origin.clone().setY(-.10)];
  for(let i=1;i<=5;i++)spine.push(spine[i-1].clone().add(vec((random()-.46)*h*.064,h*.109,(random()-.5)*h*.075)));
  taperedLimb(limbs,spine,[1.45,1,.92,.71,.52,.32].map(a=>a*trunkRadius),distant?5:9);
  if(!distant){
    for(let i=0;i<5;i++){
      const angle=random()*6.28, r=trunkRadius*(2.4+random()*2.3);
      const root=vec(x+Math.cos(angle)*r,-.08,z+Math.sin(angle)*r);
      taperedLimb(limbs,[origin.clone().setY(trunkRadius*1.2),root.clone().lerp(origin,.42).setY(.06),root],[trunkRadius*.67,trunkRadius*.41,.015],5);
    }
  }
  function fork(base:T.Vector3, angle:number, elevation:number, len:number, rad:number, depth:number) {
    const dir=vec(Math.cos(angle)*Math.cos(elevation),Math.sin(elevation),Math.sin(angle)*Math.cos(elevation));
    const kink=(random()-.47)*.38;
    const mid=base.clone().addScaledVector(dir,len*.49);
    mid.x+=Math.sin(angle)*len*kink;mid.z-=Math.cos(angle)*len*kink;
    const end=base.clone().addScaledVector(dir,len);
    // Fine outer twigs tend upwards even on descending, older scaffolds.
    end.y+=len*(random()-.33)*.23;
    const path=new T.CatmullRomCurve3([base,mid,end]);
    const segments=distant||depth===0?2:depth===1?3:5;
    const line=path.getPoints(segments);
    taperedLimb(limbs,line,line.map((_,i)=>rad*(1-.46*i/segments)),depth===0?3:depth===1?4:7);
    if(depth===0){
      const spread=distant?6:4;
      for(let n=0;n<spread;n++){
        const growth=vec(dir.x+(random()-.5)*1.26,dir.y+(random()-.5)*1.13,dir.z+(random()-.5)*1.26).normalize();
        const tint=hue.clone().multiplyScalar(.83+random()*.52);
        if(random()<.18) tint.offsetHSL(.012, .012, .025);
        sprays.push({tip:end.clone().lerp(mid,n/spread*.95),direction:growth,length:len*(distant?2.88:2.35)*(.68+random()*.63),roll:random()*6.28,hue:tint});
      }
      return;
    }
    const twist=.32+random()*.67;
    fork(end,angle+twist*(random()>.5?1:-1),elevation+(random()-.5)*.67,len*(.55+random()*.21),rad*.54,depth-1);
    fork(mid.clone().lerp(end,.25+random()*.6),angle-twist*(1+random()*.65),T.MathUtils.clamp(elevation+(random()-.52)*1.05,-.4,1.47),len*(.51+random()*.25),rad*.45,depth-1);
  }
  const count=distant?8:10;
  const rotation=random()*6.28;
  for(let i=0;i<count;i++){
    const index=Math.min(5,2+Math.floor(i/(count*.26)));
    const base=spine[index].clone().lerp(spine[index-1],random()*.65);
    fork(base,rotation+i*2.39996+(random()-.5)*.53,.22+i/count*.83+random()*.28,
      h*(.22+random()*.14),trunkRadius*(.39+random()*.15),distant?1:3);
  }
  if(spec.x===41 && spec.z===16.5) {
    const line=[spine[5],vec(40.32,7.52,16.78),vec(39.54,8.65,17.40),vec(38.59,9.04,17.95),vec(37.41,9.23,18.72),vec(36.25,9.75,18.48),vec(35.18,10.06,18.91),vec(33.95,10.17,19.25)];
    const path=new T.CatmullRomCurve3(line);
    const points=path.getPoints(17);
    taperedLimb(limbs,points,points.map((_,i)=>.135*Math.pow(1-i/19,1.7)),7);
    line.slice(2).forEach((p,i)=>{
      fork(p,3.9+(i%2)*1.7,.32+i*.074,1.23-i*.12,.034-i*.004,1);
    });
  }

}

export function addGardenTrees(root: T.Group, trees: GardenTree[], bark: T.Texture, obstacles: Obstacle[]) {
  const r=seededRandom(27843);
  const limbs:Limbs={positions:[],normals:[],uvs:[],indices:[]};
  const sparse:Spray[]=[],full:Spray[]=[];
  for(const spec of trees) {
    const shoots: Spray[] = [];
    treeSkeleton(spec, r, limbs, shoots);
    // The barest trees retain occasional compound leaf sprays on their outer twigs.
    const target = spec.leaves < .46 ? sparse : full;
    const stride = spec.leaves < .25 ? 6 : spec.leaves < .39 ? 3 : 1;
    for (let i = 0; i < shoots.length; i += stride) target.push(shoots[i]);
    if(!spec.distant)obstacles.push({x:spec.x,z:spec.z,w:spec.height*.053,d:spec.height*.053,h:spec.height*.61});
  }
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(limbs.positions,3));
  g.setAttribute('normal',new T.Float32BufferAttribute(limbs.normals,3));
  g.setAttribute('uv',new T.Float32BufferAttribute(limbs.uvs,2));
  g.setIndex(limbs.indices);
  const trunks=new T.Mesh(g,new T.MeshStandardMaterial({color:0xa09691,map:bark,roughness:1}));
  trunks.name='老櫻與楓樹的枝幹';trunks.castShadow=true;trunks.receiveShadow=true;root.add(trunks);
  for(const [items,file] of [[sparse,'copper-shoot.webp'],[full.filter((_,i)=>i%2===0),'ochre-bough.webp'],[full.filter((_,i)=>i%2===1),'russet-bough.webp']] as const) {
    // Cards share an origin at the twig joint and rotate around each branch's own axis.
    const geometry=new T.PlaneGeometry(1,1,1,2);geometry.translate(0,.5,0);
    const pos=geometry.getAttribute('position');
    for(let i=0;i<pos.count;i++){pos.setZ(i,Math.sin(Math.PI*pos.getY(i))*.10); }
    geometry.computeVertexNormals();
    const canopy=new T.InstancedMesh(geometry,boughMaterial(file),items.length);
    const dummy=new T.Object3D(),up=vec(0,1,0);
    items.forEach(({tip,direction,length,hue,roll},i)=>{
      dummy.position.copy(tip);dummy.quaternion.setFromUnitVectors(up,direction);dummy.rotateY(roll);
      dummy.scale.set(length*1.16,length,length);dummy.updateMatrix();
      canopy.setMatrixAt(i,dummy.matrix);canopy.setColorAt(i,hue);
    });
    canopy.name=items===sparse?'秋末殘葉與細梢':'林冠褐葉';canopy.receiveShadow=true;root.add(canopy);
  }
}
