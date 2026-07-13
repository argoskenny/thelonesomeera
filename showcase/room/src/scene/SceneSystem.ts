import * as THREE from "three";
import type { AssetManager } from "../core/AssetManager";
import type { CollisionSystem } from "../physics/CollisionSystem";
import { buildBuildings } from "./builders/Buildings";
import { buildFurniture } from "./builders/Furniture";
import { buildLighting } from "./builders/Lighting";
import { buildProps } from "./builders/Props";
import { buildTerrain } from "./builders/Terrain";
import { buildVegetation } from "./builders/Vegetation";
import type { MaterialLibrary } from "./shared/MaterialLibrary";
import { batchStaticMeshes } from "./shared/batchStaticMeshes";

export class SceneSystem {
  readonly scene = new THREE.Scene();

  constructor(
    private readonly materials: MaterialLibrary,
    private readonly collisions: CollisionSystem,
    private readonly assets: AssetManager,
  ) {
    this.scene.name = "StudyRoomScene";
    this.scene.background = new THREE.Color(0xbfc7bd);
    this.scene.fog = new THREE.Fog(0xc9cdc5, 7, 18);
  }

  async build(): Promise<void> {
    this.scene.add(batchStaticMeshes(buildTerrain(this.materials, this.collisions)));
    this.scene.add(batchStaticMeshes(buildBuildings(this.materials, this.collisions)));
    this.scene.add(batchStaticMeshes(await buildFurniture(this.materials, this.collisions, this.assets)));
    this.scene.add(batchStaticMeshes(await buildProps(this.materials, this.assets)));
    this.scene.add(batchStaticMeshes(await buildVegetation(this.materials, this.assets)));
    this.scene.add(buildLighting(this.materials));
  }

  setReferenceCutaway(enabled: boolean): void {
    this.scene.traverse((object) => {
      if (object.userData.cutaway === true) object.visible = !enabled;
    });
  }

  dispose(): void {
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    this.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      geometries.add(object.geometry);
      const meshMaterials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of meshMaterials) materials.add(material);
    });
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
    this.scene.clear();
  }
}
