import * as THREE from "three";
import { ROOM_BOUNDS, SCENE_CONFIG } from "../../config/sceneConfig";
import type { CollisionSystem } from "../../physics/CollisionSystem";
import type { MaterialLibrary } from "../shared/MaterialLibrary";
import { createBox, createBoxInstances } from "../shared/geometry";

interface WallPiece {
  readonly id: string;
  readonly position: readonly [number, number, number];
  readonly size: readonly [number, number, number];
  readonly cutaway?: boolean;
}

export function buildBuildings(
  materials: MaterialLibrary,
  collisions: CollisionSystem,
): THREE.Group {
  const root = new THREE.Group();
  root.name = "Buildings";

  const { width, depth, height, wallThickness } = SCENE_CONFIG.room;
  const wallY = height / 2;
  const halfWidth = width / 2;
  const halfDepth = depth / 2;
  const doorMinX = SCENE_CONFIG.door.centerX - SCENE_CONFIG.door.width / 2;
  const doorMaxX = SCENE_CONFIG.door.centerX + SCENE_CONFIG.door.width / 2;
  const windowBottom = SCENE_CONFIG.window.sillHeight;
  const windowTop = windowBottom + SCENE_CONFIG.window.height;
  const windowSideWidth = (width - SCENE_CONFIG.window.width) / 2;

  const wallPieces: WallPiece[] = [
    {
      id: "wall-left",
      position: [-halfWidth - wallThickness / 2, wallY, 0],
      size: [wallThickness, height, depth + wallThickness * 2],
    },
    {
      id: "wall-right",
      position: [halfWidth + wallThickness / 2, wallY, 0],
      size: [wallThickness, height, depth + wallThickness * 2],
    },
    {
      id: "wall-rear-left",
      position: [-(SCENE_CONFIG.window.width + windowSideWidth) / 2, wallY, -halfDepth - wallThickness / 2],
      size: [windowSideWidth, height, wallThickness],
    },
    {
      id: "wall-rear-right",
      position: [(SCENE_CONFIG.window.width + windowSideWidth) / 2, wallY, -halfDepth - wallThickness / 2],
      size: [windowSideWidth, height, wallThickness],
    },
    {
      id: "wall-rear-sill",
      position: [0, windowBottom / 2, -halfDepth - wallThickness / 2],
      size: [SCENE_CONFIG.window.width, windowBottom, wallThickness],
    },
    {
      id: "wall-rear-header",
      position: [0, windowTop + (height - windowTop) / 2, -halfDepth - wallThickness / 2],
      size: [SCENE_CONFIG.window.width, height - windowTop, wallThickness],
    },
    {
      id: "wall-front-left",
      position: [(ROOM_BOUNDS.minX + doorMinX) / 2, wallY, halfDepth + wallThickness / 2],
      size: [doorMinX - ROOM_BOUNDS.minX, height, wallThickness],
      cutaway: true,
    },
    {
      id: "wall-front-right",
      position: [(doorMaxX + ROOM_BOUNDS.maxX) / 2, wallY, halfDepth + wallThickness / 2],
      size: [ROOM_BOUNDS.maxX - doorMaxX, height, wallThickness],
      cutaway: true,
    },
    {
      id: "wall-front-header",
      position: [SCENE_CONFIG.door.centerX, SCENE_CONFIG.door.height + (height - SCENE_CONFIG.door.height) / 2, halfDepth + wallThickness / 2],
      size: [SCENE_CONFIG.door.width, height - SCENE_CONFIG.door.height, wallThickness],
      cutaway: true,
    },
  ];

  for (const piece of wallPieces) {
    const wall = createBox(piece.size, materials.wall, piece.position, {
      receiveShadow: true,
      name: piece.id,
    });
    wall.userData.cutaway = piece.cutaway ?? false;
    root.add(wall);
    collisions.addBox(piece.id, piece.position, piece.size);
  }

  const ceiling = createBox(
    [width + wallThickness * 2, wallThickness, depth + wallThickness * 2],
    materials.ceiling,
    [0, height + wallThickness / 2, 0],
    { receiveShadow: true, name: "ceiling" },
  );
  root.add(ceiling);

  addBaseboards(root, materials);
  addDoor(root, materials, collisions);
  addWindow(root, materials, collisions);
  addEntryBoundary(root, materials, collisions);
  return root;
}

