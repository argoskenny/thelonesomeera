import { StallGeometry, type Point } from './stall-geometry';

const chrome=0xbcc3ba, steel=0x7d807c, black=0x302a26, wood=0xc79a5c;
const grid:[number,number]=[4,4];
type Kind='tea'|'steam'|'grill'|'fry'|'pancake'|'fruit'|'soup';
const kinds:Kind[]=['pancake','tea','fry','steam','soup','grill','fry','soup','fry','pancake','steam','tea','grill','fry','fruit','soup','soup','grill','tea','steam','grill','grill','tea','steam'];

function pot(g:StallGeometry,x:number,y:number,z:number,r:number,h:number,lid:boolean) {
  const {metal,enamel}=g;
  g.solid(g.panShape,metal,chrome,[x,y+h/2,z],[r*2,h,r*2]);
  g.solid(g.ringShape,metal,0xdddad0,[x,y+h,z],[r*2.08,r*.7,r*2.08]);
  g.solid(g.rodShape,lid?metal:enamel,lid?0xa59e87:0x8a5125,[x,y+h+.001,z],[r*1.91,.016,r*1.91]);
  if(lid){
    g.solid(g.ballShape,metal,0xa9a899,[x,y+h+.025,z],[r*1.90,.067,r*1.9]);
    g.box(enamel,black,x,y+h+.071,z,.10,.032,.042);
  } else {
    g.foodTop(1,x,y+h+.013,z,r*.87,r*.85,.4,x);
    g.beam(metal,chrome,[x+.04,y+h-.01,z],[x+r+.04,y+h+.27,z-.045],.021,.021,true);
  }
  for(const sign of [-1,1])g.box(metal,black,x+sign*(r+.031),y+h*.71,z,.098,.036,.095);
}

function tray(g:StallGeometry,x:number,z:number,w:number,d:number,y:number) {
  g.box(g.metal,0x90978c,x,y+.026,z,w,.052,d);
  for(const s of [-1,1]){
    g.box(g.metal,chrome,x+s*(w-.014)/2,y+.063,z,.014,.091,d);
    g.box(g.metal,chrome,x,y+.063,z+s*(d-.014)/2,w,.091,.014);
  }
}

function drinkStation(g:StallGeometry,x:number,z:number) {
  for(let i=0;i<2;i++) {
    const px=x+i*.49;
    g.solid(g.rodShape,g.metal,i?0xe1c8a0:0xbcb39d,[px,1.35,z-.19],[.39,.47,.39]);
    g.solid(g.rodShape,g.enamel,black,[px,1.59,z-.19],[.405,.045,.405]);
    g.box(g.enamel,black,px,1.22,z+.044,.06,.09,.085);
    g.box(g.enamel,i?0x5b2b23:0xb56421,px,1.29,z+.055,.036,.087,.034);
  }
  for(let i=0;i<5;i++){
    const cx=x+.12+(i%3)*.205,cz=z+.16+Math.floor(i/3)*.16;
    g.solid(g.cupShape,g.glazed,i%2?0xeac48a:0xd5a681,[cx,1.22,cz],[.145,.234,.145]);
    g.solid(g.rodShape,g.glazed,0xf6e1a9,[cx,1.342,cz],[.148,.013,.148]);
    g.solid(g.rodShape,g.enamel,i%2?0xac3826:0xe5c57a,[cx+.017,1.423,cz],[.009,.17,.009],.09,.1,.14);
    g.front(g.imageLabel,9,grid,cx,1.244,cz+.068,.060,.062);
    for(let bead=0;bead<4;bead++)g.solid(g.ballShape,g.glazed,0x3c261a,[cx+(bead-1.5)*.026,1.144+bead%2*.016,cz+.05],[.027,.027,.024]);
  }
  for(let i=0;i<2;i++){
    const px=x-.43+i*.19;
    g.solid(g.cupShape,g.glazed,0xc4bca4,[px,1.26,z+.03],[.167,.292,.167]);
    for(let j=0;j<6;j++)g.solid(g.ringShape,g.glazed,0xe4decc,[px,1.235+j*.027,z+.03],[.16+j*.0015,.076,.16+j*.0015]);
  }
}

