import * as T from 'three';

export function texture(file: string, color = true) {
  const map = new T.TextureLoader().load(new URL('../assets/' + file, document.baseURI).href);
  map.wrapS = map.wrapT = T.RepeatWrapping;
  map.anisotropy = 4;
  if (color) map.colorSpace = T.SRGBColorSpace;
  return map;
}

export function surface(color: T.ColorRepresentation, map?: T.Texture, normalMap?: T.Texture) {
  return new T.MeshStandardMaterial({color, map: map ?? null, normalMap: normalMap ?? null,
    normalScale: new T.Vector2(.24,.24), roughness: .91});
}

type Instance = { matrix: T.Matrix4, tint?: T.Color };
export class Instances {
  private groups = new Map<T.BufferGeometry,Map<T.Material,Instance[]>>();
  readonly boxGeometry = new T.BoxGeometry();
  readonly pipeGeometry = new T.CylinderGeometry(.5,.5,1,8,1);
  readonly poleGeometry = new T.CylinderGeometry(.40,.5,1,12);
  private dummy = new T.Object3D();
  private up = new T.Vector3(0,1,0);
  constructor(private parent: T.Object3D) {}
  add(shape: T.BufferGeometry, mat: T.Material, x: number,y: number,z: number,
    w: number,h: number,d: number, yaw=0, pitch=0, roll=0, tint?: T.Color) {
    const object = this.dummy;
    object.position.set(x,y,z);
    object.rotation.set(pitch,yaw,roll,'YXZ');
    object.scale.set(w,h,d);
    this.record(shape,mat,tint);
  }
  box(mat:T.Material,x:number,y:number,z:number,w:number,h:number,d:number,yaw=0,tint?:T.Color) {
    this.add(this.boxGeometry,mat,x,y,z,w,h,d,yaw,0,0,tint);
  }
  rod(mat:T.Material, a:T.Vector3,b:T.Vector3,diameter:number) {
    const axis = b.clone().sub(a), length = axis.length();
    const object = this.dummy;
    object.position.copy(a).lerp(b,.5);
    object.scale.set(diameter,length,diameter);
    object.quaternion.setFromUnitVectors(this.up,axis.normalize());
    this.record(this.pipeGeometry,mat);
  }
  private record(geo:T.BufferGeometry, mat:T.Material,tint?:T.Color) {
    if (!this.groups.has(geo)) this.groups.set(geo,new Map());
    const group=this.groups.get(geo)!;
    if(!group.has(mat)) group.set(mat,[]);
    this.dummy.updateMatrix();
    group.get(mat)!.push({matrix:this.dummy.matrix.clone(),tint});
  }
  flush() {
    for(const [geo,groups] of this.groups) for(const [mat,records] of groups) {
      const mesh=new T.InstancedMesh(geo,mat,records.length);
      records.forEach(({matrix,tint},i)=>{mesh.setMatrixAt(i,matrix); if(tint) mesh.setColorAt(i,tint);});
      mesh.receiveShadow=true;
      // Tiny foliage and fine wires read best without aliased shadow-map patterns.
      mesh.castShadow=mat.userData.castShadow !== false;
      mesh.computeBoundingSphere();
      this.parent.add(mesh);
    }
    this.groups.clear();
  }
}

export const V=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
export const tint=(value:number)=>new T.Color(value,value,value);

/** Continuous bank surface with metric UVs. Rows can separate horizontally and vertically. */
export function ribbon(
  parent:T.Object3D, mat:T.Material, lanes:number, rows:number, zMin:number,zMax:number,
  sample:(lane:number,z:number)=>[number,number,number], uvSize:number,
) {
  const positions:number[]=[], colors:number[]=[], uvs:number[]=[], indices:number[]=[];
  for(let j=0;j<=rows;j++) {
    const z=zMin+(zMax-zMin)*j/rows;
    let across=0, last:[number,number,number]|null=null;
    for(let i=0;i<=lanes;i++) {
      const point=sample(i/lanes,z), [x,y,shade]=point;
      if(last) across+=Math.hypot(x-last[0], y-last[1]);
      positions.push(x,y,z); colors.push(shade,shade,shade);
      uvs.push(across/uvSize,z/uvSize); last=point;
      if(j&&i) {
        const p=j*(lanes+1)+i;
        indices.push(p-lanes-2,p-1,p, p-lanes-2,p,p-lanes-1);
      }
    }
  }
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));
  g.setAttribute('color',new T.Float32BufferAttribute(colors,3)); g.setIndex(indices); g.computeVertexNormals();
  const mesh=new T.Mesh(g,mat); mesh.receiveShadow=true; parent.add(mesh);
}
