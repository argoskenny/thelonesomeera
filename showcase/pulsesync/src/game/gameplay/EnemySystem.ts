import Phaser from 'phaser';
import { ENEMY_ARCHETYPES } from '@/game/content/config/enemyConfig';
import { GAME_CONFIG } from '@/game/content/config/gameConfig';
import type { EnemyType, SpawnCue } from '@/game/types/GameTypes';
import type {
  DamageResult,
  DamageableTarget,
} from '@/game/types/RuntimeTypes';
import { distance } from '@/game/utils/math';

interface ThreatEvent {
  kind: 'sniper' | 'mine';
  x: number;
  y: number;
  damage: number;
}

interface EnemyView {
  container: Phaser.GameObjects.Container;
  aura: Phaser.GameObjects.Image;
  core: Phaser.GameObjects.Image;
  ring: Phaser.GameObjects.Image;
}

interface EnemyActor extends DamageableTarget {
  owner: 'enemy';
  enemyType: EnemyType;
  view: EnemyView;
  speed: number;
  baseY: number;
  drift: number;
  phaseOffset: number;
  spawnElapsed: number;
  charge: number;
  clusterId?: string;
  movementMode: 'lane' | 'boss-mine';
  scatterDuration: number;
  scatterElapsed: number;
  scatterOriginX: number;
  scatterOriginY: number;
  scatterTargetX: number;
  scatterTargetY: number;
  velocityX: number;
  velocityY: number;
}

const TEXTURE_BY_TYPE: Record<EnemyType, string> = {
  'pulse-drone': 'enemy-drone',
  'shield-node': 'enemy-shield',
  'chain-cluster': 'enemy-cluster',
  'sniper-sigil': 'enemy-sniper',
  'distortion-mine': 'enemy-mine',
};

const COLOR_BY_TYPE: Record<EnemyType, number> = {
  'pulse-drone': 0x35e7ff,
  'shield-node': 0xff4cb7,
  'chain-cluster': 0xdfff4f,
  'sniper-sigil': 0xff6f91,
  'distortion-mine': 0x8d6dff,
};

