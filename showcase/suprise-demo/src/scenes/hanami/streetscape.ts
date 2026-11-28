import * as T from 'three';
import { Instances, V, surface, texture, tint } from './promenade-geometry';
import { seededRandom } from '../../shared/geometry';

function gableGeometry() {
  const g = new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute([-.5,0,0,.5,0,0,0,1,0],3));
  g.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,.5,1],2));
  g.computeVertexNormals();return g;
}

function hipRoofGeometry() {
  const g=new T.BufferGeometry(), p:number[]=[], uv:number[]=[];
  const fl=V(-.5,0,.5),fr=V(.5,0,.5),bl=V(-.5,0,-.5),br=V(.5,0,-.5);
  const near=V(0,1,.24),far=V(0,1,-.24);
  function face(a:T.Vector3,b:T.Vector3,c:T.Vector3,end:boolean){
    for(const v of [a,b,c]){p.push(v.x,v.y,v.z);uv.push(end?v.x+.5:v.z+.5,v.y);}
  }
  face(fl,fr,near,true);face(br,bl,far,true);face(bl,fl,near,false);face(bl,near,far,false);
  face(fr,br,far,false);face(fr,far,near,false);
  g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  g.computeVertexNormals();return g;
}

export function addStreetscape(parent:T.Object3D, pool:Instances) {
  const rand=seededRandom(5783), edge=surface('#524e46'), stone=surface('#797b75');
  const stucco=surface('#ffffff',texture('hanami/promenade-plaster.webp')), foundation=surface('#9a9992');
  const tile=surface('#ffffff',texture('hanami/promenade-tile.webp'));
  tile.map!.repeat.set(4,3);
  const window=surface('#bfc4be',texture('summertide/window.jpg'));
  const shade=surface('#c8c0b0'), enamel=surface('#bbbcb5'), porcelain=surface('#d9d8cd');
  const rail=surface('#63615a'), timber=surface('#766654'),facades=['#c9c2b4','#e0dfd3','#b5a995','#aeb9b3','#d9cab1','#e3ddcd','#b8bbb4'];
  const roofs=['#82858a','#6c7c88','#8b7a65','#6f736b','#b3937c','#8a9897'];
  const triangle=gableGeometry(), hip=hipRoofGeometry();
  const pane=new T.PlaneGeometry(); const cords:number[]=[];
  function cable(a:T.Vector3,b:T.Vector3,sag:number) {
    let last=a;
    for(let j=1;j<=12;j++) {
      const f=j/12, p=a.clone().lerp(b,f);p.y-=4*sag*f*(1-f);
      cords.push(last.x,last.y,last.z,p.x,p.y,p.z);last=p;
    }
  }
  // Each residence has depth on all four sides, closed gables, eaves and sash windows.
  function home(x:number,y:number,z:number,w:number,d:number,floors:number,angle:number,k:number) {
    const cs=Math.cos(angle), sn=Math.sin(angle), h=floors*2.65+.22;
    const pos=(lx:number,ly:number,lz:number)=>V(x+lx*cs+lz*sn,y+ly,z-lx*sn+lz*cs);
    function box(m:T.Material,lx:number,ly:number,lz:number,width:number,height:number,depth:number,t?:T.Color,turn=0) {
      const p=pos(lx,ly,lz);pool.box(m,p.x,p.y,p.z,width,height,depth,angle+turn,t);
    }
    const wallColor=new T.Color(facades[k%facades.length]), tileColor=new T.Color(roofs[k%roofs.length]);
    box(foundation,0,.19,0,w+.16,.38,d+.16);
    box(stucco,0,h*.5+.18,0,w,h-.36,d,wallColor);
    if(floors===2) box(edge,0,2.88,0,w+.06,.09,d+.06);
    const gableHeight=w*(.20+.04*(k%3)), hw=w/2+.48, hz=d/2+.46;
    const hipped=k%4===1 || k%6===0;
    if(hipped){
      pool.add(hip,tile,x,y+h,z,hw*2,gableHeight,hz*2,angle,0,0,tileColor);
      for(const end of [-1,1])box(edge,0,h-.035,end*hz,hw*2,.19,.11);
    }
    for(const side of [-1,1]) {
      const slant=Math.atan(gableHeight/hw), roofPos=pos(side*hw*.5,h+gableHeight*.5,0);
      if(!hipped)pool.add(pool.boxGeometry,tile,roofPos.x,roofPos.y,roofPos.z,Math.hypot(hw,gableHeight),.14,hz*2,angle,0,-side*slant,tileColor);
      box(edge,side*hw,h-.035,0,.12,.20,hz*2+.1);
      const p=pos(0,h,side*d/2);
      if(!hipped)pool.add(triangle,stucco,p.x,p.y,p.z,w,gableHeight,1,angle+(side<0?Math.PI:0),0,0,wallColor);
      for (const loc of [-.27,.27]) {
        // Deep window jamb, real mullion and a metal drip sill on both gable walls.
        for(let f=0;f<floors;f++) {
          const lx=w*loc, wy=1.68+f*2.65, lz=side*(d/2+.035);
          box(edge,lx,wy,lz,1.72,1.42,.10);
          const p=pos(lx,wy,lz+side*.06);
          pool.add(pane,window,p.x,p.y,p.z,1.59,1.29,1,angle+(side<0?Math.PI:0),0,0,tint(.64+.22*rand()));
          box(rail,lx,wy,lz+side*.07,.045,1.32,.04);
          box(enamel,lx,wy-.73,lz+side*.04,1.85,.065,.16);
        }
      }
      for(let f=0;f<floors;f++) for(let j=0;j<3;j++) {
        const wx=side*(w/2+.035),wy=1.62+f*2.65,wz=(j-1)*d*.30;
        box(edge,wx,wy,wz,.11,1.38,1.57);
        const p=pos(wx+side*.06,wy,wz);
        pool.add(pane,window,p.x,p.y,p.z,1.45,1.25,1,angle+side*Math.PI*.5,0,0,tint(.67+.17*rand()));
        box(rail,wx+side*.08,wy,wz,.045,1.31,.04);
        if(j===1 && f===0 && k%3===1) box(shade,wx+side*.14,wy+.3,wz,.08,.65,1.42);
      }
    }
    box(tile,0,h+gableHeight+.07,0,.20,.16,(hipped?.96:2)*hz+.1,tileColor);
    // Timber galleries, verandas and storm shutters vary with the house plan.
    if(k%4!==0) {
      const side=x<0?1:-1, face=side*(w/2+.03), depth=k%3===0?1.32:.97;
      const roofY=floors===2&&k%3===1?2.94:2.37;
      const span=d*(k%2?.68:.85),dir=k%3===0?.09:-.06;
      const porchZ=d*dir;
      box(timber,face+side*(depth*.45),.32,porchZ,depth,.22,span);
      for(const pole of [-.45,0,.45]){
        box(timber,face+side*(depth-.08),(roofY+.2)*.5,porchZ+pole*span,.075,roofY-.23,.075);
      }
      const pp=pos(face+side*depth*.48,roofY,porchZ);
      pool.add(pool.boxGeometry,tile,pp.x,pp.y,pp.z,depth+.41,.115,span+.48,angle,0,-side*.13,tileColor);
      if(roofY>2.7){
        box(foundation,face+side*depth,roofY+.29,porchZ,.08,.55,span);
        box(rail,face+side*depth,roofY+.78,porchZ,.06,.06,span+.08);
        for (let n=0;n<=8;n++)box(rail,face+side*depth,roofY+.56,porchZ+span*(n/8-.5),.035,.39,.035);
      }
      if(k%3!==1){
        const screen=face+side*.072;
        for(const m of [-1,1]){
          box(timber,screen,1.37,porchZ+m*span*.39,.09,1.8,.68);
          for(let j=0;j<6;j++)box(edge,screen+side*.054,.65+j*.24,porchZ+m*span*.39,.025,.028,.66);
        }
      }
    }
    if(k%5===4) {
      const shedX=w*.43, shedZ=d*.58;
      box(stucco,shedX,1.04,shedZ,2.40,2.08,2.03,wallColor);
      box(tile,shedX,2.14,shedZ,2.66,.16,2.29,tileColor);
    }
    // A sheltered timber entrance and small external air-conditioning units.
    box(edge,-w*.5-.08,1.08,.09,.17,2.05,.88);
    box(tile,-w*.5-.60,2.31,0,1.45,.12,2,tileColor);
    box(enamel,-w*.5-.24,.52,-d*.40,.43,.58,.81);
    box(stone,-w*.5-.49,.52,-d*.40,.03,.42,.57);
    const down=pos(-w*.5-.16,0,d*.47);pool.rod(enamel,down,down.clone().add(V(0,h,0)),.08);
    if(k%3===1) {
      const p=pos(w*.28,h+gableHeight*.54,d*.27);
      pool.rod(rail,p,p.clone().add(V(0,2.10,0)),.042);
      for(let n=0;n<4;n++) pool.rod(rail,p.clone().add(V(-.42,1.63,n*.17)),p.clone().add(V(.42,1.63,n*.17)),.026);
    }
  }
  let k=0;
  for(let z=-184;z<=105;z+=16+rand()*6){
    home(24.5+rand()*10,-1.9,z,6.2+rand()*2.7,7.6+rand()*2.7,rand()>.45?2:1,(k%3===0?Math.PI/2:0)+rand()*.43-.215,k++);
    if(k%2===0) home(43+rand()*12,-1.8,z-4,8.3,7.2,2,rand()*.6-.3,k++);
  }
  for(let z=-168;z<=100;z+=25+rand()*12)
    home(-38-rand()*13,-1.55,z,5.8+rand()*4.1,6.4+rand()*5.2,rand()<.39?2:1,(k%3===1?Math.PI/2:0)+rand()*.76-.34,k++);
  // Reinforced concrete distribution poles with crossarms, ceramic insulator sheds,
  // transformer cans, step bolts and gently suspended conductors.
  const poleXs=[11.7,10.9,12.1,10.4,11.4,10.0,12.4,11.1,12.2];
  let lastPole:T.Vector3|null=null;
  poleXs.forEach((x,i)=>{
    const z=i===5?-14:-172+i*34.8, base=-.79, h=9.4+(i%3)*.28, top=base+h;
    pool.add(pool.poleGeometry,enamel,x,base+h*.5,z,.36,h,.36);
    pool.box(rail,x,top-.64,z,2.1,.11,.12);
    pool.box(rail,x,top-1.32,z,.13,.10,1.36);
    pool.rod(rail,V(x,top-1.32,z),V(x-.85,top-.62,z),.055);
    for(const dx of [-.90,0,.90]) {
      pool.rod(rail,V(x+dx,top-.64,z),V(x+dx,top-.13,z),.055);
      for(let j=0;j<3;j++) pool.add(pool.pipeGeometry,porcelain,x+dx,top-.22-j*.09,z,.18-j*.015,.055,.18-j*.015);
      if(lastPole) cable(V(lastPole.x+dx,lastPole.y-.12,lastPole.z),V(x+dx,top-.12,z),.58);
    }
    if (lastPole) {
      cable(V(lastPole.x,lastPole.y-2.17,lastPole.z),V(x,top-2.17,z),.71);
      if(i%2===0) cable(V(x,top-2,z),V(-35,4.5,z-18),.76);
    }
    for(let j=0;j<8;j++) pool.box(rail,x+(j%2?.18:-.18),top-2.4-j*.45,z,.22,.034,.06);
    if(i%2) {
      pool.add(pool.pipeGeometry,stone,x+.48,top-1.85,z,.53,.83,.53);
      pool.add(pool.pipeGeometry,enamel,x+.48,top-1.4,z,.59,.065,.59);
    }
    if(i===5){
      // The lateral feeder crosses the river to the hamlet on the opposite bank.
      const farX=-37.3, farZ=-39, farTop=6.95;
      pool.add(pool.poleGeometry,enamel,farX,(farTop-1.6)*.5,farZ,.28,farTop+1.6,.28);
      pool.box(rail,farX,farTop-.31,farZ,.13,.13,1.29);
      for(let j=0;j<3;j++){
        const dz=(j-1)*.48;
        cable(V(x,top-.72+j*.10,z+dz),V(farX,farTop-.11,farZ+dz),.72+.13*j);
      }
    }
    lastPole=V(x,top,z);
  });
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(cords,3));
  const cables=new T.LineSegments(g,new T.LineBasicMaterial({color:'#514c49',transparent:true,opacity:.74}));
  parent.add(cables);
}
