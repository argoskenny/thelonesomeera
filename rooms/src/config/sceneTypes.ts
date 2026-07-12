export type Vec3Tuple = readonly [number, number, number];

export interface Size3 {
  readonly width: number;
  readonly height: number;
  readonly depth: number;
}

export interface TransformSpec {
  readonly position: Vec3Tuple;
  readonly rotationY?: number;
}

export interface FurnitureSpec extends TransformSpec {
  readonly size: Size3;
}

export interface CameraPose {
  readonly position: Vec3Tuple;
  readonly target: Vec3Tuple;
  readonly fov: number;
}

export interface AssetManifestEntry {
  readonly url: string | null;
  readonly scale?: number;
  readonly offset?: Vec3Tuple;
}

export type AssetKey = "chair" | "deskLamp" | "laptop" | "heroPlant";

export interface SceneConfig {
  readonly units: "meters";
  readonly room: Size3 & { readonly wallThickness: number };
  readonly door: {
    readonly width: number;
    readonly height: number;
    readonly thickness: number;
    readonly centerX: number;
  };
  readonly window: {
    readonly width: number;
    readonly height: number;
    readonly sillHeight: number;
    readonly frameDepth: number;
    readonly blindDrop: number;
  };
  readonly furniture: {
    readonly desk: FurnitureSpec;
    readonly chair: FurnitureSpec;
    readonly bookshelf: FurnitureSpec;
    readonly cabinet: FurnitureSpec;
  };
  readonly player: {
    readonly height: number;
    readonly eyeHeight: number;
    readonly radius: number;
    readonly walkSpeed: number;
    readonly sprintSpeed: number;
    readonly start: Vec3Tuple;
    readonly startYaw: number;
  };
  readonly cameras: {
    readonly reference: CameraPose;
    readonly free: CameraPose;
    readonly playerFov: number;
  };
  readonly decor: {
    readonly laptop: Vec3Tuple;
    readonly deskLamp: {
      readonly base: Vec3Tuple;
      readonly jointOne: Vec3Tuple;
      readonly jointTwo: Vec3Tuple;
    };
    readonly plants: {
      readonly desk: { readonly position: Vec3Tuple; readonly radius: number; readonly height: number; readonly leafScale: number };
      readonly cabinet: { readonly position: Vec3Tuple; readonly radius: number; readonly height: number; readonly leafScale: number };
      readonly hero: Vec3Tuple;
    };
    readonly frames: {
      readonly cabinet: Vec3Tuple;
      readonly wall: Vec3Tuple;
    };
    readonly deskAccessories: {
      readonly mug: Vec3Tuple;
      readonly mouse: Vec3Tuple;
    };
    readonly exteriorTrees: readonly Vec3Tuple[];
  };
  readonly assets: Readonly<Record<AssetKey, AssetManifestEntry>>;
}
