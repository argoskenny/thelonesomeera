/** Stair treads join the terrace and plaza with no unsupported gaps. */
export function stairFlight(from:number,to:number,startZ:number,endZ:number,width:number,x:number){
  const count=Math.ceil(Math.abs(to-from)/.3),depth=Math.abs(endZ-startZ)/count;
  return Array.from({length:count},(_,i)=>({x,z:startZ+(endZ-startZ)*(i+.5)/count,w:width,d:depth+.025,y:from+(to-from)*(i+1)/count}));
}
export function openSpans(start:number,end:number,gaps:readonly (readonly [number,number])[]=[]){
  let cursor=start;const spans:[number,number][]=[];
  for(const [a,b] of gaps.map(([a,b])=>[Math.max(start,a),Math.min(end,b)]).filter(([a,b])=>b>a).sort((a,b)=>a[0]-b[0])){if(a>cursor)spans.push([cursor,a]);cursor=Math.max(cursor,b);}
  if(cursor<end)spans.push([cursor,end]);return spans;
}
