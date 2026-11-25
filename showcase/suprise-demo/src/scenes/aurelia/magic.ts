import * as T from 'three';
import type { Materials } from './materials';
export function createMagic(scene:T.Scene,m:Materials){
  const root=new T.Group();root.name='Celestial armillary';root.position.set(95,238,-183);scene.add(root);
  const runeMaterial=new T.MeshBasicMaterial({color:new T.Color(3.2,1.8,.55),transparent:true,opacity:.7,blending:T.AdditiveBlending,depthWrite:false});
  const rings:T.Group[]=[];
  for(let j=0;j<3;j++){
    const ring=new T.Group(),radius=23+j*10;ring.position.y=(j-1)*8;ring.rotation.z=(j-1)*.09;root.add(ring);rings.push(ring);
    for(const offset of[0,1.5]){const hoop=new T.Mesh(new T.TorusGeometry(radius+offset,.055,5,180),runeMaterial);hoop.rotation.x=Math.PI/2;ring.add(hoop);}
    const points:number[]=[];
    for(let i=0;i<96;i++){const a=i*Math.PI*2/96,c=Math.cos(a),s=Math.sin(a),r=radius+.25;points.push(c*r,0,s*r,c*(r+.85),0,s*(r+.85));if(i%3===0){const aa=a+.012;points.push(c*(r+.65),0,s*(r+.65),Math.cos(aa)*(r+1.1),0,Math.sin(aa)*(r+1.1));points.push(Math.cos(aa)*(r+.3),0,Math.sin(aa)*(r+.3),Math.cos(aa)*(r+1.1),0,Math.sin(aa)*(r+1.1));}}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points,3));ring.add(new T.LineSegments(g,new T.LineBasicMaterial({color:new T.Color(2.7,1.45,.4),transparent:true,opacity:.85,blending:T.AdditiveBlending,depthWrite:false})));
  }
  const crystal=new T.Mesh(new T.OctahedronGeometry(1),m.azure);crystal.scale.set(4,20,4);root.add(crystal);
  const shell=new T.Mesh(new T.OctahedronGeometry(1),new T.MeshPhysicalMaterial({color:0x9de6ff,metalness:.1,roughness:.1,transparent:true,opacity:.28,side:T.DoubleSide,depthWrite:false}));shell.scale.set(6.7,28,6.7);root.add(shell);
  const beam=new T.Mesh(new T.CylinderGeometry(.2,1.1,150,12,1,true),new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv;void main(){gl_FragColor=vec4(.16,.58,1.,pow(1.-vUv.y,1.5)*.26);}'}));beam.position.y=64;root.add(beam);
  const light=new T.PointLight(0x40bfff,190,65,2);root.add(light);
  const orbLight=new T.PointLight(0x64cfff,5,6,2);orbLight.position.set(-33.8,48.5,63.5);scene.add(orbLight);
  return{root,update(t:number){rings.forEach((ring,i)=>ring.rotation.y=t*(i%2?-.025:.018));crystal.rotation.y=t*.13;shell.rotation.y=-t*.06;light.intensity=190+Math.sin(t*1.4)*20;orbLight.intensity=5+Math.sin(t*.9);}};
}
