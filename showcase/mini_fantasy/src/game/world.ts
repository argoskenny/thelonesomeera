import * as THREE from "three";
import {
  createChest,
  createGuardian,
  createHouse,
  createMoonberry,
  createMushroomMonster,
  createNpc,
  createQuestMarker,
  createSlime,
  createTree,
  palette,
  type ChestRig,
} from "./models";

export type InteractionKind = "npc" | "chest" | "berry";

export interface Interactable {
  id: string;
  kind: InteractionKind;
  label: string;
  group: THREE.Group;
  radius: number;
  marker?: THREE.Group;
  chest?: ChestRig;
  consumed: boolean;
}

export interface Enemy {
  id: string;
  name: string;
  group: THREE.Group;
  spawn: THREE.Vector3;
  hp: number;
  maxHp: number;
  speed: number;
  damageRadius: number;
  isBoss: boolean;
  alive: boolean;
  hitFlash: number;
  attackCooldown: number;
}

interface CircleCollider {
  x: number;
  z: number;
  radius: number;
}

export interface FantasyWorld {
  interactables: Interactable[];
  enemies: Enemy[];
  boss: Enemy;
  canMoveTo: (position: THREE.Vector3) => boolean;
  updateDecorations: (elapsed: number, delta: number) => void;
}

const mat = (color: number, options: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.88, flatShading: true, ...options });

const shadowed = (mesh: THREE.Mesh) => {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
};

function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value |= 0;
    value = (value + 0x6d2b79f5) | 0;
    let result = Math.imul(value ^ (value >>> 15), 1 | value);
    result = (result + Math.imul(result ^ (result >>> 7), 61 | result)) ^ result;
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function createGround(scene: THREE.Scene) {
  const ground = shadowed(
    new THREE.Mesh(new THREE.PlaneGeometry(62, 78), mat(palette.grass)),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.z = -8;
  scene.add(ground);

  const forestFloor = shadowed(
    new THREE.Mesh(new THREE.PlaneGeometry(60, 43), mat(0x5f8d45)),
  );
  forestFloor.rotation.x = -Math.PI / 2;
  forestFloor.position.set(0, 0.012, -23.5);
  scene.add(forestFloor);

  const river = new THREE.Mesh(
    new THREE.PlaneGeometry(62, 5),
    new THREE.MeshStandardMaterial({
      color: palette.water,
      roughness: 0.2,
      metalness: 0.05,
      transparent: true,
      opacity: 0.9,
    }),
  );
  river.rotation.x = -Math.PI / 2;
  river.position.set(0, 0.06, 3);
  scene.add(river);

  const pathMaterial = mat(0xd5bd82);
  for (let z = 24; z >= -38; z -= 1.55) {
    const curve = Math.sin(z * 0.22) * (z < -4 ? 1.7 : 0.7);
    const stone = shadowed(
      new THREE.Mesh(
        new THREE.CylinderGeometry(0.62 + ((z * 17) % 5) * 0.03, 0.7, 0.1, 7),
        pathMaterial,
      ),
    );
    stone.position.set(curve, 0.1, z);
    stone.rotation.y = z * 0.65;
    stone.scale.z = 0.66;
    scene.add(stone);
  }
}

function createBridge(scene: THREE.Scene) {
  const bridge = new THREE.Group();
  bridge.position.z = 3;
  const stoneMaterial = mat(0x9b9684);
  for (let index = -3; index <= 3; index += 1) {
    const slab = shadowed(new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.28, 0.8), stoneMaterial));
    slab.position.set(0, 0.24 + Math.cos(index * 0.42) * 0.12, index * 0.72);
    bridge.add(slab);
  }
  for (const side of [-1, 1]) {
    for (let index = -3; index <= 3; index += 1) {
      const post = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.75, 0.3), stoneMaterial));
      post.position.set(side * 1.75, 0.6, index * 0.75);
      bridge.add(post);
    }
    const rail = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 5.1), stoneMaterial));
    rail.position.set(side * 1.75, 0.92, 0);
    bridge.add(rail);
  }
  scene.add(bridge);
}

