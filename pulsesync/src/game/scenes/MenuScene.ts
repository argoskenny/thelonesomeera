import Phaser from 'phaser';
import { getProceduralBGMSong, getProceduralBGMSongs } from '@/game/audio/bgm/catalog';
import {
  getSelectedProceduralBGMSongId,
  setSelectedProceduralBGMSongId,
} from '@/game/audio/bgm/selection';
import { resumeToneContext } from '@/game/systems/toneRuntime';

interface ButtonStyle {
  fill: number;
  stroke: number;
  glow: number;
  text: string;
  alpha: number;
}

interface ButtonHandle {
  glow: Phaser.GameObjects.Rectangle;
  background: Phaser.GameObjects.Rectangle;
  labelText: Phaser.GameObjects.Text;
  sublabelText: Phaser.GameObjects.Text;
  hit: Phaser.GameObjects.Zone | null;
}

const BUTTON_WIDTH = 420;
const BUTTON_HEIGHT = 78;
const SONG_PANEL_WIDTH = 560;
const SONG_ROW_HEIGHT = 72;

export class MenuScene extends Phaser.Scene {
  private starting = false;
  private pickerOpen = false;
  private pickerObjects: Phaser.GameObjects.GameObject[] = [];
  private rings: Phaser.GameObjects.Image[] = [];
  private selectButton: ButtonHandle | null = null;

  constructor() {
    super('menu');
  }

  create(): void {
    this.starting = false;
    this.pickerOpen = false;
    this.pickerObjects = [];
    this.selectButton = null;
    this.cameras.main.setBackgroundColor('#050816');
    this.createBackdrop();
    this.createLandingPage();
    this.registerInputs();
  }

  update(_time: number, delta: number): void {
    const deltaSeconds = delta / 1000;
    this.rings[0].rotation += deltaSeconds * 0.11;
    this.rings[1].rotation -= deltaSeconds * 0.2;
    this.rings[2].rotation += deltaSeconds * 0.32;
  }

  private createBackdrop(): void {
    this.add
      .image(this.scale.width * 0.5, this.scale.height * 0.5, 'boss-ring')
      .setTint(0x173b6d)
      .setScale(2.9)
      .setAlpha(0.22);

    this.rings = [
      this.add
        .image(this.scale.width * 0.5, this.scale.height * 0.5, 'boss-ring')
        .setTint(0x35e7ff)
        .setScale(1.9)
        .setAlpha(0.2),
      this.add
        .image(this.scale.width * 0.5, this.scale.height * 0.5, 'boss-ring')
        .setTint(0xff4cb7)
        .setScale(1.26)
        .setAlpha(0.16),
      this.add
        .image(this.scale.width * 0.5, this.scale.height * 0.5, 'boss-ring')
        .setTint(0xdfff4f)
        .setScale(0.76)
        .setAlpha(0.1),
    ];

    this.add
      .rectangle(this.scale.width * 0.5, this.scale.height * 0.5, 1080, 612, 0x081427, 0.62)
      .setStrokeStyle(2, 0x2a86cc, 0.28);
  }

