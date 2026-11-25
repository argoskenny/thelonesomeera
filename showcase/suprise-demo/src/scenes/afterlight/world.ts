import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { Water } from 'three/addons/objects/Water.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Materials } from './materials';
import { metricUV, noise } from '../../shared/procedural';
import type { Obstacle, WalkSurface } from '../../shared/types';

export function createWorld(scene:THREE.Scene,m:Materials,mobile:boolean) {
  const obstacles:Obstacle[]=[];
  const surfaces:WalkSurface[]=[];
  const statics=new Map<THREE.Material,THREE.BufferGeometry[]>();
  const add=(g:THREE.BufferGeometry,mat:THREE.Material,x=0,y=0,z=0,ry=0)=>{
    if(g.index){const source=g;g=g.toNonIndexed();source.dispose();}g.rotateY(ry);g.translate(x,y,z);const group=statics.get(mat)||[];group.push(g);statics.set(mat,group);
  };
  const box=(w:number,h:number,d:number,x:number,y:number,z:number,mat:THREE.Material=m.concrete,r=.02,ry=0)=>{
    const g=metricUV(new RoundedBoxGeometry(w,h,d,1,r));add(g,mat,x,y,z,ry);
  };
  // A real, inhabitable pavilion. All dimensions are in meters.
  box(31,.9,38,0,-1.1,-1,m.concrete,.08);
  box(30.7,.32,37.7,0,-.58,-1,m.dark,.03);
  const tiledArea=(x0:number,x1:number,z0:number,z1:number)=>{
    surfaces.push({x:(x0+x1)/2,z:(z0+z1)/2,w:x1-x0,d:z1-z0,y:0});
    const nx=Math.ceil((x1-x0)/2.5),nz=Math.ceil((z1-z0)/2.5),w=(x1-x0)/nx,d=(z1-z0)/nz;
    for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){
      box(w-.018,.35,d-.018,x0+w*(i+.5),-.175,z0+d*(j+.5),m.stone,.013);
    }
  };
  tiledArea(-15,-6,-20,18);tiledArea(6,15,-20,18);tiledArea(-6,6,5,18);tiledArea(-6,6,-20,-14);
  box(12,.08,19,0,-.5,-4.5,m.rock,.01);
  for(const x of [-6.06,6.06]) box(.2,.2,19.4,x,-.03,-4.5,m.concrete,.02);
  for(const z of [-14.12,5.12]) box(12.3,.2,.2,0,-.03,z,m.concrete,.02);
  // Offset stepping stones form an uninterrupted route across the reflection pool.
  for(let i=0;i<7;i++){
    const x=-5.25+i*1.75,z=2.8+Math.sin(i*.8)*.5;
    box(1.63,.3,1.4,x,.025,z,m.stone,.035);
    surfaces.push({x,z,w:1.63,d:1.4,y:.175});
  }
  // Cast concrete annulus, beveled perimeter and continuous open oculus.
  const shape=new THREE.Shape();shape.absarc(0,0,14,0,Math.PI*2,false);
  const hole=new THREE.Path();hole.absarc(0,0,9.25,0,Math.PI*2,true);shape.holes.push(hole);
  const roof=new THREE.ExtrudeGeometry(shape,{depth:.8,bevelEnabled:true,bevelThickness:.035,bevelSize:.035,bevelSegments:2,steps:1,curveSegments:144});
  roof.rotateX(-Math.PI/2);metricUV(roof,3.2);add(roof,m.concrete,0,6.2,-4.5);
  const pillarPositions:[[number,number],...Array<[number,number]>]=[[-10.6,2.9],[10.6,2.9],[-10.6,-11.9],[10.6,-11.9],[0,-17.4],[0,8.4]];
  const tieGeo=new THREE.CylinderGeometry(.026,.026,.006,8);tieGeo.rotateX(Math.PI/2);
  for(const [x,z]of pillarPositions){
    box(.62,6.2,.82,x,3.1,z,m.concrete,.025);obstacles.push({x,z,w:.78,d:.98});
    for(let y=.65;y<6;y+=1.1) for(const dx of[-.18,.18]) add(tieGeo.clone(),m.dark,x+dx,y,z+.414);
  }
  // Monumental bronze ribbon: a machined rectangular band with a mineral patina.
  const sculpture=new THREE.Group();sculpture.position.set(2.0,2.6,-5.4);sculpture.rotation.y=.65;
  const ringShape=new THREE.Shape();ringShape.absarc(0,0,2.73,0,Math.PI*2,false);
  const ringHole=new THREE.Path();ringHole.absarc(0,0,2.46,0,Math.PI*2,true);ringShape.holes.push(ringHole);
  const ringGeo=new THREE.ExtrudeGeometry(ringShape,{depth:.62,bevelEnabled:true,bevelSize:.045,bevelThickness:.045,bevelSegments:3,curveSegments:128,steps:1});
  ringGeo.translate(0,0,-.31);
  const ring=new THREE.Mesh(ringGeo,m.bronze);ring.castShadow=ring.receiveShadow=true;sculpture.add(ring);scene.add(sculpture);
  // Timber benches, floating plinths, recessed bronze edging and warm light channels.
  for(const side of[-1,1]){
    for(const z of[-12,-4,5]){
      const x=side*11.8;
      box(1.7,.55,4.8,x,.275,z,m.concrete,.05);
      for(let j=0;j<6;j++)box(.245,.09,4.84,x+(j-2.5)*.268,.595,z,m.wood,.025);
      box(.05,.028,4.4,x-side*.72,.19,z,m.warmLight,.006);
      obstacles.push({x,z,w:1.9,d:5});
    }
    // Long coastal garden troughs.
    for(const z of[-14,0,12]){
      const x=side*14.35;
      box(1.25,.5,5.1,x,.25,z,m.concrete,.035);box(1.05,.03,4.9,x,.51,z,m.soil,.01);
      obstacles.push({x,z,w:1.35,d:5.2});
    }
  }
  // Stair down to a lower ocean terrace behind the pavilion.
  for(let s=0;s<5;s++){box(12,.16,1.05,0,-s*.16-.09,18+s*.7,m.stone,.025);surfaces.push({x:0,z:18+s*.7,w:12,d:1.05,y:-s*.16-.01});}
  surfaces.push({x:0,z:24,w:18.7,d:6.8,y:-.68});
  box(19,.5,7,0,-1,24,m.concrete,.04);
  box(18.7,.08,6.8,0,-.72,24,m.stone,.015);
  // A low seaward wall with intentional viewing gaps.
  for(const x of[-10.7,10.7])box(8.4,.42,.45,x,.21,-19.3,m.concrete,.035);
  for(const side of[-1,1])box(.35,.42,7,side*14.6,.21,13.5,m.concrete,.025);
  // Gravel and rocks along the shoreline.
  let seed=1907;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const rockGeometries:THREE.BufferGeometry[]=[];
  for(let i=0;i<70;i++){
    const side=i%2===0?-1:1,x=side*(16+rand()*10),z=-24+rand()*55;
    const g=new THREE.IcosahedronGeometry(1,2);const p=g.attributes.position;
    for(let v=0;v<p.count;v++){
      const a=p.getX(v),b=p.getY(v),c=p.getZ(v),n=.78+noise(a*2.7+c,b*3.1)*.43;
      p.setXYZ(v,a*n,b*n,c*n);
    }
    g.computeVertexNormals();const s=.8+rand()*2.5;g.scale(s*(.8+rand()),s*(.5+rand()*.6),s*(.8+rand()));g.rotateY(rand()*6.28);g.translate(x,-.8,z);
    rockGeometries.push(g);
  }
  const rocks=new THREE.Mesh(mergeGeometries(rockGeometries),m.rock);rocks.castShadow=rocks.receiveShadow=true;scene.add(rocks);rockGeometries.forEach(g=>g.dispose());
  // Distant continuous, layered islands, with natural fractal elevation.
  for(let k=0;k<5;k++){
    const width=160+k*65,depth=55+k*20;
    const g=new THREE.PlaneGeometry(width,depth,220,70);g.rotateX(-Math.PI/2);
    const p=g.attributes.position;
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),z=p.getZ(i),edge=Math.sin((x/width+.5)*Math.PI)*Math.sin((z/depth+.5)*Math.PI);
      const ridge=1-Math.abs(noise(x*.03+k*4,z*.045)*2-1);const f=Math.pow(ridge,2)*.55+noise(x*.14+19,z*.12)*.27+noise(x*.42,z*.39)*.13+noise(x*.95,z*.84)*.05;
      p.setY(i,Math.pow(Math.max(0,edge),1.1)*(12+k*7)*(f*.9+.2)-2.2);
    }
    g.computeVertexNormals();metricUV(g,12);const mat=new THREE.MeshStandardMaterial({color:new THREE.Color().setHSL(.52,.055,.28+k*.048),map:m.rock.map,normalMap:m.rock.normalMap,normalScale:new THREE.Vector2(.8,.8),roughness:1});
    const island=new THREE.Mesh(g,mat);island.position.set((k%2?1:-1)*(70+k*43),-1,-125-k*75);scene.add(island);
  }
  for(const[mat,geos]of statics){const mesh=new THREE.Mesh(mergeGeometries(geos),mat);mesh.castShadow=mesh.receiveShadow=true;scene.add(mesh);geos.forEach(g=>g.dispose());}
  // Instanced dune grass: curved individual blades, seed heads and wind animation.
  const grassTime={value:0};
  const bladeGeo=new THREE.PlaneGeometry(.035,1,1,4);bladeGeo.translate(0,.5,0);
  const bp=bladeGeo.attributes.position;
  for(let i=0;i<bp.count;i++){const y=bp.getY(i);bp.setX(i,bp.getX(i)*(1-y*.85));bp.setZ(i,y*y*.3);}bladeGeo.computeVertexNormals();
  const grassMat=new THREE.MeshStandardMaterial({color:0xb7a86c,side:THREE.DoubleSide,roughness:.85});
  grassMat.onBeforeCompile=(shader)=>{
    shader.uniforms.uWind=grassTime;
    shader.vertexShader='uniform float uWind;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      float phase=instanceMatrix[3].x*1.6+instanceMatrix[3].z*.7;
      transformed.x += sin(uWind*1.25+phase)*.12*position.y*position.y;
      transformed.z += cos(uWind*.8+phase)*.08*position.y*position.y;`);
  };
  const grassCount=mobile?6500:11000,grass=new THREE.InstancedMesh(bladeGeo,grassMat,grassCount);
  const dummy=new THREE.Object3D(),col=new THREE.Color();
  const clusters:Array<[number,number,number]>=[];
  for(const side of[-1,1])for(const z of[-14,0,12])for(let c=0;c<20;c++)clusters.push([side*14.35+(rand()-.5)*.7,.5,z+(rand()-.5)*4.5]);
  for(let i=0;i<grassCount;i++){
    const c=clusters[i%clusters.length],r=rand()*.3,a=rand()*Math.PI*2;
    dummy.position.set(c[0]+Math.cos(a)*r,c[1],c[2]+Math.sin(a)*r);dummy.rotation.set((rand()-.5)*.5,rand()*6.28,(rand()-.5)*.5);dummy.scale.set(.5+rand()*1.4,.35+rand()*1.3,1);dummy.updateMatrix();grass.setMatrixAt(i,dummy.matrix);
    col.setHSL(.13+rand()*.05,.17+rand()*.25,.23+rand()*.24);grass.setColorAt(i,col);
  }grass.receiveShadow=true;grass.castShadow=true;scene.add(grass);
  // Airy seed heads catch the low sun.
  const headGeo=new THREE.SphereGeometry(.045,4,5);headGeo.scale(1,4,1);
  const heads=new THREE.InstancedMesh(headGeo,new THREE.MeshStandardMaterial({color:0xc8b58d,roughness:1}),550);
  for(let i=0;i<550;i++){const c=clusters[i%clusters.length];dummy.position.set(c[0]+(rand()-.5)*.65,1.35+rand()*.8,c[2]+(rand()-.5)*.65);dummy.rotation.set(rand()*.5,0,rand()*.3);dummy.scale.setScalar(.5+rand()*.7);dummy.updateMatrix();heads.setMatrixAt(i,dummy.matrix);}scene.add(heads);
  // A few hardy, wind-sculpted coastal trees complete the silhouette.
  const foliageMaterial=new THREE.MeshStandardMaterial({color:0x465039,roughness:.95,side:THREE.DoubleSide});
  const treeLeaves:THREE.BufferGeometry[]=[];
  const branchMaterial=new THREE.MeshStandardMaterial({color:0x645b49,map:m.rock.map,roughness:1});
  const branches:THREE.BufferGeometry[]=[];
  function branch(start:THREE.Vector3,dir:THREE.Vector3,len:number,radius:number,level:number){
    const end=start.clone().addScaledVector(dir,len);const mid=start.clone().add(end).multiplyScalar(.5);
    const cyl=new THREE.CylinderGeometry(radius*.55,radius,len,7,1);cyl.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),dir));cyl.translate(mid.x,mid.y,mid.z);branches.push(cyl);
    if(level>0){for(let i=0;i<3;i++){const a=rand()*6.28;const d=dir.clone().multiplyScalar(.55).add(new THREE.Vector3(Math.cos(a)*.7,.2+rand()*.3,Math.sin(a)*.7)).normalize();branch(end,d,len*(.56+rand()*.12),radius*.53,level-1);}}
    else for(let j=0;j<28;j++){
      const p=end.clone().add(new THREE.Vector3((rand()-.5)*1.2,(rand()-.5)*.6,(rand()-.5)*1.2));
      const g=new THREE.SphereGeometry(.12+rand()*.09,4,3);g.scale(1,.25,1.9);g.rotateY(rand()*6.28);g.rotateX(rand()*.6);g.translate(p.x,p.y,p.z);treeLeaves.push(g);
    }
  }
  branch(new THREE.Vector3(-18.5,-.2,-10),new THREE.Vector3(.18,1,.05).normalize(),2.7,.22,3);
  branch(new THREE.Vector3(18.3,-.2,2),new THREE.Vector3(-.3,1,.13).normalize(),2.9,.23,3);
  for(const [gs,mat]of [[branches,branchMaterial],[treeLeaves,foliageMaterial]] as const){const mesh=new THREE.Mesh(mergeGeometries(gs),mat);mesh.castShadow=mesh.receiveShadow=true;scene.add(mesh);gs.forEach(g=>g.dispose());}
  const sunDirection=new THREE.Vector3(-.6,.32,-.65).normalize();
  const water=new Water(new THREE.PlaneGeometry(12,19),{textureWidth:mobile?512:1024,textureHeight:mobile?512:1024,waterNormals:m.waterNormal,sunDirection,sunColor:0xffd9a1,waterColor:0x43655f,distortionScale:.18,alpha:1,fog:true});
  water.rotation.x=-Math.PI/2;water.position.set(0,-.085,-4.5);water.material.uniforms.size.value=7;
  water.material.fragmentShader=water.material.fragmentShader.replace('float rf0 = 0.3;','float rf0 = 0.15;').replace('vec3( 1.5, 1.0, 1.5 )','vec3( 0.65, 1.0, 0.65 )');
  scene.add(water);
  const ocean=new Water(new THREE.PlaneGeometry(2200,2200),{textureWidth:512,textureHeight:512,waterNormals:m.waterNormal,sunDirection,sunColor:0xffd9a1,waterColor:0x456569,distortionScale:3.2,alpha:1,fog:true});
  ocean.rotation.x=-Math.PI/2;ocean.position.y=-1.65;ocean.material.uniforms.size.value=2.6;scene.add(ocean);
  // Share a reflection guard: each surface renders the other's previous reflection,
  // so two different water elevations cannot recurse into one another.
  let reflecting=false;
  for(const surface of [water,ocean]){
    const reflect=surface.onBeforeRender.bind(surface);
    surface.onBeforeRender=(...args)=>{if(reflecting)return;reflecting=true;try{reflect(...args);}finally{reflecting=false;}};
  }
  // Small flocks travel slowly across the horizon.
  const birds=new THREE.Group();const birdMat=new THREE.MeshBasicMaterial({color:0x434748,side:THREE.DoubleSide});
  for(let i=0;i<13;i++){
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([-.5,0,.12,0,0,0,-.1,.1,0,0,0,0,.5,0,.12,.1,.1,0],3));g.computeVertexNormals();
    const bird=new THREE.Mesh(g,birdMat);bird.position.set(-38+rand()*48,8+rand()*7,-65-rand()*50);birds.add(bird);
  }scene.add(birds);
  return {water,ocean,obstacles,surfaces,grassTime,sculpture,update:(time:number)=>{
    water.material.uniforms.time.value=time*.23;grassTime.value=time;
    ocean.material.uniforms.time.value=time*.36;
    birds.children.forEach((b,i)=>{b.position.x+=.0035;b.rotation.z=Math.sin(time*2.5+i)*.12;});
  }};
}
