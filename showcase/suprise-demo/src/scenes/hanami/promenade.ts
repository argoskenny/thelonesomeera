import * as T from 'three';
import { seededRandom } from '../../shared/geometry';
import { noise } from '../../shared/procedural';
import { Instances, V, surface, texture, tint, ribbon } from './promenade-geometry';
import { addStreetscape } from './streetscape';
import { addRiparianGrove } from './riparian-grove';
import { addRiver } from './river';
import { bridgeZ, stairTop, steps, treadDepth, westBank } from './crossing';

const zMin=-193, zMax=110;
const curve=(z:number)=>Math.max(0,-z-109)**2*.0025 + Math.max(0,z-36)**2*.0018;
const nearBank=(z:number)=>-10.5+Math.sin(z*.089)*.9+Math.sin(z*.23)*.35;
const farBank=(z:number)=>-24.3+Math.sin(z*.06+2)*1.7+Math.sin(z*.13)*.65;
const planter=(z:number)=>4.11+.27*Math.sin(z*.091)+.20*Math.sin(z*.18);
const colorMix=(a:T.Color,b:T.Color,f:number)=>a.clone().lerp(b,f);

function bankRock(seed:number) {
  const rand=seededRandom(seed),g=new T.IcosahedronGeometry(1,1);
  const p=g.attributes.position;
  for(let i=0;i<p.count;i++) {
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
    const n=.82+.25*noise(x*4+seed+y*3,z*3+.8*y);
    p.setXYZ(i,x*n,Math.max(-.72,y*n),z*n);
  }
  g.computeVertexNormals();
  // Blend the bevel normals along coincident vertices without breaking the UV seam.
  const normals=g.attributes.normal, summed=new Map<string,T.Vector3>(), keys:string[]=[];
  for(let i=0;i<p.count;i++){
    const key=[p.getX(i),p.getY(i),p.getZ(i)].map(n=>n.toFixed(4)).join();
    const vector=summed.get(key)??new T.Vector3();vector.add(V(normals.getX(i),normals.getY(i),normals.getZ(i)));summed.set(key,vector);keys.push(key);
  }
  for(let i=0;i<p.count;i++){
    const v=summed.get(keys[i])!.clone().normalize(),original=V(normals.getX(i),normals.getY(i),normals.getZ(i));
    v.lerp(original,.3+.12*rand()).normalize();normals.setXYZ(i,v.x,v.y,v.z);
  }
  return g;
}

