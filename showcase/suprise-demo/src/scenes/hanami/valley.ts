import * as THREE from 'three';

const ridgeAngles = [-56, 32, 168, 304].map(THREE.MathUtils.degToRad);
const asset = (file: string) => new URL(`../assets/hanami/${file}`, document.baseURI).href;

// Slope UVs are a radial perspective projection from the valley floor. The toes
// of the hills, wooded folds and crests sit at different physical distances.
function slopePoint(angle: number, v: number, target: THREE.Vector3) {
  const folds = 46 * Math.sin(3 * angle + 1.1)
    + 27 * Math.cos(7 * angle - 0.45)
    + 18 * Math.sin(12 * angle + 5 * v);
  const radius = 215 + (545 + folds) * v
    + 16 * Math.sin(4 * angle - 8 * v) * Math.sin(Math.PI * v);
  const elevation = THREE.MathUtils.degToRad(-5.5 + 34 * v);
  return target.set(Math.sin(angle) * radius, 1.62 + radius * Math.tan(elevation), 14 - Math.cos(angle) * radius);
}

function foothillPoint(angle: number, v: number, target: THREE.Vector3) {
  const toe = 120 + 65 * Math.cos(angle) ** 2 + 16 * Math.sin(angle * 3);
  const radius = toe + (68 + 14 * Math.cos(angle * 7)) * v;
  const height = 13 + 3.6 * Math.cos(angle * 3 - .44) + 1.3 * Math.sin(angle * 9 + .6);
  const elevation = THREE.MathUtils.degToRad(-3.7 + v * height);
  return target.set(Math.sin(angle) * radius, 1.62 + radius * Math.tan(elevation), 14 - Math.cos(angle) * radius);
}

function terrainSector(map: THREE.Texture, start: number, end: number, foothill = false) {
  const columns = foothill ? 288 : 112;
  const rows = 18;
  const position: number[] = [];
  const uv: number[] = [];
  const triangles: number[] = [];
  const point = new THREE.Vector3();

  for (let j = 0; j <= rows; j++) {
    const v = j / rows;
    for (let i = 0; i <= columns; i++) {
      const u = i / columns;
      const angle = THREE.MathUtils.lerp(start, end, u);
      if (foothill) foothillPoint(angle, v, point);
      else slopePoint(angle, v, point);
      position.push(point.x, point.y, point.z);
      uv.push(foothill ? 5 * u + .17 * Math.sin(angle * 3) : u, v);
      if (i === columns || j === rows) continue;
      const a = j * (columns + 1) + i;
      const b = a + columns + 1;
      triangles.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(triangles);
  map.colorSpace = THREE.SRGBColorSpace;
  if (foothill) map.wrapS = THREE.RepeatWrapping;
  const material = new THREE.MeshBasicMaterial({
    map, alphaTest: 0.5, fog: false, toneMapped: false,
    // Keep the slight distant airlight already present in the terrain plates.
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = foothill ? 'Lower bamboo terraces' : 'Wooded ridgeline';
  return mesh;
}

function ridgePylon() {
  const positions: number[] = [];
  const beam = (a: THREE.Vector3, b: THREE.Vector3) => positions.push(...a.toArray(), ...b.toArray());
  const heights = [0, 5.5, 10, 14.5, 19, 23];
  const widths = [2.65, 1.7, 1.22, .96, .63, .12];
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  const level = (j: number, i: number) => new THREE.Vector3(
    corners[i][0] * widths[j], heights[j], corners[i][1] * widths[j]);

  for (let j = 0; j < heights.length - 1; j++) {
    for (let i = 0; i < 4; i++) {
      const next = (i + 1) % 4;
      beam(level(j, i), level(j + 1, i));
      beam(level(j, i), level(j + 1, next));
      beam(level(j, next), level(j + 1, i));
    }
  }
  for (const h of [13, 16.6, 20]) {
    for (const side of [-1, 1]) {
      const tip = new THREE.Vector3(side * (h > 19 ? 3.2 : 4.1), h, 0);
      beam(new THREE.Vector3(0, h, 0), tip);
      beam(new THREE.Vector3(0, h + 1.6, 0), tip);
      beam(tip, tip.clone().add(new THREE.Vector3(0, -.64, 0)));
    }
  }
  const shape = new THREE.BufferGeometry();
  shape.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const tower = new THREE.LineSegments(shape, new THREE.LineBasicMaterial({
    color: 0x9b9fa0, toneMapped: false, fog: false, transparent: true, opacity: .73,
  }));
  tower.name = 'Ridge transmission tower';
  slopePoint(THREE.MathUtils.lerp(ridgeAngles[0], ridgeAngles[1], .638), .6603, tower.position);
  tower.position.y -= 6;
  tower.rotation.y = -.28;
  return tower;
}

export async function addValley(scene: THREE.Scene): Promise<void> {
  const loader = new THREE.TextureLoader();
  const [sky, foothills, ...mountains] = await Promise.all(
    ['valley-sky.jpg', 'valley-foothills.webp', 'valley-north.webp', 'valley-east.webp', 'valley-west.webp']
      .map(file => loader.loadAsync(asset(file)))
  );
  sky.colorSpace = THREE.SRGBColorSpace;
  sky.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = sky;
  scene.environment = sky;
  scene.backgroundRotation.y = 2.02;
  scene.environmentRotation.copy(scene.backgroundRotation);
  scene.environmentIntensity = .22;
  mountains.forEach((map, i) => scene.add(terrainSector(map, ridgeAngles[i], ridgeAngles[i + 1])));
  scene.add(terrainSector(foothills, -Math.PI, Math.PI, true));
  scene.add(ridgePylon());
}
