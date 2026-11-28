import { Mesh, type Group, type Material, type Matrix4 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { Builder } from './builder';

let musician: Group;

export async function preparePerformer() {
  const url=new URL('../assets/tsukikage/performer/musician.glb',document.baseURI);
  musician=(await new GLTFLoader().loadAsync(url.href)).scene;
  musician.updateMatrixWorld(true);
}

/** The same local frame fits the head, hands, garment and instrument to the seated pose. */
export function placePerformer(b:Builder,basis:Matrix4) {
  const finishes=new Map<Material,string>();
  musician.traverse(object=>{
    if(!(object instanceof Mesh))return;
    const mat=object.material as Material;
    let name=finishes.get(mat);
    if(!name) {
      name='performer-'+mat.name;
      b.material(name,mat);
      finishes.set(mat,name);
    }
    const shape=object.geometry.clone().applyMatrix4(object.matrixWorld).applyMatrix4(basis);
    b.mesh(name,shape);
    shape.dispose();
  });
}
