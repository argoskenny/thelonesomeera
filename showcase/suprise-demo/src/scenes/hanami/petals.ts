import * as THREE from 'three';

export function addFallingPetals(scene: THREE.Scene) {
  const shape = new THREE.Shape();
  shape.moveTo(0,-.010);
  shape.bezierCurveTo(-.011,-.004,-.010,.009,-.003,.011);
  shape.quadraticCurveTo(0,.009,.001,.007);
  shape.bezierCurveTo(.008,.015,.016,.003,0,-.010);
  const geometry = new THREE.ShapeGeometry(shape, 3);
  const coordinates = geometry.getAttribute('position');
  for (let i=0; i<coordinates.count; i++) coordinates.setZ(i, Math.abs(coordinates.getX(i))*.32);
  geometry.computeVertexNormals();
  const count = 210;
  const material = new THREE.MeshBasicMaterial({color: 0xf6d6db, side: THREE.DoubleSide});
  const petals = new THREE.InstancedMesh(geometry,material,count);
  petals.frustumCulled = false;
  petals.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(petals);
  let seed=67;
  const rand=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
  const leaves = Array.from({length:count},()=>({
    x:-6+6*rand(), z:-119+157*rand(), phase:rand()*Math.PI*2,
    period:13+8*rand(), drift:2.5+2*rand(), size:.64+.64*rand(),
  }));
  const temp = new THREE.Object3D();
  return (time:number)=>{
    leaves.forEach((leaf,i)=>{
      const fraction=(time/leaf.period+leaf.phase/Math.PI*.5)%1;
      const wobble=time*.87+leaf.phase;
      temp.position.set(leaf.x+fraction*leaf.drift+Math.sin(wobble)*.44, .04+(1-fraction)*5.6, leaf.z+.54*Math.cos(wobble*.72)+fraction*.7);
      temp.rotation.set(wobble*1.4,leaf.phase+fraction*10,wobble*.65);
      temp.scale.setScalar(leaf.size*Math.min(1,fraction*15,(1-fraction)*25));
      temp.updateMatrix();
      petals.setMatrixAt(i,temp.matrix);
    });
    petals.instanceMatrix.needsUpdate=true;
  };
}