function steamer(g:StallGeometry,x:number,z:number,rand:()=>number) {
  const woodColors=[0x8e5c34,0xb57f49,0xbb8e55];
  for(let j=0;j<3;j++){
    const px=x+(j-1)*.58;
    const tiers=j===1?3:1+Math.floor(rand()*2);
    for(let i=0;i<tiers;i++){
      const y=1.17+i*.115;
      g.solid(g.rodShape,g.enamel,woodColors[i],[px,y,z],[.56,.12,.56]);
      g.solid(g.ringShape,g.enamel,0x74532e,[px,y+.053,z],[.575,.17,.575]);
    }
    const top=1.115+tiers*.115;
    for(let k=0;k<5;k++){const a=k*1.256;g.solid(g.ballShape,g.glazed,0xe4cfa1,[px+Math.sin(a)*.14,top+.044,z+Math.cos(a)*.14],[.142,.096,.141]);}
  }
}

function fryer(g:StallGeometry,x:number,z:number,kind:Kind,preset:number,rand:()=>number,near:boolean) {
  const palette=kind==='fruit'?[0xca763b,0xc3b450,0x959f45]:kind==='grill'?[0xa44821,0x963d1d,0x70341a]:[0xcd822f,0xe59b40,0xd7a352,0xa76526];
  for(let trayIndex=0;trayIndex<(near?3:2);trayIndex++){
    const px=x+(trayIndex-.95)*.72, pz=z+.04*(trayIndex%2);
    tray(g,px,pz,.665,.48,1.11);
    const fw=.614,fd=.421,y=1.213;
    const friedCells=preset===6||preset===13?[3,2,3]:[2,3,2];
    const cell=kind==='fruit'?7:kind==='grill'?(preset===17?5:4):friedCells[trayIndex];
    g.panel(g.wells,[[px-fw/2,y,pz-fd/2],[px-fw/2,y,pz+fd/2],[px+fw/2,y,pz+fd/2],[px+fw/2,y,pz-fd/2]],cell,[4,2]);
    const count=near?14:7;
    for(let j=0;j<count;j++){
      const ax=px+(rand()-.5)*.49,az=pz+(rand()-.5)*.35;
      const stacked=j>7;
      const ay=1.21+Number(stacked)*.072+rand()*.038;
      if(kind==='grill') {
        const a=rand()*.24;
        g.solid(g.ballShape,g.glazed,palette[j%palette.length],[ax,ay,az],[.09,.088,.24],0,a,.06);
        if(near&&j%2===0)g.solid(g.rodShape,g.enamel,wood,[ax,ay-.004,az+.12],[.008,.24,.008],Math.PI/2,a,0);
      }else {
        const size=preset===2?.17:.082+rand()*.065;
        const mat=kind==='fruit'?g.glazed:g.cutletFinish;
        g.solid(g.foodShape,mat,kind==='fruit'?palette[j%palette.length]:0xe8cbaa,[ax,ay+.025,az],[size*(1+rand()*.45),size*.69,size],rand(),rand(),rand());
      }
    }
  }
  if(preset===2&&near) {
    // Large breaded cutlets angled in an actual stainless display rack.
    for(let i=0;i<3;i++){
      const px=x-.85+i*.263,pz=z-.025-i*.041;
      g.solid(g.cutletShape,g.cutletFinish,i===0?0xfff0d5:0xe6c899,[px,1.575+i*.026,pz],[.44+i*.048,.741-i*.032,.122],-.31,.84-i*.15,-.28+i*.13);
      g.beam(g.metal,chrome,[px-.077,1.21,pz-.019],[px-.07,1.51,pz+.085],.014,.014,true);
    }
    g.box(g.metal,chrome,x-.59,1.35,z+.13,1.06,.019,.018);
  }
}