function createFence(scene: THREE.Scene, x: number, z: number, length: number, rotation = 0) {
  const group = new THREE.Group();
  const wood = mat(0x835637);
  const count = Math.floor(length / 1.45);
  for (let index = 0; index <= count; index += 1) {
    const post = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.05, 0.18), wood));
    post.position.set(index * 1.45 - length / 2, 0.52, 0);
    group.add(post);
  }
  for (const height of [0.36, 0.75]) {
    const rail = shadowed(new THREE.Mesh(new THREE.BoxGeometry(length, 0.15, 0.15), wood));
    rail.position.y = height;
    group.add(rail);
  }
  group.position.set(x, 0, z);
  group.rotation.y = rotation;
  scene.add(group);
}

function createVillage(scene: THREE.Scene) {
  const house = createHouse();
  house.position.set(-10, 0, 16);
  scene.add(house);

  const garden = new THREE.Group();
  const soil = shadowed(new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.12, 3.3), mat(0x815d3d)));
  soil.position.y = 0.07;
  garden.add(soil);
  for (let row = -1; row <= 1; row += 1) {
    for (let column = -2; column <= 2; column += 1) {
      const leaves = shadowed(new THREE.Mesh(new THREE.DodecahedronGeometry(0.3, 0), mat(0x5c9447)));
      leaves.position.set(column * 0.78, 0.34, row * 0.84);
      leaves.scale.set(1, 0.72, 1);
      garden.add(leaves);
      const carrot = shadowed(new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.4, 6), mat(0xe28741)));
      carrot.position.set(column * 0.78, 0.25, row * 0.84);
      carrot.rotation.z = Math.PI;
      garden.add(carrot);
    }
  }
  garden.position.set(-15, 0, 20.4);
  scene.add(garden);

  createFence(scene, -11.5, 22.3, 10);
  createFence(scene, 10, 20.5, 10);
  createFence(scene, 14.5, 14, 10, Math.PI / 2);

  const well = new THREE.Group();
  const ring = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.85, 12, 1, true), mat(0x8f8c7e)));
  ring.position.y = 0.44;
  well.add(ring);
  for (const side of [-1, 1]) {
    const post = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 2.3, 6), mat(palette.timber)));
    post.position.set(side * 1.05, 1.25, 0);
    well.add(post);
  }
  const roof = shadowed(new THREE.Mesh(new THREE.ConeGeometry(1.65, 1.15, 4), mat(palette.terracotta)));
  roof.position.y = 2.55;
  roof.rotation.y = Math.PI / 4;
  roof.scale.z = 0.75;
  well.add(roof);
  well.position.set(10.5, 0, 12.5);
  scene.add(well);

  const edgeTrees = [
    [-20, 8, 0.88],
    [-22, 19, 1.02],
    [-18, 25, 0.84],
    [19, 7, 0.92],
    [22, 14, 1.06],
    [19, 23, 0.82],
  ] as const;
  for (let index = 0; index < edgeTrees.length; index += 1) {
    const [x, z, scale] = edgeTrees[index];
    const tree = createTree(scale, index);
    tree.position.set(x, 0, z);
    scene.add(tree);
  }

  const bushMaterial = mat(0x548f48);
  const bushLightMaterial = mat(0x72a94f);
  for (let index = 0; index < 24; index += 1) {
    const bush = shadowed(
      new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.42 + (index % 3) * 0.1, 0),
        index % 2 ? bushMaterial : bushLightMaterial,
      ),
    );
    const side = index % 2 ? -1 : 1;
    bush.position.set(side * (7.5 + (index % 6) * 2.35), 0.28, 8.2 + Math.floor(index / 6) * 4.9);
    bush.scale.y = 0.72;
    scene.add(bush);
  }
}

function createForest(scene: THREE.Scene, colliders: CircleCollider[]) {
  const random = seededRandom(20260801);
  for (let index = 0; index < 54; index += 1) {
    let x = random() * 52 - 26;
    const z = random() * 34 - 41;
    if (Math.abs(x - Math.sin(z * 0.22) * 1.7) < 4.2) {
      x += x < 0 ? -5.5 : 5.5;
    }
    if (z < -34 && Math.abs(x) < 7.5) continue;
    const scale = 0.68 + random() * 0.52;
    const tree = createTree(scale, index);
    tree.position.set(x, 0, z);
    tree.rotation.y = random() * Math.PI * 2;
    scene.add(tree);
    colliders.push({ x, z, radius: 0.52 * scale });
  }

  for (let index = 0; index < 30; index += 1) {
    const rock = shadowed(
      new THREE.Mesh(new THREE.DodecahedronGeometry(0.35 + random() * 0.45, 0), mat(0x858c7d)),
    );
    let x = random() * 50 - 25;
    const z = random() * 55 - 35;
    if (Math.abs(x) < 3.2) x += x < 0 ? -4 : 4;
    rock.position.set(x, 0.2, z);
    rock.scale.y = 0.65;
    rock.rotation.set(random(), random() * Math.PI, random() * 0.2);
    scene.add(rock);
  }
}

