import * as THREE from "three";
import { SCENE_CONFIG } from "../../config/sceneConfig";
import type { AssetManager } from "../../core/AssetManager";
import type { MaterialLibrary } from "../shared/MaterialLibrary";
import {
  createBox,
  createBoxInstances,
  createCylinderBetween,
  mulberry32,
  placeObject,
} from "../shared/geometry";

export async function buildProps(
  materials: MaterialLibrary,
  assets: AssetManager,
): Promise<THREE.Group> {
  const root = new THREE.Group();
  root.name = "Props:Details";

  const laptop = await assets.instantiate("laptop", () => createLaptop(materials));
  root.add(placeObject(laptop, SCENE_CONFIG.decor.laptop, 0, "laptop-placement"));
  const lamp = await assets.instantiate("deskLamp", () => createDeskLamp(materials));
  root.add(
    placeObject(lamp, SCENE_CONFIG.decor.deskLamp.base, 0, "desk-lamp-placement"),
  );
  root.add(createBookInstances(materials));
  root.add(createPictureFrame(materials, false));
  root.add(createPictureFrame(materials, true));
  root.add(createDeskAccessories(materials));
  return root;
}

function createLaptop(materials: MaterialLibrary): THREE.Group {
  const group = new THREE.Group();
  group.name = "procedural-laptop";
  const base = createBox([0.34, 0.018, 0.23], materials.darkFrame, [0, 0.009, 0], {
    castShadow: true,
    name: "laptop-base",
  });
  const keyboard = createBox([0.29, 0.004, 0.14], materials.blackPlastic, [0, 0.02, 0.018], {
    name: "laptop-keyboard",
  });
  const screenBack = createBox([0.34, 0.22, 0.018], materials.darkFrame, [0, 0.12, -0.11], {
    castShadow: true,
    name: "laptop-screen-back",
  });
  const screen = createBox([0.305, 0.178, 0.004], materials.screen, [0, 0.12, -0.097], {
    name: "laptop-screen",
  });
  screenBack.rotation.x = -0.12;
  screen.rotation.x = -0.12;
  group.add(base, keyboard, screenBack, screen);
  return group;
}

function createDeskLamp(materials: MaterialLibrary): THREE.Group {
  const group = new THREE.Group();
  group.name = "procedural-desk-lamp";
  const worldBase = new THREE.Vector3().fromArray(SCENE_CONFIG.decor.deskLamp.base);
  const basePosition = new THREE.Vector3();
  const jointOne = new THREE.Vector3()
    .fromArray(SCENE_CONFIG.decor.deskLamp.jointOne)
    .sub(worldBase);
  const jointTwo = new THREE.Vector3()
    .fromArray(SCENE_CONFIG.decor.deskLamp.jointTwo)
    .sub(worldBase);
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.082, 0.092, 0.025, 18),
    materials.blackMetal,
  );
  base.position.copy(basePosition);
  base.castShadow = true;
  const armOne = createCylinderBetween(basePosition, jointOne, 0.016, materials.blackMetal, 10);
  const armTwo = createCylinderBetween(jointOne, jointTwo, 0.014, materials.blackMetal, 10);
  const jointA = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), materials.blackMetal);
  jointA.position.copy(jointOne);
  const jointB = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), materials.blackMetal);
  jointB.position.copy(jointTwo);
  const shade = new THREE.Mesh(
    new THREE.ConeGeometry(0.095, 0.17, 18, 1, true),
    materials.blackMetal,
  );
  shade.position.copy(jointTwo).add(new THREE.Vector3(-0.065, -0.055, 0.02));
  shade.rotation.z = Math.PI * 0.58;
  shade.castShadow = true;
  group.add(base, armOne, armTwo, jointA, jointB, shade);
  return group;
}

