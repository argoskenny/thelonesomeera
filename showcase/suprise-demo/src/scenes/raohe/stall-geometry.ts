import * as THREE from 'three';

export type Point = [number, number, number];
export type Tint = string | number;
const up = new THREE.Vector3(0, 1, 0);
const identity = new THREE.Quaternion();

interface InstanceSet { material: THREE.Material; geometry: THREE.BufferGeometry; matrices: THREE.Matrix4[]; colors: THREE.Color[] }
interface SurfaceSet { positions: number[]; uvs: number[]; indices: number[]; colors: number[] }
export type Grid = [number, number];

/** All carts share primitive meshes and texture-atlas draws, independent of the number of bays. */
export class StallGeometry {
  readonly boxShape = new THREE.BoxGeometry();
  readonly rodShape = new THREE.CylinderGeometry(.5, .5, 1, 10);
  readonly cupShape = new THREE.CylinderGeometry(.5, .34, 1, 14);
  readonly panShape = new THREE.CylinderGeometry(.5, .42, 1, 22);
  readonly ballShape = new THREE.SphereGeometry(.5, 9, 6);
  readonly ringShape = new THREE.TorusGeometry(.475, .025, 5, 22).rotateX(Math.PI / 2);
  readonly foodShape: THREE.BufferGeometry;
  readonly cutletShape: THREE.BufferGeometry;
  readonly cutletFinish: THREE.MeshStandardMaterial;
  readonly kitchenMap = new THREE.MeshBasicMaterial({map:this.texture('kitchen-backs.webp'),color:0xd1c9bd});
  readonly wells: THREE.MeshStandardMaterial;
  readonly imageSign = new THREE.MeshBasicMaterial({map: this.texture('lightboxes.webp'), color: new THREE.Color(1.22,1.12,.99)});
  readonly imageLabel = new THREE.MeshBasicMaterial({map: this.texture('counter-surfaces.webp')});
  readonly sheet = new THREE.MeshStandardMaterial({map: this.imageLabel.map, emissiveMap: this.imageLabel.map, emissive: 0xffd7b0, emissiveIntensity: .44, roughness: .44, metalness: .47, vertexColors: true});
  readonly canvas: THREE.MeshStandardMaterial;
  readonly valance = new THREE.MeshBasicMaterial({map:this.texture('valance.webp'),vertexColors:true,side:THREE.DoubleSide});
  readonly metal = new THREE.MeshStandardMaterial({color:0xffffff, metalness:.63, roughness:.34, emissive:0x30241a, emissiveIntensity:.2});
  readonly enamel = new THREE.MeshStandardMaterial({color:0xffffff, roughness:.52, metalness:.12, emissive:0x48301b, emissiveIntensity:.24});
  readonly glazed = new THREE.MeshStandardMaterial({color:0xffffff, roughness:.3, metalness:.04, emissive:0x563512, emissiveIntensity:.38});
  readonly glass = new THREE.MeshStandardMaterial({color:0xeac9a9, roughness:.18, metalness:.24, opacity:.085, transparent:true, depthWrite:false, side:THREE.DoubleSide});
  readonly lamp = new THREE.MeshBasicMaterial({color:new THREE.Color(3.5,2.2,1.03)});
  private sets = new Map<string, InstanceSet>();
  private surfaces = new Map<THREE.Material, SurfaceSet>();
  private basis = new THREE.Matrix4();
  private pos = new THREE.Vector3();
  private scale = new THREE.Vector3();
  private mat = new THREE.Matrix4();
  private rot = new THREE.Quaternion();
  private color = new THREE.Color();
  private a = new THREE.Vector3();
  private b = new THREE.Vector3();
  constructor(){
    const finish=new THREE.TextureLoader().load(new URL('../assets/raohe/stalls/steel-roughness.webp',document.baseURI).href);
    finish.wrapS=finish.wrapT=THREE.RepeatWrapping;
    finish.anisotropy=4;
    this.metal.roughness=.65;this.metal.roughnessMap=finish;
    this.metal.bumpMap=finish;this.metal.bumpScale=.0018;
    this.glass.roughnessMap=finish;
    const tile = this.texture('canvas-weave.webp');
    this.canvas = new THREE.MeshStandardMaterial({map:tile, bumpMap:tile, bumpScale:.009, side:THREE.DoubleSide, roughness:.72, vertexColors:true, metalness:.07});
    const food = new THREE.SphereGeometry(.5,10,7);
    const p = food.getAttribute('position');
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
      const d=.96+.06*Math.sin(x*31+y*18+z*25);
      p.setXYZ(i,x*d,y*d,z*d);
    }
    food.computeVertexNormals();
    this.foodShape=food;
    const breading=this.texture('cutlet.webp'),wells=this.texture('food-wells.webp');
    this.cutletFinish=new THREE.MeshStandardMaterial({map:breading, emissiveMap:breading, emissive:0xffdbaf,emissiveIntensity:.52,bumpMap:breading,bumpScale:.016,roughness:.73});
    this.wells=new THREE.MeshStandardMaterial({map:wells,emissiveMap:wells,emissive:0xffdeb8,emissiveIntensity:.51,roughness:.55,metalness:.04});
    const cutlet=new THREE.SphereGeometry(.5,30,22),cp=cutlet.getAttribute('position'),cu=cutlet.getAttribute('uv');
    for(let i=0;i<cp.count;i++){
      const x=cp.getX(i),y=cp.getY(i),z=cp.getZ(i);
      const grit=1+.026*Math.sin(x*99+y*83)+.021*Math.sin(z*110+x*45-y*37);
      cp.setXYZ(i,(x*(.98+.22*y)+.065*Math.sin(y*7.7))*grit,y*grit,z*(.91+.12*Math.cos(y*18)));
      cu.setXY(i,Math.min(.996,Math.max(.004,.5+x)),Math.min(.996,Math.max(.004,.5+y)));
    }
    cutlet.computeVertexNormals();this.cutletShape=cutlet;
  }
  private texture(name:string) {
    const url=new URL('../assets/raohe/stalls/'+name,document.baseURI);
    const t=new THREE.TextureLoader().load(url.href);
    t.colorSpace=THREE.SRGBColorSpace;
    t.anisotropy=8;
    return t;
  }
  locate(x:number,z:number,rotation:number) {
    this.basis.makeRotationY(rotation).setPosition(x,0,z);
  }
  solid(shape:THREE.BufferGeometry,material:THREE.Material,tint:Tint,p:Point,size:Point,rx=0,ry=0,rz=0) {
    this.rot.setFromEuler(new THREE.Euler(rx,ry,rz));
    this.add(shape,material,tint,p,size,this.rot);
  }
  private add(shape:THREE.BufferGeometry,material:THREE.Material,tint:Tint,p:Point,size:Point,q:THREE.Quaternion) {
    const key=shape.uuid+material.uuid;
    let set=this.sets.get(key);
    if(!set) { set={material,geometry:shape,matrices:[],colors:[]}; this.sets.set(key,set); }
    this.mat.compose(this.pos.set(...p),q,this.scale.set(...size)).premultiply(this.basis);
    set.matrices.push(this.mat.clone());
    set.colors.push(new THREE.Color(tint));
  }
  box(mat:THREE.Material,col:Tint,x:number,y:number,z:number,w:number,h:number,d:number) {
    this.add(this.boxShape,mat,col,[x,y,z],[w,h,d],identity);
  }
  beam(mat:THREE.Material,col:Tint,start:Point,end:Point,w:number,d=w,round=false) {
    const delta=this.a.fromArray(end).sub(this.b.fromArray(start));
    const len=delta.length();
    const middle=this.b.addScaledVector(delta,.5);
    this.rot.setFromUnitVectors(up,delta.normalize());
    this.add(round?this.rodShape:this.boxShape,mat,col,[middle.x,middle.y,middle.z],[w,len,d],this.rot);
  }
  panel(mat:THREE.Material,vs:[Point,Point,Point,Point],cell=0,grid:Grid=[1,1],tint:Tint=0xffffff,uv?:[number,number,number,number]) {
    let s=this.surfaces.get(mat);
    if(!s){s={positions:[],uvs:[],indices:[],colors:[]};this.surfaces.set(mat,s);}
    const base=s.positions.length/3;
    this.color.set(tint);
    const [cols,rows]=grid;
    // Inset atlas boundaries so lower mip levels preserve the panel frame.
    const [u,v,w,h]=uv??[(cell%cols+.008)/cols,(Math.floor(cell/cols)+.009)/rows,.984/cols,.982/rows];
    s.uvs.push(u,1-v,u,1-v-h,u+w,1-v-h,u+w,1-v);
    for(const p of vs) {
      this.pos.fromArray(p).applyMatrix4(this.basis);
      s.positions.push(this.pos.x,this.pos.y,this.pos.z);s.colors.push(this.color.r,this.color.g,this.color.b);
    }
    s.indices.push(base,base+1,base+2,base,base+2,base+3);
  }
  foodTop(cell:number,cx:number,y:number,cz:number,rx:number,rz:number,angle:number,seed:number) {
    const mat=this.wells;
    let s=this.surfaces.get(mat);
    if(!s){s={positions:[],uvs:[],indices:[],colors:[]};this.surfaces.set(mat,s);}
    const base=s.positions.length/3,count=20;
    const append=(u:number,v:number,height:number,rad:number)=>{
      const dx=(u-.5)*rx*2*rad,dz=(v-.5)*rz*2*rad;
      this.pos.set(cx+dx*Math.cos(angle)-dz*Math.sin(angle),height,cz+dx*Math.sin(angle)+dz*Math.cos(angle)).applyMatrix4(this.basis);
      s!.positions.push(this.pos.x,this.pos.y,this.pos.z);s!.colors.push(1,1,1);
      s!.uvs.push((cell%4+.013+u*.974)/4,1-(Math.floor(cell/4)+.013+v*.974)/2);
    };
    append(.5,.5,y+.014,1);
    for(let k=0;k<count;k++){
      const a=-k*2*Math.PI/count;
      append(.5+.5*Math.cos(a),.5+.5*Math.sin(a),y-.003*Math.cos(a*4+seed),.985+.048*Math.sin(a*7+seed)+.030*Math.sin(a*3+seed));
      s.indices.push(base,base+k+1,base+(k+1)%count+1);
    }
  }
  front(mat:THREE.Material,cell:number,grid:Grid,x:number,y:number,z:number,w:number,h:number,tint:Tint=0xffffff) {
    this.panel(mat,[[x-w/2,y+h/2,z],[x-w/2,y-h/2,z],[x+w/2,y-h/2,z],[x+w/2,y+h/2,z]],cell,grid,tint);
  }
  flush(root:THREE.Object3D) {
    for(const s of this.sets.values()){
      const mesh=new THREE.InstancedMesh(s.geometry,s.material,s.matrices.length);
      s.matrices.forEach((m,i)=>{mesh.setMatrixAt(i,m);mesh.setColorAt(i,s.colors[i]);});
      mesh.receiveShadow=true;
      root.add(mesh);
    }
    for(const [material,s] of this.surfaces){
      const geometry=new THREE.BufferGeometry();
      geometry.setIndex(s.indices);
      geometry.setAttribute('position',new THREE.Float32BufferAttribute(s.positions,3));
      geometry.setAttribute('uv',new THREE.Float32BufferAttribute(s.uvs,2));
      geometry.setAttribute('color',new THREE.Float32BufferAttribute(s.colors,3));
      geometry.computeVertexNormals();
      const mesh=new THREE.Mesh(geometry,material);
      mesh.receiveShadow=true;root.add(mesh);
    }
  }
}
