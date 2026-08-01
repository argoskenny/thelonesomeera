import * as THREE from "three";

export const palette = {
  grass: 0x7fae4e,
  grassDark: 0x5f8f48,
  forest: 0x2e6c55,
  pine: 0x397d58,
  pineDark: 0x235240,
  cream: 0xffedc7,
  terracotta: 0xc96743,
  timber: 0x6d412d,
  bark: 0x6f4b35,
  stone: 0x8e948a,
  gold: 0xf3c84b,
  coral: 0xec7158,
  sage: 0x6c9b58,
  water: 0x65bed0,
  skin: 0xf4bd8c,
  hair: 0x543527,
  slime: 0x7edb72,
  purple: 0x8a6ec7,
};

export interface CharacterRig {
  group: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  swordPivot: THREE.Group;
}

export interface ChestRig {
  group: THREE.Group;
  lid: THREE.Group;
  glow: THREE.Mesh;
}

function material(color: number, roughness = 0.82, emissive = 0x000000) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0.02,
    flatShading: true,
    emissive,
    emissiveIntensity: emissive ? 0.16 : 0,
  });
}

function mesh(
  geometry: THREE.BufferGeometry,
  color: number,
  options: { roughness?: number; emissive?: number } = {},
) {
  const object = new THREE.Mesh(
    geometry,
    material(color, options.roughness, options.emissive),
  );
  object.castShadow = true;
  object.receiveShadow = true;
  return object;
}

