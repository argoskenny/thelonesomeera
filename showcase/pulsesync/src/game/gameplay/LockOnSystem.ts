import Phaser from 'phaser';
import { GAME_CONFIG } from '@/game/content/config/gameConfig';
import { countLocksForTarget, canCollectLock } from '@/game/gameplay/lockOnRules';
import { EventBus } from '@/game/systems/EventBus';
import type { GameEventMap } from '@/game/types/GameEvents';
import type { LockToken } from '@/game/types/GameTypes';
import type { LockableTarget } from '@/game/types/RuntimeTypes';
import { CollisionSystem } from '@/game/gameplay/CollisionSystem';

export class LockOnSystem {
  private charging = false;
  private sequence: LockToken[] = [];
  private lastLockAt = new Map<string, number>();
  private palettePrimary = 0x35e7ff;
  private paletteSecondary = 0xff4cb7;
  private readonly graphics: Phaser.GameObjects.Graphics;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly bus: EventBus<GameEventMap>,
    registerWorldObject?: (
      objects: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[],
    ) => void,
  ) {
    this.graphics = this.scene.add.graphics().setDepth(70);
    registerWorldObject?.(this.graphics);
  }

  setPalette(primary: number, secondary: number): void {
    this.palettePrimary = primary;
    this.paletteSecondary = secondary;
  }

  begin(): void {
    this.sequence = [];
    this.lastLockAt.clear();
    this.charging = true;
  }

  update(cursorX: number, cursorY: number, targets: ReadonlyArray<LockableTarget>): void {
    this.draw(cursorX, cursorY, targets);

    if (!this.charging) {
      return;
    }

    const overlaps = CollisionSystem.findTargetsInRadius(
      cursorX,
      cursorY,
      GAME_CONFIG.lockRadius,
      targets,
    );

    overlaps.forEach((target) => {
      const elapsedSinceLastLock =
        this.scene.time.now - (this.lastLockAt.get(target.id) ?? -Infinity);
      const targetQueuedLocks = countLocksForTarget(this.sequence, target.id);

      if (
        canCollectLock({
          maxLocks: GAME_CONFIG.maxLocks,
          queuedLocks: this.sequence.length,
          targetQueuedLocks,
          targetLockSlots: target.maxLocks,
          elapsedSinceLastLockMs: elapsedSinceLastLock,
          lockCooldownMs: GAME_CONFIG.lockRetargetCooldownMs,
        })
      ) {
        target.pendingLocks += 1;
        const token = {
          targetId: target.id,
          order: this.sequence.length,
        };
        this.sequence.push(token);
        this.lastLockAt.set(target.id, this.scene.time.now);
        this.bus.emit('lock:acquired', {
          targetId: target.id,
          x: target.x,
          y: target.y,
          order: token.order,
        });
      }
    });
  }

  release(targetIndex: Map<string, LockableTarget>): LockToken[] {
    const released = [...this.sequence];

    released.forEach((token) => {
      const target = targetIndex.get(token.targetId);
      if (target) {
        target.pendingLocks = Math.max(0, target.pendingLocks - 1);
      }
    });

    this.sequence = [];
    this.charging = false;
    this.lastLockAt.clear();
    this.graphics.clear();
    this.bus.emit('lock:released', { count: released.length });
    return released;
  }

  cancel(targetIndex: Map<string, LockableTarget>): void {
    this.sequence.forEach((token) => {
      const target = targetIndex.get(token.targetId);
      if (target) {
        target.pendingLocks = Math.max(0, target.pendingLocks - 1);
      }
    });
    this.sequence = [];
    this.charging = false;
    this.graphics.clear();
  }

  isCharging(): boolean {
    return this.charging;
  }

  getQueuedCount(): number {
    return this.sequence.length;
  }

  private draw(
    cursorX: number,
    cursorY: number,
    targets: ReadonlyArray<LockableTarget>,
  ): void {
    this.graphics.clear();

    if (!this.charging || this.sequence.length === 0) {
      return;
    }

    const targetIndex = new Map(targets.map((target) => [target.id, target]));
    this.sequence.forEach((token, index) => {
      const target = targetIndex.get(token.targetId);
      if (!target) {
        return;
      }

      const tint = index % 2 === 0 ? this.palettePrimary : this.paletteSecondary;
      this.graphics.lineStyle(1.5, tint, 0.65 - index * 0.04);
      this.graphics.strokeLineShape(
        new Phaser.Geom.Line(
          index === 0 ? cursorX : target.x - 12,
          index === 0 ? cursorY : target.y - 12,
          target.x,
          target.y,
        ),
      );
      this.graphics.lineStyle(2, tint, 0.92);
      this.graphics.strokeCircle(target.x, target.y, target.radius + 6 + index * 1.2);
    });
  }
}
