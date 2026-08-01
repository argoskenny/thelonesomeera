import * as THREE from "three";
import { Hud, type HeldItem } from "../ui/Hud";
import {
  TOTAL_LAPS,
  circularDistance,
  sortRankings,
  type RankingEntry,
  wrapProgress,
} from "./race-rules";
import {
  buildWorld,
  createBanana,
  createKart,
  getTrackFrame,
  placeBanana,
  placeKart,
  type BananaVisual,
  type KartVisual,
  type WorldAssets,
} from "./world";

type RacePhase = "countdown" | "racing" | "finishing" | "results" | "spectator";

interface Racer extends RankingEntry {
  kart: KartVisual;
  speed: number;
  lane: number;
  targetLane: number;
  aiSpeed: number;
  boostTimer: number;
  spinTimer: number;
  spinAngle: number;
  heldItem: HeldItem;
  padContacts: Set<number>;
  ai: boolean;
}

interface InputState {
  left: boolean;
  right: boolean;
  accelerate: boolean;
  brake: boolean;
}

const PLAYER_ID = "player";
const KART_UP = new THREE.Vector3(0, 1, 0);
const START_PROGRESS = -0.045;

export class KartGame {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(57, 1, 0.1, 600);
  private readonly world: WorldAssets;
  private readonly hud: Hud;
  private readonly input: InputState = { left: false, right: false, accelerate: false, brake: false };
  private readonly racers: Racer[];
  private phase: RacePhase = "countdown";
  private raceTime = 0;
  private countdownTime = 3.85;
  private finishWait = 0;
  private lastFrame = performance.now();
  private spectatorAngle = 0;
  private animationFrame = 0;
  private reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  constructor(container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    container.appendChild(this.renderer.domElement);

    this.scene.fog = new THREE.Fog(0x63c9ff, 70, 155);
    this.setupLights();
    this.world = buildWorld(this.scene);
    this.racers = this.createRacers();
    this.hud = new Hud(
      () => this.usePlayerItem(),
      () => this.reset(),
      () => this.enterSpectatorMode(),
    );
    this.setupInput();
    this.resize();
    window.addEventListener("resize", () => this.resize());
    this.reset();
    this.animationFrame = requestAnimationFrame((time) => this.animate(time));
  }

  destroy(): void {
    cancelAnimationFrame(this.animationFrame);
    this.renderer.dispose();
  }

  private setupLights(): void {
    const hemisphere = new THREE.HemisphereLight(0xd7f6ff, 0x497c46, 2.5);
    this.scene.add(hemisphere);
    const sun = new THREE.DirectionalLight(0xfff3d6, 4.4);
    sun.position.set(-34, 65, 24);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -75;
    sun.shadow.camera.right = 75;
    sun.shadow.camera.top = 75;
    sun.shadow.camera.bottom = -75;
    sun.shadow.camera.near = 10;
    sun.shadow.camera.far = 160;
    sun.shadow.bias = -0.00035;
    this.scene.add(sun);
    const fill = new THREE.DirectionalLight(0x8c70ff, 0.85);
    fill.position.set(35, 18, -25);
    this.scene.add(fill);
  }

  private createRacers(): Racer[] {
    const definitions = [
      { id: PLAYER_ID, name: "YOU", color: 0xff574f, accent: 0xffffff, ai: false, lane: -1.15, speed: 0 },
      { id: "nova", name: "NOVA", color: 0x24d5d8, accent: 0xe8ffff, ai: true, lane: 1.15, speed: 31.1 },
      { id: "bolt", name: "BOLT", color: 0x9f4aea, accent: 0xf2d7ff, ai: true, lane: -1.15, speed: 30.2 },
      { id: "luma", name: "LUMA", color: 0xffcc37, accent: 0xfff4b8, ai: true, lane: 1.15, speed: 29.5 },
    ];
    return definitions.map((definition, index) => {
      const kart = createKart(definition.color, definition.accent);
      this.scene.add(kart.root);
      return {
        id: definition.id,
        name: definition.name,
        color: definition.color,
        totalProgress: START_PROGRESS - (index * 0.0085),
        finishTime: null,
        kart,
        speed: 0,
        lane: definition.lane,
        targetLane: definition.lane,
        aiSpeed: definition.speed,
        boostTimer: 0,
        spinTimer: 0,
        spinAngle: 0,
        heldItem: null,
        padContacts: new Set<number>(),
        ai: definition.ai,
      };
    });
  }

