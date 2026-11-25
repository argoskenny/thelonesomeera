const icons={
  sound:`<path d="M11 5 6 9H3v6h3l5 4V5Z"/><path class="sound-waves" d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>`,
  camera:`<path d="M4 7h4l2-3h4l2 3h4v13H4Z"/><circle cx="12" cy="13" r="4"/>`,
  expand:`<path d="M4 9V4h5m6 0h5v5M4 15v5h5m6 0h5v-5M4 4l5 5m6 6 5 5"/>`,
  arrow:`<path d="M5 19 19 5M6 5h13v13"/>`,
  close:`<path d="m6 6 12 12M6 18 18 6"/>`,
};
export const svg=(name:keyof typeof icons)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
export type SceneUI={
  className?:string; description:string; brand:string; homeLabel:string;
  title:string; subtitle:string; exploreLabel:string; soundLabel:string; soundTip:string;
  otherScene:{href:string;label:string}; locationPrompt:string;
  views:readonly {name:string;label:string}[];
  moodAttribute:'time'|'weather'; moods:readonly {key:string;label:string}[];
  loadingName:string; loadingCopy:string;
};
export function mountUI(config:SceneUI){
  document.querySelector<HTMLDivElement>('#app')!.innerHTML=`
    <main id="experience" class="${config.className??''}" aria-label="${config.description}">
      <div id="canvas-wrap"></div>
      <div class="edge-shade" aria-hidden="true"></div>
      <header class="header">
        <button class="brand" id="home" aria-label="${config.homeLabel}">${config.brand}</button>
        <nav class="scene-nav" aria-label="場景導覽"><a href="../">場景首頁</a><span aria-hidden="true">/</span><a href="${config.otherScene.href}">${config.otherScene.label}</a></nav>
        <div class="utilities">
          <button class="icon-button" id="sound" aria-label="${config.soundLabel}" aria-pressed="false" data-tip="${config.soundTip}">${svg('sound')}<span class="muted-mark"></span></button>
          <button class="icon-button" id="photo" aria-label="拍照並下載" data-tip="拍照">${svg('camera')}</button>
          <button class="icon-button" id="fullscreen" aria-label="全螢幕" aria-pressed="false" data-tip="全螢幕">${svg('expand')}</button>
        </div>
      </header>
      <div class="intro" id="intro"><h1>${config.title}</h1><p>${config.subtitle}</p></div>
      <button id="explore" class="explore">${config.exploreLabel} ${svg('arrow')}</button>
      <div class="movement-panel" role="group" aria-label="移動模式">
        <div class="movement-tabs"><button data-movement="walk" aria-pressed="true">地面行走</button><button data-movement="fly" aria-pressed="false">自由飛行</button></div>
        <p id="mode-status">沿地面與階梯行走</p>
      </div>
      <div id="walk-instructions" class="walk-instructions" hidden><span>地面行走</span><p id="movement-help"></p></div>
      <div id="crosshair" class="crosshair" hidden></div>
      <div id="joystick" class="joystick" aria-label="移動搖桿" hidden><span></span></div>
      <div id="elevation" aria-label="自由升降" hidden><button type="button" aria-label="向上飛行" data-elevation="1">↑</button><button type="button" aria-label="向下飛行" data-elevation="-1">↓</button></div>
      <footer class="footer">
        <div class="location-control"><button id="location" aria-expanded="false" aria-controls="locations"><span id="location-number">01</span><span class="slash">/</span><span id="location-name">${config.views[0].name}</span><span class="location-chevron">⌃</span></button>
          <div id="locations" class="location-menu" hidden>
            <p>${config.locationPrompt}</p>
            ${config.views.map((v,i)=>`<button data-view="${i}" ${i===0?'aria-current="true"':''}><span>0${i+1}</span>${v.label.split(' · ')[0]}<em>${v.label.split(' · ')[1]}</em></button>`).join('')}
          </div>
        </div>
        <div class="time-tabs" role="group" aria-label="光線氛圍">${config.moods.map((m,i)=>`<button data-${config.moodAttribute}="${m.key}" aria-pressed="${i===0}">${m.label}</button>`).join('')}</div>
        <span class="controls-hint" id="controls-hint">點擊畫面開始 · WASD 移動</span>
      </footer>
      <div id="toast" class="toast" role="status"></div>
      <div id="photo-flash" class="photo-flash"></div>
      <div id="loading" class="loading"><div class="loading-ring"></div><span>${config.loadingName}</span><p id="loading-copy">${config.loadingCopy}</p><div class="loading-track"><span id="loading-bar"></span></div></div>
      <div id="error" class="error" hidden><span class="brand-ring"></span><h1>暫時無法開啟這片風景。</h1><p id="error-copy"></p><button onclick="location.reload()">重新載入</button></div>
    </main>`;
}
let toastTimer:ReturnType<typeof setTimeout>;
export function toast(message:string){const el=document.querySelector<HTMLElement>('#toast')!;el.textContent=message;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),3200);}