  private createLandingPage(): void {
    const selectedSong = getProceduralBGMSong(getSelectedProceduralBGMSongId(this));
    const hasMultipleSongs = getProceduralBGMSongs().length > 1;

    this.add
      .text(this.scale.width * 0.5, 118, 'PULSE SYNC', {
        fontFamily: 'Chakra Petch',
        fontSize: '58px',
        fontStyle: '700',
        color: '#f8fbff',
      })
      .setOrigin(0.5)
      .setShadow(0, 0, '#35e7ff', 24);

    this.add
      .text(this.scale.width * 0.5, 180, 'Rhythm lock-on rail combat inside a dormant cognition core', {
        fontFamily: 'Chakra Petch',
        fontSize: '18px',
        color: '#d4e7ff',
      })
      .setOrigin(0.5);

    const primaryStyle: ButtonStyle = {
      fill: 0x081e34,
      stroke: 0x35e7ff,
      glow: 0x35e7ff,
      text: '#f7fbff',
      alpha: 0.84,
    };
    const secondaryStyle: ButtonStyle = {
      fill: 0x10122d,
      stroke: 0xff4cb7,
      glow: 0xff4cb7,
      text: '#ffe6f4',
      alpha: 0.82,
    };
    const disabledStyle: ButtonStyle = {
      fill: 0x11161e,
      stroke: 0x5f7188,
      glow: 0x8aa3bf,
      text: '#afc3d8',
      alpha: 0.58,
    };

    this.createButton(
      this.scale.width * 0.5,
      314,
      'START SYNCHRONIZE',
      'Launch combat now',
      secondaryStyle,
      true,
      () => {
        void this.startDemo();
      },
    );
    this.createButton(
      this.scale.width * 0.5,
      414,
      'HOW TO PLAY',
      'Open combat guide',
      primaryStyle,
      true,
      () => this.scene.start('how-to-play'),
    );
    this.selectButton = this.createButton(
      this.scale.width * 0.5,
      514,
      'SELECT BGM',
      hasMultipleSongs ? `Current: ${selectedSong.title} · Open track list` : `${selectedSong.title} loaded`,
      hasMultipleSongs ? primaryStyle : disabledStyle,
      hasMultipleSongs,
      () => {
        this.toggleSongPicker();
      },
    );

    const prompt = this.add
      .text(this.scale.width * 0.5, 638, 'Space / Enter also starts synchronization', {
        fontFamily: 'Chakra Petch',
        fontSize: '18px',
        color: '#dfff4f',
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: prompt,
      alpha: 0.32,
      duration: 760,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });
  }

