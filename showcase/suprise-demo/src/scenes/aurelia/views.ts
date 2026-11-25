import { Vector3 } from 'three';
import type { SceneView } from '../../shared/types';
export const views:SceneView[]=[
 {name:'紫藤拱廊',label:'紫藤拱廊 · The wisteria loggia',position:new Vector3(-32,51.7,70),target:new Vector3(48,68,-105)},
 {name:'圓頂廣場',label:'圓頂廣場 · Piazza del Duomo',position:new Vector3(-30,26.7,29),target:new Vector3(-60,57,-25)},
 {name:'跨谷長橋',label:'跨谷長橋 · The valley bridge',position:new Vector3(41,26.7,-7),target:new Vector3(152,37,-29)},
 {name:'瀑布觀景臺',label:'瀑布觀景臺 · The cascades',position:new Vector3(157,26.7,-6),target:new Vector3(70,80,-135)},
 {name:'星環庭院',label:'星環庭院 · The celestial court',position:new Vector3(94,119.7,-134),target:new Vector3(95,225,-183)},
 {name:'城塞上空',label:'城塞上空 · Above Aurelia',position:new Vector3(-100,111,112),target:new Vector3(30,102,-99)},
];
export const bounds={minX:-350,maxX:400,minZ:-500,maxZ:230,maxY:390};
