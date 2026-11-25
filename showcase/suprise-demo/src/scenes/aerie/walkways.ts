/** Solid rail spans shared by the visible balustrade and its collision barriers. */
export function railSpans(length:number,gaps:readonly (readonly number[])[]=[]):[number,number][]{
  const half=length/2,spans:[number,number][]=[];let cursor=-half;
  const ordered=gaps.map(([a,b])=>[Math.max(-half,Math.min(a,b)),Math.min(half,Math.max(a,b))]).filter(([a,b])=>b>a).sort((a,b)=>a[0]-b[0]);
  for(const [a,b]of ordered){if(a>cursor)spans.push([cursor,a]);cursor=Math.max(cursor,b);}
  if(cursor<half)spans.push([cursor,half]);return spans;
}
