import type { AdventureState } from "../game/state";
import { questCopy } from "../game/state";

type Action = "interact" | "attack" | "potion";

export class Hud {
  private readonly root: HTMLElement;
  private readonly questTitle: HTMLElement;
  private readonly questDetail: HTMLElement;
  private readonly hearts: HTMLElement;
  private readonly prompt: HTMLElement;
  private readonly promptLabel: HTMLElement;
  private readonly stats: HTMLElement;
  private readonly region: HTMLElement;
  private readonly toast: HTMLElement;
  private readonly dialogue: HTMLElement;
  private readonly dialogueName: HTMLElement;
  private readonly dialogueText: HTMLElement;
  private readonly bossBar: HTMLElement;
  private readonly bossFill: HTMLElement;
  private readonly mapPlayer: HTMLElement;
  private toastTimer = 0;

  constructor(container: HTMLElement) {
    container.innerHTML = `
      <canvas id="game-canvas" aria-label="迷你奇境 3D 遊戲畫面"></canvas>
      <section class="intro" data-intro aria-labelledby="game-title">
        <div class="intro-sun" aria-hidden="true"></div>
        <div class="intro-content">
          <div class="title-mark" aria-hidden="true"><span></span></div>
          <h1 id="game-title">迷你奇境</h1>
          <p>穿過微風村與月影森林，找回月光莓，喚醒沉睡的勇氣。</p>
          <button class="primary-button" data-start>踏上旅程</button>
          <div class="intro-controls"><kbd>WASD</kbd> 移動　<kbd>E</kbd> 互動　<kbd>空白鍵</kbd> 攻擊</div>
        </div>
      </section>

      <div class="game-ui" data-game-ui aria-live="polite">
        <section class="quest-card" aria-label="目前任務">
          <div class="quest-heading"><span class="quest-leaf" aria-hidden="true"></span>今日冒險</div>
          <strong data-quest-title>和米菈談談</strong>
          <span data-quest-detail>她在村屋前等你</span>
        </section>

        <div class="region-label" data-region>微風村</div>

        <aside class="minimap" aria-label="小地圖">
          <div class="map-north">N</div>
          <div class="map-river"></div>
          <div class="map-path"></div>
          <span class="map-landmark map-house" title="微風村"></span>
          <span class="map-landmark map-forest" title="古樹谷地"></span>
          <span class="map-player" data-map-player></span>
        </aside>

        <section class="boss-bar" data-boss-bar aria-label="Boss 生命值">
          <span>苔角守衛</span>
          <div><i data-boss-fill></i></div>
        </section>

        <div class="status-cluster">
          <div class="hearts" data-hearts aria-label="生命值"></div>
          <div class="stats" data-stats>金幣 0　藥水 0</div>
        </div>

        <div class="interaction-prompt" data-prompt>
          <kbd>E</kbd><span data-prompt-label>交談</span>
        </div>

        <div class="controls-hint"><kbd>WASD</kbd> 移動　·　<kbd>E</kbd> 互動　·　<kbd>空白鍵</kbd> 攻擊　·　<kbd>Q</kbd> 補血</div>

        <div class="toast" data-toast role="status"></div>

        <section class="dialogue" data-dialogue aria-label="對話">
          <div class="portrait" aria-hidden="true"><span></span></div>
          <div class="dialogue-copy">
            <strong data-dialogue-name></strong>
            <p data-dialogue-text></p>
          </div>
          <button data-dialogue-close aria-label="繼續對話">E　繼續</button>
        </section>

        <div class="touch-controls" aria-label="觸控操作">
          <div class="joystick" data-joystick><i data-stick></i></div>
          <div class="touch-actions">
            <button data-action="potion" aria-label="使用藥水">＋</button>
            <button data-action="interact" aria-label="互動">E</button>
            <button class="attack" data-action="attack" aria-label="攻擊">劍</button>
          </div>
        </div>
      </div>

      <section class="end-screen" data-game-over aria-labelledby="game-over-title">
        <div>
          <span class="end-icon">♥</span>
          <h2 id="game-over-title">先休息一下吧</h2>
          <p>森林會等你準備好再回來。</p>
          <button class="primary-button" data-restart>重新出發</button>
        </div>
      </section>

      <section class="end-screen victory" data-victory aria-labelledby="victory-title">
        <div>
          <span class="end-icon">✦</span>
          <h2 id="victory-title">微風又吹起來了</h2>
          <p>苔角守衛放下怒氣，村莊與森林重新成為朋友。</p>
          <div class="victory-stats" data-victory-stats></div>
          <button class="primary-button" data-restart>再玩一次</button>
        </div>
      </section>
    `;

    this.root = container.querySelector<HTMLElement>("[data-game-ui]")!;
    this.questTitle = container.querySelector<HTMLElement>("[data-quest-title]")!;
    this.questDetail = container.querySelector<HTMLElement>("[data-quest-detail]")!;
    this.hearts = container.querySelector<HTMLElement>("[data-hearts]")!;
    this.prompt = container.querySelector<HTMLElement>("[data-prompt]")!;
    this.promptLabel = container.querySelector<HTMLElement>("[data-prompt-label]")!;
    this.stats = container.querySelector<HTMLElement>("[data-stats]")!;
    this.region = container.querySelector<HTMLElement>("[data-region]")!;
    this.toast = container.querySelector<HTMLElement>("[data-toast]")!;
    this.dialogue = container.querySelector<HTMLElement>("[data-dialogue]")!;
    this.dialogueName = container.querySelector<HTMLElement>("[data-dialogue-name]")!;
    this.dialogueText = container.querySelector<HTMLElement>("[data-dialogue-text]")!;
    this.bossBar = container.querySelector<HTMLElement>("[data-boss-bar]")!;
    this.bossFill = container.querySelector<HTMLElement>("[data-boss-fill]")!;
    this.mapPlayer = container.querySelector<HTMLElement>("[data-map-player]")!;
  }