function createFlowers(scene: THREE.Scene) {
  const flowerGeometry = new THREE.OctahedronGeometry(0.09, 0);
  const stemGeometry = new THREE.CylinderGeometry(0.018, 0.018, 0.24, 5);
  const colors = [0xfff0a6, 0xffffff, 0xf28a62, 0xe6a7c4];
  const random = seededRandom(716);
  for (let index = 0; index < 105; index += 1) {
    const group = new THREE.Group();
    const stem = new THREE.Mesh(stemGeometry, mat(0x4f8d48));
    stem.position.y = 0.12;
    const flower = new THREE.Mesh(flowerGeometry, mat(colors[index % colors.length], { emissive: colors[index % colors.length], emissiveIntensity: 0.05 }));
    flower.position.y = 0.28;
    group.add(stem, flower);
    let x = random() * 52 - 26;
    const z = random() * 61 - 36;
    if (Math.abs(x) < 2.4) x += x < 0 ? -2.6 : 2.6;
    group.position.set(x, 0, z);
    scene.add(group);
  }
}

function createClouds(scene: THREE.Scene) {
  const cloudMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.88, depthWrite: false });
  for (let cloudIndex = 0; cloudIndex < 7; cloudIndex += 1) {
    const cloud = new THREE.Group();
    for (let puff = 0; puff < 5; puff += 1) {
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(1.4 + (puff % 2) * 0.45, 10, 7), cloudMaterial);
      sphere.position.set((puff - 2) * 1.35, Math.sin(puff) * 0.4, Math.cos(puff) * 0.45);
      sphere.scale.y = 0.68;
      cloud.add(sphere);
    }
    cloud.position.set(-24 + cloudIndex * 9, 18 + (cloudIndex % 2) * 2.5, -38 + (cloudIndex % 3) * 10);
    cloud.userData.baseX = cloud.position.x;
    scene.add(cloud);
  }
}

function addNpc(
  scene: THREE.Scene,
  interactables: Interactable[],
  id: string,
  label: string,
  position: THREE.Vector3,
  options: { dress: number; hair: number; hood?: boolean },
) {
  const group = createNpc(options);
  group.position.copy(position);
  const marker = createQuestMarker();
  marker.position.y = 2.75;
  marker.visible = id === "mira";
  group.add(marker);
  scene.add(group);
  interactables.push({ id, kind: "npc", label, group, marker, radius: 2.2, consumed: false });
}

function addChest(scene: THREE.Scene, interactables: Interactable[], id: string, position: THREE.Vector3) {
  const chest = createChest();
  chest.group.position.copy(position);
  scene.add(chest.group);
  interactables.push({
    id,
    kind: "chest",
    label: "開啟寶箱",
    group: chest.group,
    chest,
    radius: 2,
    consumed: false,
  });
}

function addBerry(scene: THREE.Scene, interactables: Interactable[], id: string, position: THREE.Vector3) {
  const group = createMoonberry();
  group.position.copy(position);
  scene.add(group);
  interactables.push({ id, kind: "berry", label: "採集月光莓", group, radius: 1.7, consumed: false });
}

function addEnemy(
  scene: THREE.Scene,
  enemies: Enemy[],
  options: Omit<Enemy, "group" | "spawn" | "alive" | "hitFlash" | "attackCooldown"> & {
    position: THREE.Vector3;
    model: THREE.Group;
  },
) {
  const { position, model, ...enemyOptions } = options;
  model.position.copy(position);
  scene.add(model);
  const enemy: Enemy = {
    ...enemyOptions,
    group: model,
    spawn: position.clone(),
    alive: true,
    hitFlash: 0,
    attackCooldown: 0,
  };
  enemies.push(enemy);
  return enemy;
}

