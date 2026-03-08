import Phaser from 'phaser';
import { GAME_CONFIG } from '@/game/content/config/gameConfig';
import { CollisionSystem } from '@/game/gameplay/CollisionSystem';
import type { LockToken } from '@/game/types/GameTypes';
import type { DamageableTarget } from '@/game/types/RuntimeTypes';

interface LaunchOrder {
  targetId: string;
  delayMs: number;
}

interface Projectile {
  sprite: Phaser.GameObjects.Image;
  active: boolean;
  targetId: string;
  velocity: Phaser.Math.Vector2;
  age: number;
  trailMs: number;
}

export class ProjectileSystem {
  private readonly pool: Projectile[];
  private readonly launchQueue: LaunchOrder[] = [];
  private palettePrimary = 0x35e7ff;
  private targetResolver: ((targetId: string) => DamageableTarget | undefined) | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly onImpact: (target: DamageableTarget) => void,
    private readonly onLaunch: () => void,
    private readonly spawnTrail: (x: number, y: number, color: number) => void,
    registerWorldObject?: (
      objects: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[],
    ) => void,
  ) {
    this.pool = Array.from({ length: GAME_CONFIG.projectilePoolSize }, () => ({
      sprite: this.scene.add
        .image(
          GAME_CONFIG.emitterAnchor.x,
          GAME_CONFIG.emitterAnchor.y,
          'fx-projectile',
        )
        .setDepth(68)
        .setVisible(false)
        .setScale(0.55)
        .setBlendMode(Phaser.BlendModes.ADD),
      active: false,
      targetId: '',
      velocity: new Phaser.Math.Vector2(),
      age: 0,
      trailMs: 0,
    }));
    registerWorldObject?.(this.pool.map((projectile) => projectile.sprite));
  }

  setPalette(primary: number): void {
    this.palettePrimary = primary;
    this.pool.forEach((projectile) => {
      projectile.sprite.setTint(primary);
    });
  }

  fireSequence(
    locks: ReadonlyArray<LockToken>,
    targetResolver: (targetId: string) => DamageableTarget | undefined,
  ): void {
    this.targetResolver = targetResolver;
    locks.forEach((token, index) => {
      this.launchQueue.push({
        targetId: token.targetId,
        delayMs: index * GAME_CONFIG.projectileFireIntervalMs,
      });
    });
  }

  update(deltaSeconds: number): void {
    this.processLaunchQueue(deltaSeconds * 1000);

    if (!this.targetResolver) {
      return;
    }

    this.pool.forEach((projectile) => {
      if (!projectile.active) {
        return;
      }

      const target = this.targetResolver?.(projectile.targetId);
      projectile.age += deltaSeconds;
      projectile.trailMs -= deltaSeconds * 1000;

      if (target && target.active) {
        const desired = new Phaser.Math.Vector2(
          target.x - projectile.sprite.x,
          target.y - projectile.sprite.y,
        )
          .normalize()
          .scale(GAME_CONFIG.projectileSpeed);
        projectile.velocity.lerp(desired, 0.16);

        if (
          CollisionSystem.hasProjectileHit(
            projectile.sprite.x,
            projectile.sprite.y,
            target,
          )
        ) {
          this.onImpact(target);
          this.deactivate(projectile);
          return;
        }
      } else {
        projectile.velocity.scale(0.985);
        projectile.sprite.alpha -= deltaSeconds * 1.3;
        if (projectile.sprite.alpha <= 0.04) {
          this.deactivate(projectile);
          return;
        }
      }

      projectile.sprite.x += projectile.velocity.x * deltaSeconds;
      projectile.sprite.y += projectile.velocity.y * deltaSeconds;
      projectile.sprite.rotation = Math.atan2(
        projectile.velocity.y,
        projectile.velocity.x,
      );

      if (projectile.trailMs <= 0) {
        this.spawnTrail(projectile.sprite.x, projectile.sprite.y, this.palettePrimary);
        projectile.trailMs = 28;
      }
    });
  }

  isBusy(): boolean {
    return this.launchQueue.length > 0 || this.pool.some((projectile) => projectile.active);
  }

  destroy(): void {
    this.pool.forEach((projectile) => projectile.sprite.destroy());
  }

  private processLaunchQueue(deltaMs: number): void {
    for (let index = this.launchQueue.length - 1; index >= 0; index -= 1) {
      const item = this.launchQueue[index];
      item.delayMs -= deltaMs;
      if (item.delayMs <= 0) {
        this.launch(item.targetId);
        this.launchQueue.splice(index, 1);
      }
    }
  }

  private launch(targetId: string): void {
    const projectile = this.pool.find((entry) => !entry.active);
    if (!projectile) {
      return;
    }

    projectile.active = true;
    projectile.targetId = targetId;
    projectile.age = 0;
    projectile.trailMs = 0;
    projectile.velocity.set(GAME_CONFIG.projectileSpeed * 0.8, 0);
    projectile.sprite
      .setVisible(true)
      .setAlpha(1)
      .setTint(this.palettePrimary)
      .setPosition(GAME_CONFIG.emitterAnchor.x, GAME_CONFIG.emitterAnchor.y)
      .setScale(0.55);
    this.onLaunch();
  }

  private deactivate(projectile: Projectile): void {
    projectile.active = false;
    projectile.targetId = '';
    projectile.velocity.set(0, 0);
    projectile.sprite.setVisible(false);
  }
}
