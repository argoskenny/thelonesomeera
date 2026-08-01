import * as THREE from "three";
import { wrapProgress } from "./race-rules";

const UP = new THREE.Vector3(0, 1, 0);

export interface TrackFrame {
  position: THREE.Vector3;
  tangent: THREE.Vector3;
  right: THREE.Vector3;
}

export interface ItemBoxVisual {
  progress: number;
  lane: number;
  mesh: THREE.Group;
  active: boolean;
  respawnAt: number;
}

export interface BoostPadVisual {
  progress: number;
  mesh: THREE.Group;
}

export interface BananaVisual {
  progress: number;
  lane: number;
  mesh: THREE.Group;
  active: boolean;
  ownerId: string | null;
  armedAt: number;
}

export interface KartVisual {
  root: THREE.Group;
  wheels: THREE.Mesh[];
  exhausts: THREE.Mesh[];
}

export interface WorldAssets {
  curve: THREE.CatmullRomCurve3;
  trackLength: number;
  itemBoxes: ItemBoxVisual[];
  boostPads: BoostPadVisual[];
  bananas: BananaVisual[];
}

function createRibbon(
  curve: THREE.CatmullRomCurve3,
  width: number,
  yOffset: number,
  material: THREE.Material,
  segments = 260,
): THREE.Mesh {
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let index = 0; index <= segments; index += 1) {
    const progress = index / segments;
    const frame = getTrackFrame(curve, progress, 0, yOffset);
    const left = frame.position.clone().addScaledVector(frame.right, -width / 2);
    const right = frame.position.clone().addScaledVector(frame.right, width / 2);
    vertices.push(left.x, left.y, left.z, right.x, right.y, right.z);
    uvs.push(0, progress * 18, 1, progress * 18);

    if (index < segments) {
      const base = index * 2;
      indices.push(base, base + 2, base + 1, base + 2, base + 3, base + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  return mesh;
}

function createTextSprite(text: string, color = "#ffffff", scale = 1): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D context is unavailable");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.font = "900 140px Arial Black, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.lineWidth = 24;
  context.strokeStyle = "#07162f";
  context.strokeText(text, canvas.width / 2, canvas.height / 2);
  context.fillStyle = color;
  context.fillText(text, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
  sprite.scale.set(2.2 * scale, 1.1 * scale, 1);
  return sprite;
}

export function getTrackFrame(
  curve: THREE.CatmullRomCurve3,
  progress: number,
  lane = 0,
  height = 0,
): TrackFrame {
  const wrapped = wrapProgress(progress);
  const position = curve.getPointAt(wrapped);
  const tangent = curve.getTangentAt(wrapped).normalize();
  const right = new THREE.Vector3(tangent.z, 0, -tangent.x).normalize();
  position.addScaledVector(right, lane);
  position.y += height;
  return { position, tangent, right };
}

function placeOnTrack(
  object: THREE.Object3D,
  curve: THREE.CatmullRomCurve3,
  progress: number,
  lane: number,
  height = 0,
): void {
  const frame = getTrackFrame(curve, progress, lane, height);
  object.position.copy(frame.position);
  object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), frame.tangent);
}

function createTree(): THREE.Group {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.26, 1.25, 7),
    new THREE.MeshStandardMaterial({ color: 0x8e512f, roughness: 0.9 }),
  );
  trunk.position.y = 0.62;
  const crown = new THREE.Mesh(
    new THREE.ConeGeometry(0.95, 2.4, 7),
    new THREE.MeshStandardMaterial({ color: 0x35bf62, roughness: 0.82 }),
  );
  crown.position.y = 2.05;
  trunk.castShadow = true;
  crown.castShadow = true;
  tree.add(trunk, crown);
  return tree;
}

