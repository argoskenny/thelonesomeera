import * as THREE from 'three';

type Vector = THREE.Vector3;
type Strip = { positions: number[]; colors: number[]; uvs: number[]; indices: number[] };
const TAU = 2 * Math.PI;
const up = new THREE.Vector3(0, 1, 0);
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const emptyStrip = (): Strip => ({ positions: [], colors: [], uvs: [], indices: [] });

function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = Math.imul(state, 1664525) + 1013904223 | 0;
    return (state >>> 0) / 4294967296;
  };
}

function meshGeometry(strip: Strip, normals: boolean) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(strip.positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(strip.colors, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(strip.uvs, 2));
  geometry.setIndex(strip.indices);
  if (normals) geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function makeCherry(seed: number, wood: THREE.Material, bloom: THREE.Material) {
  const random = seeded(seed);
  const range = (low: number, high: number) => low + (high - low) * random();
  const bark = emptyStrip();
  const flowers = emptyStrip();
  const thinning = seeded(seed + 6741);

  // A continuous cross-section follows each centreline. Wide root flares and asymmetrical
  // cambium ridges are built into the ring rather than represented by intersecting cylinders.
  function limb(points: Vector[], radii: number[], sides: number) {
    const first = bark.positions.length / 3;
    const phase = random() * TAU;
    const uvOrigin = random();
    let distance = 0;
    const initial = points[1].clone().sub(points[0]).normalize();
    let frameX = new THREE.Vector3().crossVectors(initial, Math.abs(initial.y) > .93 ? v(0, 0, 1) : up).normalize();
    for (let i = 0; i < points.length; i++) {
      const tangent = points[Math.min(i + 1, points.length - 1)].clone().sub(points[Math.max(i - 1, 0)]).normalize();
      frameX.addScaledVector(tangent, -frameX.dot(tangent)).normalize();
      const frameY = new THREE.Vector3().crossVectors(tangent, frameX);
      if (i > 0) distance += points[i].distanceTo(points[i - 1]);
      for (let side = 0; side <= sides; side++) {
        const t = side / sides * TAU;
        const uneven = 1 + .11 * Math.sin(t * 3 + phase + i * .29) + .065 * Math.sin(t * 5 - phase);
        const normal = frameX.clone().multiplyScalar(Math.cos(t)).addScaledVector(frameY, Math.sin(t));
        const p = points[i].clone().addScaledVector(normal, radii[i] * uneven);
        bark.positions.push(p.x, p.y, p.z);
        bark.uvs.push(uvOrigin + side / sides * Math.max(.19, radii[0] * 8.3), distance * 1.75);
        const shade = .77 + .14 * Math.sin(t * 3 + phase) + Math.max(0, normal.y) * .13;
        bark.colors.push(shade * .93, shade * .89, shade * .94);
        if (i && side) {
          const d = first + i * (sides + 1) + side;
          const a = d - sides - 2, b = a + 1, c = d - 1;
          bark.indices.push(a, b, c, b, d, c);
        }
      }
    }
  }

  // Each scaffold tapers continuously into the next generation. The first control
  // handle follows the parent tangent and the last one bends under the bloom weight.
  function sweep(start: Vector, heading: number, reach: number, rise: number,
    radius: number, endRadius: number, segments: number, sides: number, parentTangent?: Vector) {
    const forward = v(Math.cos(heading), 0, Math.sin(heading));
    const lateral = v(-forward.z, 0, forward.x);
    const target = forward.clone().multiplyScalar(reach).addScaledVector(up, rise);
    const direction = target.clone().normalize();
    const handle = parentTangent ? parentTangent.clone().lerp(direction, .49).normalize() : direction;
    const bend = range(-.34, .34) * reach;
    const sway = range(-.24, .24) * reach;
    const arch = range(-.09, .28) * reach;
    const firstHandle = start.clone().addScaledVector(handle, target.length()*.33).addScaledVector(lateral,bend*.30);
    const secondHandle = start.clone().addScaledVector(target,.75)
      .addScaledVector(lateral,bend*.73 + sway*.62).addScaledVector(up,arch*1.6);
    const spline = new THREE.CubicBezierCurve3(start,firstHandle,secondHandle,start.clone().add(target));
    const points = spline.getPoints(segments);
    const radii = points.map((_, i) => THREE.MathUtils.lerp(radius, endRadius, Math.pow(i / segments, .73)));
    limb(points, radii, sides);
    return points;
  }

  type Joint = { p: Vector; dir: Vector };
  function joint(points: Vector[], t: number): Joint {
    const i = Math.max(1, Math.min(Math.round(t * (points.length - 1)), points.length - 1));
    return {p:points[i], dir:points[i].clone().sub(points[i-1]).normalize()};
  }

  // Two scales of photographic sprays: dense flowering boughs with fine dark twig
  // networks and separate, smaller spurs. Most of the illuminated tips are seen
  // against the darker inner canopy, rather than every flower facing the same light.
  function flowerSpray(start: Vector, direction: number, length: number, lift: number, outer: boolean) {
    const along = v(Math.cos(direction), lift, Math.sin(direction)).normalize();
    const roll = range(-1.27, 1.27);
    const across = new THREE.Vector3().crossVectors(along, up).normalize().applyAxisAngle(along, roll);
    const curved = new THREE.Vector3().crossVectors(across, along).normalize();
    length *= outer ? 1.04 : .97;
    const width = length * (outer ? range(1.50, 1.83) : range(.73, 1.05));
    const first = flowers.positions.length / 3;
    const radius = Math.hypot(start.x,start.z);
    const patch = Math.sin(start.x * 1.8 + start.z * .83) * .10 + Math.sin(start.z * 1.64 - start.y * 1.30) * .08;
    const light = THREE.MathUtils.clamp(.13 + start.y * .118 + radius * .062 + start.x * .045 + patch + range(-.11,.12), .20, 1.10);
    const blush = THREE.MathUtils.clamp(.87 + (light - .30) * .22 + range(-.043,.025),.81,1.06);
    const flip = random() > .5;
    if (thinning() < (radius < 2.35 && start.y < 3.85 ? .18 : .025)) return;
    const uStart = outer ? .5 : 0;
    for (let row = 0; row < 3; row++) {
      const t = row * .5;
      const crown = start.clone().addScaledVector(along, length * t).addScaledVector(curved, length * .19 * Math.sin(t * Math.PI));
      for (let col = 0; col < 2; col++) {
        const rootU = outer ? (flip ? .62 : .38) : .5;
        const point = crown.clone().addScaledVector(across, width * (col - rootU));
        flowers.positions.push(point.x, point.y, point.z);
        flowers.uvs.push(uStart + .001 + .498 * (flip ? 1-col : col), t);
        const value = light * (.79 + t * .33);
        flowers.colors.push(value * 1.02, value * blush, value * (blush * .83 + .17));
      }
    }
    for (let row = 0; row < 2; row++) {
      const a = first + 2 * row;
      flowers.indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }

  const lean = range(-.44, .44);
  const trunkCurve = new THREE.CatmullRomCurve3([v(0,-.17,0),v(.013,.12,-.01),v(.06,.46,.05),
    v(lean,.96,.16),v(lean+.055,1.44,.21),v(lean+.15,1.80,.25),v(lean+.39,2.17,.19)]);
  const trunk = trunkCurve.getPoints(17);
  limb(trunk, trunk.map((_, i) => {
    const t = i / 17;
    return .079 + .17 * (1-t) + .114 * Math.exp(-t * 17);
  }), 17);
  for (let n = 0; n < 5; n++) {
    const a = (n + random() * .65) * TAU / 5;
    const len = range(.58, .94);
    sweep(v(0,.17,0),a,len,-.29,.11,.009,6,7);
  }

  const azimuth = random() * TAU;
  const primaryCount = random() > .45 ? 6 : 5;
  for (let i = 0; i < primaryCount; i++) {
    const level = (i + range(-.20,.20)) / (primaryCount-1);
    const heading = azimuth + i * 2.39996 + range(-.28,.28);
    const origin = joint(trunk, THREE.MathUtils.clamp(.30 + level * .7,.25,1));
    const rise = range(.75,1.19) + level * 1.58;
    const reach = range(1.9,2.73) - level * .88;
    const primary = sweep(origin.p, heading, reach, rise, range(.087,.138), .025, 13, 10, origin.dir);
    const count = Math.floor(range(4,6));
    for (let j=0; j<count; j++) {
      const t = .24 + (j + range(-.12,.12)) / (count-1) * .77;
      const mid = joint(primary,t);
      const a = heading + (j % 2 ? 1 : -1) * range(.29,1.31) * (1.18 - t * .44);
      const secondary = sweep(mid.p,a,range(.87,1.69),range(-.46,1.57),
        range(.038,.058) * (1.23 - t * .29),.008,8,6,mid.dir);
      const tips = random() < .60 ? 4 : 3;
      for (let k=0; k<tips; k++) {
        const attach = joint(secondary, .30 + (k+range(-.10,.10)) / (tips-1) * .70);
        const b = a + (k%2 ? -1:1) * range(.27,1.37);
        const length = range(.39,1.02);
        const tip = sweep(attach.p,b,length,range(-.46,.86),range(.012,.025),.002,5,4,attach.dir);
        const sparse = random() < .11;
        for (let m=0; m<3; m++) {
          const sprout = joint(tip,.41 + .29*m);
          const dir = b + (m%2 ? -1:1) * range(.26,1.57);
          if (!sparse || m===0) {
            flowerSpray(sprout.p, dir, m===0 ? range(.30,.53) : range(.67,1.18),
              range(-.85,1.67),m!==0);
          }
          if (random() < .47) {
            flowerSpray(sprout.p,dir+range(1.1,2.7),range(.29,.55),range(-1.17,1.18),false);
          }
        }
        // Fine unflowered extension shoots break up the canopy silhouette.
        if (sparse || random() < .13) {
          const end=joint(tip,.83);
          const wand=sweep(end.p,b+range(-.61,.61),range(.43,.94),range(.21,.86),.009,.0008,5,3,end.dir);
          const at=joint(wand,.65);
          sweep(at.p,b+range(-1.02,1.02),range(.18,.43),range(.14,.45),.004,.0005,3,3,at.dir);
        }
      }
      if (random() < .67) {
        // Shadowed adventitious sprays attach closer to the older wood.
        const short=joint(primary,range(.32,.9));
        const side=a+range(-1.4,1.4);
        const spur=sweep(short.p,side,range(.28,.55),range(-.38,.30),.014,.004,4,4,short.dir);
        flowerSpray(spur[4],side,range(.51,.80),range(-.83,.87),true);
      }
    }
  }
  const prototype = new THREE.Group();
  const trunkMesh = new THREE.Mesh(meshGeometry(bark, true), wood);
  trunkMesh.castShadow = trunkMesh.receiveShadow = true;
  const crownMesh = new THREE.Mesh(meshGeometry(flowers, false), bloom);
  crownMesh.castShadow = true;
  prototype.add(trunkMesh, crownMesh);
  return prototype;
}

export async function addOrchard(scene: THREE.Scene): Promise<void> {
  const loader = new THREE.TextureLoader();
  const asset = (name: string) => new URL('../assets/hanami/' + name, document.baseURI).href;
  const [barkMap, petals] = await Promise.all([
    loader.loadAsync(asset('orchard-cherry-bark.webp')),
    loader.loadAsync(asset('orchard-flowers.webp')),
  ]);
  barkMap.colorSpace = petals.colorSpace = THREE.SRGBColorSpace;
  barkMap.wrapS = barkMap.wrapT = THREE.RepeatWrapping;
  barkMap.anisotropy = 4;
  petals.anisotropy = 4;
  const wood = new THREE.MeshStandardMaterial({ map: barkMap, bumpMap: barkMap, bumpScale: .032, roughness: .96, vertexColors: true });
  const bloom = new THREE.MeshBasicMaterial({ map: petals, vertexColors: true, side: THREE.DoubleSide, alphaTest: .24, alphaToCoverage: true, toneMapped: false });
  const trees = Array.from({ length: 7 }, (_, n) => makeCherry(7801 + n * 738, wood, bloom));
  const random = seeded(7729);
  // Riverside branches are allowed to hang over the water. Branches on the
  // maintained path side arc upwards above head height. Bend the entire limb and
  // its flowers together so the attached twigs stay connected through the curve.
  const pathTrees = new Map<number,THREE.Group>();
  function pathForm(index: number, yaw: number) {
    const cached = pathTrees.get(index);
    if (cached) return cached;
    const tree = trees[index].clone();
    tree.rotation.y = yaw;
    const cos = Math.cos(yaw), sin = Math.sin(yaw);
    for (const child of tree.children as THREE.Mesh[]) {
      const g = child.geometry.clone();
      const pos = g.attributes.position;
      for (let i=0; i<pos.count; i++) {
        const x=pos.getX(i)*cos + pos.getZ(i)*sin, y=pos.getY(i);
        if (g.attributes.normal && y<.38 && Math.hypot(pos.getX(i),pos.getZ(i))<1.04) continue;
        const walkSide = THREE.MathUtils.smoothstep(x,.40,1.63);
        pos.setY(i,y + walkSide * Math.max(0,2.9 - y*.65));
      }
      if (g.attributes.normal) g.computeVertexNormals();
      g.computeBoundingSphere();
      child.geometry=g;
    }
    pathTrees.set(index,tree);
    return tree;
  }
  let serial = 0;
  function plant(x: number, y: number, z: number, size: number, shape: number) {
    const index = shape % trees.length;
    const yaw = random() * TAU;
    const pathSide = x > -6 && x < -3;
    const tree = (pathSide ? pathForm(index,yaw) : trees[index]).clone();
    tree.name = 'Flowering cherry ' + ++serial;
    tree.position.set(x, y, z);
    if (!pathSide) tree.rotation.y = yaw;
    tree.scale.set(size * (.91 + random() * .17), size, size);
    scene.add(tree);
  }

  // The walk is planted at uneven intervals. The two trunks by the entrance are
  // deliberately mature, with their crowns starting below the rest of the row.
  plant(-4.95, -.11, 6.7, 1.18, 0);
  plant(-5.52, -.13, -.96, 1.04, 1);
  let shape = 2;
  for (const z of [34, 25, 16.9, -8.9, -16.8, -23.5, -31.7, -40.4, -48.3, -56.1, -65.3, -72.6, -80.2, -89.5, -98.1, -106.5]) {
    plant(-4.82 - random() * .76, -.13, z, .94 + random() * .18, shape++);
  }
  for (const z of [29,18,7,-3,-15,-29,-40,-55,-66,-82,-96,-109]) {
    plant(-8.7 - random() * .36, -2.57, z + random() * 2.2, (z < 13 && z > -30 ? 1.04 : .87) + random() * .17, shape++);
  }
  for (const z of [24, -8, -35, -52, -85, -105]) {
    plant(7.3 + random() * .86, -.54, z, .62 + random() * .19, shape++);
  }
  for (let z = 28; z > -111; z -= 12 + random() * 3) {
    plant(-30.2 - random() * 2.3, -1.58, z, .81 + random() * .21, shape++);
  }
}
