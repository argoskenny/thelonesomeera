import type { CameraMode } from "../core/CameraSystem";

export interface HudStats {
  readonly fps: number;
  readonly drawCalls: number;
  readonly triangles: number;
  readonly geometries: number;
  readonly textures: number;
  readonly camera: string;
  readonly player: string;
  readonly grounded: boolean;
  readonly fallbackAssets: number;
}

interface HudCallbacks {
  readonly onModeSelected: (mode: CameraMode) => void;
}

const MODE_LABELS: Readonly<Record<CameraMode, string>> = {
  reference: "參考視角",
  player: "玩家視角",
  free: "自由視角",
};

export class Hud {
  readonly element: HTMLElement;

  private readonly statsElement: HTMLElement;
  private readonly modeLabel: HTMLElement;
  private readonly toastElement: HTMLElement;
  private toastTimer = 0;
  private visible = true;

  constructor(container: HTMLElement, private readonly callbacks: HudCallbacks) {
    this.element = document.createElement("section");
    this.element.className = "hud";
    this.element.setAttribute("aria-label", "場景控制介面");
    this.element.innerHTML = `
      <div class="hud__ambient" aria-hidden="true"></div>
      <div class="hud__brand">
        <div class="hud__eyeline"><span>OPENAI / SPATIAL LAB</span><span class="hud__status">LIVE</span></div>
        <h1>GPT 5.6 <em>SOL</em></h1>
        <p>Spatial Omniscience Lab — 可即時探索的 AI 原生 3D 空間</p>
      </div>
      <aside class="hud__manifesto" aria-label="技術展示簡介">
        <span class="hud__index">01 — 03</span>
        <p>不只理解畫面，<br><strong>而是走進空間。</strong></p>
        <div class="hud__signals"><span>WEBGL</span><span>REAL-TIME</span><span>SPATIAL AI</span></div>
      </aside>
      <nav class="hud__modes" aria-label="相機模式">
        <button class="hud__mode-button" type="button" data-mode="reference" aria-pressed="true"><span>01</span> 鳥瞰</button>
        <button class="hud__mode-button" type="button" data-mode="player" aria-pressed="false"><span>02</span> 進入</button>
        <button class="hud__mode-button" type="button" data-mode="free" aria-pressed="false"><span>03</span> 軌道</button>
      </nav>
      <div class="hud__stats" aria-label="效能資訊">
        <div class="hud__stat-row"><span>MODE</span><strong data-stat="mode">參考視角</strong></div>
        <div class="hud__stat-row"><span>FPS</span><strong data-stat="fps">--</strong></div>
        <div class="hud__stat-row"><span>DRAW CALLS</span><strong data-stat="drawCalls">--</strong></div>
        <div class="hud__stat-row"><span>TRIANGLES</span><strong data-stat="triangles">--</strong></div>
        <div class="hud__stat-row"><span>GEOMETRIES</span><strong data-stat="geometries">--</strong></div>
        <div class="hud__stat-row"><span>TEXTURES</span><strong data-stat="textures">--</strong></div>
        <div class="hud__stat-row"><span>CAMERA</span><strong data-stat="camera">--</strong></div>
        <div class="hud__stat-row"><span>PLAYER</span><strong data-stat="player">--</strong></div>
        <div class="hud__stat-row"><span>GROUNDED</span><strong data-stat="grounded">YES</strong></div>
        <div class="hud__stat-row"><span>PROC. ASSETS</span><strong data-stat="fallbackAssets">0</strong></div>
      </div>
      <div class="hud__help">
        <span>CONTROL PROTOCOL</span><br><kbd>WASD</kbd> 移動　<kbd>SHIFT</kbd> 加速　<kbd>SPACE</kbd> 跳躍　<kbd>R</kbd> 重設　<kbd>H</kbd> 介面　<kbd>G</kbd> 碰撞
      </div>
      <div class="hud__crosshair" aria-hidden="true"></div>
      <div class="hud__lock-hint">點擊場景鎖定滑鼠；亦可按住拖曳觀看</div>
      <div class="hud__toast" role="status" aria-live="polite"></div>
    `;
    container.append(this.element);
    this.statsElement = this.requireElement(".hud__stats");
    this.modeLabel = this.requireElement('[data-stat="mode"]');
    this.toastElement = this.requireElement(".hud__toast");
    this.element.addEventListener("click", this.onClick);
  }

  setMode(mode: CameraMode): void {
    this.element.classList.toggle("hud--player", mode === "player");
    this.modeLabel.textContent = MODE_LABELS[mode];
    for (const button of this.element.querySelectorAll<HTMLButtonElement>("[data-mode]")) {
      button.setAttribute("aria-pressed", String(button.dataset.mode === mode));
    }
  }

  setPointerLocked(locked: boolean): void {
    this.element.classList.toggle("hud--locked", locked);
  }

  updateStats(stats: HudStats): void {
    this.setStat("fps", stats.fps.toFixed(0));
    this.setStat("drawCalls", String(stats.drawCalls));
    this.setStat("triangles", stats.triangles.toLocaleString("en-US"));
    this.setStat("geometries", String(stats.geometries));
    this.setStat("textures", String(stats.textures));
    this.setStat("camera", stats.camera);
    this.setStat("player", stats.player);
    this.setStat("grounded", stats.grounded ? "YES" : "NO");
    this.setStat("fallbackAssets", String(stats.fallbackAssets));
  }

  toggleVisible(): boolean {
    this.visible = !this.visible;
    this.element.style.display = this.visible ? "" : "none";
    return this.visible;
  }

  showToast(message: string): void {
    window.clearTimeout(this.toastTimer);
    this.toastElement.textContent = message;
    this.toastElement.classList.add("hud__toast--visible");
    this.toastTimer = window.setTimeout(() => {
      this.toastElement.classList.remove("hud__toast--visible");
    }, 1400);
  }

  dispose(): void {
    window.clearTimeout(this.toastTimer);
    this.element.removeEventListener("click", this.onClick);
    this.element.remove();
  }

  private setStat(key: keyof Omit<HudStats, "grounded"> | "grounded", value: string): void {
    const element = this.statsElement.querySelector<HTMLElement>(`[data-stat="${key}"]`);
    if (element) element.textContent = value;
  }

  private requireElement(selector: string): HTMLElement {
    const element = this.element.querySelector<HTMLElement>(selector);
    if (!element) throw new Error(`HUD element '${selector}' is missing.`);
    return element;
  }

  private readonly onClick = (event: MouseEvent): void => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-mode]");
    const mode = button?.dataset.mode;
    if (mode === "reference" || mode === "player" || mode === "free") {
      this.callbacks.onModeSelected(mode);
    }
  };
}
