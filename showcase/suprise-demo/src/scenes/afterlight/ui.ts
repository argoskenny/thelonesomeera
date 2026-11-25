import { mountUI } from '../../shared/ui';
import { views } from './views';
export function mountAfterlightUI(){
  mountUI({
    description:'餘光，互動 3D 海上美術館',
    brand:'<span class="brand-ring"></span><span class="wordmark">AFTERLIGHT<small>餘 光</small></span>',
    homeLabel:'回到水庭起點',title:'Stay a little longer.',subtitle:'在光消失之前，留一會。',exploreLabel:'開始探索',
    soundLabel:'開啟海浪聲',soundTip:'海浪聲',otherScene:{href:'../night-market/',label:'夜市未眠'},
    locationPrompt:'換個角度，看見餘光',views,moodAttribute:'time',
    moods:[{key:'sunset',label:'日落'},{key:'blue',label:'藍調'},{key:'mist',label:'晨霧'}],
    loadingName:'AFTERLIGHT',loadingCopy:'讓光慢慢進來。',
  });
}