function addTrackDecor(scene: THREE.Scene, curve: THREE.CatmullRomCurve3): void {
  const curbGeometry = new THREE.BoxGeometry(0.55, 0.18, 1.1);
  const redMaterial = new THREE.MeshStandardMaterial({ color: 0xff4f5e, roughness: 0.7 });
  const whiteMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.72 });
  const laneMaterial = new THREE.MeshStandardMaterial({ color: 0xf8fbff, roughness: 0.72 });

  for (let index = 0; index < 120; index += 1) {
    const progress = index / 120;
    const frame = getTrackFrame(curve, progress, 0, 0.12);
    for (const side of [-1, 1]) {
      const curb = new THREE.Mesh(curbGeometry, index % 2 === 0 ? redMaterial : whiteMaterial);
      curb.position.copy(frame.position).addScaledVector(frame.right, side * 3.72);
      curb.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), frame.tangent);
      curb.receiveShadow = true;
      curb.castShadow = true;
      scene.add(curb);
    }
  }

  for (let index = 0; index < 48; index += 1) {
    if (index % 2 === 0) continue;
    const progress = index / 48;
    const dash = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.035, 1.9), laneMaterial);
    placeOnTrack(dash, curve, progress, 0, 0.12);
    scene.add(dash);
  }

  const treePlacements = [
    [0.03, -8.5], [0.08, 9.5], [0.15, -10], [0.21, 8.2], [0.29, -9.4],
    [0.36, 9], [0.44, -8.5], [0.52, 9.5], [0.6, -9.2], [0.68, 8.6],
    [0.75, -9.5], [0.82, 9.2], [0.9, -8.7], [0.96, 8.8],
  ] as const;
  treePlacements.forEach(([progress, lane], index) => {
    const tree = createTree();
    const scale = 0.8 + (index % 3) * 0.15;
    tree.scale.setScalar(scale);
    placeOnTrack(tree, curve, progress, lane, -0.05);
    scene.add(tree);
  });

  const rockMaterial = new THREE.MeshStandardMaterial({ color: 0x76556a, roughness: 0.95 });
  for (let index = 0; index < 22; index += 1) {
    const progress = index / 22;
    const frame = getTrackFrame(curve, progress, index % 2 === 0 ? -8 : 8, -4.6);
    const rock = new THREE.Mesh(
      new THREE.ConeGeometry(2.3 + (index % 3) * 0.55, 6 + (index % 3) * 0.6, 7),
      rockMaterial,
    );
    rock.position.copy(frame.position);
    rock.rotation.z = Math.PI;
    rock.castShadow = true;
    scene.add(rock);
  }
}

function createFinishGate(scene: THREE.Scene, curve: THREE.CatmullRomCurve3): void {
  const gate = new THREE.Group();
  const black = new THREE.MeshStandardMaterial({ color: 0x07162f, roughness: 0.58 });
  const white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.58 });
  for (const side of [-1, 1]) {
    for (let row = 0; row < 7; row += 1) {
      const block = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.62, 0.62), row % 2 === 0 ? white : black);
      block.position.set(side * 4.1, 0.35 + row * 0.62, 0);
      gate.add(block);
    }
  }
  for (let column = 0; column < 13; column += 1) {
    const block = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.62, 0.66), column % 2 === 0 ? white : black);
    block.position.set(-3.96 + column * 0.66, 4.25, 0);
    gate.add(block);
  }
  placeOnTrack(gate, curve, 0, 0, 0);
  scene.add(gate);

  for (let column = 0; column < 10; column += 1) {
    const tile = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.035, 0.72),
      (column % 2 === 0) ? black : white,
    );
    placeOnTrack(tile, curve, 0.003, -3.25 + column * 0.72, 0.15);
    scene.add(tile);
  }
}

export function createItemBox(): THREE.Group {
  const group = new THREE.Group();
  const inner = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.9, 0.9),
    new THREE.MeshPhysicalMaterial({
      color: 0x34e4ff,
      emissive: 0x126bcf,
      emissiveIntensity: 1.15,
      transparent: true,
      opacity: 0.78,
      roughness: 0.12,
      metalness: 0.08,
    }),
  );
  const frame = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(1.15, 1.15, 1.15)),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.92 }),
  );
  const question = createTextSprite("?", "#ffffff", 0.58);
  question.position.z = 0.61;
  group.add(inner, frame, question);
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) child.castShadow = true;
  });
  return group;
}

export function createBoostPad(): THREE.Group {
  const group = new THREE.Group();
  const colors = [0x29dcff, 0xff4dcc, 0x29dcff];
  for (let index = 0; index < 3; index += 1) {
    const pad = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.06, 0.8),
      new THREE.MeshStandardMaterial({
        color: colors[index],
        emissive: colors[index],
        emissiveIntensity: 2.2,
        roughness: 0.25,
      }),
    );
    pad.position.z = (index - 1) * 0.92;
    group.add(pad);
  }
  return group;
}

export function createBanana(): THREE.Group {
  const group = new THREE.Group();
  const yellow = new THREE.MeshStandardMaterial({ color: 0xffdc35, roughness: 0.56 });
  for (let index = 0; index < 3; index += 1) {
    const peel = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.085, 8, 18, Math.PI * 1.1), yellow);
    peel.position.y = 0.14;
    peel.rotation.set(Math.PI / 2, index * (Math.PI * 2 / 3), -0.35);
    peel.castShadow = true;
    group.add(peel);
  }
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.09, 0.28, 7),
    new THREE.MeshStandardMaterial({ color: 0x6b4a24, roughness: 0.9 }),
  );
  stem.position.y = 0.28;
  group.add(stem);
  return group;
}

