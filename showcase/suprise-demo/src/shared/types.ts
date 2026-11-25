import type { Vector3 } from 'three';

export type Obstacle={x:number;z:number;w:number;d:number;h?:number;minY?:number};
export type SceneView={name:string;label:string;position:Vector3;target:Vector3};

export type WalkSurface={x:number;z:number;w:number;d:number;y:number;heightAt?:(x:number,z:number)=>number|undefined};
