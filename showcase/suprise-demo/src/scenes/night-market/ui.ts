import { mountUI } from '../../shared/ui';
import { vec } from './geometry';
export const nightViews=[
  {name:'LANTERN LANE',label:'燈籠街 · Lantern lane',position:vec(20.1,1.76,34),target:vec(20,3.1,-38)},
  {name:'THE GATE',label:'牌樓街 · The gate',position:vec(20,1.85,-27),target:vec(20,5.2,-40)},
  {name:'WEST OLD TOWN',label:'西埕老街 · Old town',position:vec(-41,1.8,-50),target:vec(-40,3,-43)},
  {name:'HERBAL ALLEY',label:'青草巷 · Herbal alley',position:vec(-20,1.8,-19),target:vec(-14.5,2,-19)},
  {name:'SOUTH ARCADE',label:'南光商圈 · South arcade',position:vec(-44,1.8,50),target:vec(-42,2,44)},
  {name:'MINSHENG STREET',label:'民生街 · Minsheng street',position:vec(-20,1.8,25),target:vec(-14.5,2.1,25)},
  {name:'EAST FOOD MARKET',label:'東門食集 · Food market',position:vec(62,1.8,23),target:vec(57,2.1,22)},
  {name:'ABOVE THE LIGHTS',label:'夜市全景 · Above the lights',position:vec(70,62,62),target:vec(0,0,0)},
];
export function mountNightUI(){
  mountUI({
    className:'night-market',description:'夜市未眠，可自由漫遊的台灣夜市 3D 環境',
    brand:`<span class="night-emblem"><svg viewBox="0 0 36 44" fill="none" stroke="currentColor" stroke-width=".9"><ellipse cx="18" cy="21" rx="11" ry="16"/><ellipse cx="18" cy="21" rx="5" ry="16"/><path d="M9 11h18M7 18h22M7 25h22M10 32h16M14 4h8M14 38h8M18 0v4M18 38v6"/></svg></span><span class="wordmark">NIGHTFALL<small>夜 市 未 眠</small></span>`,homeLabel:'回到燈籠街起點',
    title:'A little after midnight.',subtitle:'燈還亮著，慢慢走。',exploreLabel:'走進夜市',
    soundLabel:'開啟夜市環境聲',soundTip:'雨滴與巷弄',
    otherScene:{href:'../afterlight/',label:'餘光美術館'},
    locationPrompt:'六個街區，沿著燈火慢慢走',views:nightViews,moodAttribute:'weather',
    moods:[{key:'rain',label:'雨後'},{key:'late',label:'深夜'},{key:'mist',label:'薄霧'}],
    loadingName:'NIGHTFALL',loadingCopy:'等巷子裡的燈，一盞一盞亮起。',
  });
}
