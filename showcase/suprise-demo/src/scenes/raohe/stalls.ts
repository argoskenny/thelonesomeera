import * as THREE from 'three';
import { seededRandom } from '../../shared/geometry';
import { StallGeometry, type Grid, type Point } from './stall-geometry';
import { stockCounter } from './stall-food';

const signGrid:Grid=[4,6], surfaceGrid:Grid=[4,4];
const aluminum=0xb9bdb4, warmSteel=0xa39782, frame=0x6c6a5d, rubber=0x292722;
const clothColors=[0x448b88,0x875987,0xa9533e,0x908257,0x486d76,0x96633b,0xb95a3b];
const leftVendors=[12,0,1,3,5,8,7,4,14,6,19,15,11,18,2,20,13,17,10,22,21,23,16,9,3,1];
const rightVendors=[16,2,8,4,12,15,3,9,18,20,6,22,7,21,23,10,0,11,14,13,5,19,1,17,3,2];

function awning(g:StallGeometry,width:number,mount:number,cloth:number,phase:number,drop:number) {
  const height=mount+drop-.115, pitch=.43+.17*Math.sin(phase),sag=.075+.022*Math.sin(phase*4);
  const half=width/2+.035, frontZ=1.31,backZ=-1.39,seams=18,strips=4;
  const top=(k:number,j:number):Point=>{
    const u=k/seams,v=j/strips;
    const fold=(.015*Math.cos(u*Math.PI*16+phase)+.009*Math.sin(u*31+v*3+phase))*(.6+.4*v);
    return [(u*2-1)*half,height+pitch*(1-v)-sag*Math.sin(v*Math.PI)+fold,backZ+(frontZ-backZ)*v];
  };
  for(let k=0;k<seams;k++) {
    for(let j=0;j<strips;j++) {
      g.panel(g.canvas,[top(k,j),top(k,j+1),top(k+1,j+1),top(k+1,j)],0,[1,1],cloth,[k/seams,j/strips,1/seams,1/strips]);
    }
  }
  const scallops=7, steps=scallops*7;
  const edge=(i:number,lower:boolean,trim=false):Point=>{
    const u=i/steps;
    const y=height+.018*Math.cos(u*Math.PI*14+phase)-.018*Math.sin(u*Math.PI+phase);
    const ripple=(lower?.037:.012)*Math.sin(u*Math.PI*2*scallops+phase);
    // Little arched cut-outs separate the weighted scallops. The fabric bags out between its ties.
    const cutout=.104*Math.pow(Math.abs(Math.cos(u*Math.PI*scallops)),5.5);
    const hem=drop-cutout+.014*Math.sin(phase+u*21);
    return [(u*2-1)*half,y-(lower?hem:0)+(trim?.012:0),frontZ+(lower?.035:0)+ripple+(trim?.002:0)];
  };
  for(let i=0;i<steps;i++) {
    g.panel(g.valance,[edge(i,false),edge(i,true),edge(i+1,true),edge(i+1,false)],0,[1,1],cloth,[i/steps,0,1/steps,1]);
    g.panel(g.canvas,[edge(i,true,true),edge(i,true),edge(i+1,true),edge(i+1,true,true)],0,[1,1],0xd7ad67);
  }
  g.beam(g.metal,0xc9b181,[-half,height+.012,1.325],[half,height+.012,1.325],.034,.034,true);
  g.beam(g.metal,warmSteel,[-half,height-.025,1.29],[half,height-.025,1.29],.044,.044,true);
  for(const x of [-half+.07,half-.07]){
    g.beam(g.metal,frame,[x,height-.01,1.28],[x,height+pitch,-1.38],.033);
    g.beam(g.metal,warmSteel,[x,mount-.11,-1.15],[x,height+pitch,-1.15],.044);
    g.beam(g.metal,warmSteel,[x,mount-.13,.86],[x,height-.05,1.28],.034);
    g.beam(g.metal,frame,[x,height-.02,1.21],[x,height-.51,-.04],.025);
    g.beam(g.metal,frame,[x,height-.50,-.04],[x,height+.16,-.26],.025);
  }
}

