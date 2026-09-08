import { resolveLocale } from './locale.mjs';

export type Locale = 'zh-Hant' | 'en';
const zh = {
  title:'逛夜市', pageTitle:'逛夜市｜走進台灣的夜晚', description:'放慢腳步，走進台灣的夜晚。',
  meta:'以 three.js 打造的復古台灣夜市第一人稱漫遊，搭配台北市場實地錄音。',
  paused:'歇一下，再往下一條街走。', start:'開始逛夜市', resume:'繼續逛夜市', loading:'正在載入夜市…',
  prepare:'準備街景', progress:'載入街景', lights:'準備全區燈光與街道…', retry:'重試載入',
  loadError:'無法載入場景，請確認網路與瀏覽器支援 WebGL 2。', reload:'重新載入夜市',
  contextError:'顯示資源已中斷，請重新載入。', audioError:'環境音載入失敗，可於暫停選單關閉後再開啟重試。',
  dragHelp:'按住畫面拖曳環顧，WASD 移動。', resetDone:'已回到北街入口。',
  desktopControls:'WASD 移動 · 滑鼠環顧 · Esc 暫停<br><span>Shift 快走 · 方向鍵也能移動</span>',
  mobileControls:'左側搖桿移動 · 右側拖曳環顧', walkHint:'WASD 移動 · Esc 暫停',
  reset:'回到北街入口', quality:'畫面品質', auto:'自動', low:'省電', high:'清晰', pause:'暫停',
  creditsOpen:'♫ &nbsp;聲音來源', sound:'環境音', on:'開啟', off:'關閉', volume:'環境音音量', close:'關閉', closeLabel:'關閉聲音來源',
  worldLabel:'可自由行走的台灣夜市 3D 場景', mapLabel:'夜市地圖與目前位置', moveLabel:'移動搖桿', lookLabel:'拖曳環顧',
  north:'北街・攤販熱區', south:'南街・夜食小路', west:'西街・老城街角', east:'東街・日常商店', central:'中央街・巷弄散步',
  creditsTitle:'台灣夜市的聲音', creditsIntro:'沿著街道走，聽見攤販、人群與遊戲機的聲響。',
  hulin:'虎林街・傍晚市場', guangzhou:'廣州街・夜市與遊戲場', hulinLocation:'GaryBard · Freesound · 台北信義區', guangzhouLocation:'GaryBard · Freesound · 台北萬華區',
  license:'兩段實地錄音採 <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">Creative Commons 姓名標示 4.0</a> 授權。使用 Freesound 的 MP3 預覽版本，於遊戲中循環播放、淡化接點，並依位置混音；原作者不為本遊戲背書。',
  sceneCredit:'場景：本專案既有 Blender 夜市模組。44 種原創低多邊形人物：102 位逛街路人、154 位攤販與店家工作人員。停看與購物為情境動畫，尚無交易或戰鬥。',
};
export type MessageKey = keyof typeof zh;
const en: Record<MessageKey,string> = {
  title:'SAY YACHI', pageTitle:'SAY YACHI | A Taiwan Night Market Walk', description:'Slow down. Step into a Taiwanese night.',
  meta:'A retro first-person Taiwan night market walk, built with three.js and real field recordings from Taipei.',
  paused:'Take a breather. Another street awaits.', start:'Explore the night market', resume:'Continue exploring', loading:'Loading the night market…',
  prepare:'Preparing the streets', progress:'Loading the scene', lights:'Preparing lights across the market…', retry:'Try again',
  loadError:'The scene could not load. Check your connection and WebGL 2 support.', reload:'Reload the night market',
  contextError:'Graphics were interrupted. Please reload.', audioError:'Ambient audio could not load. Toggle sound off and on in the pause menu, then resume to retry.',
  dragHelp:'Click and drag to look around. Use WASD to move.', resetDone:'Back at the North Street entrance.',
  desktopControls:'WASD to move · Mouse to look · Esc to pause<br><span>Hold Shift to walk faster · Arrow keys also work</span>',
  mobileControls:'Left stick to move · Drag on the right to look', walkHint:'WASD to move · Esc to pause',
  reset:'Back to the entrance', quality:'Graphics', auto:'Auto', low:'Battery saver', high:'High', pause:'Pause',
  creditsOpen:'♫ &nbsp;Audio credits', sound:'Ambient sound', on:'On', off:'Off', volume:'Ambient volume', close:'Close', closeLabel:'Close audio credits',
  worldLabel:'An explorable 3D Taiwan night market', mapLabel:'Night market map and your location', moveLabel:'Movement joystick', lookLabel:'Drag to look around',
  north:'North Street · Food & games', south:'South Street · Late-night bites', west:'West Street · Old town', east:'East Street · Local shops', central:'Central Street · Backstreet stroll',
  creditsTitle:'Sounds of a Taiwanese night', creditsIntro:'Walk through the sounds of vendors, crowds and arcade games.',
  hulin:'Hulin Street · Evening market', guangzhou:'Guangzhou Street · Night market & arcade', hulinLocation:'GaryBard · Freesound · Xinyi, Taipei', guangzhouLocation:'GaryBard · Freesound · Wanhua, Taipei',
  license:'Both field recordings are licensed under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">Creative Commons Attribution 4.0</a>. This game uses the Freesound MP3 previews, with loop crossfades and location-based mixing. The original creator does not endorse this game.',
  sceneCredit:'Scene: this project’s existing Blender night market assets. 44 original low-poly character designs: 102 browsing pedestrians and 154 stall and shop workers. Shopping is an ambient animation; transactions and combat are not included.',
};
const requested=new URLSearchParams(location.search).get('lang');
let saved:string|null=null;
try { saved=localStorage.getItem('night-market-language'); } catch { /* Direct language links still work without storage. */ }
let locale: Locale = resolveLocale(requested, saved, navigator.languages, navigator.language);
export const getLocale=()=>locale;
export const t=(key:MessageKey)=>(locale==='en'?en:zh)[key];
export function translatePage(){
  document.documentElement.lang=locale;
  document.title=t('pageTitle');
  document.querySelector<HTMLMetaElement>('meta[name="description"]')!.content=t('meta');
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach(el=>el.innerHTML=t(el.dataset.i18n as MessageKey));
  document.querySelectorAll<HTMLElement>('[data-i18n-aria]').forEach(el=>el.setAttribute('aria-label',t(el.dataset.i18nAria as MessageKey)));
  const toggle=document.getElementById('language')!;
  toggle.textContent=locale==='en'?'繁體中文':'English';toggle.setAttribute('aria-label',locale==='en'?'切換為繁體中文':'Switch to English');
}
export function changeLocale(){locale=locale==='en'?'zh-Hant':'en';try{localStorage.setItem('night-market-language',locale);}catch{}const url=new URL(location.href);url.searchParams.set('lang',locale==='en'?'en':'zh');history.replaceState(null,'',url);translatePage();}
