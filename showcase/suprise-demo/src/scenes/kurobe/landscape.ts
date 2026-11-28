import * as T from 'three';
import { Water } from 'three/addons/objects/Water.js';
import { seededRandom } from '../../shared/geometry';

const smooth = (lo: number, hi: number, value: number) => T.MathUtils.smoothstep(value, lo, hi);
const mix = T.MathUtils.lerp;
const fall = (value: number, width: number) => Math.exp(-Math.pow(value / width, 2));
const hash = (x: number, z: number) => {
  const n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return n - Math.floor(n);
};
function noise(x: number, z: number) {
  const ix = Math.floor(x), iz = Math.floor(z);
  const u = smooth(0, 1, x - ix), v = smooth(0, 1, z - iz);
  return mix(mix(hash(ix, iz), hash(ix + 1, iz), u), mix(hash(ix, iz + 1), hash(ix + 1, iz + 1), u), v);
}

function shores(x: number) {
  const bend = -24 * smooth(22, 98, x) + 9 * Math.sin(x * .038)
    - 68 * smooth(85, 162, Math.abs(x)) + 24 * smooth(176, 248, Math.abs(x));
  const near = -16.5 - 23 * fall(x-51,24) + bend + 2 * Math.sin(x * .11) - 3.8 * fall(x - 12, 14);
  const bar = 13 * fall(x + 22, 17) + 5 * fall(x - 74, 20);
  return { near, far: near - 40 + bar - 1.8 * Math.sin(x * .054) };
}

function farValley(x: number, z: number, d: number) {
  const shelf = 3 + 6 * fall(x + 30, 18) + 3 * noise(x * .074, -.1);
  const cliff = smooth(shelf, shelf + 8, d);
  const rockFace = cliff * (7 + 7 * noise(x * .082, z * .058));
  const foothill = Math.max(0, d - shelf) * (.7 + .25 * noise(x * .033, 20));
  const ridge = (foothill + rockFace) * (1 - .6 * smooth(78, 180, d));
  const summits = smooth(15, 80, d) * (37 * noise(x * .012, z * .012) + 14 * noise(x * .029, z * .035));
  const headwater = 26 * fall(x - (49 + Math.sin(z * .041) * 2.5), 12) * smooth(19, 50, d);
  const upperCut = 9 * fall(x - 80 + (z+133)*.22,6.5) * fall(z + 133,14);
  const lowPass = 1 - .62 * fall(x - 46, 74) * smooth(7, 42, d);
  return (d * .14 + ridge + summits - headwater) * lowPass + cliff * (noise(x * .24, z * .21) - .5) * 3 - upperCut;
}

function distanceToSegment(x: number, z: number, x1: number, z1: number, x2: number, z2: number) {
  const dx = x2 - x1, dz = z2 - z1;
  const t = T.MathUtils.clamp(((x - x1) * dx + (z - z1) * dz) / (dx * dx + dz * dz), 0, 1);
  return Math.hypot(x - x1 - dx * t, z - z1 - dz * t);
}