export class EnemySystem {
  private readonly actors: EnemyActor[] = [];
  private readonly overlayGraphics: Phaser.GameObjects.Graphics;
  private spawnSerial = 0;
  private palettePrimary = 0x35e7ff;
  private paletteSecondary = 0xff4cb7;
  private paletteDanger = 0xff6f91;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly onThreat: (event: ThreatEvent) => void,
    private readonly registerWorldObject?: (
      objects: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[],
    ) => void,
  ) {
    this.overlayGraphics = this.scene.add.graphics().setDepth(42);
    this.registerWorldObject?.(this.overlayGraphics);
  }

  setPalette(primary: number, secondary: number, danger: number): void {
    this.palettePrimary = primary;
    this.paletteSecondary = secondary;
    this.paletteDanger = danger;
  }

  spawn(cue: SpawnCue, elapsedSeconds: number): void {
    const baseY = GAME_CONFIG.laneYs[cue.lane] ?? GAME_CONFIG.height * 0.5;
    const spawnX = GAME_CONFIG.width + 150 + (cue.spacing ?? 0);
    this.activateActor(cue.enemyType, cue.id, spawnX, baseY, elapsedSeconds, {
      hpScale: cue.hpScale,
      speedScale: cue.speedScale,
      drift: cue.drift ?? (cue.enemyType === 'pulse-drone' ? 18 : 10),
      phaseOffset: cue.phaseOffset,
      clusterId: cue.clusterId,
    });
  }

  spawnAt(
    enemyType: EnemyType,
    x: number,
    y: number,
    elapsedSeconds: number,
    options: {
      idPrefix?: string;
      hpScale?: number;
      speedScale?: number;
      drift?: number;
      phaseOffset?: number;
      clusterId?: string;
      scatter?: {
        angle: number;
        radius: number;
        durationSec: number;
      };
    } = {},
  ): void {
    this.activateActor(
      enemyType,
      options.idPrefix ?? enemyType,
      x,
      y,
      elapsedSeconds,
      {
        hpScale: options.hpScale,
        speedScale: options.speedScale,
        drift: options.drift ?? (enemyType === 'pulse-drone' ? 18 : 10),
        phaseOffset: options.phaseOffset,
        clusterId: options.clusterId,
        scatter: options.scatter,
      },
    );
  }

  private activateActor(
    enemyType: EnemyType,
    idPrefix: string,
    x: number,
    y: number,
    elapsedSeconds: number,
    options: {
      hpScale?: number;
      speedScale?: number;
      drift?: number;
      phaseOffset?: number;
      clusterId?: string;
      scatter?: {
        angle: number;
        radius: number;
        durationSec: number;
      };
    },
  ): void {
    const archetype = ENEMY_ARCHETYPES[enemyType];
    const actor = this.acquireActor(enemyType);
    const hp = Math.max(1, Math.round(archetype.maxHp * (options.hpScale ?? 1)));

    actor.id = `${idPrefix}-${this.spawnSerial}`;
    actor.owner = 'enemy';
    actor.enemyType = enemyType;
    actor.active = true;
    actor.targetable = true;
    actor.pendingLocks = 0;
    actor.maxLocks = archetype.lockSlots;
    actor.hp = hp;
    actor.maxHp = hp;
    actor.scoreValue = archetype.scoreValue;
    actor.radius = archetype.radius;
    actor.color = COLOR_BY_TYPE[enemyType];
    actor.speed = archetype.speed * (options.speedScale ?? 1);
    actor.baseY = y;
    actor.drift = options.drift ?? (enemyType === 'pulse-drone' ? 18 : 10);
    actor.phaseOffset = options.phaseOffset ?? this.spawnSerial * 0.21;
    actor.spawnElapsed = elapsedSeconds;
    actor.charge = 0;
    actor.clusterId = options.clusterId;
    actor.x = x;
    actor.y = y;
    actor.movementMode = 'lane';
    actor.scatterDuration = 0;
    actor.scatterElapsed = 0;
    actor.scatterOriginX = x;
    actor.scatterOriginY = y;
    actor.scatterTargetX = x;
    actor.scatterTargetY = y;
    actor.velocityX = -actor.speed;
    actor.velocityY = 0;

    if (enemyType === 'distortion-mine' && options.scatter) {
      const scatterRadius = Math.min(options.scatter.radius, 180);
      actor.movementMode = 'boss-mine';
      actor.scatterDuration = Math.max(0.05, options.scatter.durationSec);
      actor.scatterElapsed = 0;
      actor.scatterOriginX = x;
      actor.scatterOriginY = y;
      actor.scatterTargetX = x + Math.cos(options.scatter.angle) * scatterRadius;
      actor.scatterTargetY = y + Math.sin(options.scatter.angle) * scatterRadius;
      const chaseVector = new Phaser.Math.Vector2(
        GAME_CONFIG.emitterAnchor.x - actor.scatterTargetX,
        GAME_CONFIG.emitterAnchor.y - actor.scatterTargetY,
      ).normalize();
      actor.velocityX = chaseVector.x * actor.speed;
      actor.velocityY = chaseVector.y * actor.speed;
    }

    actor.view.aura
      .setTint(actor.color)
      .setScale(enemyType === 'chain-cluster' ? 0.5 : 0.72)
      .setAlpha(0.2);
    actor.view.core
      .setTexture(TEXTURE_BY_TYPE[enemyType])
      .setTint(actor.color)
      .setScale(enemyType === 'chain-cluster' ? 0.68 : 0.9);
    actor.view.ring
      .setTint(enemyType === 'shield-node' ? this.paletteSecondary : this.palettePrimary)
      .setScale(enemyType === 'chain-cluster' ? 0.62 : 0.84)
      .setAlpha(0.42);
    actor.view.container.setPosition(actor.x, actor.y).setVisible(true);
    this.spawnSerial += 1;
  }

  update(deltaSeconds: number, elapsedSeconds: number): void {
    this.overlayGraphics.clear();

    this.actors.forEach((actor) => {
      if (!actor.active) {
        return;
      }

      if (actor.movementMode === 'boss-mine') {
        if (actor.scatterElapsed < actor.scatterDuration) {
          actor.scatterElapsed = Math.min(actor.scatterDuration, actor.scatterElapsed + deltaSeconds);
          const progress = actor.scatterElapsed / actor.scatterDuration;
          const eased = 1 - (1 - progress) * (1 - progress);
          actor.x = Phaser.Math.Linear(actor.scatterOriginX, actor.scatterTargetX, eased);
          actor.y = Phaser.Math.Linear(actor.scatterOriginY, actor.scatterTargetY, eased);
        } else {
          actor.x += actor.velocityX * deltaSeconds;
          actor.y += actor.velocityY * deltaSeconds;
        }
      } else {
        actor.x -= actor.speed * deltaSeconds;
        actor.y =
          actor.baseY +
          Math.sin((elapsedSeconds - actor.spawnElapsed) * 2.8 + actor.phaseOffset) *
            actor.drift;
      }

      actor.view.container.setPosition(actor.x, actor.y);
      actor.view.ring.rotation += deltaSeconds * (actor.enemyType === 'shield-node' ? -1.4 : 1.8);
      actor.view.core.rotation += deltaSeconds * 0.8;
      actor.view.aura.setAlpha(0.18 + Math.sin(elapsedSeconds * 6 + actor.phaseOffset) * 0.04);

      if (actor.enemyType === 'sniper-sigil') {
        const chargeDuration = ENEMY_ARCHETYPES['sniper-sigil'].chargeDuration ?? 4.5;
        actor.charge += deltaSeconds / chargeDuration;
        actor.view.ring.setScale(0.84 + actor.charge * 0.26);
        if (actor.charge >= 0.6) {
          this.overlayGraphics.lineStyle(2, this.paletteDanger, 0.18 + actor.charge * 0.48);
          this.overlayGraphics.strokeLineShape(
            new Phaser.Geom.Line(actor.x, actor.y, GAME_CONFIG.emitterAnchor.x, GAME_CONFIG.emitterAnchor.y),
          );
        }

        if (actor.charge >= 1) {
          actor.charge = 0;
          this.onThreat({
            kind: 'sniper',
            x: actor.x,
            y: actor.y,
            damage: 8,
          });
        }
      }

      if (actor.enemyType === 'distortion-mine') {
        const pulseDuration = ENEMY_ARCHETYPES['distortion-mine'].chargeDuration ?? 2.6;
        if (actor.movementMode !== 'boss-mine' || actor.scatterElapsed >= actor.scatterDuration) {
          actor.charge += deltaSeconds / pulseDuration;
        }
        actor.view.aura.setScale(0.78 + actor.charge * 0.52);
        actor.view.ring.rotation -= deltaSeconds * 2;
        if (actor.charge >= 1) {
          actor.charge = 0;
          this.overlayGraphics.lineStyle(3, actor.color, 0.44);
          this.overlayGraphics.strokeCircle(actor.x, actor.y, 48);
          this.onThreat({
            kind: 'mine',
            x: actor.x,
            y: actor.y,
            damage: 5,
          });
        }
      }

      if (actor.x <= GAME_CONFIG.offscreenDespawnX) {
        this.deactivate(actor);
      }
    });
  }

  getTargetables(): DamageableTarget[] {
    return this.actors.filter((actor) => actor.active);
  }

  getTargetIndex(): Map<string, DamageableTarget> {
    return new Map(this.getTargetables().map((actor) => [actor.id, actor]));
  }

  getDistortionLevel(): number {
    const mines = this.actors.filter(
      (actor) => actor.active && actor.enemyType === 'distortion-mine',
    );
    return Math.min(1, mines.length / 4);
  }

  applyDamage(
    targetId: string,
    amount: number,
    source: 'projectile' | 'burst' | 'chain',
  ): DamageResult | null {
    const actor = this.actors.find(
      (candidate) => candidate.active && candidate.id === targetId,
    );
    if (!actor) {
      return null;
    }

    actor.hp -= amount;
    actor.view.core.setScale(actor.enemyType === 'chain-cluster' ? 0.82 : 1.05);
    this.scene.tweens.add({
      targets: [actor.view.core, actor.view.ring],
      scale: '*=0.9',
      duration: 120,
      yoyo: true,
      ease: 'quad.out',
    });

    const snapshot: DamageableTarget = {
      id: actor.id,
      owner: actor.owner,
      enemyType: actor.enemyType,
      x: actor.x,
      y: actor.y,
      radius: actor.radius,
      active: actor.active,
      targetable: actor.targetable,
      maxLocks: actor.maxLocks,
      pendingLocks: actor.pendingLocks,
      hp: actor.hp,
      maxHp: actor.maxHp,
      scoreValue: actor.scoreValue,
      color: actor.color,
    };

    const destroyed = actor.hp <= 0;
    const chain = actor.enemyType === 'chain-cluster';

    if (destroyed) {
      this.deactivate(actor);
      if (chain && source !== 'chain') {
        this.chainDetonate(actor.clusterId, actor.x, actor.y);
      }
    }

    return {
      target: snapshot,
      destroyed,
      remainingHp: Math.max(0, actor.hp),
      scoreValue: actor.scoreValue,
      chain: chain && destroyed,
    };
  }

  destroy(): void {
    this.overlayGraphics.destroy();
    this.actors.forEach((actor) => actor.view.container.destroy(true));
  }

  private chainDetonate(clusterId: string | undefined, x: number, y: number): void {
    if (!clusterId) {
      return;
    }

    this.actors.forEach((actor) => {
      if (
        actor.active &&
        actor.clusterId === clusterId &&
        distance(actor.x, actor.y, x, y) < 120
      ) {
        actor.hp = 0;
        this.deactivate(actor);
      }
    });
  }

  private acquireActor(enemyType: EnemyType): EnemyActor {
    const pooled = this.actors.find(
      (candidate) => !candidate.active && candidate.enemyType === enemyType,
    );

    if (pooled) {
      return pooled;
    }

    const container = this.scene.add.container(0, 0).setVisible(false).setDepth(44);
    const aura = this.scene.add
      .image(0, 0, 'fx-ring')
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.18);
    const core = this.scene.add
      .image(0, 0, TEXTURE_BY_TYPE[enemyType])
      .setBlendMode(Phaser.BlendModes.ADD);
    const ring = this.scene.add
      .image(0, 0, 'fx-ring')
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.32)
      .setScale(0.84);
    container.add([aura, core, ring]);
    this.registerWorldObject?.([container, aura, core, ring]);

    const actor: EnemyActor = {
      id: '',
      owner: 'enemy',
      enemyType,
      view: {
        container,
        aura,
        core,
        ring,
      },
      x: 0,
      y: 0,
      radius: ENEMY_ARCHETYPES[enemyType].radius,
      active: false,
      targetable: false,
      pendingLocks: 0,
      maxLocks: ENEMY_ARCHETYPES[enemyType].lockSlots,
      hp: ENEMY_ARCHETYPES[enemyType].maxHp,
      maxHp: ENEMY_ARCHETYPES[enemyType].maxHp,
      scoreValue: ENEMY_ARCHETYPES[enemyType].scoreValue,
      color: COLOR_BY_TYPE[enemyType],
      speed: ENEMY_ARCHETYPES[enemyType].speed,
      baseY: 0,
      drift: 0,
      phaseOffset: 0,
      spawnElapsed: 0,
      charge: 0,
      movementMode: 'lane',
      scatterDuration: 0,
      scatterElapsed: 0,
      scatterOriginX: 0,
      scatterOriginY: 0,
      scatterTargetX: 0,
      scatterTargetY: 0,
      velocityX: 0,
      velocityY: 0,
    };

    this.actors.push(actor);
    return actor;
  }

  private deactivate(actor: EnemyActor): void {
    actor.active = false;
    actor.targetable = false;
    actor.pendingLocks = 0;
    actor.view.container.setVisible(false);
  }
}