export function createHero(): CharacterRig {
  const group = new THREE.Group();
  group.name = "hero";

  const body = mesh(new THREE.SphereGeometry(0.48, 12, 8), 0x56834c);
  body.scale.set(0.9, 1.15, 0.72);
  body.position.y = 1.05;
  group.add(body);

  const belt = mesh(new THREE.CylinderGeometry(0.39, 0.39, 0.14, 12), palette.timber);
  belt.position.y = 0.86;
  group.add(belt);

  const scarf = mesh(new THREE.TorusGeometry(0.34, 0.11, 6, 16), palette.cream);
  scarf.rotation.x = Math.PI / 2;
  scarf.position.set(0, 1.47, 0);
  group.add(scarf);

  const head = mesh(new THREE.SphereGeometry(0.48, 16, 10), palette.skin);
  head.position.y = 1.83;
  head.scale.set(1, 0.95, 0.94);
  group.add(head);

  const hairCap = mesh(
    new THREE.SphereGeometry(0.51, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.58),
    palette.hair,
  );
  hairCap.position.y = 1.96;
  group.add(hairCap);

  for (let index = -2; index <= 2; index += 1) {
    const fringe = mesh(new THREE.ConeGeometry(0.13, 0.35, 5), palette.hair);
    fringe.position.set(index * 0.17, 1.98 + (Math.abs(index) === 2 ? 0.03 : 0), 0.39);
    fringe.rotation.x = -0.35;
    group.add(fringe);
  }

  const cap = mesh(new THREE.ConeGeometry(0.44, 0.9, 7), 0x47784b);
  cap.position.set(-0.08, 2.38, -0.08);
  cap.rotation.z = 0.22;
  group.add(cap);

  for (const side of [-1, 1]) {
    const eye = mesh(new THREE.SphereGeometry(0.045, 8, 6), 0x2d2520);
    eye.position.set(side * 0.17, 1.85, 0.43);
    group.add(eye);
  }

  const leftLeg = new THREE.Group();
  const rightLeg = new THREE.Group();
  for (const [leg, side] of [
    [leftLeg, -1],
    [rightLeg, 1],
  ] as const) {
    const boot = mesh(new THREE.CapsuleGeometry(0.13, 0.22, 3, 6), 0x513526);
    boot.position.y = -0.23;
    boot.rotation.x = Math.PI / 2;
    leg.position.set(side * 0.22, 0.48, 0);
    leg.add(boot);
    group.add(leg);
  }

  const swordPivot = new THREE.Group();
  swordPivot.position.set(0.5, 1.22, 0.05);
  const hand = mesh(new THREE.SphereGeometry(0.13, 8, 6), palette.skin);
  const blade = mesh(new THREE.BoxGeometry(0.13, 0.9, 0.08), 0xb97b43);
  blade.position.y = 0.5;
  const guard = mesh(new THREE.BoxGeometry(0.45, 0.11, 0.13), palette.gold);
  guard.position.y = 0.04;
  swordPivot.add(hand, blade, guard);
  swordPivot.rotation.z = -0.68;
  group.add(swordPivot);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.62, 24),
    new THREE.MeshBasicMaterial({ color: 0x35533a, transparent: true, opacity: 0.26, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.018;
  shadow.receiveShadow = false;
  group.add(shadow);

  return { group, leftLeg, rightLeg, swordPivot };
}

export function createNpc(options: {
  dress: number;
  hair: number;
  hood?: boolean;
}): THREE.Group {
  const group = new THREE.Group();
  const body = mesh(new THREE.ConeGeometry(0.52, 1.2, 10), options.dress);
  body.position.y = 0.76;
  group.add(body);

  const apron = mesh(new THREE.BoxGeometry(0.48, 0.58, 0.06), palette.cream);
  apron.position.set(0, 0.74, 0.4);
  apron.rotation.x = -0.08;
  group.add(apron);

  const head = mesh(new THREE.SphereGeometry(0.44, 14, 10), palette.skin);
  head.position.y = 1.62;
  group.add(head);

  const hair = mesh(new THREE.SphereGeometry(0.47, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.62), options.hair);
  hair.position.y = 1.73;
  group.add(hair);

  if (options.hood) {
    const hood = mesh(new THREE.ConeGeometry(0.54, 0.78, 8), 0x527d50);
    hood.position.set(0, 2.02, -0.05);
    group.add(hood);
  }

  for (const side of [-1, 1]) {
    const eye = mesh(new THREE.SphereGeometry(0.04, 8, 6), 0x2b241f);
    eye.position.set(side * 0.15, 1.64, 0.39);
    group.add(eye);
  }

  return group;
}

export function createSlime(color = palette.slime): THREE.Group {
  const group = new THREE.Group();
  const body = mesh(new THREE.SphereGeometry(0.62, 14, 9), color, { emissive: color });
  body.scale.y = 0.74;
  body.position.y = 0.53;
  group.add(body);

  for (const side of [-1, 1]) {
    const eye = mesh(new THREE.SphereGeometry(0.065, 8, 6), 0x24332c);
    eye.position.set(side * 0.19, 0.62, 0.51);
    group.add(eye);
  }

  const shine = mesh(new THREE.SphereGeometry(0.08, 8, 6), 0xd9ffd3, { emissive: 0xd9ffd3 });
  shine.scale.set(0.55, 1, 0.35);
  shine.position.set(-0.2, 0.83, 0.43);
  group.add(shine);
  return group;
}

export function createMushroomMonster(): THREE.Group {
  const group = new THREE.Group();
  const stem = mesh(new THREE.CapsuleGeometry(0.28, 0.55, 5, 8), palette.cream);
  stem.position.y = 0.52;
  group.add(stem);
  const cap = mesh(new THREE.SphereGeometry(0.66, 12, 7), palette.coral);
  cap.scale.y = 0.48;
  cap.position.y = 1.12;
  group.add(cap);
  for (const side of [-1, 1]) {
    const eye = mesh(new THREE.SphereGeometry(0.055, 8, 6), 0x312a24);
    eye.position.set(side * 0.14, 0.68, 0.27);
    group.add(eye);
    const spot = mesh(new THREE.SphereGeometry(0.09, 8, 6), palette.cream);
    spot.position.set(side * 0.28, 1.27, 0.36);
    group.add(spot);
  }
  return group;
}

export function createGuardian(): THREE.Group {
  const group = new THREE.Group();
  const body = mesh(new THREE.DodecahedronGeometry(1.7, 0), 0x526e45);
  body.scale.set(1.05, 1.22, 0.72);
  body.position.y = 2.1;
  group.add(body);

  const shoulders = mesh(new THREE.DodecahedronGeometry(1.15, 0), 0x465f3c);
  shoulders.scale.set(1.9, 0.65, 0.8);
  shoulders.position.y = 2.75;
  group.add(shoulders);

  const head = mesh(new THREE.DodecahedronGeometry(0.82, 0), 0x3d5940);
  head.position.set(0, 3.7, 0.1);
  group.add(head);

  for (const side of [-1, 1]) {
    const arm = mesh(new THREE.CylinderGeometry(0.36, 0.52, 2.35, 7), 0x4b6242);
    arm.position.set(side * 1.55, 1.85, 0);
    arm.rotation.z = side * 0.18;
    group.add(arm);
    const fist = mesh(new THREE.DodecahedronGeometry(0.52, 0), 0x394f38);
    fist.position.set(side * 1.78, 0.73, 0.08);
    group.add(fist);

    const horn = mesh(new THREE.ConeGeometry(0.19, 1.38, 6), palette.bark);
    horn.position.set(side * 0.7, 4.38, 0);
    horn.rotation.z = side * -0.55;
    group.add(horn);

    const eye = mesh(new THREE.SphereGeometry(0.1, 8, 6), 0x9affd0, { emissive: 0x9affd0 });
    eye.position.set(side * 0.25, 3.78, 0.72);
    group.add(eye);
  }

  for (let i = 0; i < 10; i += 1) {
    const leaf = mesh(new THREE.ConeGeometry(0.18, 0.62, 5), i % 2 ? 0x7ea955 : 0x5f8d4b);
    leaf.position.set(Math.sin(i * 2.7) * 1.15, 3.05 + (i % 3) * 0.22, Math.cos(i * 2.7) * 0.72);
    leaf.rotation.z = Math.sin(i) * 0.8;
    group.add(leaf);
  }

  return group;
}

export function createChest(): ChestRig {
  const group = new THREE.Group();
  const base = mesh(new THREE.BoxGeometry(1.15, 0.7, 0.78), palette.timber);
  base.position.y = 0.42;
  group.add(base);

  for (const side of [-1, 1]) {
    const band = mesh(new THREE.BoxGeometry(0.13, 0.74, 0.82), 0x747b78, { roughness: 0.4 });
    band.position.set(side * 0.37, 0.45, 0);
    group.add(band);
  }

  const lid = new THREE.Group();
  lid.position.set(0, 0.78, -0.33);
  const lidLayers = [
    { size: [1.15, 0.22, 0.78], position: [0, 0.11, 0.33] },
    { size: [1.15, 0.22, 0.64], position: [0, 0.3, 0.29] },
    { size: [1.15, 0.18, 0.43], position: [0, 0.47, 0.24] },
  ] as const;
  for (const layer of lidLayers) {
    const lidWood = mesh(
      new THREE.BoxGeometry(layer.size[0], layer.size[1], layer.size[2]),
      palette.timber,
    );
    lidWood.position.set(layer.position[0], layer.position[1], layer.position[2]);
    lid.add(lidWood);
  }
  for (const side of [-1, 1]) {
    const lidBand = mesh(new THREE.BoxGeometry(0.13, 0.76, 0.16), 0x747b78, { roughness: 0.4 });
    lidBand.position.set(side * 0.37, 0.27, 0.68);
    lidBand.rotation.x = -0.42;
    lid.add(lidBand);
  }
  group.add(lid);

  const lock = mesh(new THREE.BoxGeometry(0.28, 0.35, 0.12), palette.gold, { roughness: 0.35 });
  lock.position.set(0, 0.56, 0.45);
  group.add(lock);

  const glow = new THREE.Mesh(
    new THREE.RingGeometry(0.72, 0.86, 32),
    new THREE.MeshBasicMaterial({ color: 0xffe174, transparent: true, opacity: 0.76, side: THREE.DoubleSide }),
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.025;
  group.add(glow);
  return { group, lid, glow };
}

export function createMoonberry(): THREE.Group {
  const group = new THREE.Group();
  for (const [x, y, z] of [
    [-0.16, 0.25, 0],
    [0.16, 0.25, 0],
    [0, 0.47, 0],
  ]) {
    const berry = mesh(new THREE.SphereGeometry(0.22, 10, 7), 0x7d59bc, { emissive: 0x8267c9 });
    berry.position.set(x, y, z);
    group.add(berry);
  }
  const leaf = mesh(new THREE.ConeGeometry(0.15, 0.38, 5), 0x75aa54);
  leaf.position.set(0.1, 0.76, 0);
  leaf.rotation.z = -0.5;
  group.add(leaf);
  const light = new THREE.PointLight(0xb99cff, 0.8, 3);
  light.position.y = 0.5;
  group.add(light);
  return group;
}

export function createQuestMarker(): THREE.Group {
  const group = new THREE.Group();
  const diamond = mesh(new THREE.OctahedronGeometry(0.28, 0), palette.gold, { emissive: palette.gold });
  diamond.rotation.z = Math.PI / 4;
  group.add(diamond);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.39, 0.04, 6, 20),
    new THREE.MeshBasicMaterial({ color: 0xffefa0 }),
  );
  ring.rotation.x = Math.PI / 2;
  group.add(ring);
  return group;
}