  get canvas() {
    return document.querySelector<HTMLCanvasElement>("#game-canvas")!;
  }

  get dialogueOpen() {
    return this.dialogue.classList.contains("is-visible");
  }

  onStart(callback: () => void) {
    document.querySelector<HTMLElement>("[data-start]")?.addEventListener("click", () => {
      document.querySelector<HTMLElement>("[data-intro]")?.classList.add("is-hidden");
      this.root.classList.add("is-active");
      callback();
    });
  }

  onRestart(callback: () => void) {
    document.querySelectorAll<HTMLElement>("[data-restart]").forEach((button) =>
      button.addEventListener("click", callback),
    );
  }

  onDialogueContinue(callback: () => void) {
    document.querySelector<HTMLElement>("[data-dialogue-close]")?.addEventListener("click", callback);
  }

  onAction(callback: (action: Action) => void) {
    document.querySelectorAll<HTMLElement>("[data-action]").forEach((button) => {
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        callback(button.dataset.action as Action);
      });
    });
  }

  bindJoystick(callback: (x: number, y: number) => void) {
    const joystick = document.querySelector<HTMLElement>("[data-joystick]")!;
    const stick = document.querySelector<HTMLElement>("[data-stick]")!;
    let pointerId: number | null = null;

    const move = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      const rect = joystick.getBoundingClientRect();
      const radius = rect.width * 0.33;
      let x = event.clientX - (rect.left + rect.width / 2);
      let y = event.clientY - (rect.top + rect.height / 2);
      const length = Math.hypot(x, y);
      if (length > radius) {
        x = (x / length) * radius;
        y = (y / length) * radius;
      }
      stick.style.transform = `translate(${x}px, ${y}px)`;
      callback(x / radius, y / radius);
    };

    joystick.addEventListener("pointerdown", (event) => {
      pointerId = event.pointerId;
      joystick.setPointerCapture(event.pointerId);
      move(event);
    });
    joystick.addEventListener("pointermove", move);
    const end = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      pointerId = null;
      stick.style.transform = "translate(0, 0)";
      callback(0, 0);
    };
    joystick.addEventListener("pointerup", end);
    joystick.addEventListener("pointercancel", end);
  }

  update(state: AdventureState, hp: number, maxHp: number) {
    const quest = questCopy(state);
    this.questTitle.textContent = quest.title;
    this.questDetail.textContent = quest.detail;
    this.stats.textContent = `金幣 ${state.coins}　藥水 ${state.potions}`;
    this.hearts.innerHTML = Array.from({ length: maxHp }, (_, index) =>
      `<span class="heart ${index < hp ? "is-full" : ""}" aria-hidden="true">♥</span>`,
    ).join("");
    this.hearts.setAttribute("aria-label", `生命值 ${hp} / ${maxHp}`);
  }

  updateBoss(hp: number, maxHp: number, visible: boolean) {
    this.bossBar.classList.toggle("is-visible", visible);
    this.bossFill.style.transform = `scaleX(${Math.max(0, hp / maxHp)})`;
  }

  updateMap(x: number, z: number, rotation: number) {
    const left = ((x + 28) / 56) * 100;
    const top = ((z + 45) / 72) * 100;
    this.mapPlayer.style.left = `${Math.max(5, Math.min(95, left))}%`;
    this.mapPlayer.style.top = `${Math.max(5, Math.min(95, top))}%`;
    this.mapPlayer.style.transform = `translate(-50%, -50%) rotate(${rotation}rad)`;
  }

  setPrompt(label: string | null) {
    this.prompt.classList.toggle("is-visible", Boolean(label));
    if (label) this.promptLabel.textContent = label;
  }

  setRegion(label: string) {
    if (this.region.textContent === label) return;
    this.region.textContent = label;
    this.region.classList.remove("is-showing");
    void this.region.offsetWidth;
    this.region.classList.add("is-showing");
  }

  showDialogue(name: string, text: string) {
    this.dialogueName.textContent = name;
    this.dialogueText.textContent = text;
    this.dialogue.classList.add("is-visible");
    this.setPrompt(null);
  }

  closeDialogue() {
    this.dialogue.classList.remove("is-visible");
  }

  showToast(message: string, duration = 2.2) {
    this.toast.textContent = message;
    this.toast.classList.add("is-visible");
    this.toastTimer = duration;
  }

  tick(delta: number) {
    if (this.toastTimer <= 0) return;
    this.toastTimer -= delta;
    if (this.toastTimer <= 0) this.toast.classList.remove("is-visible");
  }

  showGameOver() {
    document.querySelector<HTMLElement>("[data-game-over]")?.classList.add("is-visible");
  }

  showVictory(state: AdventureState) {
    const defeated = state.defeatedEnemies.length;
    const stats = document.querySelector<HTMLElement>("[data-victory-stats]");
    if (stats) stats.textContent = `找到 3 顆月光莓　·　開啟 ${state.openedChests.length} 個寶箱　·　擊退 ${defeated} 隻魔物`;
    document.querySelector<HTMLElement>("[data-victory]")?.classList.add("is-visible");
  }
}