// A tributary cuts a notch across the old railway shelf. Its local axes follow the bridge deck.
const bridgeDX = 31 / Math.hypot(31, 15), bridgeDZ = 15 / Math.hypot(31, 15);
function tributary(x:number,z:number) {
  const cross = (x-10.5)*bridgeDX + (z+82.5)*bridgeDZ;
  const along = -(x-10.5)*bridgeDZ + (z+82.5)*bridgeDX;
  return { along, side:cross - Math.sin(along*.089)*2.5 - along*.07 };
}
function cutSideValley(x:number, z:number, d:number, slope:number) {
  const {along,side}=tributary(x,z), edge=Math.abs(side);
  const thalweg=Math.max(-.25,d*.13-.25);
  const shape=thalweg + smooth(.5,7,edge)*1.5 + smooth(5,15.6,edge)*8
    + smooth(11,16.1,edge)*2.5 + smooth(15.1,20.5,edge)*12.2;
  const influence=(1-smooth(19,32,edge))*(1-smooth(32,68,Math.abs(along)))*smooth(0,10,d);
  let h=mix(slope,shape,influence);
  if(along>7 && along<34) h=mix(Math.min(h,thalweg+smooth(.6,3.7,edge)),h,smooth(1,5,edge));
  // Excavated shelf immediately in front of the west tunnel, with natural rock above its vault.
  const portalAlong=(x+11.3)*bridgeDX+(z+93.05)*bridgeDZ;
  const portalAcross=-(x+11.3)*bridgeDZ+(z+93.05)*bridgeDX;
  if (Math.abs(portalAcross)<10 && portalAlong> -22 && portalAlong<6) {
    const cut=(1-smooth(3.7,9.7,Math.abs(portalAcross)))*(1-smooth(3.2,6,portalAlong))*smooth(-22,-14,portalAlong);
    h=mix(h,26.15+11*smooth(-.1,3.9,-portalAlong),cut);
  }
  const gully=distanceToSegment(x,z,-31,-96,-32,-78);
  h=mix(Math.min(h,18.8+gully*.20),h,smooth(2.1,8.2,gully));
  const shelf=distanceToSegment(x,z,-50,-97,-20,-94);
  return mix(Math.min(h,25.8),h,smooth(2.1,6,shelf));
}

export function groundHeight(x: number, z: number): number {
  const { near, far } = shores(x);
  if (z <= far) {
    const d = far - z;
    const slope = farValley(x, z, d);
    const bar=fall(x+22,17)*(1-smooth(8,21,d));
    return mix(cutSideValley(x,z,d,slope),d*.112 + .20*noise(x*.56,z*.61),bar);
  }
  if (z < near) {
    const w = (z - far) / (near - far);
    return -.1 - Math.pow(Math.sin(Math.PI * w), .88) * (4.2 + noise(x * .06, z * .05));
  }
  if (z < 5) {
    const d = z - near;
    const natural = 15.8 * smooth(.1, 5 - near, d) + (noise(x * .16, z * .12) - .5) * 2 * smooth(0, 4, d) * (1 - smooth(-3, 5, z));
    // A forested spur turns the river away from the station around its eastern bend.
    const headland=fall(x-56,24)*fall(z+23,13)*smooth(1,13,d);
    return natural+headland*(21+7*noise(x*.1,z*.08));
  }
  const ramp = Math.max(0, z - 43);
  const outer = 15.8 + ramp * (.38 + .45 * noise(x * .012, z * .013)) + 26 * smooth(1, 60, ramp) * noise(x * .022, z * .017);
  return outer + smooth(101, 150, Math.abs(x)) * (noise(x * .016, z * .027) * 14);
}

