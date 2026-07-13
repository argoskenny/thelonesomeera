import * as THREE from "three";
import type { AssetManager } from "../core/AssetManager";
import type { CameraSystem } from "../core/CameraSystem";
import type { ControlsSystem } from "../core/ControlsSystem";
import type { CollisionSystem } from "../physics/CollisionSystem";
import type { Hud } from "../ui/Hud";

export class DebugSystem {
  private readonly debugRoot = new THREE.Group();
  private frameCount = 0;
  private sampleElapsed = 0;
  private fps = 0;

  constructor(
    scene: THREE.Scene,
    private readonly renderer: THREE.WebGLRenderer,
    private readonly cameras: CameraSystem,
    private readonly controls: ControlsSystem,
    collisions: CollisionSystem,
    private readonly assets: AssetManager,
    private readonly hud: Hud,
  ) {
    this.debugRoot.name = "DebugSystem";
    this.debugRoot.visible = false;
    for (const collider of collisions.colliders) {
      const color = collider.walkable ? 0x53c6a0 : 0xff6557;
      const helper = new THREE.Box3Helper(collider.box, color);
      helper.name = `collider:${collider.id}`;
      this.debugRoot.add(helper);
    }
    this.debugRoot.add(this.createScaleFigure());
    const grid = new THREE.GridHelper(4.4, 44, 0x7bbca8, 0x728077);
    grid.position.y = 0.006;
    grid.material.opacity = 0.24;
    grid.material.transparent = true;
    this.debugRoot.add(grid);
    scene.add(this.debugRoot);
  }

  toggleColliders(): boolean {
    this.debugRoot.visible = !this.debugRoot.visible;
    return this.debugRoot.visible;
  }

  updateAfterRender(dt: number): void {
    this.frameCount += 1;
    this.sampleElapsed += dt;
    if (this.sampleElapsed < 0.25) return;

    this.fps = this.frameCount / this.sampleElapsed;
    this.frameCount = 0;
    this.sampleElapsed = 0;
    const camera = this.cameras.activeCamera.position;
    const player = this.controls.playerPosition;
    const info = this.renderer.info;
    this.hud.updateStats({
      fps: this.fps,
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      geometries: info.memory.geometries,
      textures: info.memory.textures,
      camera: this.formatVector(camera),
      player: this.formatVector(player),
      grounded: this.controls.grounded,
      fallbackAssets: this.assets.fallbackCount,
    });
  }

  dispose(): void {
    this.debugRoot.removeFromParent();
  }

  private formatVector(vector: THREE.Vector3): string {
    return `${vector.x.toFixed(2)}, ${vector.y.toFixed(2)}, ${vector.z.toFixed(2)}`;
  }

  private createScaleFigure(): THREE.Group {
    const root = new THREE.Group();
    root.name = "scale-reference-1.8m";
    root.position.set(-0.7, 0, 0.95);
    const material = new THREE.MeshBasicMaterial({
      color: 0x5fe0c3,
      wireframe: true,
      transparent: true,
      opacity: 0.8,
      depthTest: false,
    });
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 1.2, 4, 8), material);
    torso.position.y = 0.76;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8), material);
    head.position.y = 1.66;
    root.add(torso, head);
    return root;
  }
}
