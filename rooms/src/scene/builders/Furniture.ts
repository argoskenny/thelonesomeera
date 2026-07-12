import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { SCENE_CONFIG } from "../../config/sceneConfig";
import type { AssetManager } from "../../core/AssetManager";
import type { CollisionSystem } from "../../physics/CollisionSystem";
import type { MaterialLibrary } from "../shared/MaterialLibrary";
import { createBox, placeObject } from "../shared/geometry";

export async function buildFurniture(
  materials: MaterialLibrary,
  collisions: CollisionSystem,
  assets: AssetManager,
): Promise<THREE.Group> {
  const root = new THREE.Group();
  root.name = "Props:MajorFurniture";
  root.add(createDesk(materials));
  root.add(createBookshelf(materials));
  root.add(createCabinet(materials));

  const chair = await assets.instantiate("chair", () => createChair(materials));
  root.add(
    placeObject(
      chair,
      SCENE_CONFIG.furniture.chair.position,
      SCENE_CONFIG.furniture.chair.rotationY ?? 0,
      "chair-placement",
    ),
  );

  const { desk, chair: chairSpec, bookshelf, cabinet } = SCENE_CONFIG.furniture;
  collisions.addBox(
    "desk",
    [desk.position[0], desk.size.height / 2, desk.position[2]],
    [desk.size.width + 0.04, desk.size.height, desk.size.depth + 0.04],
  );
  collisions.addBox(
    "office-chair",
    [chairSpec.position[0], chairSpec.size.height / 2, chairSpec.position[2]],
    [chairSpec.size.width + 0.02, chairSpec.size.height, chairSpec.size.depth + 0.02],
  );
  collisions.addBox(
    "bookshelf",
    [bookshelf.position[0], bookshelf.size.height / 2, bookshelf.position[2]],
    [bookshelf.size.depth + 0.02, bookshelf.size.height, bookshelf.size.width + 0.02],
  );
  collisions.addBox(
    "low-cabinet",
    [cabinet.position[0], cabinet.size.height / 2, cabinet.position[2]],
    [cabinet.size.depth + 0.02, cabinet.size.height, cabinet.size.width + 0.02],
  );
  return root;
}

function createDesk(materials: MaterialLibrary): THREE.Group {
  const group = new THREE.Group();
  group.name = "desk";
  const spec = SCENE_CONFIG.furniture.desk;
  group.position.fromArray(spec.position);
  const topThickness = 0.045;
  group.add(
    createBox([spec.size.width, topThickness, spec.size.depth], materials.desktop, [0, spec.size.height - topThickness / 2, 0], { castShadow: true, receiveShadow: true, name: "desk-top" }),
  );
  const tube = 0.032;
  const legX = spec.size.width / 2 - 0.07;
  const legZ = spec.size.depth / 2 - 0.055;
  const verticalHeight = spec.size.height - topThickness;
  for (const x of [-legX, legX]) {
    for (const z of [-legZ, legZ]) {
      group.add(createBox([tube, verticalHeight, tube], materials.blackMetal, [x, verticalHeight / 2, z], { castShadow: true }));
    }
    group.add(createBox([tube, tube, spec.size.depth - 0.08], materials.blackMetal, [x, tube / 2, 0], { castShadow: true }));
  }
  group.add(createBox([spec.size.width - 0.12, tube, tube], materials.blackMetal, [0, spec.size.height - 0.09, -legZ], { castShadow: true }));
  return group;
}

function createBookshelf(materials: MaterialLibrary): THREE.Group {
  const group = new THREE.Group();
  group.name = "bookshelf";
  const spec = SCENE_CONFIG.furniture.bookshelf;
  group.position.fromArray(spec.position);
  const depth = spec.size.depth;
  const width = spec.size.width;
  const height = spec.size.height;
  const board = 0.024;
  const lowerHeight = 0.52;
  group.add(
    createBox([board, height, width], materials.wood, [-depth / 2 + board / 2, height / 2, 0], { castShadow: true, receiveShadow: true, name: "bookshelf-back" }),
    createBox([depth, height, board], materials.wood, [0, height / 2, -width / 2 + board / 2], { castShadow: true }),
    createBox([depth, height, board], materials.wood, [0, height / 2, width / 2 - board / 2], { castShadow: true }),
    createBox([depth, board, width], materials.wood, [0, board / 2, 0], { castShadow: true }),
    createBox([depth, board, width], materials.wood, [0, height - board / 2, 0], { castShadow: true }),
  );
  for (const y of [lowerHeight, 0.86, 1.2, 1.54]) {
    group.add(createBox([depth, board, width], materials.woodLight, [0, y, 0], { castShadow: true }));
  }
  group.add(createBox([depth, height - lowerHeight, board], materials.wood, [0, lowerHeight + (height - lowerHeight) / 2, 0], { castShadow: true }));
  for (const z of [-width / 4, width / 4]) {
    const door = createBox([0.025, lowerHeight - 0.045, width / 2 - 0.03], materials.woodLight, [depth / 2 + 0.013, lowerHeight / 2, z], { castShadow: true });
    group.add(door);
  }
  return group;
}

