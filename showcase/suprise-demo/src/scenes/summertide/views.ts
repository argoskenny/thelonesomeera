import { Vector3 } from 'three';
import type { SceneView } from '../../shared/types';
import { shoreX,roadHeight } from './layout';
export const views:SceneView[]=[
 {name:'山坡公路',label:'山坡公路 · The descent',position:new Vector3(-1.5,roadHeight(155)+1.78,155),target:new Vector3(-24,17,-56)},
 {name:'海風街角',label:'海風街角 · Seaside café',position:new Vector3(shoreX(-61)+34,5.8,-48),target:new Vector3(shoreX(-61)+50,6,-68)},
 {name:'夏日沙灘',label:'夏日沙灘 · At the waterline',position:new Vector3(shoreX(20)+10,2.73,20),target:new Vector3(shoreX(20)-30,1,-45)},
 {name:'潮汐棧橋',label:'潮汐棧橋 · Breakwater',position:new Vector3(shoreX(-150)-13,5.85,-150),target:new Vector3(-80,16,70)},
 {name:'海濱大道',label:'海濱大道 · The promenade',position:new Vector3(shoreX(-270)+27,5.78,-270),target:new Vector3(shoreX(-350)+28,5,-350)},
 {name:'海灣全景',label:'海灣全景 · Above the bay',position:new Vector3(-230,150,200),target:new Vector3(-40,8,-185)},
];
export const bounds={minX:-1450,maxX:430,minZ:-850,maxZ:260,maxY:400};