export function createFantasyWorld(scene: THREE.Scene): FantasyWorld {
  const interactables: Interactable[] = [];
  const enemies: Enemy[] = [];
  const colliders: CircleCollider[] = [];

  createGround(scene);
  createBridge(scene);
  createVillage(scene);
  createForest(scene, colliders);
  createFlowers(scene);
  createClouds(scene);

  addNpc(scene, interactables, "mira", "和米菈交談", new THREE.Vector3(-4.4, 0, 16.6), {
    dress: 0x8e6a43,
    hair: 0x6e412e,
    hood: true,
  });
  addNpc(scene, interactables, "pippin", "和皮平交談", new THREE.Vector3(7.5, 0, 13.4), {
    dress: 0x668eb0,
    hair: 0xd0a35e,
  });

  addChest(scene, interactables, "village-chest", new THREE.Vector3(5, 0, 19));
  addChest(scene, interactables, "forest-chest", new THREE.Vector3(9, 0, -25));
  interactables.filter((item) => item.kind === "chest").forEach((item) => item.group.scale.setScalar(1.18));

  addBerry(scene, interactables, "berry-1", new THREE.Vector3(-5.7, 0.16, -12.5));
  addBerry(scene, interactables, "berry-2", new THREE.Vector3(5.2, 0.16, -20));
  addBerry(scene, interactables, "berry-3", new THREE.Vector3(-6.6, 0.16, -28));

  addEnemy(scene, enemies, {
    id: "slime-mint",
    name: "薄荷史萊姆",
    model: createSlime(),
    position: new THREE.Vector3(3.6, 0, -10),
    hp: 2,
    maxHp: 2,
    speed: 1.45,
    damageRadius: 1.15,
    isBoss: false,
  });
  addEnemy(scene, enemies, {
    id: "mushroom-one",
    name: "跳跳菇",
    model: createMushroomMonster(),
    position: new THREE.Vector3(-4.5, 0, -18),
    hp: 2,
    maxHp: 2,
    speed: 1.2,
    damageRadius: 1.05,
    isBoss: false,
  });
  addEnemy(scene, enemies, {
    id: "slime-blue",
    name: "露水史萊姆",
    model: createSlime(0x63b8dc),
    position: new THREE.Vector3(5.8, 0, -27),
    hp: 3,
    maxHp: 3,
    speed: 1.55,
    damageRadius: 1.15,
    isBoss: false,
  });

  const boss = addEnemy(scene, enemies, {
    id: "moss-guardian",
    name: "苔角守衛",
    model: createGuardian(),
    position: new THREE.Vector3(0, 0, -40),
    hp: 8,
    maxHp: 8,
    speed: 0.78,
    damageRadius: 1.7,
    isBoss: true,
  });
  boss.group.scale.setScalar(1.14);

  const arena = new THREE.Mesh(
    new THREE.RingGeometry(7.2, 7.55, 48),
    new THREE.MeshBasicMaterial({ color: 0xb7d67b, transparent: true, opacity: 0.42, side: THREE.DoubleSide }),
  );
  arena.rotation.x = -Math.PI / 2;
  arena.position.set(0, 0.035, -40);
  scene.add(arena);

  const canMoveTo = (position: THREE.Vector3) => {
    if (position.x < -28 || position.x > 28 || position.z < -45 || position.z > 27) return false;
    if (position.z > 0.35 && position.z < 5.65 && Math.abs(position.x) > 2.15) return false;
    if (position.x > -13.7 && position.x < -6.25 && position.z > 12.5 && position.z < 20.2) return false;
    if (position.x > 9.1 && position.x < 11.9 && position.z > 11 && position.z < 14.6) return false;
    return !colliders.some((collider) => {
      const dx = position.x - collider.x;
      const dz = position.z - collider.z;
      return dx * dx + dz * dz < (collider.radius + 0.42) ** 2;
    });
  };

  const updateDecorations = (elapsed: number, delta: number) => {
    for (const interactive of interactables) {
      if (interactive.consumed && interactive.kind === "berry") continue;
      if (interactive.kind === "berry") {
        interactive.group.position.y = 0.16 + Math.sin(elapsed * 2.2 + interactive.group.position.x) * 0.13;
        interactive.group.rotation.y += delta * 0.8;
      }
      if (interactive.marker?.visible) {
        interactive.marker.position.y = 2.78 + Math.sin(elapsed * 2.7) * 0.16;
        interactive.marker.rotation.y += delta * 1.4;
      }
      if (interactive.chest && !interactive.consumed) {
        interactive.chest.glow.material instanceof THREE.MeshBasicMaterial &&
          (interactive.chest.glow.material.opacity = 0.56 + Math.sin(elapsed * 3) * 0.2);
        interactive.chest.glow.rotation.z += delta * 0.25;
      }
    }
  };

  return { interactables, enemies, boss, canMoveTo, updateDecorations };
}
