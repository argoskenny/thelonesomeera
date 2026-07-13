import * as THREE from "three";
import { SCENE_CONFIG } from "../../config/sceneConfig";
import type { CollisionSystem } from "../../physics/CollisionSystem";
import type { MaterialLibrary } from "../shared/MaterialLibrary";
import { createBox, createBoxInstances, mulberry32 } from "../shared/geometry";

export function buildTerrain(
  materials: MaterialLibrary,
  collisions: CollisionSystem,
): THREE.Group {
  const root = new THREE.Group();
  root.name = "Terrain";

  const floorThickness = 0.028;
  const plankWidth = 0.158;
  const plankLength = 1.2;
  const rows = Math.ceil(SCENE_CONFIG.room.depth / plankWidth);
  const columns = 4;
  const floor = createBoxInstances(materials.floor, rows * columns);
  floor.name = "instanced-oak-floor";
  floor.receiveShadow = true;
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3(plankLength - 0.003, floorThickness, plankWidth - 0.002);
  const quaternion = new THREE.Quaternion();
  const random = mulberry32(3107);
  const baseColor = new THREE.Color(0xe3cfb2);
  for (let row = 0; row < rows; row += 1) {
    const offset = row % 2 === 0 ? 0 : plankLength / 2;
    const z = -SCENE_CONFIG.room.depth / 2 + plankWidth / 2 + row * plankWidth;
    for (let column = 0; column < columns; column += 1) {
      const index = row * columns + column;
      const x = -SCENE_CONFIG.room.width / 2 + plankLength / 2 - offset + column * plankLength;
      position.set(x, -floorThickness / 2, z);
      matrix.compose(position, quaternion, scale);
      floor.setMatrixAt(index, matrix);
      floor.setColorAt(
        index,
        baseColor.clone().offsetHSL((random() - 0.5) * 0.018, (random() - 0.5) * 0.035, (random() - 0.5) * 0.07),
      );
    }
  }
  floor.instanceMatrix.needsUpdate = true;
  if (floor.instanceColor) floor.instanceColor.needsUpdate = true;
  floor.computeBoundingSphere();
  const floorUnderlay = createBox(
    [SCENE_CONFIG.room.width, 0.018, SCENE_CONFIG.room.depth],
    materials.woodLight,
    [0, -floorThickness - 0.006, 0],
    { receiveShadow: true, name: "floor-underlay" },
  );
  root.add(floorUnderlay);
  root.add(floor);
  addContactShadows(root, materials);
  collisions.addBox(
    "floor",
    [0, -floorThickness / 2, 0],
    [SCENE_CONFIG.room.width, floorThickness, SCENE_CONFIG.room.depth],
    { blocking: false, walkable: true },
  );

  const landingDepth = 0.65;
  const landing = createBox(
    [SCENE_CONFIG.door.width, floorThickness, landingDepth],
    materials.woodLight,
    [SCENE_CONFIG.door.centerX, -floorThickness / 2, SCENE_CONFIG.room.depth / 2 + landingDepth / 2],
    { receiveShadow: true, name: "entry-landing" },
  );
  root.add(landing);
  collisions.addBox(
    "entry-floor",
    [SCENE_CONFIG.door.centerX, -floorThickness / 2, SCENE_CONFIG.room.depth / 2 + landingDepth / 2],
    [SCENE_CONFIG.door.width, floorThickness, landingDepth],
    { blocking: false, walkable: true },
  );

  return root;
}

function addContactShadows(root: THREE.Group, materials: MaterialLibrary): void {
  const chairShadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.43, 32),
    materials.contactShadow,
  );
  chairShadow.name = "contact-shadow-chair";
  chairShadow.rotation.x = -Math.PI / 2;
  chairShadow.position.set(0, 0.004, 0.46);

  const deskShadow = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.48), materials.contactShadow);
  deskShadow.name = "contact-shadow-desk";
  deskShadow.rotation.x = -Math.PI / 2;
  deskShadow.position.set(0, 0.003, -0.32);

  const bookshelfShadow = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.78), materials.contactShadow);
  bookshelfShadow.name = "contact-shadow-bookshelf";
  bookshelfShadow.rotation.x = -Math.PI / 2;
  bookshelfShadow.position.set(-1.63, 0.003, -0.92);

  const cabinetShadow = new THREE.Mesh(new THREE.PlaneGeometry(0.43, 1.16), materials.contactShadow);
  cabinetShadow.name = "contact-shadow-cabinet";
  cabinetShadow.rotation.x = -Math.PI / 2;
  cabinetShadow.position.set(1.58, 0.003, 0.18);
  root.add(chairShadow, deskShadow, bookshelfShadow, cabinetShadow);
}
