import * as T from 'three';
import type { Builder } from './builder';
import { seededRandom } from '../../shared/geometry';
import { noise } from '../../shared/procedural';

const TAU = Math.PI * 2;
const v = (x: number, y: number, z: number) => new T.Vector3(x, y, z);
const clamp = T.MathUtils.clamp;
const mix = T.MathUtils.lerp;
const streamX = (z: number) => -3.45 + 1.35 * Math.sin(z * .37 - .6) + .43 * Math.cos(z * .71);
const streamWidth = (z: number) => 1.61 + .35 * Math.sin(z * .49 + 1) + .2 * Math.cos(z * .93);
const groundHeight = (x: number, z: number) => {
  const bank = (Math.abs(x - streamX(z)) - streamWidth(z)) * 1.35;
  return mix(-.29, .115, T.MathUtils.smoothstep(bank, -.65, .48)) + (noise(x * 1.46, z * 1.46) - .5) * .055;
};

function surface(points: number[], uv: number[], faces: number[], colors?: number[]) {
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(points, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  if (colors) g.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  g.setIndex(faces);
  g.computeVertexNormals();
  return g;
}

function gravelTexture(random: () => number, stone: boolean) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const pixels = ctx.createImageData(512, 512);
  const coarse = new Float32Array(64 * 64);
  for (let i = 0; i < coarse.length; i++) coarse[i] = random();
  const value = (x: number, y: number) => coarse[(y & 63) * 64 + (x & 63)];
  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      const k = (y * 512 + x) * 4;
      const cx = x / 8, cy = y / 8, ix = cx | 0, iy = cy | 0;
      const n = mix(mix(value(ix, iy), value(ix + 1, iy), cx - ix), mix(value(ix, iy + 1), value(ix + 1, iy + 1), cx - ix), cy - iy);
      const grain = random();
      const mineral = (stone ? 103 : 117) + 55 * n + 57 * grain + (grain > .94 ? 28 : 0);
      pixels.data[k] = mineral * 1.04;
      pixels.data[k + 1] = mineral;
      pixels.data[k + 2] = mineral * .91;
      pixels.data[k + 3] = 255;
    }
  }
  ctx.putImageData(pixels, 0, 0);
  if (!stone) {
    // Individual gravel chips carry a cool underside and a single light-facing edge.
    for (let i = 0; i < 8500; i++) {
      const x = random() * 512, y = random() * 512;
      const w = .75 + random() ** 2 * 3.8, h = w * (.45 + random() * .4);
      const tone = 146 + Math.round(random() * 48);
      ctx.beginPath();
      ctx.ellipse(x, y, w, h, random() * Math.PI, 0, TAU);
      ctx.fillStyle = `rgb(${tone - 16} ${tone - 18} ${tone - 23})`;
      ctx.fill();
      ctx.fillStyle = `rgb(${tone + 18} ${tone + 15} ${tone + 9})`;
      ctx.fillRect(x - w * .5, y - h * .7, Math.max(1, w), .8);
    }
  }
  const tex = new T.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = T.RepeatWrapping;
  tex.colorSpace = T.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

type RockMaps = {stoneMap: T.Texture; stoneNormal: T.Texture};