  private createButton(
    x: number,
    y: number,
    label: string,
    sublabel: string,
    style: ButtonStyle,
    enabled: boolean,
    onClick?: () => void,
  ): ButtonHandle {
    const glow = this.add
      .rectangle(x, y, BUTTON_WIDTH + 16, BUTTON_HEIGHT + 16, style.glow, 0.08)
      .setStrokeStyle(1, style.glow, 0.22);
    const background = this.add
      .rectangle(x, y, BUTTON_WIDTH, BUTTON_HEIGHT, style.fill, style.alpha)
      .setStrokeStyle(2, style.stroke, enabled ? 0.78 : 0.36);
    const labelText = this.add
      .text(x, y - 10, label, {
        fontFamily: 'Chakra Petch',
        fontSize: '24px',
        fontStyle: '700',
        color: style.text,
      })
      .setOrigin(0.5);
    const sublabelText = this.add
      .text(x, y + 18, sublabel, {
        fontFamily: 'Chakra Petch',
        fontSize: '14px',
        color: enabled ? '#b9d2eb' : '#8ea0b3',
      })
      .setOrigin(0.5);

    if (!enabled) {
      return {
        glow,
        background,
        labelText,
        sublabelText,
        hit: null,
      };
    }

    const hit = this.add.zone(x, y, BUTTON_WIDTH, BUTTON_HEIGHT).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => {
      onClick?.();
    });
    hit.on('pointerover', () => {
      glow.setFillStyle(style.glow, 0.14);
      background.setStrokeStyle(2, style.stroke, 1);
      labelText.y = y - 12;
      sublabelText.y = y + 16;
    });
    hit.on('pointerout', () => {
      glow.setFillStyle(style.glow, 0.08);
      background.setStrokeStyle(2, style.stroke, 0.78);
      labelText.y = y - 10;
      sublabelText.y = y + 18;
    });
    return {
      glow,
      background,
      labelText,
      sublabelText,
      hit,
    };
  }

  private registerInputs(): void {
    this.input.keyboard?.on('keydown-SPACE', () => {
      void this.startDemo();
    });
    this.input.keyboard?.on('keydown-ENTER', () => {
      void this.startDemo();
    });
  }

  private async startDemo(): Promise<void> {
    if (this.starting || this.pickerOpen) {
      return;
    }

    this.starting = true;
    await resumeToneContext();
    this.scene.start('demo');
  }

  private toggleSongPicker(): void {
    if (this.pickerOpen) {
      this.closeSongPicker();
      return;
    }

    this.openSongPicker();
  }

  private openSongPicker(): void {
    this.closeSongPicker();
    this.pickerOpen = true;

    const songs = getProceduralBGMSongs();
    const currentSongId = getSelectedProceduralBGMSongId(this);
    const panelHeight = 148 + songs.length * SONG_ROW_HEIGHT;
    const panelY = this.scale.height * 0.5 + 14;

    const overlay = this.add
      .rectangle(this.scale.width * 0.5, this.scale.height * 0.5, this.scale.width, this.scale.height, 0x02050d, 0.58)
      .setDepth(20)
      .setInteractive({ useHandCursor: true });
    overlay.on('pointerdown', () => {
      this.closeSongPicker();
    });

    const panel = this.add
      .rectangle(this.scale.width * 0.5, panelY, SONG_PANEL_WIDTH, panelHeight, 0x081427, 0.96)
      .setDepth(21)
      .setStrokeStyle(2, 0x35e7ff, 0.44);
    const title = this.add
      .text(this.scale.width * 0.5, panelY - panelHeight * 0.5 + 34, 'SELECT BGM', {
        fontFamily: 'Chakra Petch',
        fontSize: '28px',
        fontStyle: '700',
        color: '#f7fbff',
      })
      .setOrigin(0.5)
      .setDepth(22);
    const hint = this.add
      .text(this.scale.width * 0.5, panelY - panelHeight * 0.5 + 68, 'Choose the soundtrack for the next run', {
        fontFamily: 'Chakra Petch',
        fontSize: '14px',
        color: '#b8d5ee',
      })
      .setOrigin(0.5)
      .setDepth(22);

    this.pickerObjects.push(overlay, panel, title, hint);

    songs.forEach((song, index) => {
      const rowY = panelY - panelHeight * 0.5 + 122 + index * SONG_ROW_HEIGHT;
      const selected = song.id === currentSongId;
      const row = this.add
        .rectangle(this.scale.width * 0.5, rowY, SONG_PANEL_WIDTH - 44, SONG_ROW_HEIGHT - 10, selected ? 0x112947 : 0x0d1726, 0.96)
        .setDepth(22)
        .setStrokeStyle(2, selected ? 0x35e7ff : 0x4e6480, selected ? 0.92 : 0.34)
        .setInteractive({ useHandCursor: true });
      const songTitle = this.add
        .text(this.scale.width * 0.5 - 234, rowY - 14, song.title, {
          fontFamily: 'Chakra Petch',
          fontSize: '20px',
          fontStyle: '700',
          color: selected ? '#f7fbff' : '#d7e5f6',
        })
        .setOrigin(0, 0.5)
        .setDepth(23);
      const songDescription = this.add
        .text(this.scale.width * 0.5 - 234, rowY + 12, song.description, {
          fontFamily: 'Chakra Petch',
          fontSize: '12px',
          color: selected ? '#bfe8ff' : '#92a7bc',
          wordWrap: { width: SONG_PANEL_WIDTH - 140 },
        })
        .setOrigin(0, 0.5)
        .setDepth(23);
      const badge = this.add
        .text(this.scale.width * 0.5 + 210, rowY, selected ? 'ACTIVE' : 'SELECT', {
          fontFamily: 'Chakra Petch',
          fontSize: '12px',
          fontStyle: '700',
          color: selected ? '#35e7ff' : '#dfff4f',
        })
        .setOrigin(0.5)
        .setDepth(23);

      row.on('pointerover', () => {
        row.setStrokeStyle(2, selected ? 0x35e7ff : 0xdfff4f, 0.92);
      });
      row.on('pointerout', () => {
        row.setStrokeStyle(2, selected ? 0x35e7ff : 0x4e6480, selected ? 0.92 : 0.34);
      });
      row.on('pointerdown', () => {
        setSelectedProceduralBGMSongId(this, song.id);
        this.updateSelectedSongButton();
        this.closeSongPicker();
      });

      this.pickerObjects.push(row, songTitle, songDescription, badge);
    });
  }

  private closeSongPicker(): void {
    this.pickerObjects.forEach((object) => object.destroy());
    this.pickerObjects = [];
    this.pickerOpen = false;
  }

  private updateSelectedSongButton(): void {
    if (!this.selectButton) {
      return;
    }

    const selectedSong = getProceduralBGMSong(getSelectedProceduralBGMSongId(this));
    this.selectButton.sublabelText.setText(`Current: ${selectedSong.title} · Open track list`);
  }
}