function groundAndRiver(parent:T.Object3D) {
  const path=surface('#ffffff',texture('hanami/promenade-path.webp'),texture('night-market/asphalt-normal.jpg',false));
  path.normalScale.set(.19,.19); path.vertexColors=true;
  const soilMap=texture('hanami/promenade-soil.webp');
  path.onBeforeCompile=shader=>{
    shader.uniforms.grit={value:soilMap};
    shader.vertexShader='varying vec3 walkPoint;\n'+shader.vertexShader.replace('#include <worldpos_vertex>',
      '#include <worldpos_vertex>\nwalkPoint=(modelMatrix*vec4(transformed,1.)).xyz;');
    shader.fragmentShader='varying vec3 walkPoint; uniform sampler2D grit;\n'+shader.fragmentShader.replace('#include <map_fragment>',`
      #include <map_fragment>
      vec2 q=walkPoint.xz;vec3 deposits=texture2D(grit,q*.83).rgb;
      float roadBend=pow(max(0.,-q.y-109.),2.)*.0025+pow(max(0.,q.y-36.),2.)*.0018;
      float edge=min(q.x-roadBend+3.84,roadBend+4.01-q.x);
      float border=1.-smoothstep(.022,.17+deposits.g*.91,edge);
      diffuseColor.rgb=mix(diffuseColor.rgb,deposits*vec3(1.2,1.4,1.),border*.73);
    `);
  };
  
  const embankment=surface('#c3baa6',texture('hanami/promenade-masonry.webp'));embankment.vertexColors=true;
  const road=surface('#bbb6ad',texture('night-market/asphalt-color.jpg'));road.vertexColors=true;
  const field=surface('#b9c7a1',texture('hanami/promenade-meadow.webp'));field.vertexColors=true;
  const verge=surface('#d5d7ac',texture('hanami/promenade-meadow.webp'));verge.vertexColors=true;
  const stone=surface('#b2a89a',texture('hanami/promenade-rock.webp'));stone.vertexColors=true;
  ribbon(parent,path,20,215,zMin,zMax,(t,z)=>{
    const x=-3.84+7.85*t;
    const patina=.07*Math.sin(z*.45)+noise(z*.22,x*.43)*.12+noise(z*.8,x*1.6)*.06;
    const shade=.91+patina-(1-Math.min(t*4,1))*(.25+.21*noise(z*.5,x*.3));
    return [x+curve(z),0,shade];
  },3.4);
  ribbon(parent,verge,4,155,zMin,zMax,(t,z)=>[-5.96+2.14*t+curve(z),-.055+.025*Math.sin(t*4),.70+.32*noise(z*.2,t*4)],2.5);
  ribbon(parent,embankment,2,145,zMin,zMax,(t,z)=>[-8.22+2.26*t+curve(z),-2.52+2.45*t,.7+.4*noise(z*.22,t)],3.4);
  ribbon(parent,stone,5,165,zMin,zMax,(t,z)=>[nearBank(z)+( -8.22+curve(z)-nearBank(z))*t,-2.59+.083*Math.sin(t*3),.74+.21*noise(z*.3,t)],2.8);
  ribbon(parent,verge,6,150,zMin,zMax,(t,z)=>[4.01+t*5.0+curve(z),.025-.78*t+.032*Math.sin(z*.31)*Math.sin(Math.PI*t),.78+.39*noise(z*.38,t*7)],2.8);
  const mulch=surface('#e2d0b5',soilMap);mulch.vertexColors=true;
  ribbon(parent,mulch,4,180,zMin,zMax,(t,z)=>{
    const x=5.10+.20*Math.sin(z*.47)+t*(2.18+.21*Math.cos(z*.43));
    return [x+curve(z),.047-.156*(x-4),.88+.16*noise(t*6,z*.48)];
  },1.81);
  ribbon(parent,road,2,100,zMin,zMax,(t,z)=>[9.01+t*4.5+curve(z),-.755-.03*t,.90+.09*noise(z*.13,t)],4.8);
  ribbon(parent,field,16,100,zMin,zMax,(t,z)=>[13.51+t*330+curve(z),-.79-1.2*Math.min(t*30,1),.74+.32*noise(z*.04,t*47)],5);
  ribbon(parent,verge,5,145,zMin,zMax,(t,z)=>[farBank(z)-4.8+t*4.8,-1.56-t*.99,.78+.24*noise(z*.21,t*3)],2.8);
  ribbon(parent,field,15,80,zMin,zMax,(t,z)=>[-350+(350+farBank(z)-4.8)*t,-1.56,.82+.26*noise(z*.09,t*85)],5);
  return addRiver(parent,zMin,zMax);
}

function petalLitter(parent:T.Object3D) {
  const rand=seededRandom(5549),positions:number[]=[],colors:number[]=[];
  const tones=['#d0a2a9','#e4c2c4','#ded1cb','#edcdd6','#a97b79'].map(x=>new T.Color(x));
  for(let i=0;i<14700;i++){
    const z=-149+rand()*212, u=rand(),x=-3.82+7.80*(i%5?u**3:u)+curve(z);
    if(noise(x*.77,z*.46)<.3 && rand()<.72) continue;
    const length=.013+rand()**2*.020,width=length*(.47+rand()*.23),angle=rand()*Math.PI*2;
    const dx=Math.cos(angle)*length,dz=Math.sin(angle)*length,wx=-Math.sin(angle)*width,wz=Math.cos(angle)*width;
    const y=.006+.003*rand(), col=tones[Math.floor(rand()*tones.length)];
    positions.push(x-dx,y,z-dz,x+wx,y+.001,z+wz,x+dx,y,z+dz, x-dx,y,z-dz,x+dx,y,z+dz,x-wx,y,z-wz);
    for(let j=0;j<6;j++) colors.push(col.r,col.g,col.b);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  const m=new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide});
  parent.add(new T.Mesh(g,m));
}

function fenceSign() {
  const c=document.createElement('canvas');c.width=256;c.height=334;const ctx=c.getContext('2d')!;
  ctx.fillStyle='#dbd6c8';ctx.fillRect(0,0,256,334);
  ctx.fillStyle='#ad4a57';ctx.fillRect(12,14,232,83);
  ctx.font='bold 46px sans-serif';ctx.fillStyle='#fff4e8';ctx.textAlign='center';ctx.fillText('お願い',128,76);
  ctx.fillStyle='#574e42';ctx.font='bold 29px sans-serif';ctx.fillText('桜を大切に',128,161);
  ctx.font='20px sans-serif';ctx.fillText('枝を折らないで',128,213);ctx.fillText('ください',128,248);
  ctx.fillStyle='#a5907d';ctx.fillRect(31,279,194,3);ctx.fillStyle='#716c62';ctx.font='16px sans-serif';ctx.fillText('河川遊歩道',128,309);
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return surface('#ffffff',t);
}