function createBookInstances(materials: MaterialLibrary): THREE.InstancedMesh {
  const random = mulberry32(8241);
  const transforms: Array<{ position: THREE.Vector3; scale: THREE.Vector3 }> = [];
  const shelfBases = [0.535, 0.875, 1.215, 1.555];

  for (const shelfBase of shelfBases) {
    for (const [startZ, direction] of [
      [-1.27, 1],
      [-0.57, -1],
    ] as const) {
      let cursor = startZ;
      for (let index = 0; index < 4; index += 1) {
        const width = 0.035 + random() * 0.018;
        const height = 0.21 + random() * 0.085;
        transforms.push({
          position: new THREE.Vector3(-1.55, shelfBase + height / 2, cursor),
          scale: new THREE.Vector3(0.19, height, width),
        });
        cursor += direction * (width + 0.008);
      }
    }
  }

  let cabinetCursor = 0.34;
  for (let index = 0; index < 7; index += 1) {
    const width = 0.035 + random() * 0.018;
    const height = 0.2 + random() * 0.06;
    transforms.push({
      position: new THREE.Vector3(1.48, 0.115 + height / 2, cabinetCursor),
      scale: new THREE.Vector3(0.2, height, width),
    });
    cabinetCursor += width + 0.009;
  }

  const books = createBoxInstances(materials.book, transforms.length);
  books.name = "instanced-books";
  books.castShadow = false;
  books.receiveShadow = true;
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const palette = [0xd7ccb9, 0x6b5949, 0x85827a, 0x42513b, 0xb39a7f, 0x4d5555];
  transforms.forEach((transform, index) => {
    matrix.compose(transform.position, quaternion, transform.scale);
    books.setMatrixAt(index, matrix);
    books.setColorAt(index, new THREE.Color(palette[index % palette.length]));
  });
  books.instanceMatrix.needsUpdate = true;
  if (books.instanceColor) books.instanceColor.needsUpdate = true;
  books.computeBoundingSphere();
  return books;
}

function createPictureFrame(materials: MaterialLibrary, wallMounted: boolean): THREE.Group {
  const group = new THREE.Group();
  group.name = wallMounted ? "wall-art" : "cabinet-photo-frame";
  const width = wallMounted ? 0.32 : 0.18;
  const height = wallMounted ? 0.62 : 0.23;
  const frame = wallMounted ? 0.022 : 0.014;
  group.position.fromArray(
    wallMounted ? SCENE_CONFIG.decor.frames.wall : SCENE_CONFIG.decor.frames.cabinet,
  );
  group.rotation.y = -Math.PI / 2;
  group.add(
    createBox([frame, height, 0.025], materials.blackMetal, [-width / 2 + frame / 2, 0, 0], { castShadow: true }),
    createBox([frame, height, 0.025], materials.blackMetal, [width / 2 - frame / 2, 0, 0], { castShadow: true }),
    createBox([width, frame, 0.025], materials.blackMetal, [0, -height / 2 + frame / 2, 0], { castShadow: true }),
    createBox([width, frame, 0.025], materials.blackMetal, [0, height / 2 - frame / 2, 0], { castShadow: true }),
    createBox([width - frame * 2, height - frame * 2, 0.01], materials.paper, [0, 0, -0.012], { name: "frame-mat" }),
  );
  const motif = createBox(
    [wallMounted ? 0.075 : 0.055, wallMounted ? 0.29 : 0.09, 0.006],
    materials.screen,
    [wallMounted ? 0.035 : 0, wallMounted ? -0.02 : 0, 0.006],
    { name: "frame-artwork" },
  );
  motif.rotation.z = wallMounted ? -0.08 : 0.12;
  group.add(motif);
  if (!wallMounted) {
    const stand = createBox(
      [0.012, 0.14, 0.012],
      materials.blackMetal,
      [0, -0.03, -0.055],
      { name: "photo-frame-stand" },
    );
    stand.rotation.x = -0.42;
    group.add(stand);
  }
  return group;
}

function createDeskAccessories(materials: MaterialLibrary): THREE.Group {
  const group = new THREE.Group();
  group.name = "desk-accessories";
  const mug = new THREE.Mesh(
    new THREE.CylinderGeometry(0.038, 0.035, 0.075, 16),
    materials.cabinetWhite,
  );
  mug.position.fromArray(SCENE_CONFIG.decor.deskAccessories.mug);
  mug.castShadow = true;
  const mouse = createBox([0.055, 0.018, 0.09], materials.blackPlastic, SCENE_CONFIG.decor.deskAccessories.mouse, {
    castShadow: true,
    name: "mouse",
  });
  mouse.rotation.y = -0.12;
  group.add(mug, mouse);
  return group;
}