function installMaterials(b: Builder, random: () => number, scanned?: RockMaps) {
  const granules = gravelTexture(random, false);
  const mineral = gravelTexture(random, true);
  const gravel = new T.MeshStandardMaterial({
    map: granules, bumpMap: granules, bumpScale: .018, roughness: .95, vertexColors: true
  });
  // Parallel rake grooves bend around two stones before merging on the open bank.
  gravel.onBeforeCompile = shader => {
    shader.vertexShader = 'varying vec3 gravelP;\n' + shader.vertexShader.replace(
      '#include <project_vertex>', '#include <project_vertex>\n gravelP = (modelMatrix * vec4(transformed,1.)).xyz;');
    shader.fragmentShader = 'varying vec3 gravelP;\n' + shader.fragmentShader.replace('#include <color_fragment>', `
      #include <color_fragment>
      vec2 p = gravelP.xz;
      float nearest = min(length((p-vec2(-7.5,4.1))*vec2(.83,1.)),length((p-vec2(.6,.15))*vec2(1.,.89)));
      float rakePhase = 59. * (max(.01,nearest) + .045 * sin(p.y*1.25) + .15*p.y);
      float rake = smoothstep(.43,.97,sin(rakePhase)) * (1. - smoothstep(.15,2.1,fwidth(rakePhase)));
      float dryBank = smoothstep(.025,.12,gravelP.y);
      diffuseColor.rgb *= 1. - .22*rake*dryBank;
    `);
  };
  b.material('riverGravel', gravel);
  b.material('gardenBoulder', new T.MeshStandardMaterial({
    map: scanned?.stoneMap ?? mineral, normalMap: scanned?.stoneNormal, normalScale: new T.Vector2(.84,.84), roughness: .82, vertexColors: true
  }));
  b.material('lanternGranite', new T.MeshStandardMaterial({
    color: 0xaaa9a1, map: scanned?.stoneMap ?? mineral, normalMap: scanned?.stoneNormal, normalScale: new T.Vector2(.26,.26), roughness: .88
  }));
  b.material('mapleBark', new T.MeshStandardMaterial({
    color: 0x817365, map: mineral, bumpMap: mineral, bumpScale: .012, roughness: .92
  }));
  b.material('mapleTwigs', new T.MeshStandardMaterial({ color: 0x987552, roughness: .78 }));
  b.material('dryLeaves', new T.MeshStandardMaterial({ vertexColors: true, roughness: .83, side: T.DoubleSide }));
  b.material('sedgeBlades', new T.MeshStandardMaterial({ vertexColors: true, roughness: .85, side: T.DoubleSide }));
  b.material('boundBamboo', new T.MeshStandardMaterial({ color: 0x807047, map: mineral, roughness: .68 }));
  b.material('caneCut', new T.MeshStandardMaterial({ color: 0xb2986d, roughness: .86 }));
  b.material('basinWater', new T.MeshStandardMaterial({ color: 0x34443d, roughness: .19, metalness: .55 }));

  const water = new T.MeshStandardMaterial({
    color: 0x475c54, roughness: .12, metalness: .07, transparent: true, opacity: .78, depthWrite: false
  });
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let phase: { value: number } | undefined;
  water.onBeforeCompile = shader => {
    phase = shader.uniforms.riverTime = {value: 0};
    shader.vertexShader = 'varying vec3 streamP;\n' + shader.vertexShader.replace(
      '#include <project_vertex>', '#include <project_vertex>\n streamP = (modelMatrix * vec4(transformed,1.)).xyz;');
    shader.fragmentShader = 'varying vec3 streamP; uniform float riverTime;\n' + shader.fragmentShader
      .replace('#include <normal_fragment_maps>', `
        #include <normal_fragment_maps>
        {
          vec2 p = streamP.xz;
          float swell = 7.3*p.y + 2.1*p.x + .7*sin(p.x*2.2-riverTime*.21) - riverTime*.54;
          float wave = 16.1*p.y - 5.4*p.x + .62*sin(p.y*3.2 + p.x*1.7 + riverTime*.4) - riverTime*.83;
          float chop = 29.2*p.y + 7.1*p.x + sin(p.x*6.8-riverTime*.33) + riverTime*.62;
          vec3 rippleNormal = normalize(vec3(.019*cos(swell)-.016*cos(wave)+.007*sin(chop),1.,
            .026*cos(swell)+.023*cos(wave)+.014*cos(chop)));
          normal = normalize(mat3(viewMatrix)*rippleNormal);
        }
      `)
      .replace('#include <opaque_fragment>', `
        #if defined(USE_ENVMAP) && defined(ENVMAP_TYPE_CUBE_UV)
        {
          // Locally projected reflection probe of the built hall, captured before the water is shown.
          vec3 N = inverseTransformDirection(normal,viewMatrix);
          vec3 V = normalize(cameraPosition-streamP);
          vec3 R = reflect(-V,N);
          // The probe sits between the shoji facade and the two timber galleries.
          vec3 wall = mix(vec3(-11.7,-.45,-7.9),vec3(12.3,10.9,11.5),step(vec3(0.),R));
          vec3 safeR = mix(vec3(-1.),vec3(1.),step(vec3(0.),R))*max(abs(R),vec3(.0001));
          vec3 hit = (wall-streamP)/safeR;
          float dist = min(hit.x,min(hit.y,hit.z));
          vec3 probeDir = normalize(streamP+R*max(0.,dist)-vec3(-3.75,1.47,3.55));
          vec3 reflectedHall = textureCubeUV(envMap,envMapRotation*probeDir,.10).rgb;
          float fresnel = .13+.79*pow(1.-max(0.,dot(N,V)),3.);
          outgoingLight = mix(outgoingLight,reflectedHall,fresnel);
        }
        #endif
        #include <opaque_fragment>
      `);
  };
  water.onBeforeRender = () => {
    if (phase) phase.value = reducedMotion.matches ? 0 : performance.now() * .001;
  };
  b.material('riverSurface', water);
}

