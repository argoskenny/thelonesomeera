import { vec } from '../../shared/geometry';
export const consolePosition=vec(-36,0,54);
export const views=[
  {name:'GOLDEN HOUR',label:'夕照全景 · Golden hour',position:vec(110,64,215),target:vec(-30,70,0)},
  {name:'GROUND CONTROL',label:'地面控制台 · Ground control',position:vec(-35,1.7,58),target:vec(-35.7,1.2,54)},
  {name:'LIFTOFF',label:'發射觀景點 · Liftoff',position:vec(-85,24,160),target:vec(4,68,0)},
  {name:'TANK FARM',label:'低溫儲槽區 · Tank farm',position:vec(110,1.7,50),target:vec(60,18,-20)},
  {name:'TOWER DECK',label:'塔頂平台 · Tower deck',position:vec(25,144.7,5),target:vec(-6,101,0)},
];
export const bounds={minX:-155,maxX:155,minZ:-105,maxZ:165,maxY:600};