function infrastructure(parent:T.Object3D,pool:Instances) {
  const rand=seededRandom(17843), iron=surface('#43433f'), cap=surface('#50514f'),concrete=surface('#9f9b90');
  iron.roughness=.44;iron.metalness=.17;cap.roughness=.38;cap.metalness=.23;
  const base=surface('#9b9485'),grate=surface('#635f53');
  const ball=new T.SphereGeometry(.5,12,8), v=V, placard=fenceSign(), pane=new T.PlaneGeometry();
  let i=0;
  for(let z=-174;z<95;z+=2.4,i++) {
    const x=-3.78+curve(z),x2=-3.78+curve(z+2.4);
    pool.add(pool.pipeGeometry,iron,x,.548,z,.082,1.13,.082);
    pool.add(ball,cap,x,1.152,z,.132,.129,.132);
    pool.add(pool.pipeGeometry,cap,x,1.087,z,.104,.025,.104);
    pool.add(pool.pipeGeometry,cap,x,.057,z,.157,.09,.157);
    if (Math.abs(z+1.2-bridgeZ)<.1 || Math.abs(z+1.2-60)<.1) continue;
    pool.rod(iron,v(x,1.018,z),v(x2,1.018,z+2.4),.068);
    pool.rod(iron,v(x,.151,z),v(x2,.151,z+2.4),.044);
    for(let n=1;n<13;n++) {
      const f=n/13,diameter=.022+(n%4===0?.003:0);
      pool.box(iron,x+(x2-x)*f,.584,z+2.4*f,diameter,.86,diameter);
    }
    if(i%26===0 || Math.abs(z-6)<.3) {
      const xx=x+.078;
      const signZ=z+(Math.abs(z-6)<.3?1.74:.58);
      pool.box(concrete,xx,.772,signZ,.035,.422,.343);
      pool.add(pane,placard,xx+.019,.772,signZ,.327,.409,1,Math.PI/2);
    }
  }
  // Expansion cuts and drainage covers sit flush with the pavement.
  const seams:number[]=[];
  for(let z=-168;z<100;z+=6.9+rand()*2.8){
    if(rand()<.47)continue;
    const lean=(rand()-.5)*.42;
    for(let n=0;n<7;n++){
      const x=-3.72+n*1.11, zz=z+lean*n*.2+.009*Math.sin(n*2);
      seams.push(x+curve(z),.002,zz,x+1.11+curve(z),.002,z+lean*(n+1)*.2+.009*Math.sin((n+1)*2));
    }
  }
  const sg=new T.BufferGeometry();sg.setAttribute('position',new T.Float32BufferAttribute(seams,3));
  parent.add(new T.LineSegments(sg,new T.LineBasicMaterial({color:'#6d5850',transparent:true,opacity:.23})));
  for(let z=-156;z<=88;z+=19.6){
    const x=3.65+curve(z);
    pool.box(base,x,.004,z,.33,.008,.55);
    for(let j=0;j<8;j++) pool.box(grate,x,.010,z-.20+j*.057,.24,.006,.021);
  }
  // Low boundary walls break at the lanes leading up to the village houses.
  const gardenWall=surface('#939891',texture('hanami/promenade-masonry.webp'));
  gardenWall.side=T.DoubleSide;
  const wallVertices:number[]=[], wallUVs:number[]=[];
  for(let z=-172;z<92;) {
    const length=10+rand()*14, x=16.8+rand()*2.1+curve(z), h=.25+rand()*.53;
    wallVertices.push(x,-1.90,z,x,-1.90,z+length,x,h,z+length,x,-1.90,z,x,h,z+length,x,h,z);
    wallUVs.push(0,0,length/3.2,0,length/3.2,(h+1.9)/3.2,0,0,length/3.2,(h+1.9)/3.2,0,(h+1.9)/3.2);
    pool.box(base,x+.14,h+.041,z+length*.5,.39,.09,length+.15);
    z+=length+3.4+rand()*4.5;
  }
  const wg=new T.BufferGeometry();wg.setAttribute('position',new T.Float32BufferAttribute(wallVertices,3));
  wg.setAttribute('uv',new T.Float32BufferAttribute(wallUVs,2));wg.computeVertexNormals();
  const walls=new T.Mesh(wg,gardenWall);walls.receiveShadow=walls.castShadow=true;parent.add(walls);
  const bollard=surface('#888d89'), reflector=surface('#d3cbb8');bollard.metalness=.34;
  for(const z of [-101.5,-69,-43,-24,4.2,24,47]) {
    const x=planter(z)+.09+curve(z);
    pool.add(pool.pipeGeometry,bollard,x,.27,z,.115,.55,.115);
    pool.add(pool.pipeGeometry,reflector,x,.47,z,.118,.073,.118);
    pool.add(ball,bollard,x,.545,z,.114,.035,.114);
  }
  // A short transverse agricultural bridge with concrete abutments at the far bend.
  for(const z of [bridgeZ,60]) {
    const bridge=surface('#948e80'),rim=surface('#777a71');
    const eastEnd=-3.4+curve(z);
    pool.box(bridge,(-30+eastEnd)*.5,-.11,z,eastEnd+30,.60,2.86);
    if(z===bridgeZ){
      for(let i=0;i<steps;i++){
        const top=stairTop(i), foot=westBank-.14;
        pool.box(bridge,-30-(i+.5)*treadDepth,(top+foot)*.5,z,treadDepth+.004,top-foot,2.58);
      }
      for(const dz of [-1.2,1.2]){
        pool.rod(rim,v(-30,1.08,z+dz),v(-33.6,westBank+.91,z+dz),.073);
        for(const i of [0,4,9])pool.rod(rim,v(-30-(i+.5)*treadDepth,stairTop(i),z+dz),v(-30-(i+.5)*treadDepth,stairTop(i)+.94,z+dz),.052);
      }
    }
    for(const x of [-29.4,-19,-5.2])pool.box(bridge,x,-1.38,z,.70,2.47,2.66);
    for(const s of [-1,1]){
      const side=z+s*1.38;pool.box(rim,(-30+eastEnd)*.5,.99,side,eastEnd+30,.11,.09);
      pool.box(rim,(-30+eastEnd)*.5,.54,side,eastEnd+30,.05,.06);
      for(let n=0;n<=13;n++)pool.box(bridge,-30+n*2,.54,side,.12,.99,.12);
    }
  }
}

