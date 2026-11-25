import { mountUI } from '../../shared/ui';
import { views } from './views';
export function mountCityUI(){
  mountUI({className:'vertigo',description:'懸城，可自由漫遊的高樓峽谷 3D 環境',
    brand:`<span class="vertigo-emblem"><svg viewBox="0 0 36 44" fill="none" stroke="currentColor" stroke-width=".85"><path d="M7 5v35M13 2v39M19 0v43M25 3v37M31 7v31"/></svg></span><span class="wordmark">VERTIGO<small>懸 城</small></span>`,homeLabel:'回到懸空長廊',
    title:'Between sky and sea.',subtitle:'風穿過巷弄，燈還為誰亮著。',exploreLabel:'走進懸城',soundLabel:'開啟風與潮聲',soundTip:'風與遠方的海',
    otherScene:{href:'../night-market/',label:'夜市未眠'},locationPrompt:'在樓宇之間，換個視角',views,moodAttribute:'weather',moods:[{key:'dusk',label:'暮色'},{key:'rain',label:'夜雨'},{key:'mist',label:'晨霧'}],loadingName:'VERTIGO',loadingCopy:'風穿過高樓，遠處的窗慢慢亮起。',
  });
}