  private setupInput(): void {
    const updateKey = (event: KeyboardEvent, pressed: boolean): void => {
      const key = event.key.toLowerCase();
      if (["arrowleft", "arrowright", "arrowup", "arrowdown", " "].includes(key)) event.preventDefault();
      if (key === "a" || key === "arrowleft") this.input.left = pressed;
      if (key === "d" || key === "arrowright") this.input.right = pressed;
      if (key === "w" || key === "arrowup") this.input.accelerate = pressed;
      if (key === "s" || key === "arrowdown") this.input.brake = pressed;
      if (pressed && key === " ") this.usePlayerItem();
      if (pressed && key === "r" && (this.phase === "results" || this.phase === "spectator")) this.reset();
    };
    window.addEventListener("keydown", (event) => updateKey(event, true), { passive: false });
    window.addEventListener("keyup", (event) => updateKey(event, false), { passive: false });
    window.addEventListener("blur", () => {
      this.input.left = false;
      this.input.right = false;
      this.input.accelerate = false;
      this.input.brake = false;
    });

    document.querySelectorAll<HTMLButtonElement>("[data-control]").forEach((button) => {
      const control = button.dataset.control;
      const setPressed = (pressed: boolean): void => {
        if (control === "left") this.input.left = pressed;
        if (control === "right") this.input.right = pressed;
        if (control === "drive") this.input.accelerate = pressed;
      };
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        button.setPointerCapture(event.pointerId);
        setPressed(true);
      });
      button.addEventListener("pointerup", () => setPressed(false));
      button.addEventListener("pointercancel", () => setPressed(false));
    });
  }

  private reset(): void {
    this.phase = "countdown";
    this.raceTime = 0;
    this.countdownTime = 3.85;
    this.finishWait = 0;
    this.spectatorAngle = 0;
    this.hud.hideResults();
    this.hud.clearToast();
    this.hud.setCountdown("3");
    this.input.left = false;
    this.input.right = false;
    this.input.accelerate = false;
    this.input.brake = false;

    const gridLanes = [-1.15, 1.15, -1.15, 1.15];
    this.racers.forEach((racer, index) => {
      racer.totalProgress = START_PROGRESS - (index * 0.0085);
      racer.finishTime = null;
      racer.speed = 0;
      racer.lane = gridLanes[index] ?? 0;
      racer.targetLane = racer.lane;
      racer.boostTimer = 0;
      racer.spinTimer = 0;
      racer.spinAngle = 0;
      racer.heldItem = null;
      racer.padContacts.clear();
      racer.kart.root.visible = true;
      racer.kart.exhausts.forEach((exhaust) => {
        (exhaust.material as THREE.MeshBasicMaterial).opacity = 0;
        exhaust.scale.setScalar(0.5);
      });
      placeKart(racer.kart, this.world.curve, racer.totalProgress, racer.lane, 0);
    });
    this.world.itemBoxes.forEach((box) => {
      box.active = true;
      box.mesh.visible = true;
      box.respawnAt = 0;
    });
    this.world.bananas.forEach((banana, index) => {
      banana.active = index < 3;
      banana.mesh.visible = banana.active;
      banana.ownerId = null;
      banana.armedAt = 0;
    });
    this.updateHud();
    this.snapCameraToPlayer();
  }

  private animate(time: number): void {
    const delta = Math.min((time - this.lastFrame) / 1000, 0.05);
    this.lastFrame = time;
    this.update(delta);
    this.renderer.render(this.scene, this.camera);
    this.animationFrame = requestAnimationFrame((nextTime) => this.animate(nextTime));
  }

  private update(delta: number): void {
    this.hud.tick(delta);
    this.animateWorld(delta);

    if (this.phase === "countdown") {
      this.updateCountdown(delta);
      this.updateCamera(delta);
    } else if (this.phase === "racing" || this.phase === "finishing") {
      this.raceTime += delta;
      this.updateRacers(delta);
      this.updateObjects(delta);
      this.updateCamera(delta);
      this.updateHud();
      this.checkRaceCompletion(delta);
    } else if (this.phase === "spectator") {
      this.updateSpectatorCamera(delta);
    }
  }

  private updateCountdown(delta: number): void {
    const previous = Math.ceil(this.countdownTime);
    this.countdownTime -= delta;
    const current = Math.ceil(this.countdownTime);
    if (current !== previous) {
      if (current > 0 && current <= 3) this.hud.setCountdown(current.toString());
      if (current <= 0) this.hud.setCountdown("GO!");
    }
    if (this.countdownTime <= -0.65) {
      this.phase = "racing";
      this.hud.setCountdown("");
      this.hud.showToast("THREE LAPS — MAKE THEM COLORFUL!", 2.2);
    }
  }

  private updateRacers(delta: number): void {
    this.racers.forEach((racer, index) => {
      if (racer.finishTime !== null) {
        racer.speed = Math.max(0, racer.speed - 13 * delta);
        this.updateKartVisual(racer, delta);
        return;
      }
      if (racer.ai) this.updateAiRacer(racer, index, delta);
      else this.updatePlayer(racer, delta);

      const previousProgress = racer.totalProgress;
      racer.totalProgress += (racer.speed / this.world.trackLength) * delta;
      if (previousProgress < TOTAL_LAPS && racer.totalProgress >= TOTAL_LAPS) {
        racer.totalProgress = TOTAL_LAPS;
        racer.finishTime = this.raceTime;
        racer.heldItem = null;
        if (!racer.ai) {
          this.phase = "finishing";
          this.hud.showToast("FINISH!", 2.5);
        }
      }
      this.updateKartVisual(racer, delta);
    });
  }

  private updatePlayer(player: Racer, delta: number): void {
    const offRoad = Math.abs(player.lane) > 3.35;
    const accelerating = this.input.accelerate;
    const braking = this.input.brake;
    const normalMax = offRoad ? 17 : 36;
    const maxSpeed = player.boostTimer > 0 ? 47 : normalMax;

    if (accelerating) player.speed += (player.boostTimer > 0 ? 29 : 21) * delta;
    else if (!braking) player.speed = THREE.MathUtils.damp(player.speed, offRoad ? 12 : 18, 1.35, delta);
    if (braking) player.speed -= 28 * delta;
    if (offRoad) player.speed -= 14 * delta;
    player.speed = THREE.MathUtils.clamp(player.speed, 0, maxSpeed);

    const steer = Number(this.input.right) - Number(this.input.left);
    const steerPower = 3.6 + Math.min(player.speed, 30) * 0.065;
    player.lane += steer * steerPower * delta;
    if (steer === 0) player.lane *= Math.exp(-0.11 * delta);
    player.lane = THREE.MathUtils.clamp(player.lane, -4.8, 4.8);

    if (player.spinTimer > 0) {
      player.spinTimer -= delta;
      player.spinAngle += delta * 15;
      player.speed = Math.max(4, player.speed - 28 * delta);
    } else {
      player.spinAngle = THREE.MathUtils.damp(player.spinAngle, 0, 8, delta);
    }
    if (player.boostTimer > 0) player.boostTimer -= delta;
  }

  private updateAiRacer(racer: Racer, index: number, delta: number): void {
    const phaseOffset = index * 1.8;
    const lapWave = Math.sin(this.raceTime * 0.7 + phaseOffset) * 1.15;
    let targetSpeed = racer.aiSpeed + lapWave;
    if (racer.boostTimer > 0) {
      racer.boostTimer -= delta;
      targetSpeed += 9;
    }
    if (racer.spinTimer > 0) {
      racer.spinTimer -= delta;
      racer.spinAngle += delta * 13;
      targetSpeed = 10;
    } else {
      racer.spinAngle = THREE.MathUtils.damp(racer.spinAngle, 0, 7, delta);
    }

    const desiredLane = Math.sin(racer.totalProgress * Math.PI * 12 + phaseOffset) * 1.65;
    racer.targetLane = desiredLane;
    racer.lane = THREE.MathUtils.damp(racer.lane, racer.targetLane, 1.7, delta);
    racer.speed = THREE.MathUtils.damp(racer.speed, targetSpeed, 2.2, delta);
    if (racer.heldItem === "boost" && Math.sin(this.raceTime * 1.4 + index) > 0.96) {
      racer.heldItem = null;
      racer.boostTimer = 1.2;
    }
  }

  private updateKartVisual(racer: Racer, delta: number): void {
    placeKart(racer.kart, this.world.curve, racer.totalProgress, racer.lane, racer.spinAngle);
    const wheelRotation = racer.speed * delta * 1.35;
    racer.kart.wheels.forEach((wheel) => {
      wheel.rotation.x -= wheelRotation;
    });
    const boostOpacity = racer.boostTimer > 0 ? 0.92 : 0;
    racer.kart.exhausts.forEach((exhaust, index) => {
      const material = exhaust.material as THREE.MeshBasicMaterial;
      material.opacity = THREE.MathUtils.lerp(material.opacity, boostOpacity, 0.2);
      const pulse = 0.9 + Math.sin(this.raceTime * 32 + index) * 0.35;
      exhaust.scale.setScalar(racer.boostTimer > 0 ? pulse * 2.2 : 0.5);
    });
  }

  private updateObjects(delta: number): void {
    this.world.itemBoxes.forEach((box, index) => {
      box.mesh.rotation.y += delta * 1.9;
      box.mesh.position.y += Math.sin(this.raceTime * 2.5 + index) * delta * 0.08;
      if (!box.active && this.raceTime >= box.respawnAt) {
        box.active = true;
        box.mesh.visible = true;
      }
      if (!box.active) return;
      const player = this.getPlayer();
      if (
        player.finishTime === null
        && player.heldItem === null
        && circularDistance(player.totalProgress, box.progress) < 0.009
        && Math.abs(player.lane - box.lane) < 1.05
      ) {
        box.active = false;
        box.mesh.visible = false;
        box.respawnAt = this.raceTime + 4.2;
        player.heldItem = Math.random() > 0.5 ? "boost" : "banana";
        this.hud.showToast(player.heldItem === "boost" ? "TURBO READY!" : "BANANA READY!");
      }
    });

    this.racers.forEach((racer) => {
      this.world.boostPads.forEach((pad, index) => {
        const distance = circularDistance(racer.totalProgress, pad.progress);
        if (distance < 0.012 && !racer.padContacts.has(index)) {
          racer.padContacts.add(index);
          racer.boostTimer = Math.max(racer.boostTimer, 1.35);
          racer.speed = Math.max(racer.speed, 38);
          if (!racer.ai) this.hud.showToast("BOOST PAD!", 1.2);
        } else if (distance > 0.035) {
          racer.padContacts.delete(index);
        }
      });
    });

    this.world.bananas.forEach((banana) => {
      if (!banana.active || this.raceTime < banana.armedAt) return;
      banana.mesh.rotation.y += delta * 0.8;
      for (const racer of this.racers) {
        if (racer.finishTime !== null || racer.id === banana.ownerId) continue;
        if (circularDistance(racer.totalProgress, banana.progress) < 0.0075 && Math.abs(racer.lane - banana.lane) < 0.72) {
          banana.active = false;
          banana.mesh.visible = false;
          racer.spinTimer = 1.05;
          if (!racer.ai) this.hud.showToast("BANANA SPIN!", 1.4);
          break;
        }
      }
    });
  }

  private animateWorld(delta: number): void {
    this.world.boostPads.forEach((pad, index) => {
      const pulse = 1 + Math.sin(performance.now() * 0.006 + index) * 0.08;
      pad.mesh.scale.y = pulse;
    });
    if (this.reducedMotion) return;
    this.world.itemBoxes.forEach((box) => {
      if (box.active && this.phase === "countdown") box.mesh.rotation.y += delta * 0.7;
    });
  }

  private usePlayerItem(): void {
    if (this.phase !== "racing" && this.phase !== "finishing") return;
    const player = this.getPlayer();
    if (player.finishTime !== null || player.heldItem === null) return;
    if (player.heldItem === "boost") {
      player.boostTimer = 2.15;
      player.speed = Math.max(player.speed, 39);
      this.hud.showToast("TURBO!", 1.35);
    } else {
      const banana: BananaVisual = {
        progress: wrapProgress(player.totalProgress - 0.012),
        lane: player.lane,
        mesh: createBanana(),
        active: true,
        ownerId: PLAYER_ID,
        armedAt: this.raceTime + 0.55,
      };
      placeBanana(banana, this.world.curve);
      this.scene.add(banana.mesh);
      this.world.bananas.push(banana);
      this.hud.showToast("BANANA DROPPED!", 1.35);
    }
    player.heldItem = null;
  }

  private checkRaceCompletion(delta: number): void {
    const player = this.getPlayer();
    if (player.finishTime === null) return;
    this.finishWait += delta;
    const allFinished = this.racers.every((racer) => racer.finishTime !== null);
    if (!allFinished && this.finishWait < 6.5) return;

    this.racers.forEach((racer) => {
      if (racer.finishTime === null) {
        const remainingProgress = Math.max(0, TOTAL_LAPS - racer.totalProgress);
        racer.finishTime = this.raceTime + remainingProgress * this.world.trackLength / Math.max(1, racer.speed);
        racer.totalProgress = TOTAL_LAPS;
      }
    });
    const finalRanking = sortRankings(this.racers);
    this.phase = "results";
    this.hud.showResults(finalRanking);
  }

  private updateHud(): void {
    const player = this.getPlayer();
    this.hud.update({
      playerId: PLAYER_ID,
      speedKmh: player.speed * 3.6,
      totalProgress: player.totalProgress,
      heldItem: player.heldItem,
      boosting: player.boostTimer > 0,
      ranking: sortRankings(this.racers),
    });
  }

  private snapCameraToPlayer(): void {
    const player = this.getPlayer();
    const frame = getTrackFrame(this.world.curve, player.totalProgress, player.lane, 1);
    this.camera.position.copy(frame.position).addScaledVector(frame.tangent, -8.5).addScaledVector(KART_UP, 4.6);
    this.camera.lookAt(frame.position.clone().addScaledVector(frame.tangent, 10).addScaledVector(KART_UP, 1.1));
  }

  private updateCamera(delta: number): void {
    const player = this.getPlayer();
    const frame = getTrackFrame(this.world.curve, player.totalProgress, player.lane * 0.26, 0.8);
    const speedPullback = THREE.MathUtils.clamp(player.speed / 36, 0, 1) * 1.6;
    const desired = frame.position.clone()
      .addScaledVector(frame.tangent, -8.2 - speedPullback)
      .addScaledVector(KART_UP, 4.25 + speedPullback * 0.15);
    const lookAt = frame.position.clone().addScaledVector(frame.tangent, 9.5).addScaledVector(KART_UP, 1.05);
    const cameraLambda = this.reducedMotion ? 14 : 7;
    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, desired.x, cameraLambda, delta);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, desired.y, cameraLambda, delta);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, desired.z, cameraLambda, delta);
    this.camera.lookAt(lookAt);
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, player.boostTimer > 0 ? 65 : 57, 5, delta);
    this.camera.updateProjectionMatrix();
  }

  private enterSpectatorMode(): void {
    this.hud.hideResults();
    this.phase = "spectator";
    this.spectatorAngle = 0;
    this.hud.showToast("TRACK VIEW — PRESS R TO RACE AGAIN", 4);
  }

  private updateSpectatorCamera(delta: number): void {
    this.spectatorAngle += delta * (this.reducedMotion ? 0.035 : 0.09);
    const radius = 78;
    this.camera.position.set(Math.cos(this.spectatorAngle) * radius, 47, Math.sin(this.spectatorAngle) * radius);
    this.camera.lookAt(0, 0, 0);
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, 48, 5, delta);
    this.camera.updateProjectionMatrix();
  }

  private getPlayer(): Racer {
    const player = this.racers.find((racer) => racer.id === PLAYER_ID);
    if (!player) throw new Error("Player racer is missing");
    return player;
  }

  private resize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}
