import * as THREE from "three";
import type { BoxColliderOptions, StaticBoxCollider } from "./collisionTypes";

const MAX_SUBSTEP = 0.08;

export class CollisionSystem {
  readonly colliders: StaticBoxCollider[] = [];

  private readonly candidate = new THREE.Vector3();
  private readonly center = new THREE.Vector3();
  private readonly halfSize = new THREE.Vector3();

  addBox(
    id: string,
    position: readonly [number, number, number],
    size: readonly [number, number, number],
    options: BoxColliderOptions = {},
  ): StaticBoxCollider {
    this.center.fromArray(position);
    this.halfSize.fromArray(size).multiplyScalar(0.5);
    const collider: StaticBoxCollider = {
      id,
      box: new THREE.Box3(
        this.center.clone().sub(this.halfSize),
        this.center.clone().add(this.halfSize),
      ),
      blocking: options.blocking ?? true,
      walkable: options.walkable ?? false,
    };
    this.colliders.push(collider);
    return collider;
  }

  resolveHorizontal(
    position: THREE.Vector3,
    displacement: THREE.Vector3,
    radius: number,
    height: number,
  ): THREE.Vector3 {
    const distance = Math.hypot(displacement.x, displacement.z);
    const steps = Math.max(1, Math.ceil(distance / MAX_SUBSTEP));
    const stepX = displacement.x / steps;
    const stepZ = displacement.z / steps;

    for (let index = 0; index < steps; index += 1) {
      this.candidate.copy(position);
      this.candidate.x += stepX;
      if (!this.intersectsBlocking(this.candidate, radius, height)) position.x = this.candidate.x;

      this.candidate.copy(position);
      this.candidate.z += stepZ;
      if (!this.intersectsBlocking(this.candidate, radius, height)) position.z = this.candidate.z;
    }

    return position;
  }

  groundHeightAt(position: THREE.Vector3, radius: number): number | null {
    let ground: number | null = null;
    for (const collider of this.colliders) {
      if (!collider.walkable) continue;
      if (
        position.x + radius < collider.box.min.x ||
        position.x - radius > collider.box.max.x ||
        position.z + radius < collider.box.min.z ||
        position.z - radius > collider.box.max.z
      ) {
        continue;
      }
      const top = collider.box.max.y;
      if (ground === null || top > ground) ground = top;
    }
    return ground;
  }

  clear(): void {
    this.colliders.length = 0;
  }

  private intersectsBlocking(position: THREE.Vector3, radius: number, height: number): boolean {
    const playerMinY = position.y;
    const playerMaxY = position.y + height;

    for (const collider of this.colliders) {
      if (!collider.blocking) continue;
      if (playerMaxY <= collider.box.min.y || playerMinY >= collider.box.max.y) continue;

      const closestX = THREE.MathUtils.clamp(position.x, collider.box.min.x, collider.box.max.x);
      const closestZ = THREE.MathUtils.clamp(position.z, collider.box.min.z, collider.box.max.z);
      const deltaX = position.x - closestX;
      const deltaZ = position.z - closestZ;
      if (deltaX * deltaX + deltaZ * deltaZ < radius * radius) return true;
    }
    return false;
  }
}