function planting(pool:Instances) {
  const rand=seededRandom(8591), rockTex=texture('hanami/promenade-rock.webp');
  const rockMat=surface('#dad8cf',rockTex),rockShapes=[23,91,171].map(bankRock);
  const minRock=new T.Color('#888785'),maxRock=new T.Color('#d9d5ca');
  const rock=(x:number,y:number,z:number,w:number,h:number,d:number)=>{
    const shade=colorMix(minRock,maxRock,rand());
    pool.add(rockShapes[Math.floor(rand()*rockShapes.length)],rockMat,x,y,z,w,h,d,rand()*6.28,(rand()-.5)*.35,(rand()-.5)*.3,shade);
  };
  const sprig=texture('hanami/promenade-sprays.webp');
  const greenCards=new T.MeshLambertMaterial({map:sprig,alphaTest:.48,side:T.DoubleSide,color:'#ffffff'});
  greenCards.userData.castShadow=false; const sprays:T.PlaneGeometry[]=[];
  for(let n=0;n<3;n++){
    const g=new T.PlaneGeometry(1,1);g.translate(0,.5,0);
    const uv=g.attributes.uv;
    for(let j=0;j<uv.count;j++)uv.setX(j,(n+.008+.984*uv.getX(j))/3);
    sprays.push(g);
  }
  for(let z=-172;z<86;z+=.37+rand()*.25) {
    if(Math.sin(z*.141+.3)<-.79 || Math.abs(z+104)<2)continue;
    const h=.25+.07*Math.sin(z*.51)+rand()*.15;
    rock(planter(z)+curve(z)+.03*rand(),.055,z,.23+rand()*.13,h,.25+rand()*.11);
  }
  for(let i=0;i<1480;i++){
    const z=zMin+rand()*(zMax-zMin),isNear=rand()<.52;
    const x=isNear?nearBank(z)+rand()*1.58:farBank(z)+rand()*.9-1;
    const s=.045+rand()**2*.37;
    rock(x,-2.46,z,s*(1.0+rand()*.9),s*.68,s*(1+rand()*.48));
  }
  // Layered banks of young photinia and low azaleas; every card is a cut-out
  // stem with individual pointed leaves. Varying the silhouette avoids boxed hedges.
  function shrub(x:number,y:number,z:number,r:number,h:number,reddish:boolean) {
    const count=Math.floor(10+r*5);
    for(let j=0;j<count;j++){
      const angle=rand()*Math.PI*2, f=Math.sqrt(rand()), xx=x+Math.cos(angle)*r*f,zz=z+Math.sin(angle)*r*f;
      const height=h*(.44+.55*Math.sqrt(1-f*f))*(.88+rand()*.23);
      const sel=reddish&&rand()>.18?1:rand()>.68?2:0;
      const tinting=reddish?new T.Color(.67+rand()*.30,.64+rand()*.22,.62+rand()*.21):tint(.60+rand()*.50);
      pool.add(sprays[sel],greenCards,xx,y,zz,.47+r*.44,height,1,angle,0,(rand()-.5)*.38,tinting);
    }
  }
  for(let z=-169;z<91;z+=.50+rand()*.48){
    const f=planter(z),x=f+.66+rand()*1.75+curve(z),size=.50+rand()*.49;
    if(Math.sin(z*.13+.2)<-.43 || Math.abs(z+104)<3)continue;
    shrub(x,-.18,z,size,.54+.31*rand(),Math.sin(z*.051+1)>.1);
  }
  for(let z=-166;z<98;z+=1.52+rand()*1.9){
    shrub(-29.8-rand()*3,-1.64,z,1.13+rand()*.8,1.3+rand()*1.7,false);
    if(rand()>.3)shrub(13+curve(z)+rand()*4,-.99,z,.80+rand()*.7,.96+rand()*.9,false);
  }
  // Dry fountain grass blades, spears of new grass, and a few oat-coloured plumes.
  const blades:number[]=[], colors:number[]=[];
  const bladeTones=['#707740','#737c49','#77824c','#7e8656','#616d37','#9a956b','#a49e73'].map(v=>new T.Color(v));
  function tussock(x:number,y:number,z:number,h:number,r:number,amount:number){
    for(let j=0;j<amount;j++){
      const a=rand()*6.28, dx=Math.sin(a),dz=Math.cos(a), f=rand(),xx=x+dx*r*.45*f, zz=z+dz*r*.45*f;
      const rise=h*(.54+rand()*.75), lean=r*(.25+rand()*1.52),w=.009+rand()*.014;
      const mx=xx+dx*lean*.24,mz=zz+dz*lean*.24, my=y+rise*.74;
      blades.push(xx-dz*w,y,zz+dx*w, mx-dz*w*.66,my,mz+dx*w*.66,xx+dz*w,y,zz-dx*w,
        xx+dz*w,y,zz-dx*w,mx-dz*w*.66,my,mz+dx*w*.66,mx+dz*w*.66,my,mz-dx*w*.66,
        mx-dz*w*.66,my,mz+dx*w*.66,xx+dx*lean,y+rise,zz+dz*lean,mx+dz*w*.66,my,mz-dx*w*.66);
      const c=bladeTones[Math.floor(rand()*bladeTones.length)];
      for(let k=0;k<9;k++){const v=k===0||k===2||k===3?.52:1;colors.push(c.r*v,c.g*v,c.b*v);}
    }
  }
  for(let i=0;i<1120;i++){
    const z=-158+rand()*245,right=i%3!==0,xx=right?4.17+rand()*4.7:-3.93-rand()*1.72;
    const h=right?.08+rand()**1.8*.40:.07+rand()**1.7*.30;
    tussock(xx+curve(z),right?.022-.154*(xx-4):-.056,z,h,h*.42,15+Math.floor(rand()*13));
  }
  for(let i=0;i<400;i++){
    const z=-173+rand()*260, near=rand()<.5, x=near?nearBank(z)+rand()*.46:farBank(z)-rand()*1.86;
    tussock(x,-2.48,z,.32+rand()*.72,.24+rand()*.19,17);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(blades,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  const grass=new T.Mesh(g,new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide}));
  return grass;
}

export function addPromenade(scene:T.Scene):(elapsedSeconds:number)=>void {
  const parent=new T.Group();parent.name='River walk, riparian garden and town';scene.add(parent);
  const pool=new Instances(parent);
  const update=groundAndRiver(parent);
  infrastructure(parent,pool);
  parent.add(planting(pool)); addRiparianGrove(pool);petalLitter(parent);addStreetscape(parent,pool);pool.flush();
  return update;
}
