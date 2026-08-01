import * as THREE from "three";
import { Hud } from "../ui/Hud";
import { createHero, type CharacterRig } from "./models";
import {
  acceptQuest,
  collectBerry,
  completeQuest,
  defeatBoss,
  defeatEnemy,
  initialAdventureState,
  openChest,
  type AdventureState,
} from "./state";
import { createFantasyWorld, type Enemy, type Interactable } from "./world";

type Particle = THREE.Mesh & {
  userData: {
    velocity: THREE.Vector3;
    life: number;
  };
};

class Sounds {
  private context: AudioContext | null = null;

  resume() {
    this.context ??= new AudioContext();
    void this.context.resume();
  }

  play(frequency: number, duration = 0.12, type: OscillatorType = "sine", delay = 0) {
    if (!this.context) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const start = this.context.currentTime + delay;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(70, frequency * 0.72), start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.1, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.03);
  }

  success() {
    this.play(520, 0.16, "triangle");
    this.play(680, 0.18, "triangle", 0.11);
    this.play(880, 0.24, "triangle", 0.22);
  }
}

export class MiniFantasyGame {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(38, 1, 0.1, 140);
  private readonly renderer: THREE.WebGLRenderer;
  private readonly timer = new THREE.Timer();
  private readonly hud: Hud;
  private readonly hero: CharacterRig;
  private readonly world;
  private readonly sounds = new Sounds();
  private readonly keys = new Set<string>();
  private readonly touchMove = new THREE.Vector2();
  private readonly cameraTarget = new THREE.Vector3();
  private readonly desiredCamera = new THREE.Vector3();
  private readonly particles: Particle[] = [];
  private readonly temp = new THREE.Vector3();
  private readonly moveVector = new THREE.Vector3();
  private state: AdventureState = initialAdventureState();
  private currentInteractable: Interactable | null = null;
  private hp = 3;
  private readonly maxHp = 3;
  private running = false;
  private ended = false;
  private elapsed = 0;
  private walkPhase = 0;
  private attackCooldown = 0;
  private attackAnimation = 0;
  private invulnerable = 0;
  private bossActive = false;
  private bossStompCooldown = 1.7;
  private region = "微風村";
  private lockedHintShown = false;
  private frameId = 0;

  constructor(container: HTMLElement) {
    this.hud = new Hud(container);
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.hud.canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.96;

    this.scene.background = new THREE.Color(0x86cfdf);
    this.scene.fog = new THREE.Fog(0x9fc9ae, 34, 82);
    this.timer.connect(document);
    this.addLights();

    this.hero = createHero();
    this.hero.group.position.set(0, 0, 20.5);
    this.hero.group.rotation.y = Math.PI;
    this.hero.group.scale.setScalar(1.14);
    this.scene.add(this.hero.group);
    this.world = createFantasyWorld(this.scene);

    this.camera.position.set(10.5, 13.4, 35.5);
    this.camera.lookAt(0, 1.3, 10);
    this.bindEvents();
    this.updateUi();
    this.resize();
    this.animate();
    this.installQaBridge();
  }

  private addLights() {
    const hemisphere = new THREE.HemisphereLight(0xd7f1ff, 0x4f7042, 2.15);
    this.scene.add(hemisphere);

    const sun = new THREE.DirectionalLight(0xffe6b4, 4.2);
    sun.position.set(-14, 26, 18);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -34;
    sun.shadow.camera.right = 34;
    sun.shadow.camera.top = 35;
    sun.shadow.camera.bottom = -35;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 80;
    sun.shadow.bias = -0.0002;
    this.scene.add(sun);

    const fill = new THREE.DirectionalLight(0x8ed4bc, 0.7);
    fill.position.set(15, 8, -20);
    this.scene.add(fill);
  }

