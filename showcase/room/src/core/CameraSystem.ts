import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { SCENE_CONFIG } from "../config/sceneConfig";

export type CameraMode = "reference" | "player" | "free";

const MODES: readonly CameraMode[] = ["reference", "player", "free"];

export class CameraSystem {
  readonly referenceCamera: THREE.PerspectiveCamera;
  readonly playerCamera: THREE.PerspectiveCamera;
  readonly freeCamera: THREE.PerspectiveCamera;

  private mode: CameraMode = "reference";
  private readonly orbitControls: OrbitControls;
  private readonly playerFeet = new THREE.Vector3();
  private playerYaw = SCENE_CONFIG.player.startYaw;
  private playerPitch = 0;

  constructor(domElement: HTMLElement) {
    this.referenceCamera = this.createCamera(SCENE_CONFIG.cameras.reference.fov);
    this.playerCamera = this.createCamera(SCENE_CONFIG.cameras.playerFov);
    this.freeCamera = this.createCamera(SCENE_CONFIG.cameras.free.fov);

    this.applyPose(this.referenceCamera, SCENE_CONFIG.cameras.reference);
    this.applyPose(this.freeCamera, SCENE_CONFIG.cameras.free);

    this.orbitControls = new OrbitControls(this.freeCamera, domElement);
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.075;
    this.orbitControls.enablePan = true;
    this.orbitControls.screenSpacePanning = true;
    this.orbitControls.minDistance = 0.5;
    this.orbitControls.maxDistance = 4.8;
    this.orbitControls.minPolarAngle = 0.22;
    this.orbitControls.maxPolarAngle = Math.PI * 0.49;
    this.orbitControls.target.fromArray(SCENE_CONFIG.cameras.free.target);
    this.orbitControls.enabled = false;
    this.orbitControls.update();

    this.setPlayerFeet(new THREE.Vector3().fromArray(SCENE_CONFIG.player.start));
    this.applyPlayerRotation();
  }

  get activeCamera(): THREE.PerspectiveCamera {
    if (this.mode === "player") return this.playerCamera;
    if (this.mode === "free") return this.freeCamera;
    return this.referenceCamera;
  }

  get currentMode(): CameraMode {
    return this.mode;
  }

  get yaw(): number {
    return this.playerYaw;
  }

  setMode(mode: CameraMode): void {
    this.mode = mode;
    this.orbitControls.enabled = mode === "free";
    if (mode === "free") this.orbitControls.update();
  }

  cycleMode(): CameraMode {
    const index = MODES.indexOf(this.mode);
    const nextMode = MODES[(index + 1) % MODES.length] ?? "reference";
    this.setMode(nextMode);
    return nextMode;
  }

  setPlayerFeet(feet: THREE.Vector3): void {
    this.playerFeet.copy(feet);
    this.playerCamera.position.set(feet.x, feet.y + SCENE_CONFIG.player.eyeHeight, feet.z);
  }

  rotatePlayer(deltaX: number, deltaY: number): void {
    const sensitivity = 0.002;
    this.playerYaw -= deltaX * sensitivity;
    this.playerPitch -= deltaY * sensitivity;
    this.playerPitch = THREE.MathUtils.clamp(this.playerPitch, -Math.PI * 0.47, Math.PI * 0.47);
    this.applyPlayerRotation();
  }

  reset(mode = this.mode): void {
    if (mode === "reference") {
      this.applyPose(this.referenceCamera, SCENE_CONFIG.cameras.reference);
    } else if (mode === "free") {
      this.applyPose(this.freeCamera, SCENE_CONFIG.cameras.free);
      this.orbitControls.target.fromArray(SCENE_CONFIG.cameras.free.target);
      this.orbitControls.update();
    } else {
      this.playerYaw = SCENE_CONFIG.player.startYaw;
      this.playerPitch = 0;
      this.applyPlayerRotation();
    }
  }

  resize(aspect: number): void {
    for (const camera of [this.referenceCamera, this.playerCamera, this.freeCamera]) {
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
    }
  }

  update(): void {
    if (this.mode === "free") this.orbitControls.update();
  }

  dispose(): void {
    this.orbitControls.dispose();
  }

  private createCamera(fov: number): THREE.PerspectiveCamera {
    return new THREE.PerspectiveCamera(fov, 1, 0.04, 60);
  }

  private applyPose(
    camera: THREE.PerspectiveCamera,
    pose: { readonly position: readonly [number, number, number]; readonly target: readonly [number, number, number] },
  ): void {
    camera.position.fromArray(pose.position);
    camera.lookAt(new THREE.Vector3().fromArray(pose.target));
  }

  private applyPlayerRotation(): void {
    this.playerCamera.rotation.order = "YXZ";
    this.playerCamera.rotation.set(this.playerPitch, this.playerYaw, 0);
  }
}