function createCabinet(materials: MaterialLibrary): THREE.Group {
  const group = new THREE.Group();
  group.name = "low-cabinet";
  const spec = SCENE_CONFIG.furniture.cabinet;
  group.position.fromArray(spec.position);
  const depth = spec.size.depth;
  const width = spec.size.width;
  const height = spec.size.height;
  const board = 0.025;
  const footHeight = 0.09;
  group.add(
    createBox([board, height - footHeight, width], materials.wood, [depth / 2 - board / 2, footHeight + (height - footHeight) / 2, 0], { castShadow: true }),
    createBox([depth, board, width], materials.woodLight, [0, height - board / 2, 0], { castShadow: true, receiveShadow: true }),
    createBox([depth, board, width], materials.wood, [0, footHeight + board / 2, 0], { castShadow: true }),
    createBox([depth, height - footHeight, board], materials.wood, [0, footHeight + (height - footHeight) / 2, -width / 2 + board / 2], { castShadow: true }),
    createBox([depth, height - footHeight, board], materials.wood, [0, footHeight + (height - footHeight) / 2, width / 2 - board / 2], { castShadow: true }),
  );
  const openStart = 0.15;
  group.add(
    createBox([depth, height - footHeight, board], materials.wood, [0, footHeight + (height - footHeight) / 2, openStart], { castShadow: true }),
    createBox([depth, board, width / 3], materials.wood, [0, footHeight + (height - footHeight) / 2, width / 3], { castShadow: true }),
  );
  for (const z of [-0.39, -0.12]) {
    group.add(createBox([0.025, height - footHeight - 0.06, 0.255], materials.cabinetWhite, [-depth / 2 - 0.013, footHeight + (height - footHeight) / 2, z], { castShadow: true }));
  }
  for (const z of [-width / 2 + 0.06, width / 2 - 0.06]) {
    group.add(createBox([0.04, footHeight, 0.04], materials.woodDark, [0, footHeight / 2, z], { castShadow: true }));
  }
  return group;
}

function createChair(materials: MaterialLibrary): THREE.Group {
  const group = new THREE.Group();
  group.name = "procedural-office-chair";
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.36, 12), materials.blackMetal);
  stem.position.y = 0.27;
  stem.castShadow = true;
  group.add(stem);
  const seat = new THREE.Mesh(
    new RoundedBoxGeometry(0.5, 0.07, 0.46, 3, 0.03),
    materials.blackFabric,
  );
  seat.name = "chair-seat";
  seat.position.set(0, 0.48, 0);
  seat.castShadow = true;
  seat.receiveShadow = true;
  group.add(seat);
  const backPanel = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.42), materials.chairMesh);
  backPanel.name = "chair-mesh-back";
  backPanel.position.set(0, 0.79, 0.205);
  backPanel.rotation.x = -0.1;
  group.add(
    backPanel,
    createBox([0.045, 0.52, 0.055], materials.blackPlastic, [-0.215, 0.79, 0.205], { castShadow: true }),
    createBox([0.045, 0.52, 0.055], materials.blackPlastic, [0.215, 0.79, 0.205], { castShadow: true }),
    createBox([0.44, 0.045, 0.055], materials.blackPlastic, [0, 1.04, 0.18], { castShadow: true }),
    createBox([0.4, 0.045, 0.055], materials.blackPlastic, [0, 0.56, 0.22], { castShadow: true }),
  );
  for (const x of [-0.27, 0.27]) {
    group.add(
      createBox([0.035, 0.22, 0.035], materials.blackPlastic, [x, 0.61, 0], { castShadow: true }),
      createBox([0.18, 0.035, 0.06], materials.blackPlastic, [x, 0.72, -0.015], { castShadow: true }),
    );
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.06, 12), materials.blackPlastic);
  hub.position.y = 0.09;
  group.add(hub);
  for (let index = 0; index < 5; index += 1) {
    const angle = (index / 5) * Math.PI * 2;
    const legRadius = 0.155;
    const wheelRadius = 0.31;
    const leg = createBox(
      [0.045, 0.035, 0.31],
      materials.blackPlastic,
      [Math.sin(angle) * legRadius, 0.085, -Math.cos(angle) * legRadius],
      { castShadow: true },
    );
    leg.rotation.y = angle;
    group.add(leg);
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.045, 10), materials.blackPlastic);
    wheel.rotation.z = Math.PI / 2;
    wheel.rotation.y = angle;
    wheel.position.set(Math.sin(angle) * wheelRadius, 0.035, -Math.cos(angle) * wheelRadius);
    wheel.castShadow = true;
    const casterPost = createBox(
      [0.025, 0.06, 0.025],
      materials.blackPlastic,
      [Math.sin(angle) * wheelRadius, 0.07, -Math.cos(angle) * wheelRadius],
      { castShadow: true },
    );
    group.add(casterPost, wheel);
  }
  return group;
}