export function createKart(color: number, accent: number): KartVisual {
  const root = new THREE.Group();
  const bodyMaterial = new THREE.MeshStandardMaterial({ color, roughness: 0.38, metalness: 0.08 });
  const accentMaterial = new THREE.MeshStandardMaterial({ color: accent, roughness: 0.4 });
  const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x111928, roughness: 0.72 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.5, 2.25), bodyMaterial);
  body.position.y = 0.42;
  const nose = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.3, 0.82), accentMaterial);
  nose.position.set(0, 0.46, 1.3);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.72, 0.72), darkMaterial);
  seat.position.set(0, 0.83, -0.25);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 12), bodyMaterial);
  helmet.position.set(0, 1.3, -0.1);
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.16, 0.12), darkMaterial);
  visor.position.set(0, 1.3, 0.29);
  const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.14, 0.44), accentMaterial);
  spoiler.position.set(0, 0.86, -1.1);
  root.add(body, nose, seat, helmet, visor, spoiler);

  const wheels: THREE.Mesh[] = [];
  for (const x of [-0.92, 0.92]) {
    for (const z of [-0.75, 0.75]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.3, 14), darkMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.34, z);
      wheel.castShadow = true;
      wheels.push(wheel);
      root.add(wheel);
    }
  }

  const exhausts: THREE.Mesh[] = [];
  for (const x of [-0.4, 0.4]) {
    const exhaust = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0x36e8ff, transparent: true, opacity: 0 }),
    );
    exhaust.position.set(x, 0.34, -1.3);
    exhausts.push(exhaust);
    root.add(exhaust);
  }

  root.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  root.scale.setScalar(0.9);
  return { root, wheels, exhausts };
}

export function buildWorld(scene: THREE.Scene): WorldAssets {
  const curve = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(0, 0, 35),
      new THREE.Vector3(20, 0.8, 31),
      new THREE.Vector3(37, 1.2, 17),
      new THREE.Vector3(40, 1.8, -5),
      new THREE.Vector3(28, 2.8, -23),
      new THREE.Vector3(6, 3.2, -31),
      new THREE.Vector3(-18, 2.6, -28),
      new THREE.Vector3(-37, 1.4, -14),
      new THREE.Vector3(-42, 0.5, 8),
      new THREE.Vector3(-30, 0.2, 27),
      new THREE.Vector3(-11, 0, 35),
    ],
    true,
    "catmullrom",
    0.28,
  );

  const grassMaterial = new THREE.MeshStandardMaterial({ color: 0x49ca69, roughness: 0.88 });
  const underMaterial = new THREE.MeshStandardMaterial({ color: 0x805670, roughness: 0.95 });
  const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x30384d, roughness: 0.72, metalness: 0.04 });
  scene.add(createRibbon(curve, 17, -0.42, underMaterial));
  scene.add(createRibbon(curve, 15.8, -0.08, grassMaterial));
  scene.add(createRibbon(curve, 7.2, 0.08, roadMaterial));
  addTrackDecor(scene, curve);
  createFinishGate(scene, curve);

  const itemPlacements: Array<readonly [number, number]> = [
    [0.12, -2.1], [0.12, 0], [0.12, 2.1], [0.47, -2], [0.47, 0], [0.47, 2],
    [0.78, -2.1], [0.78, 0], [0.78, 2.1],
  ];
  const itemBoxes: ItemBoxVisual[] = itemPlacements.map(([progress, lane]) => {
    const mesh = createItemBox();
    placeOnTrack(mesh, curve, progress, lane, 1.05);
    scene.add(mesh);
    return { progress, lane, mesh, active: true, respawnAt: 0 };
  });

  const boostPads: BoostPadVisual[] = [0.055, 0.36, 0.67, 0.91].map((progress) => {
    const mesh = createBoostPad();
    placeOnTrack(mesh, curve, progress, 0, 0.14);
    scene.add(mesh);
    return { progress, mesh };
  });

  const bananaPlacements: Array<readonly [number, number]> = [
    [0.24, 1.1], [0.55, -1.7], [0.84, 0.45],
  ];
  const bananas: BananaVisual[] = bananaPlacements.map(([progress, lane]) => {
    const mesh = createBanana();
    placeOnTrack(mesh, curve, progress, lane, 0.18);
    scene.add(mesh);
    return { progress, lane, mesh, active: true, ownerId: null, armedAt: 0 };
  });

  return { curve, trackLength: curve.getLength(), itemBoxes, boostPads, bananas };
}

export function placeKart(
  kart: KartVisual,
  curve: THREE.CatmullRomCurve3,
  progress: number,
  lane: number,
  spin: number,
): TrackFrame {
  const frame = getTrackFrame(curve, progress, lane, 0.62);
  kart.root.position.copy(frame.position);
  kart.root.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), frame.tangent);
  kart.root.rotateY(spin);
  return frame;
}

export function placeBanana(
  banana: BananaVisual,
  curve: THREE.CatmullRomCurve3,
): void {
  placeOnTrack(banana.mesh, curve, banana.progress, banana.lane, 0.18);
}