function stream(b: Builder) {
  const p: number[] = [], uv: number[] = [], c: number[] = [], ix: number[] = [];
  const nx = 86, nz = 86;
  const dry = new T.Color(0xcaaf8f), wet = new T.Color(0x52605a);
  for (let j = 0; j <= nz; j++) {
    const z = mix(-12.1, 14.15, j / nz);
    for (let i = 0; i <= nx; i++) {
      const x = mix(-15.1, 15.1, i / nx);
      const h = groundHeight(x, z);
      p.push(x,h,z); uv.push(x * .78,z * .78);
      const color = wet.clone().lerp(dry, T.MathUtils.smoothstep(h,-.12,.14));
      const n = .47*noise(x*.44,z*.44)+.53*noise(x*2.1,z*2.1);
      color.multiplyScalar(.58 + .67*n); c.push(color.r,color.g,color.b);
      if (i < nx && j < nz) {
        const a = i + (nx+1)*j;
        ix.push(a,a+nx+1,a+1,a+1,a+nx+1,a+nx+2);
      }
    }
  }
  b.mesh('riverGravel',surface(p,uv,ix,c));
  const wp: number[] = [], wu: number[] = [], wi: number[] = [];
  for (let i=0;i<=105;i++) {
    const z = -12.08 + 26.19*i/105, mid = streamX(z), w = streamWidth(z)+.42;
    wp.push(mid-w,-.028,z,mid+w,-.028,z); wu.push(0,i*.2,1,i*.2);
    if(i<105) {const a=i*2; wi.push(a,a+2,a+1,a+1,a+2,a+3);}
  }
  b.mesh('riverSurface',surface(wp,wu,wi));
}

