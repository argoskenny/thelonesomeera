import * as THREE from "three";
import { SCENE_CONFIG } from "../config/sceneConfig";
import type { CollisionSystem } from "../physics/CollisionSystem";
import type { CameraMode, CameraSystem } from "./CameraSystem";

interface ControlsCallbacks {
  readonly onModeRequested: (mode: CameraMode) => void;
  readonly onResetRequested: () => void;
  readonly onHudToggleRequested: () => void;
  readonly onDebugToggleRequested: () => void;
  readonly onPointerLockChanged: (locked: boolean) => void;
  readonly onPointerLockUnavailable: () => void;
}

export class ControlsSystem {
  readonly playerPosition = new THREE.Vector3().fromArray(SCENE_CONFIG.player.start);

  private readonly pressed = new Set<string>();
  private readonly movement = new THREE.Vector3();
  private readonly displacement = new THREE.Vector3();
  private readonly forward = new THREE.Vector3();
  private readonly right = new THREE.Vector3();
  private verticalVelocity = 0;
  private groundedState = true;
  private jumpQueued = false;
  private pulseForward = 0;
  private pulseRight = 0;
  private dragLooking = false;
  private dragX = 0;
  private dragY = 0;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly cameras: CameraSystem,
    private readonly collisions: CollisionSystem,
    private readonly callbacks: ControlsCallbacks,
  ) {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);
    document.addEventListener("mousemove", this.onMouseMove);
    window.addEventListener("pointerup", this.onPointerUp);
    document.addEventListener("pointerlockchange", this.onPointerLockChange);
    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    this.canvas.addEventListener("click", this.onCanvasClick);
    this.cameras.setPlayerFeet(this.playerPosition);
  }

  get grounded(): boolean {
    return this.groundedState;
  }

  get pointerLocked(): boolean {
    return document.pointerLockElement === this.canvas;
  }

  fixedUpdate(dt: number): void {
    if (this.cameras.currentMode === "player") this.updateHorizontal(dt);
    this.updateVertical(dt);
    this.cameras.setPlayerFeet(this.playerPosition);
  }

  resetPlayer(): void {
    this.playerPosition.fromArray(SCENE_CONFIG.player.start);
    this.verticalVelocity = 0;
    this.groundedState = true;
    this.cameras.reset("player");
    this.cameras.setPlayerFeet(this.playerPosition);
  }

  requestPointerLock(): void {
    if (this.cameras.currentMode === "player" && !this.pointerLocked) {
      try {
        void this.canvas.requestPointerLock().catch(() => {
          this.callbacks.onPointerLockUnavailable();
        });
      } catch {
        this.callbacks.onPointerLockUnavailable();
      }
    }
  }

  dispose(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onBlur);
    document.removeEventListener("mousemove", this.onMouseMove);
    window.removeEventListener("pointerup", this.onPointerUp);
    document.removeEventListener("pointerlockchange", this.onPointerLockChange);
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.canvas.removeEventListener("click", this.onCanvasClick);
  }

  private updateHorizontal(dt: number): void {
    const heldForward = Number(this.pressed.has("KeyW")) - Number(this.pressed.has("KeyS"));
    const heldRight = Number(this.pressed.has("KeyD")) - Number(this.pressed.has("KeyA"));
    const forwardInput = THREE.MathUtils.clamp(heldForward + this.pulseForward, -1, 1);
    const rightInput = THREE.MathUtils.clamp(heldRight + this.pulseRight, -1, 1);
    this.pulseForward = 0;
    this.pulseRight = 0;
    this.movement.set(0, 0, 0);

    if (forwardInput !== 0 || rightInput !== 0) {
      const yaw = this.cameras.yaw;
      this.forward.set(-Math.sin(yaw), 0, -Math.cos(yaw));
      this.right.set(Math.cos(yaw), 0, -Math.sin(yaw));
      this.movement
        .addScaledVector(this.forward, forwardInput)
        .addScaledVector(this.right, rightInput)
        .normalize();
      const speed = this.pressed.has("ShiftLeft") || this.pressed.has("ShiftRight")
        ? SCENE_CONFIG.player.sprintSpeed
        : SCENE_CONFIG.player.walkSpeed;
      this.displacement.copy(this.movement).multiplyScalar(speed * dt);
      this.collisions.resolveHorizontal(
        this.playerPosition,
        this.displacement,
        SCENE_CONFIG.player.radius,
        SCENE_CONFIG.player.height,
      );
    }

    if (this.jumpQueued && this.groundedState) {
      this.verticalVelocity = 3.05;
      this.groundedState = false;
    }
    this.jumpQueued = false;
  }

  private updateVertical(dt: number): void {
    const ground = this.collisions.groundHeightAt(
      this.playerPosition,
      SCENE_CONFIG.player.radius,
    );
    this.verticalVelocity -= 9.81 * dt;
    this.playerPosition.y += this.verticalVelocity * dt;

    if (ground !== null && this.playerPosition.y <= ground && this.verticalVelocity <= 0) {
      this.playerPosition.y = ground;
      this.verticalVelocity = 0;
      this.groundedState = true;
    } else {
      this.groundedState = false;
    }

    if (this.playerPosition.y < -2) this.resetPlayer();
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    this.pressed.add(event.code);
    if (event.repeat) return;

    if (event.code === "KeyW") this.pulseForward = 1;
    if (event.code === "KeyS") this.pulseForward = -1;
    if (event.code === "KeyD") this.pulseRight = 1;
    if (event.code === "KeyA") this.pulseRight = -1;

    if (event.code === "Space") {
      this.jumpQueued = true;
      event.preventDefault();
    } else if (event.code === "Digit1") {
      this.callbacks.onModeRequested("reference");
    } else if (event.code === "Digit2") {
      this.callbacks.onModeRequested("player");
    } else if (event.code === "Digit3") {
      this.callbacks.onModeRequested("free");
    } else if (event.code === "KeyC") {
      this.callbacks.onModeRequested(this.cameras.cycleMode());
    } else if (event.code === "KeyR") {
      this.callbacks.onResetRequested();
    } else if (event.code === "KeyH" || event.code === "F3") {
      event.preventDefault();
      this.callbacks.onHudToggleRequested();
    } else if (event.code === "KeyG" || event.code === "F4") {
      event.preventDefault();
      this.callbacks.onDebugToggleRequested();
    }
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    this.pressed.delete(event.code);
  };

  private readonly onBlur = (): void => {
    this.pressed.clear();
  };

  private readonly onMouseMove = (event: MouseEvent): void => {
    if (this.pointerLocked && this.cameras.currentMode === "player") {
      this.cameras.rotatePlayer(event.movementX, event.movementY);
    } else if (this.dragLooking && this.cameras.currentMode === "player") {
      this.cameras.rotatePlayer(event.clientX - this.dragX, event.clientY - this.dragY);
      this.dragX = event.clientX;
      this.dragY = event.clientY;
    }
  };

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (this.cameras.currentMode !== "player" || event.button !== 0) return;
    this.dragLooking = true;
    this.dragX = event.clientX;
    this.dragY = event.clientY;
  };

  private readonly onPointerUp = (): void => {
    this.dragLooking = false;
  };

  private readonly onPointerLockChange = (): void => {
    if (this.pointerLocked) this.dragLooking = false;
    this.callbacks.onPointerLockChanged(this.pointerLocked);
  };

  private readonly onCanvasClick = (): void => {
    this.requestPointerLock();
  };
}
