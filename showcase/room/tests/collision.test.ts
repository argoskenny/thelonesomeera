import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { CollisionSystem } from "../src/physics/CollisionSystem";

describe("CollisionSystem", () => {
  it("prevents a player circle from crossing a wall", () => {
    const collisions = new CollisionSystem();
    collisions.addBox("wall", [0.6, 1, 0], [0.1, 2, 2]);
    const position = new THREE.Vector3(0, 0, 0);
    collisions.resolveHorizontal(position, new THREE.Vector3(1, 0, 0), 0.22, 1.8);
    expect(position.x).toBeLessThan(0.38);
  });

  it("allows movement to slide along a wall", () => {
    const collisions = new CollisionSystem();
    collisions.addBox("wall", [0.6, 1, 0], [0.1, 2, 2]);
    const position = new THREE.Vector3(0, 0, 0);
    collisions.resolveHorizontal(position, new THREE.Vector3(1, 0, 0.5), 0.22, 1.8);
    expect(position.x).toBeLessThan(0.38);
    expect(position.z).toBeGreaterThan(0.45);
  });

  it("reports a walkable floor height separately from blocking boxes", () => {
    const collisions = new CollisionSystem();
    collisions.addBox("floor", [0, -0.03, 0], [3.6, 0.06, 3], {
      blocking: false,
      walkable: true,
    });
    expect(collisions.groundHeightAt(new THREE.Vector3(0, 1, 0), 0.22)).toBeCloseTo(0);
    expect(collisions.groundHeightAt(new THREE.Vector3(4, 1, 4), 0.22)).toBeNull();
  });
});
