import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { batchStaticMeshes } from "../src/scene/shared/batchStaticMeshes";
import { placeObject } from "../src/scene/shared/geometry";

describe("batchStaticMeshes", () => {
  it("preserves the world-placement wrapper and local transform of external assets", () => {
    const source = new THREE.Group();
    const asset = new THREE.Group();
    asset.name = "asset:chair";
    asset.userData.assetSource = "/assets/models/chair.glb";
    asset.position.set(0.1, 0.2, 0.3);
    asset.scale.setScalar(2);
    asset.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial()));

    const placement = placeObject(asset, [1, 0, -2], Math.PI / 2, "chair-placement");
    source.add(placement);

    const output = batchStaticMeshes(source);

    expect(output.getObjectByName("chair-placement")).toBe(placement);
    expect(placement.parent).toBe(output);
    expect(asset.parent).toBe(placement);
    expect(asset.position.toArray()).toEqual([0.1, 0.2, 0.3]);
    expect(asset.scale.toArray()).toEqual([2, 2, 2]);
  });
});