function lightbox(g:StallGeometry,width:number,height:number,sign:number,side:number) {
  const tall=sign===0||sign===2;
  const h=tall?.67:.49+(sign%4)*.035;
  const y=height-h*.5-.14,z=1.125+(sign%3)*.018,depth=.39+(sign%3)*.066,w=width-.17-(sign%4===3?.18:0);
  const {metal,imageSign,imageLabel}=g;
  g.box(metal,frame,0,y,z-depth/2,w,h+.062,depth);
  g.front(imageSign,sign,signGrid,0,y,z+.001,w-.084,h-.043);
  // The return toward approaching customers carries an illuminated dish photograph.
  for(const end of [-1,1]) {
    const x=end*(w/2+.001), far=z-depth+.018, near=z-.018;
    const a=end===1?near:far,b=end===1?far:near;
    const cell=sign===1?1:sign===0?0:sign===2?3:sign%5===0?0:sign%3===0?1:13;
    g.panel(imageLabel,[[x,y+h*.47,a],[x,y-h*.47,a],[x,y-h*.47,b],[x,y+h*.47,b]],cell,surfaceGrid);
    g.box(metal,aluminum,end*w/2,y,z+.012,.022,h+.04,.029);
    for(const yy of [y-h/2+.035,y+h/2-.035]) {
      g.solid(g.ballShape,metal,rubber,[end*(w/2-.032),yy,z+.021],[.018,.018,.009]);
    }
  }
  for(const yy of [y-(h+.015)/2,y+(h+.015)/2])g.box(metal,aluminum,0,yy,z+.011,w+.027,.030,.031);
  for(const px of [-w*.35,w*.35])g.box(metal,frame,px,height-.122,z-.15,.023,.25,.026);
  // Most bays carry a tube in an aluminum channel under their header.
  const tubeWidth=w*.63,dx=side*.12;
  g.box(metal,0x81765f,dx,y-h*.5-.034,z-.14,tubeWidth+.12,.042,.14);
  g.beam(g.lamp,sign%5===0?0xfff8e8:0xffdcab,[dx-tubeWidth*.5,y-h*.5-.067,z-.097],[dx+tubeWidth*.5,y-h*.5-.067,z-.097],.035,.035,true);
  for(const end of [-1,1])g.box(metal,frame,dx+end*tubeWidth*.5,y-h*.5-.058,z-.098,.056,.041,.044);
}

function bareBulb(g:StallGeometry,x:number,z:number,ceiling:number,drop:number) {
  const y=ceiling-drop;
  g.beam(g.enamel,rubber,[x+.031,ceiling,z-.015],[x,y+.11,z],.013,.013,true);
  g.solid(g.rodShape,g.enamel,0xccbc9a,[x,y+.091,z],[.066,.079,.066]);
  g.solid(g.cupShape,g.lamp,0xffe6c4,[x,y+.026,z],[.102,.089,.102],Math.PI);
  g.solid(g.ballShape,g.lamp,0xffecdd,[x,y-.015,z],[.128,.125,.128]);
}

