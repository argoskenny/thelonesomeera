import * as THREE from "three";

const UNIT_BOX_GEOMETRY = new THREE.BoxGeometry(1, 1, 1);
const UNIT_CYLINDERS = new Map<number, THREE.CylinderGeometry>();

export interface BoxOptions {
  readonly castShadow?: boolean;
  readonly receiveShadow?: boolean;
  readonly name?: string;
}

export function createBox(
  size: readonly [number, number, number],
  material: THREE.Material,
  position: readonly [number, number, number] = [0, 0, 0],
  options: BoxOptions = {},
): THREE.Mesh {
  const mesh = new THREE.Mesh(UNIT_BOX_GEOMETRY, material);
  mesh.scale.set(...size);
  mesh.position.fromArray(position);
  mesh.castShadow = options.castShadow ?? false;
  mesh.receiveShadow = options.receiveShadow ?? false;
  if (options.name) mesh.name = options.name;
  return mesh;
}

export function createBoxInstances(
  material: THREE.Material,
  count: number,
): THREE.InstancedMesh {
  return new THREE.InstancedMesh(UNIT_BOX_GEOMETRY, material, count);
}

export function createCylinderBetween(
  start: THREE.Vector3,
  end: THREE.Vector3,
  radius: number,
  material: THREE.Material,
  radialSegments = 10,
): THREE.Mesh {
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  let geometry = UNIT_CYLINDERS.get(radialSegments);
  if (!geometry) {
    geometry = new THREE.CylinderGeometry(1, 1, 1, radialSegments);
    UNIT_CYLINDERS.set(radialSegments, geometry);
  }
  const mesh = new THREE.Mesh(geometry, material);
  mesh.scale.set(radius, length, radius);
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  mesh.castShadow = true;
  return mesh;
}

export function setShadowRecursive(
  object: THREE.Object3D,
  castShadow: boolean,
  receiveShadow = false,
): void {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = castShadow;
      child.receiveShadow = receiveShadow;
    }
  });
}

export function placeObject(
  object: THREE.Object3D,
  position: readonly [number, number, number],
  rotationY = 0,
  name = "asset-placement",
): THREE.Group {
  const placement = new THREE.Group();
  placement.name = name;
  placement.userData.assetPlacement = true;
  placement.position.fromArray(position);
  placement.rotation.y = rotationY;
  placement.add(object);
  return placement;
}

export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