function boulder(b: Builder, random: () => number, x: number, y: number, z: number, w: number, h: number, d: number, moss = .5, tread = false) {
  const p: number[] = [], uv: number[] = [], ix: number[] = [], c: number[] = [];
  const seed = random()*1200, rows = tread ? 5 : 8, count = tread ? 10 : w>.65 ? 18 : 10;
  const tilt = (random()-.5) * .28, phase = random()*TAU;
  const slate = new T.Color().setHSL(.068 + random()*.047,.06+random()*.065,.66+random()*.25,T.SRGBColorSpace);
  const green = new T.Color(0x7e8a4e);
  for(let row=0;row<=rows;row++) {
    const t = row/rows, angleY = Math.PI*t;
    const radial = Math.max(.001,Math.sin(angleY)**(tread?.32:.67));
    for(let i=0;i<count;i++) {
      const a=TAU*i/count;
      const dx=Math.cos(a)*radial, dz=Math.sin(a)*radial;
      const ring=1+.19*Math.sin(2*a+phase)+.085*Math.sin(5*a+phase*2)+.17*(noise(dx*2+seed,dz*2+t*3)-.5);
      // Several intersecting cleavage planes give the older boulders fractured shoulders and skewed caps.
      const cut=Math.min(1,.79/(.0001+Math.abs(dx*1.15+dz*.4)),.88/(.0001+Math.abs(dz-.24*dx)));
      const px=dx*ring*cut*w*.5 + (1-t)*tilt*w*.57;
      const pz=dz*ring*cut*d*.5;
      const roughness=(tread?.06:.17)*h*(noise(dx*4+seed,dz*3)-.48);
      const sphereY=(.5+.5*Math.cos(angleY))*h;
      const cap=tread ? .84+.065*dx-.041*dz : Math.min(.83+.32*dx+.11*dz,.9-.4*dz+.12*dx);
      const py=Math.min(sphereY,cap*h)+roughness;
      p.push(px,py,pz);
      uv.push((px+pz*.41+py*.24)*1.33+seed,(pz+py*.91)*1.33+seed*.37);
      const mottling = noise(dx*2.2+seed,dz*2.2+py);
      const growth = clamp((1-t-.4 + (mottling-.5)*1.52)*moss*1.9,0,.93);
      const col = slate.clone().lerp(green,growth).multiplyScalar((.74+mottling*.42)*(.65+.35*(1-t)));
      c.push(col.r,col.g,col.b);
      if(row<rows){
        const a0=row*count+i, a1=row*count+(i+1)%count;
        ix.push(a0,a1,a0+count,a1,a1+count,a0+count);
      }
    }
  }
  const g=surface(p,uv,ix,c).toNonIndexed();
  const smooth=g.getAttribute('normal').clone();
  g.computeVertexNormals();
  const normals=g.getAttribute('normal'), positions=g.getAttribute('position'), rockUv=g.getAttribute('uv');
  const normal=new T.Vector3(),smoothNormal=new T.Vector3();
  for(let i=0;i<normals.count;i++) {
    normal.fromBufferAttribute(normals,i);
    const ax=Math.abs(normal.x),ay=Math.abs(normal.y),az=Math.abs(normal.z);
    const px=positions.getX(i),py=positions.getY(i),pz=positions.getZ(i);
    const u=ax>ay && ax>az ? pz : px, v=ay>ax && ay>az ? pz : py;
    rockUv.setXY(i, u*1.18+seed, v*1.18+seed*.37);
    normal.lerp(smoothNormal.fromBufferAttribute(smooth,i),tread?.71:.48).normalize();
    normals.setXYZ(i,normal.x,normal.y,normal.z);
  }
  b.mesh('gardenBoulder',g,x,y,z,0,random()*TAU);
}

function addRockery(b: Builder, random: () => number) {
  // Dominant, supporting and recumbent stones on each bank.
  const groups = [
    [-9.96,1.88,1.52,1.01,1.19],[-9.77,2.49,.98,.51,.79],[-10.24,1.21,.91,.58,.85],
    [-5.85,.18,1.05,.78,1.48],[-6.1,-.54,.85,.37,.67],[-2.85,-2.02,1.28,.87,1.04],
    [.55,.17,1.1,.72,.76],[.74,.88,.84,.32,.91],[-1.06,5.1,1.14,.77,.85],
    [-5.66,7.76,1.64,.84,1.08],[-6.43,7.53,.83,.44,.89],[-5.42,8.48,.97,.5,.96],
    [-4.94,-5.58,1.32,.88,1.19],[-6.5,10.18,1.23,.58,.95],[2.5,-3,.95,.58,.73],
    [8.1,5.62,1.33,.83,1.06],[8.65,5.77,.8,.52,.81],[-10.22,-3.7,1.57,.92,1.3]
  ];
  for(const [x,z,w,h,d] of groups) boulder(b,random,x,groundHeight(x,z)-h*.16,z,w,h,d,.86);
  // Gravel shoals sit in pockets of the bank, preserving stretches of open water.
  for(let i=0;i<25;i++){
    const z0=-10+random()*22, side=random()>.5?1:-1;
    const x0=streamX(z0)+side*(streamWidth(z0)-random()*.46);
    const count=5+Math.floor(random()*8);
    for(let j=0;j<count;j++){
      const x=x0+(random()-.5)*.95,z=z0+(random()-.5)*1.3,size=.09+random()**2*.48;
      boulder(b,random,x,groundHeight(x,z)-size*.08,z,size,size*(.25+random()*.38),size*(.64+random()*.58),.21);
    }
  }
  const path = [
    [1.78,8.6],[1.13,8.02],[.6,7.53],[-.01,7.04],[-.77,6.59],[-1.52,6.39],[-2.23,6.42],
    [-2.96,6.19],[-3.6,5.94],[-4.33,5.83],[-5.05,5.68],[-5.71,5.51],[-6.31,5.21],[-6.91,5.18]
  ];
  for(const [x,z] of path) {
    const top=.22+random()*.055, bottom=Math.min(groundHeight(x,z)-.015,top-.21);
    boulder(b,random,x,bottom,z,.71+random()*.12,top-bottom,.53+random()*.14,.15,true);
  }
}

