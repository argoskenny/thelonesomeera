import * as THREE from "three";
import { SCENE_CONFIG } from "../../config/sceneConfig";
import type { AssetManager } from "../../core/AssetManager";
import type { MaterialLibrary } from "../shared/MaterialLibrary";
import { createCylinderBetween, mulberry32, placeObject } from "../shared/geometry";

interface PlantSpec {
  readonly position: readonly [number, number, number];
  readonly radius: number;
  readonly height: number;
  readonly leafScale: number;
}

export async function buildVegetation(
  materials: MaterialLibrary,
  assets: AssetManager,
): Promise<THREE.Group> {
  const root = new THREE.Group();
  root.name = "Vegetation";
  root.add(createSmallPlants(materials));
  root.add(createExteriorGreenery(materials));
  const hero = await assets.instantiate("heroPlant", () => createTrailingPlant(materials));
  root.add(
    placeObject(hero, SCENE_CONFIG.decor.plants.hero, 0, "hero-plant-placement"),
  );
  return root;
}

function createSmallPlants(materials: MaterialLibrary): THREE.Group {
  const root = new THREE.Group();
  root.name = "interior-small-plants";
  const specs: readonly PlantSpec[] = [
    SCENE_CONFIG.decor.plants.desk,
    SCENE_CONFIG.decor.plants.cabinet,
  ];
  const potGeometry = new THREE.CylinderGeometry(1, 0.78, 1, 14);
  const pots = new THREE.InstancedMesh(potGeometry, materials.pot, specs.length);
  pots.name = "instanced-plant-pots";
  pots.castShadow = true;
  const soilGeometry = new THREE.CylinderGeometry(1, 1, 1, 14);
  const soils = new THREE.InstancedMesh(soilGeometry, materials.soil, specs.length);
  soils.name = "instanced-plant-soil";
  const leafGeometry = new THREE.IcosahedronGeometry(1, 1);
  const leavesPerPlant = 9;
  const leaves = new THREE.InstancedMesh(leafGeometry, materials.foliage, specs.length * leavesPerPlant);
  leaves.name = "instanced-indoor-leaves";
  const random = mulberry32(4751);
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const colors = [0x789a58, 0x5f8143, 0x93a971];

  specs.forEach((spec, plantIndex) => {
    quaternion.identity();
    position.fromArray(spec.position).add(new THREE.Vector3(0, spec.height / 2, 0));
    scale.set(spec.radius, spec.height, spec.radius);
    matrix.compose(position, quaternion, scale);
    pots.setMatrixAt(plantIndex, matrix);
    position.set(spec.position[0], spec.position[1] + spec.height + 0.004, spec.position[2]);
    scale.set(spec.radius * 0.72, 0.008, spec.radius * 0.72);
    matrix.compose(position, quaternion, scale);
    soils.setMatrixAt(plantIndex, matrix);

    for (let leafIndex = 0; leafIndex < leavesPerPlant; leafIndex += 1) {
      const index = plantIndex * leavesPerPlant + leafIndex;
      const angle = (leafIndex / leavesPerPlant) * Math.PI * 2 + random() * 0.5;
      const radius = spec.leafScale * (0.55 + random() * 0.75);
      position.set(
        spec.position[0] + Math.cos(angle) * radius,
        spec.position[1] + spec.height + 0.035 + random() * spec.leafScale * 1.8,
        spec.position[2] + Math.sin(angle) * radius,
      );
      scale.set(
        spec.leafScale * (0.6 + random() * 0.4),
        spec.leafScale * (0.35 + random() * 0.35),
        spec.leafScale * (0.45 + random() * 0.35),
      );
      quaternion.setFromEuler(new THREE.Euler(random() * 0.5, angle, random() * 0.45));
      matrix.compose(position, quaternion, scale);
      leaves.setMatrixAt(index, matrix);
      leaves.setColorAt(index, new THREE.Color(colors[index % colors.length]));
    }
  });
  for (const mesh of [pots, soils, leaves]) {
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }
  if (leaves.instanceColor) leaves.instanceColor.needsUpdate = true;
  root.add(pots, soils, leaves);
  return root;
}