function groundTexture(scope: string, file: string, srgb = true) {
  const tex = new T.TextureLoader().load(new URL(`../assets/${scope}/${file}`, document.baseURI).href);
  tex.colorSpace = srgb ? T.SRGBColorSpace : T.NoColorSpace;
  tex.wrapS = tex.wrapT = T.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

function buildTerrain(scene: T.Scene, shingle: T.Texture, cliff: T.Texture, shade:T.Texture) {
  const forest = groundTexture('summertide', 'forest.jpg');
  const brush = groundTexture('kurobe/landscape','slope-leaves.webp');
  brush.wrapS=brush.wrapT=T.MirroredRepeatWrapping;
  const moss = groundTexture('kurobe/landscape','mossy-schist.webp');
  const material = new T.MeshStandardMaterial({ roughness: .96 });
  material.onBeforeCompile = shader => {
    shader.uniforms.riverGravel = { value: shingle };
    shader.uniforms.bedrock = { value: cliff };
    shader.uniforms.brushCover = { value: brush };
    shader.uniforms.mossySchist = { value: moss };
    shader.uniforms.canopyShade = { value: shade };
    shader.uniforms.forestFloor = { value: forest };
    shader.vertexShader = shader.vertexShader.replace('#include <common>', `#include <common>
      attribute vec2 surfaceMix;
      varying vec2 vSurface;
      varying vec3 vGround;`).replace('#include <begin_vertex>', `#include <begin_vertex>
      vGround=position; vSurface=surfaceMix;`);
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>
      uniform sampler2D riverGravel, bedrock, forestFloor, mossySchist, canopyShade, brushCover;
      vec3 rockMoss(vec3 p,vec3 weights){
        return texture2D(mossySchist,p.zy).rgb*weights.x
          + texture2D(mossySchist,p.xz).rgb*weights.y
          + texture2D(mossySchist,p.xy).rgb*weights.z;
      }
      varying vec2 vSurface;
      varying vec3 vGround;`).replace('#include <map_fragment>', `
      vec2 gravelUV=vGround.xz*.34;
      vec3 gravel=texture2D(riverGravel,gravelUV).rgb;
      gravel*=mix(vec3(.44,.51,.49),vec3(.83,.82,.76),smoothstep(-.3,2.1,vGround.y));
      vec2 faceUV=vec2(vGround.x*.139+vGround.z*.039, vGround.y*.154+vGround.z*.086);
      vec3 rock=texture2D(bedrock,faceUV).rgb;
      rock=mix(rock,vec3(dot(rock,vec3(.28,.53,.19))),.57)*vec3(1.06,1.11,1.07);
      rock*=vec3(.44,.45,.42);
      vec2 mossUV=vec2(vGround.x+vGround.z*.37, vGround.y*.93+vGround.z*.40)*.094;
      vec3 faceN=abs(normalize(cross(dFdx(vGround),dFdy(vGround))));
      vec3 weights=max(faceN*faceN,vec3(.001));
      weights/=weights.x+weights.y+weights.z;
      vec3 moss=rockMoss(vGround*.125,weights);
      vec3 broad=texture2D(mossySchist,mossUV*.28+vec2(.12,.48)).rgb;
      float damp=smoothstep(.03,.17,broad.g+.034*sin(vGround.x*.28+vGround.y*.18));
      rock=mix(rock,moss*.93,.48+.5*damp);
      vec3 soil=texture2D(forestFloor,vGround.xz*.023+vGround.y*.004).rgb*.36+vec3(.009,.014,.004);
      soil=mix(soil,moss*.78,vSurface.x*.89);
      vec2 brushUV=vec2(vGround.x*.037+vGround.z*.009,vGround.y*.073+vGround.z*.029);
      vec3 brush=texture2D(brushCover,brushUV+vec2(.044*sin(vGround.z*.19),.08*cos(vGround.x*.11))).rgb;
      float greenFace=smoothstep(1.4,8.,vGround.y+3.4*sin(vGround.x*.18+vGround.z*.14))*smoothstep(13.,34.,-vGround.z);
      soil=mix(soil,brush*.82,greenFace*.83);
      rock=mix(rock,brush*.73,greenFace*(.42+.36*damp));
      float paleBar=exp(-pow((vGround.x+22.)/22.,2.))*smoothstep(30.,46.,-vGround.z)*(1.-smoothstep(2.8,5.5,vGround.y));
      gravel*=1.+paleBar*1.23;
      float occlusion=texture2D(canopyShade,(vGround.xz+vec2(168.,160.))/vec2(336.,232.)).r;
      diffuseColor.rgb*=mix(mix(gravel,rock,vSurface.x),soil,vSurface.y)*mix(.30,1.,occlusion);`);
  };
  const grid = (lo: number, hi: number, nearLo: number, nearHi: number) => {
    const values = [lo];
    for (let v = lo; v < hi;) {
      v = Math.min(hi, v + (v >= nearLo && v < nearHi ? 1.6 : 5));
      values.push(v);
    }
    return values;
  };
  const xx = grid(-360, 360, -125, 130), zz = grid(-310, 215, -144, 57);
  const positions: number[] = [], weights: number[] = [], indices: number[] = [];
  for (const [j,z] of zz.entries()) {
    for (const [i,x] of xx.entries()) {
      const h = groundHeight(x,z), banks = shores(x);
      const d = Math.max(banks.far - z, z - banks.near);
      const grade = Math.hypot(groundHeight(x + 1,z) - h, groundHeight(x,z + 1) - h);
      const canopyFloor=noise(x*.067,z*.064);
      let forestMix = smooth(4.2, 11.2, d + canopyFloor*4) * (1 - smooth(1.08, 2.1, grade)*(.33+canopyFloor*.35));
      if (z<banks.far) forestMix*=1-fall(x+22,18)*(1-smooth(6,16,d));
      forestMix *= 1 - (1 - smooth(103, 130, Math.abs(x))) * smooth(4,7,z) * (1 - smooth(19.5,24.5,z));
      positions.push(x,h,z);
      weights.push(smooth(.43,1.03,grade) * smooth(2,7,d),forestMix);
      if (i+1 < xx.length && j+1 < zz.length) {
        const a = j*xx.length+i, b = a+xx.length;
        indices.push(a,b,a+1,a+1,b,b+1);
      }
    }
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(positions,3));
  geo.setAttribute('surfaceMix', new T.Float32BufferAttribute(weights,2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const land = new T.Mesh(geo, material);
  land.name = 'Gorge bedrock and alluvial shelves';
  land.receiveShadow = true;
  scene.add(land);
}

function buildStones(scene: T.Scene, texture: T.Texture) {
  const random = seededRandom(887), dummy = new T.Object3D();
  const material = new T.MeshStandardMaterial({ map: texture, roughness: .84, color: 0xcaccc9 });
  for (let family=0; family<5; family++) {
    const geo = new T.IcosahedronGeometry(1,1);
    const p = geo.attributes.position;
    for(let i=0;i<p.count;i++) {
      const x=p.getX(i), y=p.getY(i), z=p.getZ(i);
      const k=.81+.28*noise(x*3.8+family,z*3.4+y*1.3);
      p.setXYZ(i,x*k, Math.max(-.77, y*k)+.1*x, z*k);
    }
    geo.computeVertexNormals();
    const mesh = new T.InstancedMesh(geo,material,650);
    for (let i=0;i<mesh.count;i++) {
      let x=0,z=0,h=0,grade=0;
      for(let attempt=0;attempt<12;attempt++) {
        x=-195+random()*390;
        const banks=shores(x);
        z=random()<.64 ? banks.far+(random()-.55)*9 : banks.near+(random()-.40)*7;
        h=groundHeight(x,z);
        grade=Math.hypot(groundHeight(x+.8,z)-h,groundHeight(x,z+.8)-h);
        if(grade<.52 && h<2.35) break;
      }
      const s = .055+Math.pow(random(),3.5)*1.65;
      const slope=Math.hypot(groundHeight(x+.65,z)-h,groundHeight(x,z+.65)-h);
      const seat=Math.max(.01,Math.min(s*.42,slope*.38));
      dummy.position.set(x,h-.02*s-seat,z);
      dummy.rotation.set(random()*.28,random()*Math.PI*2,random()*.22);
      dummy.scale.set(s*(.73+random()*.65),s*(.37+random()*.45),s*(.67+random()*.45));
      dummy.updateMatrix(); mesh.setMatrixAt(i,dummy.matrix);
      const c=new T.Color().setHSL(.09+random()*.08,.03+random()*.08,.56+random()*.36);
      mesh.setColorAt(i,c);
    }
    mesh.receiveShadow=true;
    mesh.name='River cobbles';
    scene.add(mesh);
  }
}

type Tree = { x:number; y:number; z:number; w:number; h:number; species:number; flip:number; light:number; };
function buildForest(scene:T.Scene) {
  const atlas = groundTexture('kurobe/landscape','trees.webp');
  atlas.wrapS = atlas.wrapT = T.ClampToEdgeWrapping;
  atlas.anisotropy = 2;
  const shader = new T.ShaderMaterial({
    uniforms: T.UniformsUtils.merge([T.UniformsLib.fog, { treeAtlas:{ value:atlas } }]),
    fog:true,
    vertexShader: `
      attribute vec4 treePlace;
      attribute vec4 treeShape;
      varying vec2 vTreeUV;
      varying float vTreeLight;
      #include <common>
      #include <fog_pars_vertex>
      void main(){
        vec3 base=treePlace.xyz;
        vec3 view=normalize(cameraPosition-(base+vec3(0.,treeShape.x*.5,0.)));
        vec3 right=normalize(vec3(view.z,0.,-view.x)+vec3(.00001,0.,0.));
        vec3 up=vec3(0.,1.,0.);
        vec3 top=normalize(mix(up,normalize(cross(view,right)),smoothstep(.32,.97,view.y)*.88));
        float u=position.x+.5,v=position.y+.5;
        // A bowed crown gives each tree its own spatial depth on the hillside.
        float crown=sin(3.14159*u)*sin(3.14159*v)*.14*treePlace.w;
        vec3 pos=base+right*position.x*treePlace.w+top*v*treeShape.x+vec3(view.x,0.,view.z)*crown;
        vec4 mvPosition=viewMatrix*vec4(pos,1.);
        gl_Position=projectionMatrix*mvPosition;
        vTreeUV=vec2((mix(u,1.-u,treeShape.z)+mod(treeShape.y,4.))*.25,
          (v+1.-floor(treeShape.y*.25))*.5);
        vTreeLight=treeShape.w*mix(.74,1.03,v);
        #include <fog_vertex>
      }`,
    fragmentShader: `
      uniform sampler2D treeAtlas;
      varying vec2 vTreeUV;
      varying float vTreeLight;
      #include <common>
      #include <fog_pars_fragment>
      void main(){
        vec4 texel=texture2D(treeAtlas,vTreeUV);
        if(texel.a<.34) discard;
        gl_FragColor=vec4(texel.rgb*vTreeLight,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`
  });
  // UniformsUtils.clone deep-copies textures before their image has loaded.
  shader.uniforms.treeAtlas.value = atlas;
  const random=seededRandom(816134), chunks = new Map<string,Tree[]>();
  const plant = (x:number,z:number,shrub=false) => {
    const banks=shores(x), far=z<banks.far;
    const shoreDistance=far?banks.far-z:z-banks.near;
    const gravelShelf=far?fall(x+22,20)*10:0;
    if (shoreDistance< (shrub?1.3:5.3)+gravelShelf) return;
    if (!far && Math.hypot((x+28)*.84,z+23)<8) return;
    if (Math.abs(x)<135 && z>2 && z<22.8) return;
    if (z>18 && z<37 && Math.abs(x+29)<14) return;
    if (!far && z<5 && x> -106 && x<34 && !shrub) return;
    const fromBridge=distanceToSegment(x,z,-12,-93.3,31,-72.6);
    if (fromBridge<(shrub?2.6:6.5)) return;
    const notch=tributary(x,z);
    if (far && Math.abs(notch.along)<17 && Math.abs(notch.side)<13 && !shrub) return;
    if (distanceToSegment(x,z,-50,-97,-20,-94)<(shrub?2.1:4.1)) return;
    if (distanceToSegment(x,z,65,-129,95,-137)<(shrub?2.1:4.3)) return;
    if (!shrub && distanceToSegment(x,z,-31,-93,-31,-67)<6.6) return;
    if (!shrub && distanceToSegment(x,z,65,-112,77,-129)<5.2) return;
    const y=groundHeight(x,z);
    const steep=Math.hypot(groundHeight(x+1,z)-y,groundHeight(x,z+1)-y);
    if(steep>2.1 && random()<.55) return;
    if(shrub && steep>.98) return;
    if(shrub && steep>.68 && noise(x*.13,z*.11)<.73) return;
    const warmPatch=noise(x*.025+11,z*.022)*.73+noise(x*.065,z*.059)*.27;
    const s=random(), stand=noise(x*.046,z*.042);
    let species=s<.22?2:s<.41?3:s<.67?6:7;
    if(stand>.46 && s>.68) species=s>.90?4:5;
    if(warmPatch>.54 && s<.56) species=s<.14 && warmPatch>.62?1:0;
    if(shrub) species=s<.42?2:s<.78?6:5;
    const h=shrub?.65+random()*1.65:(5.4+random()*7.5)*(.62+stand*.76)*(species===7?1.19:1)*(far?.72:1);
    const w=h*(species===4||species===7?.8+random()*.24:.84+random()*.48);
    const shade=.61+.40*noise(x*.017+5,z*.023+9)+.17*stand;
    const t={x,y:y-(shrub?.06:.35)-Math.min(steep,2.8)*(shrub?.17:.23),z,w,h,species,flip:random()>.5?1:0,
      light:(.68+random()*.36)*shade*(far?1.02:.91)};
    const key=Math.floor(x/72)+','+Math.floor(z/72);
    if(!chunks.has(key))chunks.set(key,[]);
    chunks.get(key)!.push(t);
  };
  for(let z=-265;z<185;) {
    const dz=z< -170 || z>90?5.8:z< -40?2.63:3.55;
    for(let x=-320;x<320;) {
      const stride=Math.abs(x)>150 ? dz*1.35:dz;
      plant(x+(random()-.5)*stride*1.83,z+(random()-.5)*dz*1.78);
      x+=stride;
    }
    z+=dz;
  }
  for(let i=0;i<1600;i++) {
    const x=random()*430-215, banks=shores(x);
    const z=random()<.5?banks.near+random()*9:banks.far-random()*12;
    plant(x,z,true);
  }
  // Ferns and alder thickets follow small pockets of soil between exposed strata.
  for(let i=0;i<540;i++) {
    const cx=random()*275-135, banks=shores(cx), cz=banks.far-3-random()*68;
    const radius=1.8+random()*3.3;
    for(let j=0;j<15;j++){
      const angle=random()*Math.PI*2, spread=radius*Math.sqrt(random());
      plant(cx+Math.cos(angle)*spread,cz+Math.sin(angle)*spread*.65,true);
    }
  }
  const shadowCanvas=document.createElement('canvas');
  shadowCanvas.width=1008; shadowCanvas.height=696;
  const ctx=shadowCanvas.getContext('2d')!;
  ctx.fillStyle='#fff'; ctx.fillRect(0,0,shadowCanvas.width,shadowCanvas.height);
  const stamp=document.createElement('canvas');
  stamp.width=stamp.height=48;
  const stampContext=stamp.getContext('2d')!, radial=stampContext.createRadialGradient(24,24,0,24,24,24);
  radial.addColorStop(0,'rgba(0,0,0,.70)');
  radial.addColorStop(.43,'rgba(0,0,0,.40)');
  radial.addColorStop(1,'rgba(0,0,0,0)');
  stampContext.fillStyle=radial;stampContext.fillRect(0,0,48,48);
  const template=new T.PlaneGeometry(1,1,2,2);
  chunks.forEach(trees=>{
    const geo=new T.InstancedBufferGeometry();
    geo.setAttribute('position',template.attributes.position);
    geo.setIndex(template.index);
    const place:number[]=[],shape:number[]=[];
    const box=new T.Box3();
    for(const tree of trees) {
      place.push(tree.x,tree.y,tree.z,tree.w);
      shape.push(tree.h,tree.species,tree.flip,tree.light);
      if(Math.abs(tree.x)<168 && tree.z> -160 && tree.z<72) {
        const width=tree.w*3.05;
        ctx.drawImage(stamp,(tree.x+168)*3-width*.45,(tree.z+160)*3-width*.54,width,width*.92);
      }
      box.expandByPoint(new T.Vector3(tree.x,tree.y+tree.h*.5,tree.z));
    }
    geo.setAttribute('treePlace',new T.InstancedBufferAttribute(new Float32Array(place),4));
    geo.setAttribute('treeShape',new T.InstancedBufferAttribute(new Float32Array(shape),4));
    geo.instanceCount=trees.length;
    geo.boundingSphere=box.expandByScalar(13).getBoundingSphere(new T.Sphere());
    const stand=new T.Mesh(geo,shader);
    stand.name='Native mixed woodland';
    scene.add(stand);
  });
  const shade=new T.CanvasTexture(shadowCanvas);
  shade.flipY=false;
  shade.colorSpace=T.NoColorSpace;
  return shade;
}

function buildRiver(scene:T.Scene,gravel:T.Texture) {
  const positions:number[]=[], banks:number[]=[], index:number[]=[];
  const steps=320, widths=16;
  for(let i=0;i<=steps;i++) {
    const x=-365+i*730/steps, {near,far}=shores(x);
    for(let j=0;j<=widths;j++) {
      const t=j/widths, z=mix(far-.7,near+.7,t);
      positions.push(x,-z,0);
      banks.push(Math.max(0,Math.min(near-z,z-far)));
      if(i<steps&&j<widths) {
        const a=i*(widths+1)+j,b=a+widths+1;
        index.push(a,a+1,b,b,a+1,b+1);
      }
    }
  }
  const geom=new T.BufferGeometry();
  geom.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  geom.setAttribute('bankDistance',new T.Float32BufferAttribute(banks,1));
  geom.setIndex(index);geom.computeVertexNormals();
  const normal=groundTexture('shared','water-normal.jpg',false);
  const river=new Water(geom,{ textureWidth:384,textureHeight:384,waterNormals:normal,
    waterColor:0x258282,sunColor:0xffedcb,sunDirection:new T.Vector3(-.46,.78,.39).normalize(),
    distortionScale:1.55, fog:true });
  river.rotation.x=-Math.PI/2;river.position.y=.035;river.receiveShadow=true;
  river.material.uniforms.shingle={value:gravel};
  river.material.uniforms.size.value=2.9;
  river.material.vertexShader=river.material.vertexShader.replace('void main() {',
    'attribute float bankDistance; varying float depthFromShore; void main() {depthFromShore=bankDistance;');
  river.material.fragmentShader=river.material.fragmentShader.replace('void main() {',
    'uniform sampler2D shingle; varying float depthFromShore; void main() {')
    .replace('noise.xzy * vec3( 1.5, 1.0, 1.5 )','vec3(noise.x*.29,1.,noise.y*.37)')
    .replace('vec3 outgoingLight = albedo;',`
      float shallow=exp(-max(0.,depthFromShore)*.42);
      vec2 p=worldPosition.xz;
      vec2 surfaceUV=p*vec2(.043,.092)-vec2(time*.037,0.);
      float stream=texture2D(normalSampler,surfaceUV).r;
      vec3 bed=texture2D(shingle,p*.34+surfaceNormal.xz*.18).rgb*vec3(.62,.73,.64);
      vec3 deep=mix(vec3(.009,.086,.091),vec3(.022,.145,.137),stream);
      vec3 transmitted=mix(deep,bed,shallow)*mix(.72,1.,getShadowMask());
      float fresnel=.12+.75*pow(1.-theta,3.);
      vec3 reflected=reflectionSample/(vec3(1.)+reflectionSample*vec3(4.7,3.6,3.5));
      vec3 outgoingLight=mix(transmitted,reflected,fresnel)+min(specularLight,vec3(.35))*.10;
      float reef=(1.-smoothstep(.22,2.25,depthFromShore))*(.34+.66*stream);
      float broken=smoothstep(.56,.76,texture2D(normalSampler,p*vec2(.28,.63)-vec2(time*.12,0.)).r);
      outgoingLight+=vec3(.28,.32,.29)*reef*broken*.28;
    `);
  // All reflected scenery is static; ripples animate in the surface shader.
  // Holding a viewpoint therefore needs a single reflection pass.
  const reflect=river.onBeforeRender;
  const lastView=new T.Matrix4(), lastProjection=new T.Matrix4();
  let reflected=false;
  river.onBeforeRender=function(renderer,world,camera,geometry,material,group) {
    if(reflected && lastView.equals(camera.matrixWorld) && lastProjection.equals(camera.projectionMatrix)) return;
    reflect.call(this,renderer,world,camera,geometry,material,group);
    lastView.copy(camera.matrixWorld);
    lastProjection.copy(camera.projectionMatrix);
    reflected=true;
  };
  river.name='Kurobe River';scene.add(river);
  return river;
}

function buildTributary(scene:T.Scene,shingle:T.Texture) {
  const positions:number[]=[], texCoords:number[]=[], ids:number[]=[];
  const steps=117;
  for(let i=0;i<=steps;i++) {
    const along=-47+i*.63;
    const axis=Math.sin(along*.089)*2.5+along*.07;
    const cx=10.5+bridgeDX*axis-bridgeDZ*along;
    const cz=-82.5+bridgeDZ*axis+bridgeDX*along;
    const level=Math.max(.043,groundHeight(cx,cz)+.12);
    for(let side=0;side<3;side++) {
      const sign=side-1;
      const width=.74+noise(along*.13,side)*.74+smooth(13,25,along)*.67;
      const x=cx+sign*width*bridgeDX,z=cz+sign*width*bridgeDZ;
      positions.push(x,level,z);
      texCoords.push(side*.5,along*.32);
      if(i<steps && side<2){
        const a=i*3+side;
        ids.push(a,a+3,a+1,a+1,a+3,a+4);
      }
    }
  }
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  geometry.setAttribute('uv',new T.Float32BufferAttribute(texCoords,2));
  geometry.setIndex(ids);geometry.computeVertexNormals();
  const material=new T.MeshStandardMaterial({
    color:0x818e84,roughness:.38,side:T.DoubleSide,map:shingle,
  });
  const time={value:0};
  material.onBeforeCompile=shader=>{
    shader.uniforms.brookTime=time;
    shader.vertexShader=shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vBrookUV;')
      .replace('#include <uv_vertex>', '#include <uv_vertex>\nvBrookUV=uv;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform float brookTime; varying vec2 vBrookUV;')
      .replace('#include <map_fragment>', `
        vec2 p=vBrookUV;
        float eddy=texture2D(map,p*.79-vec2(.015,brookTime*.09)).r;
        vec3 bed=texture2D(map,p+eddy*.04).rgb;
        float foam=smoothstep(.46,.72,texture2D(map,p*vec2(1.7,2.3)-vec2(0.,brookTime*.18)).r)*smoothstep(.20,.5,eddy);
        diffuseColor.rgb=mix(vec3(.036,.11,.108)+bed*.26,vec3(.5,.57,.53),foam);
      `);
  };
  const brook=new T.Mesh(geometry,material);
  brook.receiveShadow=true;
  brook.name='Side ravine headwater';
  scene.add(brook);
  return time;
}

export function buildLandscape(scene:T.Scene): { update:(time:number)=>void } {
  const shingle=groundTexture('kurobe/landscape','shingle.webp');
  const stone=groundTexture('afterlight','rock-color.jpg');
  const shade=buildForest(scene);
  buildTerrain(scene,shingle,stone,shade);
  buildStones(scene,stone);
  const river=buildRiver(scene,shingle), brookTime=buildTributary(scene,shingle);
  return { update(time:number){river.material.uniforms.time.value=time*.44;brookTime.value=time;} };
}