function cart(g:StallGeometry,w:number,height:number,sign:number,id:number,near:boolean,rand:()=>number) {
  const {boxShape,metal,enamel}=g;
  const half=w/2-.11,top=1.1,frontZ=1.13,rearZ=.18;
  const shellColor=[0x777775,0x82776b,0x9b895d,0x83776c][id%4];
  g.box(metal,shellColor,0,.63,(frontZ+rearZ)/2,half*2,.83,frontZ-rearZ);
  g.box(metal,0xb8b4a4,0,1.067,.67,half*2+.067,.066,1.035);
  g.box(metal,aluminum,0,.227,.66,half*2+.012,.053,.95);
  g.front(g.sheet,sign%3===0?2:10,surfaceGrid,0,.635,frontZ+.003,half*2-.028,.783);
  for(const end of [-1,1]){
    const px=end*(half+.003),a=end===1?frontZ:rearZ,b=end===1?rearZ:frontZ;
    g.panel(g.sheet,[[px,1.02,a],[px,.235,a],[px,.235,b],[px,1.02,b]],sign%3?10:2,surfaceGrid,0xacaea1);
  }
  g.panel(g.sheet,[[-half,1.101,.19],[-half,1.101,1.185],[half,1.101,1.185],[half,1.101,.19]],10,surfaceGrid,0xd8d4cb);
  g.box(metal,aluminum,0,1.04,1.193,half*2+.067,.036,.027);
  g.box(metal,frame,0,.515,frontZ+.009,half*2,.013,.012);
  for(const x of [-half+.05,-half*.31,half*.34,half-.05]){
    g.box(metal,frame,x,.632,frontZ+.013,.019,.792,.015);
    if(near)for(const y of [.29,.965])g.solid(g.ballShape,metal,0xd6c0a2,[x,y,frontZ+.021],[.018,.018,.009]);
  }
  if(sign===1||sign===8||sign===5) {
    // Painted end doors, menu stickers and service panels give each cart a different silhouette.
    const end=sign===1?-1:1,px=end*(half+.013),a=end===1?frontZ:rearZ,b=end===1?rearZ:frontZ;
    g.box(enamel,sign===8?0x942c21:0xdba52b,px,.652,.665,.036,.766,.923);
    g.panel(g.imageLabel,[[px+end*.019,.865,a*.72+b*.28],[px+end*.019,.51,a*.72+b*.28],[px+end*.019,.51,a*.28+b*.72],[px+end*.019,.865,a*.28+b*.72]],sign===1?8:4,surfaceGrid);
    if(sign===1)g.front(g.imageLabel,1,surfaceGrid,half*.62,.625,frontZ+.020,.47,.64);
  }
  if(id%3===0||sign===2){
    const px=(id%2?1:-1)*half*.63,wid=.54;
    g.front(g.imageLabel,sign===1?8:sign===2?4:13,surfaceGrid,px,.63,frontZ+.025,wid,.60);
  } else{
    for(let j=0;j<5;j++)g.box(metal,rubber,-half*.67,.31+j*.033,frontZ+.017,.31,.012,.008);
    for(const x of [-half*.45,half*.29])g.box(metal,aluminum,x,.917,frontZ+.032,.19,.018,.054);
  }
  for(const x of [-half+.15,half-.15])for(const zz of [.275,1.01]) {
    g.box(metal,frame,x,.176,zz,.081,.121,.1);
    g.solid(g.rodShape,enamel,rubber,[x,.104,zz],[.166,.075,.166],Math.PI/2,0,0);
    g.solid(g.rodShape,metal,frame,[x,.105,zz+.041],[.062,.017,.062],Math.PI/2,0,0);
  }
  // Thin steel extrusions, individual side glazing and a sneeze guard over the food.
  for(const x of [-half+.04,half-.04]) {
    for(const z of [frontZ-.023,rearZ+.19]){
      g.box(metal,aluminum,x,(top+height-.19)/2,z,.038,height-.19-top,.038);
    }
    g.box(metal,warmSteel,x,1.56,(frontZ+rearZ+.19)/2,.024,.032,frontZ-rearZ-.19);
    if(near)g.solid(boxShape,g.glass,0xffffff,[x,1.70,.75],[.008,1.15,.71]);
    g.box(metal,frame,x,.70,.60,.032,.77,.029);
  }
  if(id%3!==0) {
    g.box(metal,aluminum,0,1.5,frontZ-.009,half*2,.025,.032);
    g.solid(boxShape,g.glass,0xffffff,[0,1.306,frontZ-.009],[half*2-.10,.366,.008]);
  }
  if(near&&sign%3!==0){
    const x=(id%2===0?1:-1)*(half-.23);
    g.beam(enamel,rubber,[x,height-.7,1.06],[x,1.958,1.06],.009,.009,true);
    g.front(g.imageLabel,sign===1?8:7,surfaceGrid,x,1.815,1.064,.182,.284);
  }
  stockCounter(g,sign,rand,near);
}

