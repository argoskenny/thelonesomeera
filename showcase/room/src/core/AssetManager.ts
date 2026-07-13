import * as THREE from "three";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { AssetKey, AssetManifestEntry } from "../config/sceneTypes";

export class AssetManager {
  private readonly cache = new Map<string, Promise<GLTF>>();
  private readonly loadedScenes = new Set<THREE.Object3D>();
  private loaderPromise: Promise<GLTFLoader> | null = null;
  private fallbackTotal = 0;

  constructor(private readonly manifest: Readonly<Record<AssetKey, AssetManifestEntry>>) {}

  get fallbackCount(): number {
    return this.fallbackTotal;
  }

  async instantiate(key: AssetKey, fallback: () => THREE.Object3D): Promise<THREE.Object3D> {
    const entry = this.manifest[key];
    if (!entry.url) return this.makeFallback(key, fallback, "procedural");

    try {
      const gltf = await this.load(entry.url);
      const { clone } = await import("three/examples/jsm/utils/SkeletonUtils.js");
      const instance = clone(gltf.scene);
      instance.name = `asset:${key}`;
      instance.userData.assetSource = entry.url;
      if (entry.scale) instance.scale.setScalar(entry.scale);
      if (entry.offset) instance.position.fromArray(entry.offset);
      return instance;
    } catch (error) {
      console.warn(`Asset '${key}' failed to load; using procedural fallback.`, error);
      return this.makeFallback(key, fallback, "load-failure");
    }
  }

  dispose(): void {
    for (const scene of this.loadedScenes) {
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) material.dispose();
      });
    }
    this.loadedScenes.clear();
    this.cache.clear();
    this.loaderPromise = null;
  }

  private async load(url: string): Promise<GLTF> {
    const cached = this.cache.get(url);
    if (cached) return cached;
    const loader = await this.getLoader();
    const request = loader.loadAsync(url).then((gltf) => {
      this.loadedScenes.add(gltf.scene);
      return gltf;
    });
    this.cache.set(url, request);
    return request;
  }

  private getLoader(): Promise<GLTFLoader> {
    if (!this.loaderPromise) {
      this.loaderPromise = import("three/examples/jsm/loaders/GLTFLoader.js").then(
        ({ GLTFLoader: Loader }) => new Loader(),
      );
    }
    return this.loaderPromise;
  }

  private makeFallback(
    key: AssetKey,
    fallback: () => THREE.Object3D,
    reason: "procedural" | "load-failure",
  ): THREE.Object3D {
    this.fallbackTotal += 1;
    const object = fallback();
    object.name = `fallback:${key}`;
    object.userData.assetFallback = true;
    object.userData.assetFallbackReason = reason;
    return object;
  }
}
