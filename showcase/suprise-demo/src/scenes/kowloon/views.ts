import { Vector3 } from 'three';
import type { SceneView } from '../../shared/types';
export const views:SceneView[]=[
 {name:'茶餐廳露臺',label:'茶餐廳露臺 · The tea-room balcony',position:new Vector3(-12,29.7,23.6),target:new Vector3(-5,45,-45)},
 {name:'一盞奶茶',label:'一盞奶茶 · A table for one',position:new Vector3(-17,29.7,10.8),target:new Vector3(-23,29.8,6.5)},
 {name:'連城天橋',label:'連城天橋 · Across the courtyard',position:new Vector3(0,29.7,-18),target:new Vector3(12,36,-48)},
 {name:'祥興冰室',label:'祥興冰室 · The ice-room landing',position:new Vector3(10,43.7,5),target:new Vector3(-13,36,-18)},
 {name:'天井微光',label:'天井微光 · A little borrowed light',position:new Vector3(14,57.7,-32),target:new Vector3(-3,90,-62)},
 {name:'樓城上空',label:'樓城上空 · Above the rooftops',position:new Vector3(4,118,40),target:new Vector3(1,61,-52)},
];
export const bounds={minX:-83,maxX:90,minZ:-170,maxZ:85,maxY:150};
