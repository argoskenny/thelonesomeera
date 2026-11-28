import * as T from 'three';
import { GeometryBatch, seededRandom, vec } from '../../shared/geometry';
import { groundHeight } from './landscape';

// Leaves follow twig pairs so the near-camera shrubs retain volume from the water and the track.
export function buildUndergrowth(scene:T.Scene){
  const random=seededRandom(62401),wood=new GeometryBatch();
  const bark=new T.MeshStandardMaterial({color:0x524739,roughness:.96});
  const leafMap=new T.TextureLoader().load(new URL('../assets/aerie/leaf.png',document.baseURI).href);
  leafMap.colorSpace=T.SRGBColorSpace;
  const leaves=new T.MeshStandardMaterial({map:leafMap,alphaTest:.5,side:T.DoubleSide,roughness:.83});
  const leafShape=new T.PlaneGeometry(1,1,2,2),p=leafShape.attributes.position;
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i)+.5;
    p.setXYZ(i,x,y,(.5-Math.abs(x))*.2+Math.sin(y*Math.PI)*.17-y*y*.17);
  }
  leafShape.computeVertexNormals();
  const transforms:T.Matrix4[]=[],tints:T.Color[]=[];
  const dummy=new T.Object3D(),unit=vec(0,1,0);
  const green=[0x688a58,0x789851,0x586e47,0x899f64,0xa7a154];
  function bush(x:number,z:number,height:number){
    const base=vec(x,groundHeight(x,z)-.09,z);
    for(let j=0;j<8;j++){
      const angle=j*2.39996+random(),length=height*(.6+random()*.42);
      const tip=base.clone().add(vec(Math.cos(angle)*length*.53,length,Math.sin(angle)*length*.53));
      const joint=base.clone().lerp(tip,.52);
      wood.beam(base,joint,.022*height,.024*height,bark);
      for(let t=0;t<6;t++){
        const side=t%2?1:-1,splay=angle+side*(.62+random()*.8);
        const root=joint.clone().lerp(tip,t/8);
        const end=root.clone().add(vec(Math.cos(splay)*height*.43,.17*height,Math.sin(splay)*height*.43));
        wood.beam(root,end,.010*height,.012*height,bark);
        for(let k=0;k<8;k++){
          const a=splay+(k%2?1:-1)*(.65+random()*.65);
          dummy.position.copy(root).lerp(end,(k+.7)/9);
          dummy.quaternion.setFromUnitVectors(unit,vec(Math.cos(a),.12+random()*.57,Math.sin(a)).normalize());
          dummy.rotateY((random()-.5)*1.2);
          const size=(.13+random()*.11)*height;
          dummy.scale.set(size*.68,size,size);dummy.updateMatrix();
          transforms.push(dummy.matrix.clone());
          tints.push(new T.Color(green[Math.floor(random()*green.length)]));
        }
      }
    }
  }
  for(let i=0;i<95;i++){
    const x=-100+random()*211,z=random()<.62?1.2+random()*3.1:21.2+random()*4.7;
    bush(x,z,.65+Math.pow(random(),2)*1.7);
  }
  const mesh=new T.InstancedMesh(leafShape,leaves,transforms.length);
  transforms.forEach((m,i)=>{mesh.setMatrixAt(i,m);mesh.setColorAt(i,tints[i]);});
  mesh.name='Lineside undergrowth';mesh.castShadow=true;mesh.receiveShadow=true;
  scene.add(mesh);wood.flush(scene);
}
