import type { WalkSurface } from '../../shared/types';

export const bridgeZ = -103.2;
export const deckHeight = .19;
export const treadDepth = .36;
export const steps = 10;
export const westBank = -1.56;
export const stairTop = (i:number) => deckHeight + (westBank-deckHeight)*(i+1)/steps;

export const walkable: WalkSurface[] = [
  {x:.02,z:-37.5,w:7.14,d:145,y:0},
  {x:-16.7,z:bridgeZ,w:26.6,d:1.94,y:deckHeight},
  ...Array.from({length:steps},(_,i)=>({
    x:-30-(i+.5)*treadDepth,z:bridgeZ,w:treadDepth,d:1.94,y:stairTop(i),
  })),
  {x:-35.1,z:bridgeZ,w:3.0,d:2.3,y:westBank},
];
