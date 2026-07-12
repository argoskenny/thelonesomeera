import type * as THREE from "three";

export interface StaticBoxCollider {
  readonly id: string;
  readonly box: THREE.Box3;
  readonly blocking: boolean;
  readonly walkable: boolean;
}

export interface BoxColliderOptions {
  readonly blocking?: boolean;
  readonly walkable?: boolean;
}