function taperedBranch(points: T.Vector3[], radii: number[], sides: number) {
  const p: number[] = [], uv: number[] = [], ix: number[] = [];
  const tangent = points.at(-1)!.clone().sub(points[0]).normalize();
  const helper=Math.abs(tangent.y)<.83?v(0,1,0):v(1,0,0);
  let axis = tangent.clone().cross(helper).normalize();
  let length = 0;
  for(let i=0;i<points.length;i++) {
    const t = points[Math.min(i+1,points.length-1)].clone().sub(points[Math.max(0,i-1)]).normalize();
    axis.addScaledVector(t,-axis.dot(t)).normalize();
    const other=t.clone().cross(axis);
    if(i) length+=points[i].distanceTo(points[i-1]);
    for(let j=0;j<=sides;j++) {
      const a = j/sides*TAU, r=radii[i]*(1+.067*Math.cos(a*3));
      const pt=points[i].clone().addScaledVector(axis,Math.cos(a)*r).addScaledVector(other,Math.sin(a)*r);
      p.push(pt.x,pt.y,pt.z); uv.push(j/sides,length*2.8);
      if(i<points.length-1 && j<sides) {
        const a0 = i*(sides+1)+j; ix.push(a0,a0+1,a0+sides+1,a0+1,a0+sides+2,a0+sides+1);
      }
    }
  }
  return surface(p,uv,ix);
}