function addBaseboards(root: THREE.Group, materials: MaterialLibrary): void {
  const height = 0.09;
  const thickness = 0.018;
  const halfWidth = SCENE_CONFIG.room.width / 2;
  const halfDepth = SCENE_CONFIG.room.depth / 2;
  root.add(
    createBox([SCENE_CONFIG.room.width, height, thickness], materials.trim, [0, height / 2, -halfDepth + thickness / 2], { name: "baseboard-rear" }),
    createBox([thickness, height, SCENE_CONFIG.room.depth], materials.trim, [-halfWidth + thickness / 2, height / 2, 0], { name: "baseboard-left" }),
    createBox([thickness, height, SCENE_CONFIG.room.depth], materials.trim, [halfWidth - thickness / 2, height / 2, 0], { name: "baseboard-right" }),
  );
}

function addDoor(
  root: THREE.Group,
  materials: MaterialLibrary,
  collisions: CollisionSystem,
): void {
  const halfDepth = SCENE_CONFIG.room.depth / 2;
  const hingeX = SCENE_CONFIG.door.centerX - SCENE_CONFIG.door.width / 2;
  const doorCenterZ = halfDepth - SCENE_CONFIG.door.width / 2;
  const leaf = createBox(
    [SCENE_CONFIG.door.thickness, SCENE_CONFIG.door.height, SCENE_CONFIG.door.width],
    materials.woodDark,
    [hingeX + SCENE_CONFIG.door.thickness / 2, SCENE_CONFIG.door.height / 2, doorCenterZ],
    { castShadow: true, receiveShadow: true, name: "open-door" },
  );
  root.add(leaf);
  collisions.addBox(
    "open-door",
    [hingeX + SCENE_CONFIG.door.thickness / 2, SCENE_CONFIG.door.height / 2, doorCenterZ],
    [SCENE_CONFIG.door.thickness + 0.02, SCENE_CONFIG.door.height, SCENE_CONFIG.door.width],
  );

  const frameThickness = 0.055;
  const doorFrames = [
    createBox([frameThickness, SCENE_CONFIG.door.height + 0.1, 0.12], materials.trim, [hingeX, (SCENE_CONFIG.door.height + 0.1) / 2, halfDepth - 0.01], { name: "door-frame-left" }),
    createBox([frameThickness, SCENE_CONFIG.door.height + 0.1, 0.12], materials.trim, [hingeX + SCENE_CONFIG.door.width, (SCENE_CONFIG.door.height + 0.1) / 2, halfDepth - 0.01], { name: "door-frame-right" }),
    createBox([SCENE_CONFIG.door.width + frameThickness, frameThickness, 0.12], materials.trim, [SCENE_CONFIG.door.centerX, SCENE_CONFIG.door.height + frameThickness / 2, halfDepth - 0.01], { name: "door-frame-top" }),
  ];
  for (const frame of doorFrames) frame.userData.cutaway = true;
  root.add(...doorFrames);

  const handleBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.045, 0.018, 16),
    materials.blackMetal,
  );
  handleBase.rotation.z = Math.PI / 2;
  handleBase.position.set(hingeX + 0.046, 0.96, halfDepth - SCENE_CONFIG.door.width + 0.12);
  handleBase.castShadow = true;
  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.15, 12),
    materials.blackMetal,
  );
  handle.rotation.x = Math.PI / 2;
  handle.position.copy(handleBase.position);
  handle.position.z -= 0.05;
  handle.castShadow = true;
  root.add(handleBase, handle);
}

