import * as THREE from "three";
import { SCENE_CONFIG } from "../config/sceneConfig";
import { AssetManager } from "../core/AssetManager";
import { CameraSystem, type CameraMode } from "../core/CameraSystem";
import { ControlsSystem } from "../core/ControlsSystem";
import { RendererSystem } from "../core/RendererSystem";
import { DebugSystem } from "../debug/DebugSystem";
import { CollisionSystem } from "../physics/CollisionSystem";
import { SceneSystem } from "../scene/SceneSystem";
import { MaterialLibrary } from "../scene/shared/MaterialLibrary";
import { Hud } from "../ui/Hud";

const FIXED_TIMESTEP = 1 / 60;

export class RoomApp {
  private renderer!: RendererSystem;
  private cameras!: CameraSystem;
  private controls!: ControlsSystem;
  private assets!: AssetManager;
  private collisions!: CollisionSystem;
  private materials!: MaterialLibrary;
  private sceneSystem!: SceneSystem;
  private debug!: DebugSystem;
  private hud!: Hud;
  private resizeObserver!: ResizeObserver;
  private animationFrame = 0;
  private accumulator = 0;
  private readonly timer = new THREE.Timer();

  constructor(private readonly container: HTMLElement) {}

  async init(): Promise<void> {
    this.renderer = new RendererSystem(this.container);
    this.cameras = new CameraSystem(this.renderer.renderer.domElement);
    this.assets = new AssetManager(SCENE_CONFIG.assets);
    this.collisions = new CollisionSystem();
    this.materials = new MaterialLibrary();
    this.sceneSystem = new SceneSystem(this.materials, this.collisions, this.assets);
    await this.sceneSystem.build();

    this.hud = new Hud(this.container, {
      onModeSelected: (mode) => this.setMode(mode),
    });
    this.controls = new ControlsSystem(
      this.renderer.renderer.domElement,
      this.cameras,
      this.collisions,
      {
        onModeRequested: (mode) => this.setMode(mode),
        onResetRequested: () => this.resetCurrentMode(),
        onHudToggleRequested: () => this.hud.toggleVisible(),
        onDebugToggleRequested: () => this.toggleDebug(),
        onPointerLockChanged: (locked) => this.hud.setPointerLocked(locked),
        onPointerLockUnavailable: () => {
          this.hud.showToast("此瀏覽器未允許滑鼠鎖定，請按住拖曳觀看");
        },
      },
    );
    this.debug = new DebugSystem(
      this.sceneSystem.scene,
      this.renderer.renderer,
      this.cameras,
      this.controls,
      this.collisions,
      this.assets,
      this.hud,
    );

    this.resizeObserver = new ResizeObserver(this.handleResize);
    this.resizeObserver.observe(this.container);
    this.handleResize();
    this.setMode("reference");

    const loading = this.container.querySelector<HTMLElement>("#loading");
    if (loading) loading.hidden = true;

    console.info(
      `[StudyRoom] Scene ready — ${SCENE_CONFIG.room.width} × ${SCENE_CONFIG.room.depth} × ${SCENE_CONFIG.room.height} m, ${this.collisions.colliders.length} collision proxies.`,
    );
    this.timer.connect(document);
    this.timer.reset();
    this.animationFrame = requestAnimationFrame(this.animate);
    window.addEventListener("beforeunload", this.dispose, { once: true });
  }

  private setMode(mode: CameraMode): void {
    if (mode !== "player" && document.pointerLockElement) document.exitPointerLock();
    this.cameras.setMode(mode);
    this.sceneSystem.setReferenceCutaway(mode === "reference");
    this.hud.setMode(mode);
    const message: Readonly<Record<CameraMode, string>> = {
      reference: "已切換到設計圖參考視角",
      player: "玩家視角：點擊場景開始控制",
      free: "自由視角：拖曳旋轉，滾輪縮放",
    };
    this.hud.showToast(message[mode]);
  }

  private resetCurrentMode(): void {
    if (this.cameras.currentMode === "player") {
      this.controls.resetPlayer();
    } else {
      this.cameras.reset();
    }
    this.hud.showToast("位置已重設");
  }

  private toggleDebug(): void {
    const visible = this.debug.toggleColliders();
    this.hud.showToast(visible ? "已顯示碰撞代理與 1.8m 尺標" : "已隱藏碰撞代理");
  }

  private readonly handleResize = (): void => {
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.renderer.resize(width, height);
    this.cameras.resize(width / height);
  };

  private readonly animate = (timestamp: number): void => {
    this.timer.update(timestamp);
    const dt = Math.min(this.timer.getDelta(), 0.05);
    this.accumulator += dt;
    while (this.accumulator >= FIXED_TIMESTEP) {
      this.controls.fixedUpdate(FIXED_TIMESTEP);
      this.accumulator -= FIXED_TIMESTEP;
    }
    this.cameras.update();
    this.renderer.render(this.sceneSystem.scene, this.cameras.activeCamera);
    this.debug.updateAfterRender(dt);
    this.animationFrame = requestAnimationFrame(this.animate);
  };

  private readonly dispose = (): void => {
    cancelAnimationFrame(this.animationFrame);
    this.resizeObserver?.disconnect();
    this.timer.dispose();
    this.controls?.dispose();
    this.debug?.dispose();
    this.hud?.dispose();
    this.cameras?.dispose();
    this.sceneSystem?.dispose();
    this.assets?.dispose();
    this.collisions?.clear();
    this.renderer?.dispose();
  };
}
