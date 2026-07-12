import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

interface GeometryBucket {
  readonly material: THREE.Material;
  readonly geometries: THREE.BufferGeometry[];
  readonly castShadow: boolean;
  readonly receiveShadow: boolean;
  readonly cutaway: boolean;
}

export function batchStaticMeshes(source: THREE.Group, name = source.name): THREE.Group {
  source.updateWorldMatrix(true, true);
  const output = new THREE.Group();
  output.name = name;
  const buckets = new Map<string, GeometryBucket>();
  const preserved: THREE.Object3D[] = [];
  const flattenedTransparent: THREE.Mesh[] = [];
  const externalRoots = new Set<THREE.Object3D>();

  source.traverse((object) => {
    if (typeof object.userData.assetSource === "string" && object.userData.assetSource !== "procedural") {
      const placement = object.parent?.userData.assetPlacement === true ? object.parent : object;
      externalRoots.add(placement);
    }
  });

  source.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    if (!object.visible) return;
    if (hasExternalAncestor(object, externalRoots)) return;
    if (object instanceof THREE.InstancedMesh || object instanceof THREE.SkinnedMesh) {
      preserved.push(object);
      return;
    }
    if (Array.isArray(object.material)) {
      preserved.push(object);
      return;
    }

    const geometry = object.geometry.clone();
    geometry.applyMatrix4(object.matrixWorld);
    if (object.material.transparent) {
      const mesh = new THREE.Mesh(geometry, object.material);
      mesh.name = object.name || "transparent-static-mesh";
      mesh.castShadow = object.castShadow;
      mesh.receiveShadow = object.receiveShadow;
      mesh.renderOrder = object.renderOrder;
      mesh.userData = { ...object.userData };
      flattenedTransparent.push(mesh);
      return;
    }

    const cutaway = object.userData.cutaway === true;
    const key = [
      object.material.uuid,
      Number(object.castShadow),
      Number(object.receiveShadow),
      Number(cutaway),
    ].join(":");
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = {
        material: object.material,
        geometries: [],
        castShadow: object.castShadow,
        receiveShadow: object.receiveShadow,
        cutaway,
      };
    }
    bucket.geometries.push(geometry);
    buckets.set(key, bucket);
  });

  for (const [key, bucket] of buckets) {
    const geometry = bucket.geometries.length === 1
      ? bucket.geometries[0]
      : mergeGeometries(bucket.geometries, false);
    if (!geometry) continue;
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    const mesh = new THREE.Mesh(geometry, bucket.material);
    mesh.name = `batched:${name}:${key.slice(0, 8)}`;
    mesh.castShadow = bucket.castShadow;
    mesh.receiveShadow = bucket.receiveShadow;
    mesh.userData.cutaway = bucket.cutaway;
    output.add(mesh);
  }

  for (const mesh of flattenedTransparent) output.add(mesh);
  for (const object of [...externalRoots, ...preserved]) {
    if (hasExternalAncestor(object, externalRoots) && !externalRoots.has(object)) continue;
    output.attach(object);
  }
  return output;
}

function hasExternalAncestor(
  object: THREE.Object3D,
  externalRoots: ReadonlySet<THREE.Object3D>,
): boolean {
  let current: THREE.Object3D | null = object;
  while (current) {
    if (externalRoots.has(current)) return true;
    current = current.parent;
  }
  return false;
}
