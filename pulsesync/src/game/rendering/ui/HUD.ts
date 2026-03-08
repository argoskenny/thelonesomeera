import Phaser from 'phaser';
import { GAME_CONFIG } from '@/game/content/config/gameConfig';
import type { BossHudState } from '@/game/types/RuntimeTypes';

export interface HudState {
  phaseLabel: string;
  score: number;
  combo: number;
  multiplier: number;
  syncGauge: number;
  syncTier: string;
  integrity: number;
  burstReadyIn: number;
  queuedLocks: number;
  elapsedSeconds: number;
  beatIndex: number;
  boss?: BossHudState;
  paused: boolean;
  debugText: string;
}

export class HUD {
  private readonly bars: Phaser.GameObjects.Graphics;
  private readonly scoreText: Phaser.GameObjects.Text;
  private readonly comboText: Phaser.GameObjects.Text;
  private readonly syncText: Phaser.GameObjects.Text;
  private readonly syncLabelText: Phaser.GameObjects.Text;
  private readonly integrityLabelText: Phaser.GameObjects.Text;
  private readonly burstLabelText: Phaser.GameObjects.Text;
  private readonly phaseText: Phaser.GameObjects.Text;
  private readonly timerText: Phaser.GameObjects.Text;
  private readonly bossText: Phaser.GameObjects.Text;
  private readonly pauseText: Phaser.GameObjects.Text;
  private readonly debugText: Phaser.GameObjects.Text;
  private primary = 0x35e7ff;
  private secondary = 0xff4cb7;
  private accent = 0xdfff4f;
  private danger = 0xff5a7c;
  private debugVisible = GAME_CONFIG.debug.overlayEnabledByDefault;

  constructor(
    private readonly scene: Phaser.Scene,
    registerUiObject?: (
      objects: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[],
    ) => void,
  ) {
    this.bars = this.scene.add.graphics().setDepth(120);
    this.scoreText = this.makeText(28, 18, 20, '#edf7ff', 'left');
    this.comboText = this.makeText(28, 48, 30, '#ffffff', 'left');
    this.syncText = this.makeText(28, 82, 12, '#edf7ff', 'left');
    this.syncLabelText = this.makeText(28, 108, 10, '#b8d8ef', 'left').setText('SYNC GAUGE');
    this.integrityLabelText = this.makeText(28, 140, 10, '#b8d8ef', 'left').setText('INTEGRITY');
    this.burstLabelText = this.makeText(
      GAME_CONFIG.width - 276,
      GAME_CONFIG.height - 58,
      10,
      '#b8d8ef',
      'left',
    ).setText('PULSE BURST');
    this.phaseText = this.makeText(
      GAME_CONFIG.width * 0.5,
      26,
      18,
      '#edf7ff',
      'center',
    );
    this.timerText = this.makeText(
      GAME_CONFIG.width - 28,
      18,
      18,
      '#edf7ff',
      'right',
    );
    this.bossText = this.makeText(
      GAME_CONFIG.width * 0.5,
      64,
      14,
      '#edf7ff',
      'center',
    );
    this.pauseText = this.makeText(
      GAME_CONFIG.width * 0.5,
      GAME_CONFIG.height * 0.5,
      34,
      '#ffffff',
      'center',
    );
    this.debugText = this.makeText(
      24,
      GAME_CONFIG.height - 108,
      13,
      '#e6f5ff',
      'left',
    );
    this.pauseText.setVisible(false).setText('PAUSED');
    this.bossText.setVisible(false);
    this.debugText.setVisible(this.debugVisible);
    registerUiObject?.([
      this.bars,
      this.scoreText,
      this.comboText,
      this.syncText,
      this.syncLabelText,
      this.integrityLabelText,
      this.burstLabelText,
      this.phaseText,
      this.timerText,
      this.bossText,
      this.pauseText,
      this.debugText,
    ]);
  }

  setPalette(primary: number, secondary: number, accent: number, danger: number): void {
    this.primary = primary;
    this.secondary = secondary;
    this.accent = accent;
    this.danger = danger;
  }

  setDebugVisible(visible: boolean): void {
    this.debugVisible = visible;
    this.debugText.setVisible(visible);
  }

  update(state: HudState): void {
    this.scoreText.setText(`Score ${state.score.toString().padStart(7, '0')}`);
    this.comboText.setText(`Combo ${state.combo.toString().padStart(3, '0')}  x${state.multiplier.toFixed(2)}`);
    this.syncText.setText(`Sync ${state.syncTier.toUpperCase()}  ${Math.round(state.syncGauge)}%`);
    this.phaseText.setText(state.phaseLabel.toUpperCase());
    this.timerText.setText(`${Math.floor(state.elapsedSeconds / 60)
      .toString()
      .padStart(2, '0')}:${Math.floor(state.elapsedSeconds % 60)
      .toString()
      .padStart(2, '0')}`);
    this.pauseText.setVisible(state.paused);
    this.debugText.setText(state.debugText);

    if (state.boss?.active) {
      this.bossText.setVisible(true);
      this.bossText.setText(`${state.boss.label}  ${Math.max(0, Math.round((state.boss.health / state.boss.maxHealth) * 100))}%`);
    } else {
      this.bossText.setVisible(false);
    }

    this.bars.clear();
    this.bars.fillStyle(0x050816, 0.52);
    this.bars.fillRect(28, 122, 256, 8);
    this.bars.fillStyle(this.primary, 0.85);
    this.bars.fillRect(28, 122, 256 * (state.syncGauge / 100), 8);

    this.bars.fillStyle(0x050816, 0.52);
    this.bars.fillRect(28, 154, 256, 8);
    this.bars.fillStyle(this.danger, 0.92);
    this.bars.fillRect(28, 154, 256 * (state.integrity / GAME_CONFIG.integrityMax), 8);

    const burstCharge = Phaser.Math.Clamp(
      1 - state.burstReadyIn / GAME_CONFIG.burstCooldownSec,
      0,
      1,
    );
    this.bars.fillStyle(0x050816, 0.52);
    this.bars.fillRect(GAME_CONFIG.width - 276, GAME_CONFIG.height - 42, 240, 8);
    this.bars.fillStyle(state.burstReadyIn <= 0 ? this.accent : this.secondary, 0.9);
    this.bars.fillRect(
      GAME_CONFIG.width - 276,
      GAME_CONFIG.height - 42,
      240 * burstCharge,
      8,
    );

    for (let index = 0; index < GAME_CONFIG.maxLocks; index += 1) {
      const filled = index < state.queuedLocks;
      this.bars.fillStyle(filled ? this.secondary : 0x183047, filled ? 0.9 : 0.5);
      this.bars.fillRect(20 + index * 22, GAME_CONFIG.height - 42, 16, 14);
    }

    if (state.boss?.active) {
      this.bars.fillStyle(0x050816, 0.45);
      this.bars.fillRect(360, 54, 560, 10);
      this.bars.fillStyle(this.secondary, 0.86);
      this.bars.fillRect(
        360,
        54,
        560 * (state.boss.health / state.boss.maxHealth),
        10,
      );
    }
  }

  private makeText(
    x: number,
    y: number,
    size: number,
    color: string,
    align: 'left' | 'center' | 'right',
  ): Phaser.GameObjects.Text {
    return this.scene.add
      .text(x, y, '', {
        fontFamily: 'Chakra Petch',
        fontSize: `${size}px`,
        fontStyle: '600',
        color,
        align,
      })
      .setDepth(120)
      .setOrigin(align === 'left' ? 0 : align === 'center' ? 0.5 : 1, 0);
  }
}
