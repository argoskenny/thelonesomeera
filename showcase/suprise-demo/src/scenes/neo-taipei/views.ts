import { Vector3 } from 'three';
import type { SceneView } from '../../shared/types';
export const views:SceneView[]=[
 {name:'雨夜露臺',label:'雨夜露臺 · Midnight balcony',position:new Vector3(-34,62.7,73),target:new Vector3(38,102,-240)},
 {name:'深夜食堂',label:'深夜食堂 · The last bowl',position:new Vector3(-43.5,61.7,75),target:new Vector3(-48,62.2,68)},
 {name:'環城高架',label:'環城高架 · Orbital express',position:new Vector3(10,48.7,0),target:new Vector3(72,113,-160)},
 {name:'櫻花花園',label:'櫻花花園 · Memory garden',position:new Vector3(155,51.7,-105),target:new Vector3(-30,100,-100)},
 {name:'晶核城塞',label:'晶核城塞 · The neural citadel',position:new Vector3(151,131.7,-274),target:new Vector3(135,228,-307)},
 {name:'鯨游之境',label:'鯨游之境 · Between the tides',position:new Vector3(125,112,-20),target:new Vector3(65,103,-100)},
];
export const bounds={minX:-330,maxX:370,minZ:-610,maxZ:160,maxY:440};
