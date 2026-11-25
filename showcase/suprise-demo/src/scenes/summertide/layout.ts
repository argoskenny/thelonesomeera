import { noise,smoothstep } from '../../shared/procedural';
export const shoreX=(z:number)=>-60-.00135*(z-80)**2;
const hillRise=(z:number)=>Math.min(250,Math.max(0,z+25))*.30+12*(1-Math.exp(-Math.max(0,z-225)/140));
export const roadHeight=(z:number)=>4+hillRise(z);
export function terrainHeight(x:number,z:number){
  const d=x-shoreX(z);
  for(const rz of[-150,-50,50])if(Math.abs(z-rz)<3.1&&d>=5&&d<=24)return .225+(d-5)/19*3.855;
  if(d<20)return -.5+d*.145;
  const slope=hillRise(z)*smoothstep(43,Math.max(48,-10-shoreX(z)),d);
  const hill=smoothstep(55,185,x)*(18+noise(x*.008,z*.008)*55)+smoothstep(-20,-180,z)*smoothstep(100,260,d)*(noise(x*.009,z*.007)*70);
  return 4+slope+hill+smoothstep(170,200,d)*noise(x*.15,z*.15)*2.4;
}
export const playableHeight=(x:number,z:number)=>{
  if(z< -590||z>225||x-shoreX(z)<4||x>380)return undefined;
  return terrainHeight(x,z)+.08;
};
