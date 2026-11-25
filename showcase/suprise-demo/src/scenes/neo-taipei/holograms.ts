import * as T from 'three';
import { GeometryBatch,vec } from '../../shared/geometry';
import type { Materials } from './materials';
export function createHolograms(scene:T.Scene,m:Materials){
 const root=new T.Group();scene.add(root);const time={value:0};
 const mat=new T.ShaderMaterial({uniforms:{time},transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,vertexShader:`uniform float time;varying vec2 vUv;varying vec3 vNormal;varying vec3 vView;varying vec3 vLocal;void main(){vUv=uv;vLocal=position;vec3 p=position;p.y+=sin(time*1.2+p.x*.18)*pow(smoothstep(-8.,16.,p.x),2.)*1.4;vec4 mv=modelViewMatrix*vec4(p,1.);vNormal=normalize(normalMatrix*normal);vView=-mv.xyz;gl_Position=projectionMatrix*mv;}`,fragmentShader:`uniform float time;varying vec2 vUv;varying vec3 vNormal;varying vec3 vView;varying vec3 vLocal;void main(){float fres=pow(1.-abs(dot(normalize(vNormal),normalize(vView))),2.);vec2 cell=vec2(vLocal.x,vLocal.z+vLocal.y)*2.5;vec2 grid=abs(fract(cell)-.5)/max(fwidth(cell),vec2(.01));float line=1.-min(min(grid.x,grid.y),1.);float scan=.5+.5*sin(vUv.y*360.-time*4.);gl_FragColor=vec4(vec3(.06,.38,1.1)*(1.+fres*.8),(.04+fres*.32+line*.12)*(.7+scan*.3));
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 function whale(){const g=new T.Group(),b=new GeometryBatch(),p:number[]=[],uv:number[]=[],ix:number[]=[];
 for(let i=0;i<=90;i++)for(let j=0;j<=40;j++){const t=i/90,a=j/40*Math.PI*2,r=Math.pow(Math.sin(t*Math.PI),.7)*(3.4-2.5*t)+.035;p.push(-15+t*30,Math.sin(a)*r*.8,Math.cos(a)*r);uv.push(t,j/40);if(i&&j){const k=i*41+j;ix.push(k,k-1,k-41,k-1,k-42,k-41);}}
 const body=new T.BufferGeometry();body.setAttribute('position',new T.Float32BufferAttribute(p,3));body.setAttribute('uv',new T.Float32BufferAttribute(uv,2));body.setIndex(ix);body.computeVertexNormals();b.add(body,mat);
 function fin(points:number[][],thickness:number){const shape=new T.Shape();shape.moveTo(points[0][0],points[0][1]);for(let i=1;i<=points.length;i++){const q=points[i%points.length],next=points[(i+1)%points.length];shape.quadraticCurveTo(q[0],q[1],(q[0]+next[0])*.5,(q[1]+next[1])*.5);}shape.closePath();const geom=new T.ExtrudeGeometry(shape,{depth:thickness,bevelEnabled:true,bevelSize:.12,bevelThickness:.08,bevelSegments:2,steps:1});return geom;}
 for(const side of[-1,1]){const f=fin([[-7,0],[-3,1],[6,7],[4,8],[-4,4]],.13);f.scale(1,side,1);f.rotateX(Math.PI/2);b.add(f,mat,0,-1,side*1.4);const tail=fin([[12,0],[13,3],[16,8],[18,7],[17,3],[15,0]],.12);tail.scale(1,side,1);tail.rotateX(Math.PI/2);b.add(tail,mat);}
 const dorsal=fin([[1,1.5],[4,5],[6,1.3]],.2);b.add(dorsal,mat,0,0,-.1);
 for(const s of[-1,1]){b.sphere(.13,-11,.5,s*1.8,m.cyan);for(let i=0;i<5;i++)b.tube([vec(-13,-.35,s*(.6+i*.19)),vec(-8,-1.6,s*(.7+i*.2)),vec(-1,-1.5,s*(.8+i*.19))],.018,mat,30);}
 b.flush(g);root.add(g);return g;}
 const whales=[whale(),whale(),whale()];whales[0].scale.setScalar(1.65);whales[1].scale.setScalar(.65);whales[2].scale.setScalar(.25);
 const rings=new T.Group();rings.position.set(135,322,-307);root.add(rings);const lineMat=new T.MeshBasicMaterial({color:new T.Color(3.8,.7,3.1),transparent:true,opacity:.9,depthWrite:false});
 const ringBatch=new GeometryBatch();
 for(let j=0;j<3;j++){ringBatch.torus(34+j*17,.2,0,j*10,0,lineMat,new T.Euler(Math.PI/2,0,0),180);ringBatch.torus(32+j*17,.04,0,j*10,0,lineMat,new T.Euler(Math.PI/2,0,0),160);for(let k=0;k<64;k++){const a=k/64*Math.PI*2;ringBatch.box(.09,.08,k%4===0?2:.65,Math.cos(a)*(34+j*17),j*10,Math.sin(a)*(34+j*17),lineMat,0,new T.Euler(0,-a+Math.PI/2,0));}}ringBatch.flush(rings);

 const beam=new T.Mesh(new T.CylinderGeometry(.35,.9,220,16,1,true),new T.MeshBasicMaterial({color:new T.Color(2,.3,3),transparent:true,opacity:.52,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide}));beam.position.set(135,365,-307);root.add(beam);
 return{root,update(t:number){time.value=t;whales.forEach((w,i)=>{w.position.set(60+i*27+Math.sin(t*.035+i)*16,100+i*16+Math.sin(t*.16+i)*2.2,-95-i*49+Math.cos(t*.035+i)*12);w.rotation.y=-.2+Math.sin(t*.035+i)*.2;w.rotation.z=Math.sin(t*.15+i)*.025;});rings.rotation.y=t*.018;}};
}
