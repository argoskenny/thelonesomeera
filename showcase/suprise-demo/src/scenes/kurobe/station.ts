import * as T from 'three';
import { GeometryBatch,vec } from '../../shared/geometry';

export const platformHeight=18.92;

function enamelSign(){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;
  const g=canvas.getContext('2d')!;
  g.fillStyle='#e7e7d9';g.fillRect(0,0,1024,256);
  g.fillStyle='#294338';g.fillRect(0,197,1024,59);
  g.font='600 88px "Hiragino Sans","PingFang TC",sans-serif';g.textAlign='center';
  g.fillText('黒 部 峡 谷 鉄 道',512,112);
  g.font='27px Arial,sans-serif';g.fillText('K U R O B E   G O R G E   R A I L W A Y',512,166);
  g.fillStyle='#f1efdf';g.font='29px "Hiragino Sans",sans-serif';g.fillText('待 合 所',512,237);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=8;
  return new T.MeshStandardMaterial({map:texture,roughness:.6,metalness:.08});
}

export function buildStation(scene:T.Scene){
  const batch=new GeometryBatch();
  const timber=new T.TextureLoader().load(new URL('../assets/kurobe/railway/timber.webp',document.baseURI).href);
  timber.wrapS=timber.wrapT=T.RepeatWrapping;timber.colorSpace=T.SRGBColorSpace;
  const cedar=new T.MeshStandardMaterial({map:timber,color:0xd4b18c,roughness:.89});
  const dark=new T.MeshStandardMaterial({color:0x493b2f,roughness:.85});
  const zinc=new T.MeshStandardMaterial({color:0x626b67,metalness:.57,roughness:.63});
  const curb=new T.MeshStandardMaterial({color:0x97958b,roughness:.96});
  const sign=enamelSign();
  const floor=platformHeight;
  batch.at(30,16,0,()=>{
    for(const z of [-1.55,1.75])for(const x of [-4.35,0,4.35]){
      batch.box(.28,.14,.28,x,.07,z,curb);
      batch.box(.15,2.51,.15,x,1.39,z,cedar);
      batch.box(.17,.31,.17,x,.28,z,zinc);
      batch.beam(vec(x,2.05,z),vec(x+(x>0?-.56:.56),2.61,z),.10,.10,dark);
    }
    for(const z of [-1.55,1.75])batch.box(9.2,.20,.15,0,2.64,z,dark);
    for(const x of [-4.35,-2.18,0,2.18,4.35]){
      batch.beam(vec(x,2.7,-2.15),vec(x,3.29,.12),.13,.13,cedar);
      batch.beam(vec(x,3.29,.12),vec(x,2.7,2.39),.13,.13,cedar);
    }
    const roofAngle=Math.atan2(.59,2.27);
    for(const side of [-1,1]){
      batch.box(9.8,.095,2.40,0,3.025,.12+side*1.135,zinc,0,new T.Euler(side*roofAngle,0,0));
      for(let x=-4.8;x<4.9;x+=.435)
        batch.beam(vec(x,3.355,.12),vec(x,2.746,.12+side*2.32),.029,.032,zinc);
    }
    batch.box(9.82,.08,.12,0,3.36,.12,zinc);
    for(let i=0;i<12;i++)
      batch.box(8.84,.18,.095,0,.185+i*.19,1.78,cedar);
    batch.box(2.84,.75,.055,0,1.83,1.69,zinc);
    batch.plane(2.77,.692,0,1.83,1.654,sign,Math.PI);
    for(const bx of [-2.35,2.35]){
      for(const x of [bx-.97,bx+.97])for(const z of [.77,1.23])
        batch.box(.085,.4,.085,x,.2,z,zinc);
      for(let i=0;i<4;i++)batch.box(2.62,.064,.12,bx,.43,.75+i*.135,cedar);
      for(let i=0;i<2;i++)batch.box(2.61,.14,.06,bx,.66+i*.165,1.25,cedar);
    }
  },floor);
  // A rear stair joins the raised platform to the gravel path behind the shelter.
  const rise=(platformHeight-15.8)/18,run=5.3/18;
  for(let i=0;i<18;i++){
    const height=(18-i)*rise;
    batch.box(2.7,height,run,52,15.8+height/2,20.3+(i+.5)*run,curb);
  }
  for(const x of [50.63,53.37]){
    for(let i=0;i<=18;i+=3){
      const top=platformHeight-i*rise,z=20.3+i*run;
      batch.cylinder(.029,.029,.92,x,top+.46,z,zinc,8);
    }
    batch.beam(vec(x,platformHeight+.93,20.3),vec(x,16.73,25.6),.055,.058,zinc);
  }
  const root=new T.Group();root.name='Timber platform waiting shelter';batch.flush(root);scene.add(root);
}