  private bindEvents() {
    this.hud.onStart(() => {
      this.running = true;
      this.sounds.resume();
      this.hud.setRegion("微風村");
    });
    this.hud.onRestart(() => window.location.reload());
    this.hud.onDialogueContinue(() => this.hud.closeDialogue());
    this.hud.onAction((action) => {
      this.sounds.resume();
      if (action === "interact") this.handleInteract();
      if (action === "attack") this.handleAttack();
      if (action === "potion") this.usePotion();
    });
    this.hud.bindJoystick((x, y) => this.touchMove.set(x, y));

    window.addEventListener("keydown", (event) => {
      if (["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
        event.preventDefault();
      }
      if (event.repeat) return;
      this.keys.add(event.code);
      if (event.code === "KeyE") this.handleInteract();
      if (event.code === "Space") this.handleAttack();
      if (event.code === "KeyQ") this.usePotion();
    });
    window.addEventListener("keyup", (event) => this.keys.delete(event.code));
    window.addEventListener("blur", () => this.keys.clear());
    window.addEventListener("resize", () => this.resize());
  }

  private resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  private handleInteract() {
    if (!this.running || this.ended) return;
    this.sounds.resume();
    if (this.hud.dialogueOpen) {
      this.hud.closeDialogue();
      return;
    }
    const target = this.findInteractable();
    if (!target) return;

    if (target.kind === "npc") this.interactNpc(target);
    if (target.kind === "chest") this.interactChest(target);
    if (target.kind === "berry") this.interactBerry(target);
    this.updateQuestMarkers();
    this.updateUi();
  }

  private interactNpc(target: Interactable) {
    if (target.id === "pippin") {
      if (this.hp < this.maxHp) {
        this.hp = this.maxHp;
        this.sounds.success();
        this.hud.showDialogue("皮平", "坐在井邊休息一下吧！風吹過來，傷口就不痛了。");
      } else if (this.state.questStage === "complete" && !this.state.bossDefeated) {
        this.hud.showDialogue("皮平", "古樹谷地在森林最深處。記得看準守衛抬腳的時機！");
      } else {
        this.hud.showDialogue("皮平", "森林裡的史萊姆怕木劍。寶箱裡的藥水按 Q 就能喝喔！");
      }
      return;
    }

    switch (this.state.questStage) {
      case "not-started":
        this.state = acceptQuest(this.state);
        this.hud.showDialogue("米菈", "森林今天有點不安……可以替我找回 3 顆會發光的月光莓嗎？");
        this.sounds.success();
        break;
      case "collecting":
        this.hud.showDialogue("米菈", `月光莓通常長在森林小路旁。還差 ${3 - this.state.berries} 顆，小心史萊姆！`);
        break;
      case "ready":
        this.state = completeQuest(this.state);
        this.hud.showDialogue("米菈", "全都找到了！這枚葉語護符能安撫古樹谷地的封印。請幫幫苔角守衛吧。");
        this.sounds.success();
        break;
      case "complete":
        this.hud.showDialogue(
          "米菈",
          this.state.bossDefeated ? "你讓森林重新聽見了風聲。謝謝你，小小勇者！" : "沿著石路走到最深處，葉語護符會為你開路。",
        );
        break;
    }
  }

  private interactChest(target: Interactable) {
    if (target.consumed) {
      this.hud.showToast("寶箱已經空了");
      return;
    }
    target.consumed = true;
    this.state = openChest(this.state, target.id);
    this.hp = Math.min(this.maxHp, this.hp + 1);
    this.sounds.play(340, 0.16, "triangle");
    this.sounds.play(690, 0.28, "triangle", 0.12);
    this.hud.showToast("找到 12 枚金幣與 1 瓶莓果藥水！", 2.8);
  }

  private interactBerry(target: Interactable) {
    if (target.consumed) return;
    if (this.state.questStage === "not-started") {
      this.hud.showToast("散發柔光的果實，也許村裡有人知道它的用途");
      return;
    }
    if (this.state.questStage !== "collecting") {
      this.hud.showToast("已經收集足夠的月光莓了");
      return;
    }
    target.consumed = true;
    this.state = collectBerry(this.state);
    this.sounds.play(620, 0.15, "sine");
    this.sounds.play(840, 0.18, "sine", 0.1);
    this.spawnBurst(target.group.position, 0xc8a7ff, 8);
    target.group.visible = false;
    this.hud.showToast(`取得月光莓　${this.state.berries} / 3`);
  }

  private handleAttack() {
    if (!this.running || this.ended || this.hud.dialogueOpen || this.attackCooldown > 0) return;
    this.sounds.resume();
    this.attackCooldown = 0.48;
    this.attackAnimation = 0.34;
    this.sounds.play(230, 0.1, "sawtooth");

    const living = this.world.enemies
      .filter((enemy) => enemy.alive && (!enemy.isBoss || this.bossActive))
      .map((enemy) => ({ enemy, distance: enemy.group.position.distanceTo(this.hero.group.position) }))
      .filter(({ enemy, distance }) => distance < (enemy.isBoss ? 3.25 : 2.6))
      .sort((a, b) => a.distance - b.distance);
    const target = living[0]?.enemy;
    if (!target) return;

    target.hp -= 1;
    target.hitFlash = 0.2;
    this.spawnBurst(target.group.position, target.isBoss ? 0xa9d974 : 0xffdf79, target.isBoss ? 12 : 7);
    this.sounds.play(target.isBoss ? 120 : 180, 0.16, "square");
    if (target.hp <= 0) this.killEnemy(target);
  }

  private killEnemy(enemy: Enemy) {
    enemy.alive = false;
    this.state = defeatEnemy(this.state, enemy.id);
    if (!enemy.isBoss) {
      enemy.group.visible = false;
      this.hud.showToast(`${enemy.name}化成一陣亮晶晶的泡泡！`);
      this.sounds.success();
      this.updateUi();
      return;
    }

    this.state = defeatBoss(this.state);
    this.bossActive = false;
    this.ended = true;
    this.spawnBurst(enemy.group.position.clone().add(new THREE.Vector3(0, 2.4, 0)), 0xf5d96e, 30);
    enemy.group.visible = false;
    this.sounds.success();
    window.setTimeout(() => this.hud.showVictory(this.state), 650);
    this.updateUi();
  }

  private usePotion() {
    if (!this.running || this.ended) return;
    if (this.state.potions <= 0) {
      this.hud.showToast("還沒有莓果藥水");
      return;
    }
    if (this.hp === this.maxHp) {
      this.hud.showToast("現在精神很好，不需要喝藥水");
      return;
    }
    this.state = { ...this.state, potions: this.state.potions - 1 };
    this.hp = Math.min(this.maxHp, this.hp + 2);
    this.sounds.play(430, 0.16, "sine");
    this.sounds.play(720, 0.22, "sine", 0.11);
    this.spawnBurst(this.hero.group.position.clone().add(new THREE.Vector3(0, 1, 0)), 0x91efb4, 10);
    this.updateUi();
  }

  private findInteractable() {
    let nearest: Interactable | null = null;
    let distance = Number.POSITIVE_INFINITY;
    for (const interactive of this.world.interactables) {
      if (interactive.consumed && interactive.kind === "berry") continue;
      const candidate = interactive.group.position.distanceTo(this.hero.group.position);
      if (candidate < interactive.radius && candidate < distance) {
        nearest = interactive;
        distance = candidate;
      }
    }
    return nearest;
  }

  private updateQuestMarkers() {
    for (const interactive of this.world.interactables) {
      if (!interactive.marker) continue;
      interactive.marker.visible =
        interactive.id === "mira" &&
        (this.state.questStage === "not-started" || this.state.questStage === "ready");
    }
  }

  private updateUi() {
    this.hud.update(this.state, this.hp, this.maxHp);
    this.hud.updateBoss(this.world.boss.hp, this.world.boss.maxHp, this.bossActive && this.world.boss.alive);
  }

  private updatePlayer(delta: number) {
    if (!this.running || this.ended || this.hud.dialogueOpen) return;
    this.moveVector.set(0, 0, 0);
    if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) this.moveVector.x -= 1;
    if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) this.moveVector.x += 1;
    if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) this.moveVector.z -= 1;
    if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) this.moveVector.z += 1;
    this.moveVector.x += this.touchMove.x;
    this.moveVector.z += this.touchMove.y;
    if (this.moveVector.lengthSq() < 0.02) {
      this.hero.leftLeg.rotation.x = THREE.MathUtils.lerp(this.hero.leftLeg.rotation.x, 0, delta * 10);
      this.hero.rightLeg.rotation.x = THREE.MathUtils.lerp(this.hero.rightLeg.rotation.x, 0, delta * 10);
      this.hero.group.position.y = THREE.MathUtils.lerp(this.hero.group.position.y, 0, delta * 8);
      return;
    }

    this.moveVector.normalize();
    const speed = 5.1;
    const current = this.hero.group.position;
    const nextX = current.clone();
    nextX.x += this.moveVector.x * speed * delta;
    if (this.world.canMoveTo(nextX)) current.x = nextX.x;
    const nextZ = current.clone();
    nextZ.z += this.moveVector.z * speed * delta;
    if (this.world.canMoveTo(nextZ)) current.z = nextZ.z;

    const targetRotation = Math.atan2(this.moveVector.x, this.moveVector.z);
    this.hero.group.rotation.y = this.lerpAngle(this.hero.group.rotation.y, targetRotation, delta * 11);
    this.walkPhase += delta * 11;
    this.hero.leftLeg.rotation.x = Math.sin(this.walkPhase) * 0.55;
    this.hero.rightLeg.rotation.x = -Math.sin(this.walkPhase) * 0.55;
    this.hero.group.position.y = Math.abs(Math.sin(this.walkPhase * 2)) * 0.05;
  }

  private updateEnemies(delta: number) {
    for (const enemy of this.world.enemies) {
      if (!enemy.alive) continue;
      enemy.attackCooldown = Math.max(0, enemy.attackCooldown - delta);
      enemy.hitFlash = Math.max(0, enemy.hitFlash - delta);
      const baseScale = enemy.isBoss ? 1.14 : 1;
      const pulse = enemy.hitFlash > 0 ? 1.08 : 1;
      enemy.group.scale.setScalar(baseScale * pulse);
      enemy.group.position.y = Math.sin(this.elapsed * (enemy.isBoss ? 1.5 : 3.3) + enemy.spawn.x) * (enemy.isBoss ? 0.04 : 0.08);

      const distance = enemy.group.position.distanceTo(this.hero.group.position);
      if (enemy.isBoss) {
        if (!this.bossActive && this.state.questStage === "complete" && distance < 13) {
          this.bossActive = true;
          this.hud.showToast("苔角守衛甦醒了！", 2.8);
          this.sounds.play(92, 0.7, "sawtooth");
          this.updateUi();
        } else if (!this.bossActive && this.state.questStage !== "complete" && distance < 10 && !this.lockedHintShown) {
          this.lockedHintShown = true;
          this.hud.showToast("古老藤蔓擋住了道路，米菈的護符也許能打開它", 3.2);
        }
        if (!this.bossActive) continue;
        this.updateBoss(enemy, distance, delta);
        continue;
      }

      if (distance > 7.5 || distance < 0.01) {
        const homeDistance = enemy.group.position.distanceTo(enemy.spawn);
        if (homeDistance > 0.12) {
          this.temp.copy(enemy.spawn).sub(enemy.group.position).setY(0).normalize();
          enemy.group.position.addScaledVector(this.temp, enemy.speed * 0.35 * delta);
        }
        continue;
      }
      this.chasePlayer(enemy, distance, delta);
    }
  }

  private updateBoss(enemy: Enemy, distance: number, delta: number) {
    this.bossStompCooldown -= delta;
    if (distance > 3.5) this.chasePlayer(enemy, distance, delta);
    if (this.bossStompCooldown <= 0 && distance < 6.5) {
      this.bossStompCooldown = 3.2;
      this.spawnShockwave(enemy.group.position);
      this.sounds.play(82, 0.38, "square");
      if (distance < 2.4) this.damagePlayer(enemy.group.position);
    }
  }

  private chasePlayer(enemy: Enemy, distance: number, delta: number) {
    this.temp.copy(this.hero.group.position).sub(enemy.group.position).setY(0);
    if (this.temp.lengthSq() > 0.001) {
      this.temp.normalize();
      enemy.group.rotation.y = this.lerpAngle(enemy.group.rotation.y, Math.atan2(this.temp.x, this.temp.z), delta * 5);
      if (distance > enemy.damageRadius * 0.82) {
        enemy.group.position.addScaledVector(this.temp, enemy.speed * delta);
      }
    }
    if (distance < enemy.damageRadius && enemy.attackCooldown <= 0) {
      enemy.attackCooldown = 1.2;
      this.damagePlayer(enemy.group.position);
    }
  }

  private damagePlayer(source: THREE.Vector3) {
    if (this.invulnerable > 0 || this.ended) return;
    this.invulnerable = 1.15;
    this.hp -= 1;
    this.sounds.play(110, 0.25, "sawtooth");
    this.temp.copy(this.hero.group.position).sub(source).setY(0).normalize();
    const knockback = this.hero.group.position.clone().addScaledVector(this.temp, 1.25);
    if (this.world.canMoveTo(knockback)) this.hero.group.position.copy(knockback);
    this.updateUi();
    if (this.hp <= 0) {
      this.ended = true;
      this.hud.setPrompt(null);
      window.setTimeout(() => this.hud.showGameOver(), 420);
    }
  }

  private updateInteraction() {
    if (!this.running || this.ended || this.hud.dialogueOpen) {
      this.hud.setPrompt(null);
      return;
    }
    this.currentInteractable = this.findInteractable();
    this.hud.setPrompt(this.currentInteractable?.label ?? null);
  }

  private updateAnimation(delta: number) {
    this.attackCooldown = Math.max(0, this.attackCooldown - delta);
    this.invulnerable = Math.max(0, this.invulnerable - delta);
    if (this.attackAnimation > 0) {
      this.attackAnimation -= delta;
      const progress = 1 - Math.max(0, this.attackAnimation) / 0.34;
      this.hero.swordPivot.rotation.z = -0.68 - Math.sin(progress * Math.PI) * 2.15;
    } else {
      this.hero.swordPivot.rotation.z = THREE.MathUtils.lerp(this.hero.swordPivot.rotation.z, -0.68, delta * 12);
    }
    const blink = this.invulnerable > 0 && Math.floor(this.invulnerable * 12) % 2 === 0;
    this.hero.group.visible = !blink;

    for (const interactive of this.world.interactables) {
      if (interactive.chest && interactive.consumed) {
        interactive.chest.lid.rotation.x = THREE.MathUtils.lerp(interactive.chest.lid.rotation.x, -1.12, delta * 5);
        interactive.chest.glow.visible = false;
      }
    }

    for (let index = this.particles.length - 1; index >= 0; index -= 1) {
      const particle = this.particles[index];
      particle.userData.life -= delta;
      particle.userData.velocity.y -= delta * 3.4;
      particle.position.addScaledVector(particle.userData.velocity, delta);
      particle.rotation.x += delta * 5;
      particle.rotation.y += delta * 4;
      particle.scale.setScalar(Math.max(0.01, particle.userData.life * 1.5));
      if (particle.userData.life <= 0) {
        this.scene.remove(particle);
        particle.geometry.dispose();
        (particle.material as THREE.Material).dispose();
        this.particles.splice(index, 1);
      }
    }
  }

  private spawnBurst(position: THREE.Vector3, color: number, count: number) {
    for (let index = 0; index < count; index += 1) {
      const particle = new THREE.Mesh(
        new THREE.TetrahedronGeometry(0.1 + Math.random() * 0.09, 0),
        new THREE.MeshBasicMaterial({ color }),
      ) as unknown as Particle;
      particle.position.copy(position).add(new THREE.Vector3(0, 0.5 + Math.random() * 1.1, 0));
      particle.userData = {
        velocity: new THREE.Vector3((Math.random() - 0.5) * 3.2, 1.1 + Math.random() * 2.6, (Math.random() - 0.5) * 3.2),
        life: 0.55 + Math.random() * 0.38,
      };
      this.particles.push(particle);
      this.scene.add(particle);
    }
  }

  private spawnShockwave(position: THREE.Vector3) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.7, 0.9, 32),
      new THREE.MeshBasicMaterial({ color: 0xd2ed94, transparent: true, opacity: 0.72, side: THREE.DoubleSide }),
    );
    ring.position.copy(position).setY(0.08);
    ring.rotation.x = -Math.PI / 2;
    this.scene.add(ring);
    const start = performance.now();
    const animateRing = (time: number) => {
      const progress = (time - start) / 700;
      if (progress >= 1) {
        this.scene.remove(ring);
        ring.geometry.dispose();
        (ring.material as THREE.Material).dispose();
        return;
      }
      ring.scale.setScalar(1 + progress * 5.2);
      (ring.material as THREE.MeshBasicMaterial).opacity = 0.72 * (1 - progress);
      requestAnimationFrame(animateRing);
    };
    requestAnimationFrame(animateRing);
  }

  private updateCamera(delta: number) {
    const portrait = window.innerHeight > window.innerWidth;
    const offset = portrait ? new THREE.Vector3(11.5, 18.5, 20) : new THREE.Vector3(10.5, 13.4, 15);
    this.desiredCamera.copy(this.hero.group.position).add(offset);
    this.camera.position.lerp(this.desiredCamera, 1 - Math.exp(-delta * 4.5));
    this.cameraTarget.copy(this.hero.group.position);
    this.cameraTarget.y += 1.1;
    this.cameraTarget.z -= portrait ? 3.8 : 3;
    this.camera.lookAt(this.cameraTarget);
  }

  private updateRegion() {
    const z = this.hero.group.position.z;
    const next = z > 5.8 ? "微風村" : z > 0.1 ? "風鈴石橋" : z > -32 ? "月影森林" : "古樹谷地";
    if (next !== this.region) {
      this.region = next;
      this.hud.setRegion(next);
    }
  }

  private animate = (timestamp?: number) => {
    this.frameId = requestAnimationFrame(this.animate);
    this.timer.update(timestamp);
    const delta = Math.min(this.timer.getDelta(), 0.05);
    this.elapsed += delta;
    this.updatePlayer(delta);
    if (this.running && !this.ended && !this.hud.dialogueOpen) this.updateEnemies(delta);
    this.updateAnimation(delta);
    this.updateInteraction();
    this.world.updateDecorations(this.elapsed, delta);
    this.updateCamera(delta);
    this.updateRegion();
    this.hud.tick(delta);
    this.hud.updateMap(this.hero.group.position.x, this.hero.group.position.z, this.hero.group.rotation.y);
    this.renderer.render(this.scene, this.camera);
  };

  private lerpAngle(from: number, to: number, amount: number) {
    const difference = Math.atan2(Math.sin(to - from), Math.cos(to - from));
    return from + difference * Math.min(1, amount);
  }

  private installQaBridge() {
    if (!new URLSearchParams(window.location.search).has("qa")) return;
    const bridge = {
      start: () => {
        this.running = true;
        document.querySelector<HTMLElement>("[data-intro]")?.classList.add("is-hidden");
        document.querySelector<HTMLElement>("[data-game-ui]")?.classList.add("is-active");
      },
      teleport: (x: number, z: number) => this.hero.group.position.set(x, 0, z),
      interact: () => this.handleInteract(),
      attack: () => {
        this.attackCooldown = 0;
        this.handleAttack();
      },
      snapshot: () => ({
        ...this.state,
        hp: this.hp,
        bossHp: this.world.boss.hp,
        bossActive: this.bossActive,
        position: { x: this.hero.group.position.x, z: this.hero.group.position.z },
        renderer: this.renderer.info.render,
      }),
    };
    (window as unknown as { __MINI_FANTASY_QA__: typeof bridge }).__MINI_FANTASY_QA__ = bridge;

    const panel = document.createElement("nav");
    panel.className = "qa-panel";
    panel.setAttribute("aria-label", "QA 快速操作");
    const actions = [
      ["start", "開始"],
      ["mira", "米菈"],
      ["pippin", "皮平"],
      ["berry-1", "莓 1"],
      ["berry-2", "莓 2"],
      ["berry-3", "莓 3"],
      ["return", "交付"],
      ["chest", "寶箱"],
      ["slime", "史萊姆"],
      ["boss", "Boss"],
      ["strike", "攻擊"],
    ] as const;
    panel.innerHTML = actions.map(([action, label]) => `<button data-qa-action="${action}">${label}</button>`).join("");
    document.body.append(panel);

    const closeDialogue = () => {
      if (this.hud.dialogueOpen) this.hud.closeDialogue();
    };
    const interactAt = (x: number, z: number) => {
      closeDialogue();
      this.hero.group.position.set(x, 0, z);
      this.handleInteract();
    };
    panel.addEventListener("click", (event) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-qa-action]");
      if (!button) return;
      const action = button.dataset.qaAction;
      if (action === "start") bridge.start();
      if (action === "mira") interactAt(-4.4, 18);
      if (action === "pippin") interactAt(7.5, 14.8);
      if (action === "berry-1") interactAt(-5.7, -11.3);
      if (action === "berry-2") interactAt(5.2, -18.8);
      if (action === "berry-3") interactAt(-6.6, -26.8);
      if (action === "return") interactAt(-4.4, 18);
      if (action === "chest") interactAt(5, 20.5);
      if (action === "slime") this.hero.group.position.set(3.6, 0, -8.2);
      if (action === "boss") this.hero.group.position.set(0, 0, -34.2);
      if (action === "strike") {
        if (this.bossActive && this.world.boss.alive) {
          this.hero.group.position.copy(this.world.boss.group.position).add(new THREE.Vector3(0, 0, 2.7));
        }
        bridge.attack();
      }
    });
  }

  destroy() {
    cancelAnimationFrame(this.frameId);
    this.timer.dispose();
    this.renderer.dispose();
  }
}