function addWindow(
  root: THREE.Group,
  materials: MaterialLibrary,
  collisions: CollisionSystem,
): void {
  const halfDepth = SCENE_CONFIG.room.depth / 2;
  const { width, height, sillHeight, frameDepth, blindDrop } = SCENE_CONFIG.window;
  const centerY = sillHeight + height / 2;
  const frameThickness = 0.055;
  const frameZ = -halfDepth + 0.015;

  const glass = createBox(
    [width, height, 0.012],
    materials.glass,
    [0, centerY, -halfDepth - 0.01],
    { name: "window-glass" },
  );
  root.add(glass);
  collisions.addBox("window-glass", [0, centerY, -halfDepth], [width, height, 0.035]);

  root.add(
    createBox([frameThickness, height + 0.12, frameDepth], materials.darkFrame, [-width / 2 - frameThickness / 2, centerY, frameZ], { castShadow: true, name: "window-frame-left" }),
    createBox([frameThickness, height + 0.12, frameDepth], materials.darkFrame, [width / 2 + frameThickness / 2, centerY, frameZ], { castShadow: true, name: "window-frame-right" }),
    createBox([width + frameThickness * 2, frameThickness, frameDepth], materials.darkFrame, [0, sillHeight + height + frameThickness / 2, frameZ], { castShadow: true, name: "window-frame-top" }),
    createBox([width + 0.12, frameThickness, 0.18], materials.trim, [0, sillHeight - frameThickness / 2, -halfDepth + 0.07], { castShadow: true, name: "window-sill" }),
    createBox([frameThickness, height, frameDepth], materials.darkFrame, [0, centerY, frameZ + 0.015], { castShadow: true, name: "window-mullion" }),
  );

  const railY = sillHeight + height + 0.09;
  root.add(
    createBox([width + 0.16, 0.085, 0.105], materials.darkFrame, [0, railY, -halfDepth + 0.14], { castShadow: true, name: "blind-rail" }),
    createBox([width + 0.08, blindDrop, 0.018], materials.blind, [0, railY - blindDrop / 2 - 0.04, -halfDepth + 0.16], { castShadow: true, name: "blind-cloth" }),
  );
  const stripeCount = 8;
  const stripes = createBoxInstances(materials.trim, stripeCount);
  stripes.name = "blind-horizontal-weave";
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3(width + 0.055, 0.004, 0.008);
  for (let index = 0; index < stripeCount; index += 1) {
    const y = railY - 0.075 - (index / (stripeCount - 1)) * (blindDrop - 0.07);
    matrix.compose(new THREE.Vector3(0, y, -halfDepth + 0.174), quaternion, scale);
    stripes.setMatrixAt(index, matrix);
  }
  stripes.instanceMatrix.needsUpdate = true;
  stripes.computeBoundingSphere();
  root.add(stripes);
}

function addEntryBoundary(
  root: THREE.Group,
  materials: MaterialLibrary,
  collisions: CollisionSystem,
): void {
  const landingDepth = 0.65;
  const boundaryThickness = 0.08;
  const centerZ = SCENE_CONFIG.room.depth / 2 + landingDepth;
  const position: readonly [number, number, number] = [
    SCENE_CONFIG.door.centerX,
    0.55,
    centerZ,
  ];
  const size: readonly [number, number, number] = [SCENE_CONFIG.door.width, 1.1, boundaryThickness];
  const boundary = createBox(size, materials.wall, position, { name: "entry-boundary" });
  boundary.visible = false;
  root.add(boundary);
  collisions.addBox("entry-boundary", position, size);

  const sideDepth = landingDepth;
  for (const [id, x] of [
    ["entry-side-left", SCENE_CONFIG.door.centerX - SCENE_CONFIG.door.width / 2],
    ["entry-side-right", SCENE_CONFIG.door.centerX + SCENE_CONFIG.door.width / 2],
  ] as const) {
    const sidePosition: readonly [number, number, number] = [
      x,
      0.55,
      SCENE_CONFIG.room.depth / 2 + sideDepth / 2,
    ];
    const sideSize: readonly [number, number, number] = [boundaryThickness, 1.1, sideDepth];
    const side = createBox(sideSize, materials.wall, sidePosition, { name: id });
    side.visible = false;
    root.add(side);
    collisions.addBox(id, sidePosition, sideSize);
  }
}
