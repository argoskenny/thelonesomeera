import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const visitors = [
  { model: 'Male_02', x: .70, z: -9.8, yaw: -2.77 },
  { model: 'Female_01', x: 1.28, z: -10.36, yaw: .13 },
  { model: 'Female_02', x: 1.87, z: -10.17, yaw: -.54 },
];
export const visitorObstacles = visitors.map(({ x, z }) => ({ x, z, w: .40, d: .32, h: 1.76 }));

export async function addVisitors(scene: THREE.Scene) {
  const load = (file: string) => new GLTFLoader().loadAsync(new URL('../assets/hanami/'+file,document.baseURI).href);
  const [people, cars] = await Promise.all([load('visitors.glb'),load('parked-cars.glb')]);
  const group = people.scene;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 31);
  gradient.addColorStop(0, 'rgba(37,29,32,.34)');
  gradient.addColorStop(.45, 'rgba(37,29,32,.21)');
  gradient.addColorStop(1, 'rgba(37,29,32,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  const shadowMaterial = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false });
  const shadowGeometry = new THREE.PlaneGeometry(.92,.67);
  for (const { model, x, z, yaw } of visitors) {
    const person = group.getObjectByName(model) as THREE.Mesh;
    person.position.set(x, .008, z);
    person.rotation.y = yaw;
    person.receiveShadow = person.castShadow = true;
    scene.add(person);
    const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(x,.014,z);
    scene.add(shadow);
  }
  const parking = [
    {model:'Minivan',x:12.41,z:-25.5,angle:3.09},
    {model:'Sedan',x:12.34,z:19.1,angle:.05},
    {model:'Sedan',x:12.20,z:-77.3,angle:3.12},
    {model:'Minivan',x:12.51,z:-92.7,angle:3.16},
  ];
  for (const {model,x,z,angle} of parking) {
    const car = cars.scene.getObjectByName(model)!.clone();
    car.position.set(x,-.768,z);
    car.rotation.y=angle;
    car.traverse(part=>{
      if (part instanceof THREE.Mesh) part.castShadow=part.receiveShadow=true;
    });
    scene.add(car);
    const contact = new THREE.Mesh(shadowGeometry,shadowMaterial);
    contact.rotation.x=-Math.PI/2;
    contact.scale.set(2.6,6.9,1);
    contact.position.set(x,-.763,z);
    scene.add(contact);
  }

}
