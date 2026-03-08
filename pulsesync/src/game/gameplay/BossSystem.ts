import Phaser from 'phaser';
import { GAME_CONFIG } from '@/game/content/config/gameConfig';
import type { BeatSnapshot } from '@/game/systems/beatMath';
import type {
  BossHudState,
  DamageResult,
  DamageableTarget,
} from '@/game/types/RuntimeTypes';

interface ThreatEvent {
  kind: 'boss';
  x: number;
  y: number;
  damage: number;
}

type BossPartType = 'node' | 'core' | 'orbital';

interface BossPart extends DamageableTarget {
  owner: 'boss';
  part: BossPartType;
  view: Phaser.GameObjects.Image;
  angle: number;
  initialAngle: number;
  orbitRadius: number;
  visibleScale: number;
}

export class BossSystem {
  private static readonly MAX_HEALTH = 90;
  private static readonly HALF_HEALTH_THRESHOLD = BossSystem.MAX_HEALTH * 0.5;
  private static readonly PHASE_THREE_THRESHOLD = 30;
  private static readonly PHASE_ONE_NODE_HP = 10;
  private static readonly PHASE_ONE_SIGIL_INTERVAL_BEATS = 8;
  private static readonly PHASE_TWO_MINE_INTERVAL_BEATS = 4;
  private static readonly REGEN_DURATION_MS = 1000;
  private readonly root: Phaser.GameObjects.Container;
  private readonly backRing: Phaser.GameObjects.Image;
  private readonly frontRing: Phaser.GameObjects.Image;
  private readonly coreAura: Phaser.GameObjects.Image;
  private readonly coreView: Phaser.GameObjects.Image;
  private readonly petals: Phaser.GameObjects.Image[];
  private readonly overlayGraphics: Phaser.GameObjects.Graphics;
  private readonly nodes: BossPart[];
  private readonly orbitals: BossPart[];
  private readonly corePart: BossPart;
  private active = false;
  private defeated = false;
  private phase: 1 | 2 | 3 = 1;
  private maxHealth = BossSystem.MAX_HEALTH;
  private health = BossSystem.MAX_HEALTH;
  private center = new Phaser.Math.Vector2(GAME_CONFIG.width + 280, GAME_CONFIG.height * 0.5);
  private targetCenter = new Phaser.Math.Vector2(960, GAME_CONFIG.height * 0.5);
  private lastThreatBeat = -1;
  private lastSigilSpawnBeat = -1;
  private lastMineSpawnBeat = -1;
  private phaseStartedBeat = 0;
  private currentBeatIndex = 0;
  private regenerating = false;
  private regeneratedAtHalf = false;
  private palettePrimary = 0x6af8ff;
  private paletteSecondary = 0xff4fbe;
  private paletteAccent = 0xe7ff6b;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly onThreat: (event: ThreatEvent) => void,
    private readonly spawnEnemy?: (
      enemyType: 'sniper-sigil' | 'distortion-mine',
      x: number,
      y: number,
      elapsedSeconds: number,
    ) => void,
    registerWorldObject?: (
      objects: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[],
    ) => void,
  ) {
    this.root = this.scene.add.container(this.center.x, this.center.y).setDepth(52).setVisible(false);
    this.backRing = this.scene.add
      .image(0, 0, 'boss-ring')
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScale(2.3);
    this.frontRing = this.scene.add
      .image(0, 0, 'boss-ring')
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScale(1.72);
    this.coreAura = this.scene.add
      .image(0, 0, 'fx-particle')
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScale(4.8)
      .setAlpha(0.22);
    this.coreView = this.scene.add
      .image(0, 0, 'boss-core')
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScale(1.18);
    this.petals = Array.from({ length: 4 }, (_, index) =>
      this.scene.add
        .image(0, 0, 'boss-petal')
        .setBlendMode(Phaser.BlendModes.ADD)
        .setRotation(index * (Math.PI / 2))
        .setScale(1.4)
        .setAlpha(0.24),
    );

    this.root.add([this.backRing, ...this.petals, this.coreAura, this.coreView, this.frontRing]);
    this.overlayGraphics = this.scene.add.graphics().setDepth(54);
    registerWorldObject?.([
      this.root,
      this.backRing,
      this.frontRing,
      this.coreAura,
      this.coreView,
      ...this.petals,
      this.overlayGraphics,
    ]);

    this.nodes = Array.from({ length: 6 }, (_, index) =>
      this.createPart(
        `boss-node-${index}`,
        'node',
        2,
        210,
        (index / 6) * Math.PI * 2,
        0xb6f7ff,
        0.72,
        registerWorldObject,
      ),
    );
    this.orbitals = Array.from({ length: 3 }, (_, index) =>
      this.createPart(
        `boss-orbital-${index}`,
        'orbital',
        2,
        124,
        (index / 3) * Math.PI * 2,
        0xff7fd0,
        0.56,
        registerWorldObject,
      ),
    );
    this.corePart = this.createPart(
      'boss-core',
      'core',
      999,
      0,
      0,
      0xe7ff6b,
      0.92,
      registerWorldObject,
    );
    this.corePart.maxLocks = 4;
    this.corePart.radius = 44;
    this.corePart.view = this.coreView;
  }

  setPalette(primary: number, secondary: number, accent: number): void {
    this.palettePrimary = primary;
    this.paletteSecondary = secondary;
    this.paletteAccent = accent;
    this.backRing.setTint(primary);
    this.frontRing.setTint(secondary);
    this.coreAura.setTint(primary);
    this.coreView.setTint(accent);
    this.petals.forEach((petal, index) => {
      petal.setTint(index % 2 === 0 ? primary : secondary);
    });
    this.nodes.forEach((node, index) => {
      node.view.setTint(index % 2 === 0 ? primary : secondary);
    });
    this.orbitals.forEach((orbital, index) => {
      orbital.view.setTint(index % 2 === 0 ? secondary : accent);
    });
  }

  handleCommand(command: 'start' | 'phase' | 'end', phase?: 1 | 2 | 3, beatIndex = 0): void {
    if (command === 'start') {
      this.start(beatIndex);
      return;
    }

    if (command === 'phase' && phase) {
      this.setPhase(phase, beatIndex);
      return;
    }

    if (command === 'end') {
      this.defeat();
    }
  }

  update(deltaSeconds: number, snapshot: BeatSnapshot): void {
    if (!this.active) {
      this.overlayGraphics.clear();
      return;
    }
    this.currentBeatIndex = snapshot.beatIndex;

    this.center.x = Phaser.Math.Linear(this.center.x, this.targetCenter.x, 1 - Math.exp(-3.8 * deltaSeconds));
    this.center.y = GAME_CONFIG.height * 0.5;
    this.root.setPosition(this.center.x, this.center.y);
    this.backRing.rotation += deltaSeconds * (0.3 + this.phase * 0.1);
    this.frontRing.rotation -= deltaSeconds * (0.55 + this.phase * 0.16);
    this.coreAura.setScale(4.7 + Math.sin(snapshot.elapsedSeconds * 3.2) * 0.28 + this.phase * 0.18);
    this.coreView.setScale(1.1 + Math.sin(snapshot.elapsedSeconds * 6.4) * 0.04);
    this.overlayGraphics.clear();

    this.nodes.forEach((node, index) => {
      if (!node.active) {
        node.view.setVisible(false);
        return;
      }

      node.angle += deltaSeconds * 0.45;
      node.x = this.center.x + Math.cos(node.angle) * node.orbitRadius;
      node.y = this.center.y + Math.sin(node.angle) * node.orbitRadius;
      node.view.setPosition(node.x, node.y).setVisible(this.phase === 1);
      node.view.rotation += deltaSeconds * (index % 2 === 0 ? 1 : -1);
      node.targetable = false;
    });

    this.orbitals.forEach((orbital, index) => {
      orbital.angle -= deltaSeconds * 0.9;
      orbital.x = this.center.x + Math.cos(orbital.angle) * orbital.orbitRadius;
      orbital.y = this.center.y + Math.sin(orbital.angle) * orbital.orbitRadius;
      orbital.view
        .setPosition(orbital.x, orbital.y)
        .setVisible(this.phase === 3 && orbital.active);
      orbital.view.rotation += deltaSeconds * (index % 2 === 0 ? 1.2 : -1.2);
      orbital.targetable = false;
    });

    if (this.phase === 1) {
      const aliveNodes = this.nodes.filter((node) => node.active);
      if (aliveNodes.length === 0) {
        this.setPhase(2, snapshot.beatIndex);
      } else {
        const nodesTargetable = this.center.x <= this.targetCenter.x + 8 && !this.regenerating;
        this.overlayGraphics.lineStyle(2, this.palettePrimary, 0.45);
        aliveNodes.forEach((node, index) => {
          node.targetable = nodesTargetable;
          if (!this.regenerating) {
            node.view.setScale(node.visibleScale + Math.sin(snapshot.elapsedSeconds * 4 + index) * 0.04);
          }
          this.overlayGraphics.strokeCircle(node.x, node.y, 34);
        });
        this.corePart.targetable = false;

        const beatsSincePhaseStart = snapshot.beatIndex - this.phaseStartedBeat;
        if (
          this.spawnEnemy &&
          !this.regenerating &&
          beatsSincePhaseStart > 0 &&
          beatsSincePhaseStart % BossSystem.PHASE_ONE_SIGIL_INTERVAL_BEATS === 0 &&
          this.lastSigilSpawnBeat !== snapshot.beatIndex
        ) {
          this.lastSigilSpawnBeat = snapshot.beatIndex;
          aliveNodes.forEach((node) => {
            this.spawnEnemy?.('sniper-sigil', node.x, node.y, snapshot.elapsedSeconds);
          });
        }
      }
    }

    if (this.phase === 2) {
      this.corePart.targetable = this.center.x <= this.targetCenter.x + 8 && !this.regenerating;
      this.petals.forEach((petal, index) => {
        const spread = 1.72;
        petal.setScale(spread).setRotation(index * (Math.PI / 2) + snapshot.elapsedSeconds * 0.35);
        petal.setAlpha(0.42);
      });
      if (
        this.spawnEnemy &&
        snapshot.beatIndex % BossSystem.PHASE_TWO_MINE_INTERVAL_BEATS === 0 &&
        this.lastMineSpawnBeat !== snapshot.beatIndex
      ) {
        this.lastMineSpawnBeat = snapshot.beatIndex;
        Array.from({ length: 4 }).forEach(() => {
          this.spawnEnemy?.(
            'distortion-mine',
            this.center.x,
            this.center.y,
            snapshot.elapsedSeconds,
          );
        });
      }
    }

    if (this.phase === 3) {
      this.corePart.targetable = this.center.x <= this.targetCenter.x + 8;
      const activeOrbital = this.orbitals[snapshot.beatIndex % this.orbitals.length];
      if (activeOrbital.active) {
        activeOrbital.targetable = true;
        activeOrbital.view.setScale(0.74);
        this.overlayGraphics.lineStyle(2, this.paletteSecondary, 0.45);
        this.overlayGraphics.strokeCircle(activeOrbital.x, activeOrbital.y, 28);
      }
      this.petals.forEach((petal, index) => {
        petal
          .setScale(1.92)
          .setRotation(index * (Math.PI / 2) + snapshot.elapsedSeconds * 0.7)
          .setAlpha(0.38);
      });

      if (snapshot.beatIndex % 4 === 0 && this.lastThreatBeat !== snapshot.beatIndex) {
        this.lastThreatBeat = snapshot.beatIndex;
        this.onThreat({
          kind: 'boss',
          x: this.center.x,
          y: this.center.y,
          damage: 7,
        });
      }
    }

    this.corePart.x = this.center.x;
    this.corePart.y = this.center.y;
    this.corePart.active = this.active;
  }

  getTargetables(): DamageableTarget[] {
    if (!this.active) {
      return [];
    }

    return [this.corePart, ...this.nodes, ...this.orbitals].filter(
      (part) => part.active && part.targetable,
    );
  }

  getTargetIndex(): Map<string, DamageableTarget> {
    return new Map(this.getTargetables().map((target) => [target.id, target]));
  }

  getHudState(): BossHudState {
    return {
      active: this.active,
      phase: this.phase,
      health: this.health,
      maxHealth: this.maxHealth,
      label: `Gate of Eden P${this.phase}`,
    };
  }

  getCorePosition(): { x: number; y: number } {
    return {
      x: this.center.x,
      y: this.center.y,
    };
  }

  hideDefeatedVisuals(): void {
    this.root.setVisible(false);
    this.overlayGraphics.clear();
  }

  applyDamage(targetId: string, amount: number): DamageResult | null {
    if (!this.active || this.regenerating) {
      return null;
    }

    const target = [this.corePart, ...this.nodes, ...this.orbitals].find(
      (candidate) => candidate.id === targetId && candidate.active && candidate.targetable,
    );
    if (!target) {
      return null;
    }

    const snapshot: DamageableTarget = {
      id: target.id,
      owner: target.owner,
      x: target.x,
      y: target.y,
      radius: target.radius,
      active: target.active,
      targetable: target.targetable,
      maxLocks: target.maxLocks,
      pendingLocks: target.pendingLocks,
      hp: target.hp,
      maxHp: target.maxHp,
      scoreValue: target.scoreValue,
      color: target.color,
    };

    let destroyed = false;
    let phaseCleared = false;
    if (target.part !== 'core') {
      target.hp -= amount;
      destroyed = target.hp <= 0;
      if (destroyed) {
        target.active = false;
        target.targetable = false;
        target.view.setVisible(false);
      }
    }

    if (target.part === 'core' || target.part === 'orbital') {
      this.health = Math.max(0, this.health - amount);
    }

    this.scene.tweens.add({
      targets: [this.coreView, this.frontRing, this.backRing],
      alpha: 0.62,
      duration: 80,
      yoyo: true,
      ease: 'quad.out',
    });

    if (this.phase === 1 && this.nodes.every((node) => !node.active)) {
      phaseCleared = true;
      this.setPhase(2, this.currentBeatIndex);
    }

    if (this.phase === 2 && !this.regeneratedAtHalf && this.health <= BossSystem.HALF_HEALTH_THRESHOLD) {
      this.triggerHalfHealthRegeneration();
    }

    if (this.phase === 2 && this.health <= BossSystem.PHASE_THREE_THRESHOLD) {
      phaseCleared = true;
      this.setPhase(3, this.currentBeatIndex);
    }

    let bossDefeated = false;
    if (this.health <= 0) {
      bossDefeated = true;
      this.defeat();
    }

    return {
      target: snapshot,
      destroyed: destroyed || bossDefeated,
      remainingHp: this.health,
      scoreValue: target.scoreValue,
      chain: false,
      phaseCleared,
      bossDefeated,
    };
  }

  destroy(): void {
    this.overlayGraphics.destroy();
    this.root.destroy(true);
    this.nodes.forEach((node) => node.view.destroy());
    this.orbitals.forEach((orbital) => orbital.view.destroy());
  }

  private start(beatIndex: number): void {
    this.active = true;
    this.defeated = false;
    this.phase = 1;
    this.health = this.maxHealth;
    this.lastThreatBeat = -1;
    this.lastSigilSpawnBeat = beatIndex;
    this.lastMineSpawnBeat = -1;
    this.phaseStartedBeat = beatIndex;
    this.currentBeatIndex = beatIndex;
    this.regenerating = false;
    this.regeneratedAtHalf = false;
    this.center.set(GAME_CONFIG.width + 280, GAME_CONFIG.height * 0.5);
    this.root.setPosition(this.center.x, this.center.y).setVisible(true).setAlpha(1);
    this.corePart.active = true;
    this.corePart.targetable = false;
    this.nodes.forEach((node, index) => {
      node.active = true;
      node.targetable = false;
      node.angle = node.initialAngle;
      node.hp = BossSystem.PHASE_ONE_NODE_HP;
      node.maxHp = BossSystem.PHASE_ONE_NODE_HP;
      node.view
        .setVisible(true)
        .setAlpha(1)
        .setScale(0.72)
        .setTint(index % 2 === 0 ? this.palettePrimary : this.paletteSecondary);
    });
    this.orbitals.forEach((orbital, index) => {
      orbital.active = true;
      orbital.targetable = false;
      orbital.hp = 2;
      orbital.view
        .setVisible(false)
        .setScale(0.56)
        .setTint(index % 2 === 0 ? this.paletteSecondary : this.paletteAccent);
    });
  }

  private setPhase(phase: 1 | 2 | 3, beatIndex: number): void {
    if (phase === this.phase && this.active) {
      return;
    }

    this.phase = phase;
    this.lastThreatBeat = -1;
    this.lastSigilSpawnBeat = beatIndex;
    this.phaseStartedBeat = beatIndex;
    this.currentBeatIndex = beatIndex;

    if (phase === 2) {
      this.lastMineSpawnBeat = beatIndex - 1;
      this.nodes.forEach((node) => {
        node.active = false;
        node.targetable = false;
        node.view.setVisible(false);
      });
    }

    if (phase === 3) {
      this.orbitals.forEach((orbital) => {
        orbital.active = true;
        orbital.targetable = false;
        orbital.hp = Math.max(1, orbital.hp);
        orbital.view.setVisible(true);
      });
    }
  }

  private triggerHalfHealthRegeneration(): void {
    if (this.regeneratedAtHalf || this.regenerating) {
      return;
    }

    this.regeneratedAtHalf = true;
    this.regenerating = true;
    this.phase = 1;
    this.phaseStartedBeat = this.currentBeatIndex;
    this.lastSigilSpawnBeat = this.currentBeatIndex;
    this.lastMineSpawnBeat = -1;
    this.corePart.targetable = false;
    this.orbitals.forEach((orbital) => {
      orbital.active = false;
      orbital.targetable = false;
      orbital.view.setVisible(false);
    });
    this.petals.forEach((petal, index) => {
      petal
        .setScale(0.9)
        .setAlpha(0.2)
        .setRotation(index * (Math.PI / 2));
    });

    this.nodes.forEach((node, index) => {
      node.active = true;
      node.targetable = false;
      node.angle = node.initialAngle;
      node.hp = BossSystem.PHASE_ONE_NODE_HP;
      node.maxHp = BossSystem.PHASE_ONE_NODE_HP;
      node.view
        .setVisible(true)
        .setAlpha(0.16)
        .setScale(0.18)
        .setTint(index % 2 === 0 ? this.palettePrimary : this.paletteSecondary);
      this.scene.tweens.add({
        targets: node.view,
        alpha: 1,
        scale: node.visibleScale,
        duration: BossSystem.REGEN_DURATION_MS,
        ease: 'sine.out',
      });
    });

    this.scene.tweens.add({
      targets: [this.coreView, this.frontRing, this.backRing],
      alpha: 0.28,
      duration: BossSystem.REGEN_DURATION_MS * 0.5,
      yoyo: true,
      ease: 'sine.inOut',
    });

    this.scene.time.delayedCall(BossSystem.REGEN_DURATION_MS, () => {
      if (!this.active || this.defeated) {
        return;
      }

      this.regenerating = false;
      this.phaseStartedBeat = this.currentBeatIndex;
      this.lastSigilSpawnBeat = this.currentBeatIndex;
      this.nodes.forEach((node) => {
        node.targetable = this.center.x <= this.targetCenter.x + 8;
        node.view.setAlpha(1).setScale(node.visibleScale);
      });
    });
  }

  private defeat(): void {
    if (this.defeated) {
      return;
    }

    this.active = false;
    this.defeated = true;
    this.corePart.active = false;
    this.nodes.forEach((node) => {
      node.active = false;
      node.targetable = false;
    });
    this.orbitals.forEach((orbital) => {
      orbital.active = false;
      orbital.targetable = false;
    });
  }

  private createPart(
    id: string,
    part: BossPartType,
    hp: number,
    orbitRadius: number,
    angle: number,
    color: number,
    visibleScale: number,
    registerWorldObject?: (
      objects: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[],
    ) => void,
  ): BossPart {
    const view =
      part === 'core'
        ? this.coreView
        : this.scene.add
            .image(0, 0, part === 'node' ? 'boss-node' : 'enemy-cluster')
            .setBlendMode(Phaser.BlendModes.ADD)
            .setScale(visibleScale)
            .setTint(color)
            .setDepth(53)
            .setVisible(false);

    registerWorldObject?.(view);

    return {
      id,
      owner: 'boss',
      part,
      view,
      angle,
      initialAngle: angle,
      orbitRadius,
      visibleScale,
      x: 0,
      y: 0,
      radius: part === 'node' ? 30 : part === 'orbital' ? 20 : 44,
      active: part === 'core',
      targetable: false,
      pendingLocks: 0,
      maxLocks: part === 'node' ? 2 : 1,
      hp,
      maxHp: hp,
      scoreValue: part === 'core' ? 600 : 220,
      color,
    };
  }
}
