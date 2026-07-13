import Phaser from 'phaser';
import type { ResultSummary } from '@/game/types/GameTypes';

const DEFAULT_RESULT: ResultSummary = {
  score: 0,
  maxCombo: 0,
  hits: 0,
  kills: 0,
  syncPeak: 'dormant',
  integrityLeft: 0,
  levelTitle: 'Pulse Sync',
  cleared: false,
};
const RETURN_TO_MENU_DELAY_MS = 250;

export class ResultScene extends Phaser.Scene {
  private summary: ResultSummary = DEFAULT_RESULT;

  constructor() {
    super('result');
  }

  init(data: Partial<ResultSummary>): void {
    this.summary = {
      ...DEFAULT_RESULT,
      ...data,
    };
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#04111f');
    this.add
      .image(this.scale.width * 0.5, this.scale.height * 0.5, 'boss-ring')
      .setTint(this.summary.cleared ? 0x87fdff : 0xff6b7b)
      .setScale(2.5)
      .setAlpha(0.16);

    this.add
      .text(this.scale.width * 0.5, 126, this.summary.cleared ? 'CORE AWAKENED' : 'SYNC LOST', {
        fontFamily: 'Chakra Petch',
        fontSize: '52px',
        fontStyle: '700',
        color: this.summary.cleared ? '#f5feff' : '#ffd8e0',
      })
      .setOrigin(0.5);

    this.add
      .text(
        this.scale.width * 0.5,
        286,
        [
          `Level  ${this.summary.levelTitle}`,
          `Score  ${this.summary.score.toString().padStart(7, '0')}`,
          `Max Combo  ${this.summary.maxCombo}`,
          `Hits / Kills  ${this.summary.hits} / ${this.summary.kills}`,
          `Peak Sync  ${this.summary.syncPeak.toUpperCase()}`,
          `Integrity Left  ${this.summary.integrityLeft}%`,
        ].join('\n'),
        {
          fontFamily: 'Chakra Petch',
          fontSize: '24px',
          color: '#edf7ff',
          align: 'center',
          lineSpacing: 14,
        },
      )
      .setOrigin(0.5);

    this.add
      .text(this.scale.width * 0.5, 616, 'Click or press Space to return to Menu', {
        fontFamily: 'Chakra Petch',
        fontSize: '22px',
        fontStyle: '700',
        color: '#dfff4f',
      })
      .setOrigin(0.5);

    this.time.delayedCall(RETURN_TO_MENU_DELAY_MS, () => {
      this.input.once('pointerdown', () => {
        this.scene.start('menu');
      });
      this.input.keyboard?.once('keydown-SPACE', () => {
        this.scene.start('menu');
      });
    });
  }
}