export function createTree(scale = 1, variant = 0): THREE.Group {
  const group = new THREE.Group();
  const trunk = mesh(new THREE.CylinderGeometry(0.23 * scale, 0.34 * scale, 2.25 * scale, 7), palette.bark);
  trunk.position.y = 1.1 * scale;
  group.add(trunk);
  const colors = variant % 2 ? [0x397a55, 0x2c644c, 0x24533f] : [0x4d8755, 0x387049, 0x2d5c41];
  for (let layer = 0; layer < 3; layer += 1) {
    const crown = mesh(
      new THREE.ConeGeometry((1.2 - layer * 0.16) * scale, 2.3 * scale, 7),
      colors[layer],
    );
    crown.position.y = (2.1 + layer * 0.9) * scale;
    group.add(crown);
  }
  return group;
}

export function createHouse(): THREE.Group {
  const group = new THREE.Group();
  const walls = mesh(new THREE.BoxGeometry(6.6, 4.2, 5.2), palette.cream);
  walls.position.y = 2.1;
  group.add(walls);

  const roofGeometry = new THREE.BufferGeometry();
  roofGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      [
        -3.9, 0, -3.1,
        3.9, 0, -3.1,
        0, 2.75, -3.1,
        -3.9, 0, 3.1,
        3.9, 0, 3.1,
        0, 2.75, 3.1,
      ],
      3,
    ),
  );
  roofGeometry.setIndex([
    0, 2, 1,
    3, 4, 5,
    0, 3, 5,
    0, 5, 2,
    1, 2, 5,
    1, 5, 4,
    0, 1, 4,
    0, 4, 3,
  ]);
  roofGeometry.computeVertexNormals();
  const roof = mesh(roofGeometry, palette.terracotta);
  roof.position.y = 4.05;
  group.add(roof);

  const ridge = mesh(new THREE.BoxGeometry(0.28, 0.3, 6.4), 0xa94f38);
  ridge.position.y = 6.82;
  group.add(ridge);

  const chimney = mesh(new THREE.BoxGeometry(0.75, 1.8, 0.78), 0x84604a);
  chimney.position.set(-2.1, 6.08, -0.7);
  group.add(chimney);

  const door = mesh(new THREE.BoxGeometry(1.4, 2.45, 0.18), palette.timber);
  door.position.set(0.7, 1.24, 2.68);
  group.add(door);

  for (const x of [-2, 2]) {
    const window = mesh(new THREE.BoxGeometry(1.05, 1.05, 0.16), 0x7bc0cf, { emissive: 0xbbe6e7 });
    window.position.set(x, 2.4, 2.7);
    group.add(window);
    const sill = mesh(new THREE.BoxGeometry(1.35, 0.16, 0.34), palette.timber);
    sill.position.set(x, 1.83, 2.78);
    group.add(sill);

    const flowerBox = mesh(new THREE.BoxGeometry(1.15, 0.27, 0.35), palette.timber);
    flowerBox.position.set(x, 1.72, 2.92);
    group.add(flowerBox);
    for (let flowerIndex = -1; flowerIndex <= 1; flowerIndex += 1) {
      const flower = mesh(
        new THREE.OctahedronGeometry(0.11, 0),
        flowerIndex === 0 ? 0xf6dc6c : 0xee8061,
      );
      flower.position.set(x + flowerIndex * 0.3, 1.94, 3.03);
      group.add(flower);
    }
  }

  for (const x of [-3.05, 3.05]) {
    const beam = mesh(new THREE.BoxGeometry(0.25, 4.25, 0.2), palette.timber);
    beam.position.set(x, 2.1, 2.7);
    group.add(beam);
  }
  return group;
}
