import {
  formatRaceTime,
  lapFromProgress,
  racePositionSuffix,
  type RankingEntry,
} from "../game/race-rules";

export type HeldItem = "boost" | "banana" | null;

export interface HudSnapshot {
  playerId: string;
  speedKmh: number;
  totalProgress: number;
  heldItem: HeldItem;
  boosting: boolean;
  ranking: RankingEntry[];
}

function requiredElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing required HUD element: #${id}`);
  return element as T;
}

function colorToHex(color: number): string {
  return `#${color.toString(16).padStart(6, "0")}`;
}

export class Hud {
  private readonly positionValue = requiredElement("position-value");
  private readonly lapValue = requiredElement("lap-value");
  private readonly lapFill = requiredElement("lap-fill");
  private readonly leaderboard = requiredElement<HTMLOListElement>("leaderboard");
  private readonly speedValue = requiredElement("speed-value");
  private readonly speedRing = requiredElement("speed-ring");
  private readonly boostLabel = requiredElement("boost-label");
  private readonly itemValue = requiredElement("item-value");
  private readonly itemIcon = requiredElement("item-icon");
  private readonly itemButton = requiredElement<HTMLButtonElement>("item-button");
  private readonly countdown = requiredElement("countdown");
  private readonly toast = requiredElement("toast");
  private readonly results = requiredElement<HTMLElement>("results");
  private readonly finalRanking = requiredElement<HTMLOListElement>("final-ranking");
  private readonly raceAgain = requiredElement<HTMLButtonElement>("race-again");
  private readonly viewTrack = requiredElement<HTMLButtonElement>("view-track");
  private toastTimer = 0;
  private lastLeaderboard = "";

  constructor(onUseItem: () => void, onRestart: () => void, onViewTrack: () => void) {
    this.itemButton.addEventListener("click", onUseItem);
    this.raceAgain.addEventListener("click", onRestart);
    this.viewTrack.addEventListener("click", onViewTrack);
  }

  update(snapshot: HudSnapshot): void {
    const playerPosition = snapshot.ranking.findIndex((racer) => racer.id === snapshot.playerId) + 1;
    this.positionValue.textContent = racePositionSuffix(playerPosition);
    this.speedValue.textContent = Math.round(snapshot.speedKmh).toString();
    this.speedRing.style.setProperty("--speed", `${Math.min(1, snapshot.speedKmh / 165) * 280}deg`);
    this.boostLabel.classList.toggle("active", snapshot.boosting);

    const lap = lapFromProgress(snapshot.totalProgress);
    const currentLapProgress = Math.max(0, Math.min(1, snapshot.totalProgress - Math.floor(snapshot.totalProgress)));
    this.lapValue.textContent = `LAP ${lap} / 3`;
    this.lapFill.style.width = `${currentLapProgress * 100}%`;

    const itemLabel = snapshot.heldItem === "boost" ? "TURBO" : snapshot.heldItem === "banana" ? "BANANA" : "NO ITEM";
    this.itemValue.textContent = itemLabel;
    this.itemIcon.textContent = snapshot.heldItem === "boost" ? "⚡" : snapshot.heldItem === "banana" ? "🍌" : "?";
    this.itemButton.classList.toggle("ready", snapshot.heldItem !== null);

    const leaderboardMarkup = snapshot.ranking
      .map((racer, index) => `
        <li class="${racer.id === snapshot.playerId ? "is-player" : ""}">
          <span class="rank-number">${index + 1}</span>
          <i style="--racer-color:${colorToHex(racer.color)}"></i>
          <span>${racer.name}</span>
        </li>`)
      .join("");
    if (leaderboardMarkup !== this.lastLeaderboard) {
      this.leaderboard.innerHTML = leaderboardMarkup;
      this.lastLeaderboard = leaderboardMarkup;
    }
  }

  setCountdown(label: string): void {
    this.countdown.textContent = label;
    this.countdown.classList.toggle("visible", label.length > 0);
    if (label.length > 0) {
      this.countdown.classList.remove("pop");
      void this.countdown.offsetWidth;
      this.countdown.classList.add("pop");
    }
  }

  showToast(message: string, duration = 1.8): void {
    this.toast.textContent = message;
    this.toast.classList.add("visible");
    this.toastTimer = duration;
  }

  clearToast(): void {
    this.toastTimer = 0;
    this.toast.textContent = "";
    this.toast.classList.remove("visible");
  }

  tick(delta: number): void {
    if (this.toastTimer <= 0) return;
    this.toastTimer -= delta;
    if (this.toastTimer <= 0) this.toast.classList.remove("visible");
  }

  showResults(ranking: RankingEntry[]): void {
    this.finalRanking.innerHTML = ranking
      .map((racer, index) => `
        <li>
          <i style="--racer-color:${colorToHex(racer.color)}"></i>
          <strong>${index + 1}</strong>
          <span>${racer.name}</span>
          <time>${formatRaceTime(racer.finishTime)}</time>
        </li>`)
      .join("");
    this.results.hidden = false;
    requestAnimationFrame(() => this.results.classList.add("visible"));
  }

  hideResults(): void {
    this.results.classList.remove("visible");
    this.results.hidden = true;
  }
}