function maple(b: Builder, random: () => number) {
  const lp: number[] = [], lu: number[] = [], lc: number[] = [], lf: number[] = [];
  const rust = [0xa64f28,0xca7643,0x9d572e,0xaf6439,0x9c3c1c,0xc69a53].map(t=>new T.Color(t));
  function leaf(base:T.Vector3, size:number, orient:T.Euler) {
    const idx = lp.length/3, color = rust[Math.floor(random()*rust.length)];
    lp.push(base.x,base.y,base.z);lu.push(.5,.45);lc.push(color.r*.75,color.g*.71,color.b*.68);
    // Seven palmate lobes connect to a darker creased midrib.
    for(let j=0;j<15;j++){
      const angle=(j-7)*.365, r=(j%2===1?1:.42)*(.93-.039*Math.abs(j-7));
      const dx=Math.sin(angle)*r, dy=Math.cos(angle)*r;
      const pt=v(dx*size,dy*size,(.18*Math.abs(dx)+.1*dy)*size).applyEuler(orient).add(base);
      lp.push(pt.x,pt.y,pt.z);lu.push(.5+dx*.45,.45+.46*dy);lc.push(color.r,color.g,color.b);
      if(j>0) lf.push(idx,idx+j,idx+j+1);
    }
  }
  function limb(start:T.Vector3, heading:T.Vector3, length:number, radius:number, depth:number) {
    const bend=v((random()-.5)*.74,(random()-.35)*.29,(random()-.5)*.74);
    const direction=heading.clone().add(bend).normalize();
    const mid=start.clone().addScaledVector(heading,length*.46);
    const tip=mid.clone().addScaledVector(direction,length*.54);
    const coil=heading.clone().cross(direction).normalize().multiplyScalar(length*(.028+random()*.043));
    const points=[start,start.clone().lerp(mid,.41).add(coil),mid,mid.clone().lerp(tip,.56).addScaledVector(coil,-.49),tip];
    b.mesh(depth<2?'mapleTwigs':'mapleBark',taperedBranch(points,[radius,radius*.92,radius*.86,radius*.76,Math.max(.0021,radius*.68)],depth>2?7:4));
    if(depth===0){
      if(random()>.57) {
        const plane=random()*TAU;
        for(let j=0;j<3;j++) leaf(tip.clone().lerp(mid,.11+j*.24),.045+random()*.048,
          new T.Euler(Math.PI*.57+(random()-.5)*.94,plane+j*.91,(random()-.5)*2.2));
      }
      return;
    }
    const perp=direction.clone().cross(Math.abs(direction.y)>.91?v(1,0,0):v(0,1,0)).normalize().applyAxisAngle(direction,random()*TAU);
    const main=direction.clone().addScaledVector(perp,.12+random()*.26).normalize();
    const subsidiary=direction.clone().multiplyScalar(.63).addScaledVector(perp,-.45-random()*.49).add(v(0,.19,0)).normalize();
    limb(tip,main,length*(.67+random()*.14),radius*.69,depth-1);
    limb(mid.clone().lerp(tip,.36+random()*.39),subsidiary,length*(.53+random()*.17),radius*.53,depth-1);
  }
  const root = v(-9.35,.12,1.65);
  for(let i=0;i<8;i++){
    const a=i*TAU/8+random()*.24,r=.53+random()*.46;
    const end=root.clone().add(v(Math.cos(a)*r,-.1,Math.sin(a)*r));
    b.mesh('mapleBark',taperedBranch([root.clone().add(v(0,.2,0)),root.clone().lerp(end,.55),end],[.099,.055,.009],7));
  }
  // A multi-stemmed Japanese maple; forks start at different heights rather than a single hub.
  const trunks = [
    [v(-.32,1,.04),1.51,.113,6],[v(.27,1,-.27),1.37,.076,6],
    [v(-.64,.85,.24),1.17,.079,5],[v(.58,.92,.21),1.27,.068,6],
    [v(.08,.98,.18),1.65,.097,6],[v(.19,.88,-.66),1.12,.061,5]
  ] as const;
  for(const [direction,length,radius,depth] of trunks) limb(root.clone().add(v((random()-.5)*.28,.06,(random()-.5)*.27)),direction.clone().normalize(),length,radius,depth);
  for(let i=0;i<90;i++){
    const a=random()*TAU,r=Math.sqrt(random())*2.5;
    const x=root.x+Math.cos(a)*r,z=root.z+Math.sin(a)*r;
    leaf(v(x,groundHeight(x,z)+.013,z),.045+random()*.032,new T.Euler(-Math.PI/2+(random()-.5)*.1,0,random()*TAU));
  }
  b.mesh('dryLeaves',surface(lp,lu,lf,lc));
}

function sedges(b: Builder, random: () => number) {
  const p: number[]=[],uv: number[]=[],ix: number[]=[],c: number[]=[];
  const colors=[0x46523a,0x696b3c,0x807746,0x74794c,0x3f4b32].map(v=>new T.Color(v));
  const patches=[[-6.05,.46],[-10.06,1.47],[-9.32,1.44],[-5.47,7.7],[-1.2,4.98],[-4.69,-5.46],[-3.45,-2.26],[8.3,5.52]];
  for(const [px,pz] of patches){
    for(let tuft=0;tuft<7;tuft++){
      const x=px+(random()-.5)*.66,z=pz+(random()-.5)*.69,y=groundHeight(x,z)-.003;
      const r=.15+random()*.21;
      for(let blade=0;blade<21;blade++){
        const a=random()*TAU,w=.005+random()*.01,h=r*(.53+random()*.57),out=r*random(),i=p.length/3;
        const offx=(random()-.5)*r*.22,offz=(random()-.5)*r*.22,baseX=x+offx,baseZ=z+offz;
        const color=colors[Math.floor(random()*colors.length)];
        for(let s=0;s<=3;s++){
          const t=s/3,radial=out*t**1.4,up=h*Math.sin(t*1.94),width=w*(1-t*.99);
          const mx=baseX+Math.cos(a)*radial,mz=baseZ+Math.sin(a)*radial;
          for(const edge of [-1,1]){
            p.push(mx+edge*Math.sin(a)*width,y+up,mz-edge*Math.cos(a)*width);
            uv.push((edge+1)/2,t); const light=.5+t*.64;c.push(color.r*light,color.g*light,color.b*light);
          }
          if(s<3){const id=i+s*2;ix.push(id,id+2,id+1,id+1,id+2,id+3);}
        }
      }
    }
  }
  b.mesh('sedgeBlades',surface(p,uv,ix,c));
}

