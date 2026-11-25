// One wave definition drives mesh displacement, shading and rock impact timing.
const components=[
  {x:.84,z:.54,length:17,amplitude:1.05,phase:.3,steepness:.54},
  {x:-.94,z:.34,length:11,amplitude:.57,phase:2.1,steepness:.45},
  {x:.23,z:.973,length:6.2,amplitude:.26,phase:1.4,steepness:.34},
  {x:-.44,z:.898,length:3.1,amplitude:.10,phase:3.9,steepness:.25},
].map(w=>{const length=Math.hypot(w.x,w.z),k=2*Math.PI/w.length;return {...w,x:w.x/length,z:w.z/length,k,omega:Math.sqrt(9.81*k)};});
const f=(n:number)=>n.toFixed(8);
export const waveGLSL=`
  uniform float uSwellTime;
  void swellComponent(vec2 p,vec2 dir,float k,float amplitude,float omega,float phase,float q,inout vec3 d,inout vec3 tx,inout vec3 tz){
    float theta=k*dot(dir,p)-omega*uSwellTime+phase,s=sin(theta),c=cos(theta),ak=amplitude*k;
    d+=vec3(q*amplitude*dir.x*c,amplitude*s,q*amplitude*dir.y*c);
    tx+=vec3(-q*ak*dir.x*dir.x*s,ak*dir.x*c,-q*ak*dir.x*dir.y*s);
    tz+=vec3(-q*ak*dir.x*dir.y*s,ak*dir.y*c,-q*ak*dir.y*dir.y*s);
  }
  void swell(vec2 p,out vec3 d,out vec3 n){
    d=vec3(0.);vec3 tx=vec3(1.,0.,0.),tz=vec3(0.,0.,1.);
    ${components.map(w=>`swellComponent(p,vec2(${f(w.x)},${f(w.z)}),${f(w.k)},${f(w.amplitude)},${f(w.omega)},${f(w.phase)},${f(w.steepness)},d,tx,tz);`).join('\n')}
    n=normalize(cross(tz,tx));
  }
`;
export function waveHeight(x:number,z:number,time:number){
  // Invert the horizontal Gerstner displacement to sample a fixed shoreline position.
  let px=x,pz=z;
  for(let i=0;i<2;i++){let dx=0,dz=0;for(const w of components){const c=Math.cos(w.k*(w.x*px+w.z*pz)-w.omega*time+w.phase)*w.steepness*w.amplitude;dx+=w.x*c;dz+=w.z*c;}px=x-dx;pz=z-dz;}
  let y=.05;for(const w of components)y+=w.amplitude*Math.sin(w.k*(w.x*px+w.z*pz)-w.omega*time+w.phase);return y;
}