function backCounter(g:StallGeometry,w:number,h:number,id:number,sign:number,near:boolean,rand:()=>number){
  const half=w/2-.09;
  g.box(g.metal,0x615e52,0,.90,-.83,w-.17,.064,.79);
  // A deep independent back wall and returns sit behind the counter and open glazing.
  const backingTop=h-.34,backingBase=.78,backingHeight=backingTop-backingBase;
  const wallZ=-1.191;
  g.box(g.metal,0x403c36,0,backingBase+backingHeight/2,wallZ-.035,w-.15,backingHeight,.055);
  const kitchen=sign===0||sign===9?0:sign===1||sign===11?1:sign===2||sign===8?2:3+sign%3;
  g.front(g.kitchenMap,kitchen,[3,2],0,backingBase+backingHeight/2,wallZ,w-.16,backingHeight);
  for(const end of [-1,1]) {
    const px=end*(half-.024),depth=.53,top=backingTop;
    g.box(g.metal,0x585449,px,1.43,wallZ+depth/2,.022,1.23,depth);
    const a=end===-1?wallZ+depth:wallZ,b=end===-1?wallZ:wallZ+depth;
    g.panel(g.sheet,[[px-end*.013,top-.24,a],[px-end*.013,1.0,a],[px-end*.013,1.0,b],[px-end*.013,top-.24,b]],id%2?2:10,surfaceGrid,0x848783);
  }
  for(const x of [-half+.055,half-.055]) {
    g.box(g.metal,frame,x,h/2,-1.15,.048,h,.048);
    g.box(g.metal,frame,x,.44,-.48,.037,.86,.037);
  }
  const shelfY=1.74+(sign%4)*.07;
  const shelfCenter=(id%3-1)*.31,shelfWidth=w*(.36+(sign%4)*.068);
  g.box(g.metal,warmSteel,shelfCenter,shelfY,-1.025,shelfWidth,.03,.31);
  const jars=near?3+sign%3:2;
  for(let i=0;i<jars;i++){
    const px=shelfCenter+(i/(jars-1)-.5)*(shelfWidth-.27),y=shelfY+.02,height=.13+rand()*.16;
    g.solid(g.rodShape,g.glazed,[0x846347,0x926836,0xb5a886,0x873d25,0xa89773][(i+id)%5],[px,y+height*.5,-1.01],[.12+rand()*.06,height,.13]);
    g.solid(g.rodShape,g.enamel,i%2?0xa5987c:0x8a3f2d,[px,y+height+.011,-1.01],[.126,.025,.133]);
    if(near)g.front(g.imageLabel,i%2?9:7,surfaceGrid,px,y+height*.47,-.940,.093,height*.51);
  }
  if(near||id%2===0){
    const px=(id%2?.73:-.73);
    g.box(g.enamel,id%3?0x74674d:0x92583a,px,.32,-.55,.49,.56,.48);
    g.box(g.enamel,0x513f30,px,.45,-.296,.165,.037,.01);
    g.solid(g.cupShape,g.enamel,id%2?0x8a5542:0x747971,[-px*.6,.30,-.72],[.42,.5,.42]);
    g.solid(g.ringShape,g.metal,frame,[-px*.6,.547,-.72],[.43,.17,.43]);
    g.solid(g.rodShape,g.metal,warmSteel,[-px*.32,1.11,-.68],[.39,.34,.39]);
    g.solid(g.ballShape,g.metal,aluminum,[-px*.32,1.292,-.68],[.39,.07,.39]);
  }
}

export function buildStalls(scene:THREE.Scene):void {
  const g=new StallGeometry(),rand=seededRandom(17684);
  const root=new THREE.Group();
  root.name='Raohe market carts and canvas awnings';
  for(const side of [-1,1]) {
    const vendors=side<0?leftVendors:rightVendors;
    let start=9.23;
    for(let id=0;start>-74;id++){
      // Leave a transverse aisle under the gate and another between the middle blocks.
      if(start< -7.4 && start> -10.82)start=-10.82;
      if(start<-39&&start>-40.35)start=-40.35;
      const span=3.18+(rand()-.5)*.31;
      let end=Math.max(start-span,-74.7);
      if(start> -7.4 && end< -7.4) {
        end=-7.4;
        if(start-end<2.4){start=-10.82;id--;continue;}
      }
      if(start-end<2.4)break;
      const sign=vendors[id%vendors.length];
      const z=(start+end)/2;
      const center=4.00+rand()*.11;
      g.locate(side*center,z,-side*Math.PI/2+(rand()-.5)*.039);
      const h=2.94+.25*rand()+(id%6===3?.13:0);
      const near=z>-22;
      const cloth=id<3?(side===-1?(id<2?clothColors[0]:0x50777c):(id<2?0xc95a43:0xb58243)):clothColors[(id*3+(side+1)*2)%clothColors.length];
      const valanceDrop=id<2?.59+(id===0?.08:0):.305+.17*rand();
      awning(g,start-end-.04,h,cloth,rand()*2,valanceDrop);
      cart(g,start-end-.10,h,sign,id+(side+1)*3,near,rand);
      backCounter(g,start-end-.12,h+.38,id,sign,near,rand);
      lightbox(g,start-end-.10,h,sign,side);
      const lampX=(side===-1?.82:-.79)+(rand()-.5)*.13;
      bareBulb(g,lampX,.72,h-.12,.63+rand()*.12);
      if(id%3!==1)bareBulb(g,-lampX,.13,h-.11,.60+rand()*.13);
      start=end-.10-(id%7===3?.13:0);
    }
  }
  g.flush(root);scene.add(root);
}
