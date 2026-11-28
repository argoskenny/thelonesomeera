export type FloorPoint = [x:number,z:number];
export type DeckStrip = [startBack:FloorPoint,startFront:FloorPoint,endBack:FloorPoint,endFront:FloorPoint];

export const stageYaw = 56 * Math.PI / 180;
export const stageLengthScale = .88;
export function stagePoint(x:number,z:number,scale=stageLengthScale):FloorPoint {
  const dx=(x+1)*scale,dz=z-1.5,c=Math.cos(stageYaw),s=Math.sin(stageYaw);
  return [-1+dx*c+dz*s,1.5-dx*s+dz*c];
}

// Each end shares the edge of the adjoining deck, including the bias cut against the stage.
export const westBridge:DeckStrip=[[-12,4.45],[-12,6.35],stagePoint(-3.8,.36),stagePoint(-3.8,2.23)];
export const eastApron:DeckStrip=[stagePoint(1.8,1.1),stagePoint(1.8,4.08),[2.90,-1.0],[2.90,.65]];

export function onStrip([a,b,c,d]:DeckStrip,t:number,across:number):FloorPoint {
  const ax=a[0]+(c[0]-a[0])*t,az=a[1]+(c[1]-a[1])*t;
  const bx=b[0]+(d[0]-b[0])*t,bz=b[1]+(d[1]-b[1])*t;
  return [ax+(bx-ax)*across,az+(bz-az)*across];
}

export const eastTurn:DeckStrip=[eastApron[2],eastApron[3],[3.35,.45],[3.35,4.15]];

// Outboard of the stage toe, the landing widens before the grand stair's bottom post.
export const eastWing:DeckStrip=[eastApron[1],[2.34,4.15],eastApron[3],[2.90,4.15]];
export const eastWingTip:DeckStrip=[eastWing[2],eastWing[3],eastTurn[3],eastTurn[3]];
