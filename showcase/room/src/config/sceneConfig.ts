import type { SceneConfig } from "./sceneTypes";

export const SCENE_CONFIG: SceneConfig = {
  units: "meters",
  room: {
    width: 3.6,
    depth: 3,
    height: 2.7,
    wallThickness: 0.12,
  },
  door: {
    width: 0.8,
    height: 2.08,
    thickness: 0.04,
    centerX: -1.31,
  },
  window: {
    width: 1.4,
    height: 1.28,
    sillHeight: 0.88,
    frameDepth: 0.1,
    blindDrop: 0.52,
  },
  furniture: {
    desk: {
      size: { width: 1.2, depth: 0.6, height: 0.75 },
      position: [0, 0, -0.32],
    },
    chair: {
      size: { width: 0.6, depth: 0.6, height: 1.1 },
      position: [0, 0, 0.46],
      rotationY: Math.PI,
    },
    bookshelf: {
      size: { width: 0.8, depth: 0.3, height: 2 },
      position: [-1.64, 0, -0.92],
      rotationY: Math.PI / 2,
    },
    cabinet: {
      size: { width: 1.2, depth: 0.4, height: 0.75 },
      position: [1.58, 0, 0.18],
      rotationY: -Math.PI / 2,
    },
  },
  player: {
    height: 1.8,
    eyeHeight: 1.65,
    radius: 0.22,
    walkSpeed: 1.45,
    sprintSpeed: 2.25,
    start: [0.83, 0, 1.05],
    startYaw: 0,
  },
  cameras: {
    reference: {
      position: [-0.3, 1.46, 3.15],
      target: [0, 1.16, -0.5],
      fov: 58,
    },
    free: {
      position: [1.25, 2.15, 1.18],
      target: [0, 1.05, -0.28],
      fov: 56,
    },
    playerFov: 70,
  },
  decor: {
    laptop: [-0.37, 0.775, -0.33],
    deskLamp: {
      base: [0.43, 0.785, -0.42],
      jointOne: [0.47, 1.1, -0.43],
      jointTwo: [0.31, 1.27, -0.38],
    },
    plants: {
      desk: { position: [0.34, 0.75, -0.28], radius: 0.055, height: 0.09, leafScale: 0.07 },
      cabinet: { position: [1.36, 0.75, 0.48], radius: 0.058, height: 0.09, leafScale: 0.064 },
      hero: [-1.49, 2.02, -1.08],
    },
    frames: {
      cabinet: [1.36, 0.865, -0.12],
      wall: [1.735, 1.5, -0.73],
    },
    deskAccessories: {
      mug: [0.13, 0.805, -0.39],
      mouse: [0.12, 0.77, -0.19],
    },
    exteriorTrees: [
      [-0.38, 0.45, -2.25],
      [0, 0.35, -2.5],
      [0.38, 0.42, -2.18],
    ],
  },
  assets: {
    chair: { url: null },
    deskLamp: { url: null },
    laptop: { url: null },
    heroPlant: { url: null },
  },
};

export const ROOM_BOUNDS = {
  minX: -SCENE_CONFIG.room.width / 2,
  maxX: SCENE_CONFIG.room.width / 2,
  minZ: -SCENE_CONFIG.room.depth / 2,
  maxZ: SCENE_CONFIG.room.depth / 2,
} as const;