function createTrailingPlant(materials: MaterialLibrary): THREE.Group {
  const root = new THREE.Group();
  root.name = "procedural-trailing-plant";
  const base = new THREE.Vector3();
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.085, 0.15, 16), materials.pot);
  pot.position.copy(base).add(new THREE.Vector3(0, 0.075, 0));
  pot.castShadow = true;
  root.add(pot);

  const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x344426, roughness: 0.9 });
  const stemStart = new THREE.Vector3(0, 0.13, 0);
  const stemEnds = [
    new THREE.Vector3(0.08, -0.66, 0.05),
    new THREE.Vector3(0.03, -0.56, -0.1),
    new THREE.Vector3(0.13, -0.48, -0.02),
  ];
  for (const end of stemEnds) root.add(createCylinderBetween(stemStart, end, 0.008, stemMaterial, 7));

  const leafCount = 24;
  const leaves = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(1, 1),
    materials.foliage,
    leafCount,
  );
  const random = mulberry32(7718);
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const colors = [0x789a58, 0x5f8143, 0x93a971];
  for (let index = 0; index < leafCount; index += 1) {
    const strand = stemEnds[index % stemEnds.length];
    const t = (Math.floor(index / stemEnds.length) + 1) / 8;
    position.lerpVectors(stemStart, strand, Math.min(t, 1));
    position.x += (random() - 0.5) * 0.1;
    position.z += (random() - 0.5) * 0.08;
    scale.set(0.07 + random() * 0.035, 0.035 + random() * 0.025, 0.05 + random() * 0.03);
    quaternion.setFromEuler(new THREE.Euler(random() * 0.5, random() * Math.PI, random() * 0.5));
    matrix.compose(position, quaternion, scale);
    leaves.setMatrixAt(index, matrix);
    leaves.setColorAt(index, new THREE.Color(colors[index % colors.length]));
  }
  leaves.instanceMatrix.needsUpdate = true;
  if (leaves.instanceColor) leaves.instanceColor.needsUpdate = true;
  leaves.computeBoundingSphere();
  root.add(leaves);
  return root;
}

function createExteriorGreenery(materials: MaterialLibrary): THREE.Group {
  const root = new THREE.Group();
  root.name = "window-exterior-greenery";
  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(3, 2.9),
    materials.exteriorBackdrop,
  );
  backdrop.name = "window-daylight-backdrop";
  backdrop.position.set(0, 1.42, -3.05);
  root.add(backdrop);
  const treePositions = SCENE_CONFIG.decor.exteriorTrees.map(
    (position) => new THREE.Vector3().fromArray(position),
  );
  const trunks = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.045, 0.08, 1, 7),
    materials.woodDark,
    treePositions.length,
  );
  trunks.name = "instanced-exterior-trunks";
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  for (let index = 0; index < treePositions.length; index += 1) {
    const position = treePositions[index];
    matrix.compose(
      new THREE.Vector3(position.x, position.y + 0.7, position.z),
      quaternion,
      new THREE.Vector3(1, 1.4, 1),
    );
    trunks.setMatrixAt(index, matrix);
  }
  trunks.instanceMatrix.needsUpdate = true;
  trunks.computeBoundingSphere();

  const clustersPerTree = 8;
  const foliage = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(1, 1),
    materials.foliageExterior,
    treePositions.length * clustersPerTree,
  );
  foliage.name = "instanced-exterior-foliage";
  const random = mulberry32(1911);
  const colors = [0xc0cdb0, 0xd0d9c1, 0xaebf9d];
  treePositions.forEach((tree, treeIndex) => {
    for (let index = 0; index < clustersPerTree; index += 1) {
      const instanceIndex = treeIndex * clustersPerTree + index;
      const angle = (index / clustersPerTree) * Math.PI * 2;
      const position = new THREE.Vector3(
        tree.x + Math.cos(angle) * (0.08 + random() * 0.1),
        1.24 + random() * 0.78,
        tree.z + Math.sin(angle) * (0.08 + random() * 0.1),
      );
      const scale = new THREE.Vector3(
        0.18 + random() * 0.09,
        0.16 + random() * 0.1,
        0.15 + random() * 0.08,
      );
      quaternion.setFromEuler(new THREE.Euler(random() * 0.5, angle, random() * 0.4));
      matrix.compose(position, quaternion, scale);
      foliage.setMatrixAt(instanceIndex, matrix);
      foliage.setColorAt(instanceIndex, new THREE.Color(colors[instanceIndex % colors.length]));
    }
  });
  foliage.instanceMatrix.needsUpdate = true;
  if (foliage.instanceColor) foliage.instanceColor.needsUpdate = true;
  foliage.computeBoundingSphere();
  root.add(trunks, foliage);
  return root;
}