function pancake(g:StallGeometry,x:number,z:number,rand:()=>number) {
  const s=g.metal;
  g.box(s,black,x-.47,1.16,z,1.02,.116,.61);
  for(let i=0;i<2;i++){
    const px=x-.73+i*.51;
    g.solid(g.panShape,s,0x332e26,[px,1.235,z],[.48,.05,.48]);
    g.beam(s,black,[px,1.22,z-.16],[px-.065,1.28,z-.46],.042,.043);
    g.solid(g.foodShape,g.glazed,0xdeab59,[px,1.266,z],[.37,.049,.33],0,i*.42,0);
    g.foodTop(0,px,1.293,z,.18,.171,i*.51,i);
    for(let j=0;j<8;j++)g.solid(g.foodShape,g.glazed,j%3===0?0x59782c:0xb0632f,[px+(rand()-.5)*.21,1.286,z+(rand()-.5)*.18],[.041,.014,.032]);
  }
  tray(g,x+.51,z,.91,.57,1.11);
  const px=x+.51,pz=z,fw=.424,fd=.251,fy=1.205;
  g.panel(g.wells,[[px-fw,fy,pz-fd],[px-fw,fy,pz+fd],[px+fw,fy,pz+fd],[px+fw,fy,pz-fd]],0,[4,2]);
  for(let i=0;i<9;i++) {
    const ax=px+(i%3-1)*.25+(rand()-.5)*.07,az=pz+(Math.floor(i/3)-1)*.126+(rand()-.5)*.048;
    const level=1.233+Math.floor(i/4)*.016;
    g.solid(g.foodShape,g.glazed,0xc38942,[ax,level-.008,az],[.28,.062,.21],0,i*.27,0);
    g.foodTop(0,ax,level+.018,az,.151,.108,i*.51,i+3.4);
  }
  g.beam(g.metal,chrome,[px-.05,1.27,pz-.13],[px+.22,1.53,pz-.19],.016,.028);
  g.solid(g.ballShape,g.metal,chrome,[px-.085,1.25,pz-.12],[.101,.034,.081]);

  // A broad blade and a turned handle rest on the hotplate.
  g.box(s,chrome,x-.05,1.275,z+.16,.10,.014,.11);
  g.beam(s,wood,[x-.05,1.278,z+.12],[x+.14,1.35,z-.04],.022,.035);
}

export function stockCounter(g:StallGeometry, preset:number, rand:()=>number, near:boolean) {
  const kind=kinds[preset], x=-.07, z=.80;
  if(kind==='tea')drinkStation(g,x-.47,z);
  else if(kind==='pancake')pancake(g,x,z,rand);
  else if(kind==='steam')steamer(g,x,z,rand);
  else if(kind==='soup'){for(let i=0;i<3;i++)pot(g,x+(i-1)*.59,1.11,z,.24,.23+i*.036,i===2);}
  else fryer(g,x,z,kind,preset,rand,near);
  // Condiments at the far end of the worktop carry paper labels and nozzle caps.
  for(let i=0;i<(near?3:2);i++){
    const px=.83+i*.124,pz=z-.34+(i%2)*.097,h=.21+rand()*.09;
    g.solid(g.rodShape,g.glazed,[0xb24622,0xb8904a,0x8d3b25][i],[px,1.11+h/2,pz],[.103,h,.103]);
    g.solid(g.cupShape,g.enamel,0xe8d4ac,[px,1.11+h+.027,pz],[.028,.061,.062],Math.PI);
    g.front(g.imageLabel,9,grid,px,1.11+h*.46,pz+.052,.079,.095);
  }
  if(near) {
    g.solid(g.cupShape,g.metal,steel,[-1.19,1.20,z-.29],[.14,.18,.14]);
    for(let j=0;j<8;j++){
      const p:Point=[-1.19+(rand()-.5)*.095,1.23,z-.29+(rand()-.5)*.09];
      g.beam(g.enamel,wood,p,[p[0]+(rand()-.5)*.055,1.47+rand()*.09,p[2]+(rand()-.5)*.045],.010,.010,true);
    }
  }
}
