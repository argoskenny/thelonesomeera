import { distanceSquared } from '@/game/utils/math';
import type { LockableTarget } from '@/game/types/RuntimeTypes';

export class CollisionSystem {
  static findTargetsInRadius<T extends LockableTarget>(
    x: number,
    y: number,
    radius: number,
    targets: ReadonlyArray<T>,
  ): T[] {
    return targets.filter((target) => {
      if (!target.active || !target.targetable) {
        return false;
      }

      return (
        distanceSquared(x, y, target.x, target.y) <=
        (radius + target.radius) * (radius + target.radius)
      );
    }).sort(
      (left, right) =>
        distanceSquared(x, y, left.x, left.y) -
        distanceSquared(x, y, right.x, right.y),
    );
  }

  static hasProjectileHit(
    x: number,
    y: number,
    target: LockableTarget,
    padding = 12,
  ): boolean {
    return distanceSquared(x, y, target.x, target.y) <= (target.radius + padding) ** 2;
  }
}
