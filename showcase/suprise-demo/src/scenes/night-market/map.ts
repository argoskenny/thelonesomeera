import type * as THREE from 'three';
/** A small optional street map: keyboard-accessible destinations and a live heading. */
export function mountDistrictMap(camera:THREE.Camera,visit:(index:number)=>void){
  const el=document.createElement('aside');el.className='district-map';el.setAttribute('aria-label','夜市街區地圖');
  el.innerHTML=`<button class="map-toggle" aria-expanded="false" aria-controls="district-map-panel"><span>街區地圖</span><span>＋</span></button>
  <div id="district-map-panel" hidden><div class="map-caption">ISLAND AFTER HOURS <span>北 ↑</span></div>
  <svg viewBox="-76 -66 152 132" aria-label="六個街區的位置與目前方向" role="img">
  <g fill="#496361" fill-opacity=".30" stroke="#8ea49d" stroke-opacity=".45" stroke-width=".5">
  ${[-41,0,41].flatMap(x=>[-25,25].map(z=>`<rect x="${x-15}" y="${z-19}" width="30" height="38" rx="1"/>`)).join('')}</g>
  <g fill="#c9bb99" font-size="8" text-anchor="middle"><text x="-41" y="-25">西埕</text><text x="0" y="-25">青草</text><text x="41" y="-25">牌樓</text><text x="-41" y="25">南光</text><text x="0" y="25">民生</text><text x="41" y="25">東門</text></g>
  <path d="M20 47V-44" fill="none" stroke="#e6ac6d" stroke-width=".6" stroke-dasharray="1.5 1.5"/>
  <g id="map-position"><circle r="3" fill="#f7c784" fill-opacity=".2"/><path d="M0 -3.3L-1.7 2L0 1L1.7 2Z" fill="#ffd39a"/></g></svg>
  <div class="map-destinations">${['西埕老街','青草巷','牌樓街','南光商圈','民生街','東門食集'].map((name,i)=>`<button data-map-view="${[2,3,1,4,5,6][i]}">${name}<span>↗</span></button>`).join('')}</div><p>滑鼠轉頭 · WASD 移動 · F 切換模式</p></div>`;
  document.getElementById('experience')!.appendChild(el);
  const toggle=el.querySelector<HTMLButtonElement>('.map-toggle')!,panel=el.querySelector<HTMLDivElement>('#district-map-panel')!,marker=el.querySelector<SVGGElement>('#map-position')!;
  const setOpen=(open:boolean)=>{panel.hidden=!open;toggle.setAttribute('aria-expanded',String(open));toggle.lastElementChild!.textContent=open?'−':'＋';};
  toggle.addEventListener('click',()=>setOpen(panel.hidden));
  el.querySelectorAll<HTMLButtonElement>('[data-map-view]').forEach(button=>button.addEventListener('click',()=>{visit(Number(button.dataset.mapView));if(innerWidth<760)setOpen(false);}));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){setOpen(false);toggle.focus();}});
  let tick=0;
  return ()=>{if(panel.hidden||tick++%6)return;const e=camera.matrixWorld.elements;const angle=Math.atan2(-e[8],-e[10])*180/Math.PI+180;marker.setAttribute('transform',`translate(${camera.position.x} ${camera.position.z}) rotate(${-angle})`);};
}