function fixtures(b: Builder) {
  const x=-7.35,z=6.05,y=.14,m='lanternGranite';
  // Yukimi-doro lantern: low tripod, pierced lamp chamber and a flared snow roof.
  for(let i=0;i<3;i++) {
    const a=i*TAU/3+.44;
    const foot=v(x+Math.cos(a)*.32,y,z+Math.sin(a)*.32);
    const shoulder=v(x+Math.cos(a)*.22,y+.44,z+Math.sin(a)*.22);
    b.mesh(m,taperedBranch([foot,foot.clone().lerp(shoulder,.45).add(v(Math.cos(a)*.044,0,Math.sin(a)*.044)),shoulder],[.11,.082,.115],8));
  }
  b.cylinder(m,x,y+.46,z,.37,.29,.105,8);
  b.cylinder(m,x,y+.535,z,.32,.37,.065,8);
  b.cylinder('lantern',x,y+.723,z,.185,.185,.31,8);
  for(let j=0;j<6;j++){
    const a=j*TAU/6;
    b.cylinder(m,x+Math.cos(a)*.242,y+.718,z+Math.sin(a)*.242,.058,.061,.326,5);
  }
  b.cylinder(m,x,y+.901,z,.282,.315,.054,6);
  const cap=new T.LatheGeometry([v2(.005,0),v2(.275,-.009),v2(.49,-.048),v2(.535,-.026),v2(.492,.01),v2(.343,.067),v2(.232,.128),v2(.116,.193),v2(.06,.215),v2(.001,.217)],12);
  b.mesh(m,cap,x,y+.956,z);
  b.cylinder(m,x,y+1.187,z,.083,.093,.055,12);
  b.mesh(m,new T.LatheGeometry([v2(.059,0),v2(.077,.036),v2(.061,.076),v2(.022,.112),v2(.001,.137)],12),x,y+1.209,z);
  // Chozubachi and hollow kakehi, tucked against the far bank.
  const bx=-8.15,bz=.48,base=.105;
  const bowl=new T.LatheGeometry([v2(.001,0),v2(.26,.005),v2(.38,.16),v2(.41,.33),v2(.36,.38),v2(.29,.365),v2(.255,.27),v2(.19,.15),v2(.001,.12)],36);
  b.mesh(m,bowl,bx,base,bz);
  b.cylinder('basinWater',bx,base+.322,bz,.277,.277,.004,40);
  const pipe=[v(bx-.69,base+.9,bz+.03),v(bx-.07,base+.765,bz+.018)];
  b.mesh('boundBamboo',taperedBranch(pipe,[.055,.052],16));
  const tip=pipe[1],dir=pipe[1].clone().sub(pipe[0]).normalize();
  const ring = new T.RingGeometry(.038,.052,18).applyQuaternion(new T.Quaternion().setFromUnitVectors(v(0,0,1),dir));
  b.mesh('caneCut',ring,tip.x,tip.y,tip.z);
  b.cylinder('boundBamboo',bx-.57,base+.47,bz+.035,.051,.061,.94,14);
  for(const h of [.32,.59,.79]) b.cylinder('walnut',bx-.57,base+h,bz+.035,.057,.057,.012,14);
  const thread=[tip.clone().add(v(.002,-.017,0)),tip.clone().add(v(.065,-.14,0)),tip.clone().add(v(.09,-.437,0))];
  b.mesh('basinWater',taperedBranch(thread,[.009,.006,.004],6));
  for(const r of [.043,.092,.155]) {
    const ripple=new T.TorusGeometry(r,.0017,4,36).rotateX(Math.PI*.5);
    b.mesh('basinWater',ripple,thread[2].x,base+.327,bz+.016);
  }
}

const v2=(r:number,h:number)=>new T.Vector2(r,h);

export function buildGarden(b: Builder, scanned?: RockMaps): void {
  const random = seededRandom(72913);
  installMaterials(b,random,scanned);
  stream(b);
  addRockery(b,random);
  maple(b,random);
  sedges(b,random);
  fixtures(b);
}
