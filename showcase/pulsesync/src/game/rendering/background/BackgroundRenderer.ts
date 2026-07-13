import Phaser from 'phaser';
import { GAME_CONFIG } from '@/game/content/config/gameConfig';
import { VISUAL_PALETTES, type VisualPalette } from '@/game/content/palette/palettes';
import { EventBus } from '@/game/systems/EventBus';
import type { GameEventMap } from '@/game/types/GameEvents';

interface Star {
  x: number;
  y: number;
  speed: number;
  size: number;
  twinkle: number;
}

interface Stream {
  x: number;
  y: number;
  length: number;
  speed: number;
  thickness: number;
}

export class BackgroundRenderer {
  private readonly far: Phaser.GameObjects.Graphics;
  private readonly mid: Phaser.GameObjects.Graphics;
  private readonly flow: Phaser.GameObjects.Graphics;
  private readonly overlay: Phaser.GameObjects.Graphics;
  private readonly stars: Star[];
  private readonly streams: Stream[];
  private readonly disposers: Array<() => void> = [];
  private palette: VisualPalette = VISUAL_PALETTES.boot;
  private beatPulse = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly bus: EventBus<GameEventMap>,
    registerWorldObject?: (
      objects: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[],
    ) => void,
  ) {
    this.far = this.scene.add.graphics().setDepth(0);
    this.mid = this.scene.add.graphics().setDepth(2);
    this.flow = this.scene.add.graphics().setDepth(4);
    this.overlay = this.scene.add.graphics().setDepth(6);
    registerWorldObject?.([this.far, this.mid, this.flow, this.overlay]);
    this.stars = Array.from({ length: GAME_CONFIG.quality.starCount }, () => ({
      x: Phaser.Math.Between(0, GAME_CONFIG.width),
      y: Phaser.Math.Between(0, GAME_CONFIG.height),
      speed:
        Phaser.Math.FloatBetween(0.08, 0.38) *
        90 *
        GAME_CONFIG.background.starSpeedMultiplier,
      size: Phaser.Math.FloatBetween(1, 2.4),
      twinkle: Phaser.Math.FloatBetween(0, Math.PI * 2),
    }));
    this.streams = Array.from({ length: GAME_CONFIG.quality.streamCount }, (_, index) =>
      this.createStream(
        Phaser.Math.Between(
          0,
          GAME_CONFIG.width + GAME_CONFIG.background.streamSpawnPadding,
        ) + index * 18,
      ),
    );

    this.disposers.push(
      this.bus.on('beat:beat', () => {
        this.beatPulse = 1;
      }),
    );
    this.disposers.push(
      this.bus.on('timeline:visual', ({ cue }) => {
        this.palette = VISUAL_PALETTES[cue.palette];
      }),
    );
  }

  getPalette(): VisualPalette {
    return this.palette;
  }

  update(
    deltaSeconds: number,
    elapsedSeconds: number,
    syncIntensity: number,
    distortionLevel: number,
  ): void {
    this.beatPulse = Math.max(0, this.beatPulse - deltaSeconds * 1.6);
    this.far.clear();
    this.mid.clear();
    this.flow.clear();
    this.overlay.clear();

    this.far.fillStyle(this.palette.background, 1);
    this.far.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

    this.stars.forEach((star) => {
      star.x -= star.speed * deltaSeconds;
      if (star.x < -star.size * 4) {
        this.resetStar(star);
      }
      const alpha =
        0.2 +
        Math.sin(elapsedSeconds * 1.8 + star.twinkle) * 0.08 +
        syncIntensity * 0.1;
      this.far.fillStyle(this.palette.highlight, alpha);
      this.far.fillCircle(star.x, star.y, star.size);
    });

    this.mid.lineStyle(1, this.palette.grid, 0.26 + syncIntensity * 0.12);
    for (let laneIndex = 0; laneIndex < GAME_CONFIG.laneYs.length; laneIndex += 1) {
      const laneY = GAME_CONFIG.laneYs[laneIndex];
      this.mid.strokeLineShape(
        new Phaser.Geom.Line(180, GAME_CONFIG.height * 0.5, GAME_CONFIG.width, laneY),
      );
    }

    for (let column = 0; column < 9; column += 1) {
      const x = 260 + column * 120;
      this.mid.strokeLineShape(
        new Phaser.Geom.Line(x, 64, x + Math.sin(elapsedSeconds + column) * 20, GAME_CONFIG.height - 64),
      );
    }

    this.mid.lineStyle(2, this.palette.primary, 0.12 + this.beatPulse * 0.3);
    this.mid.strokeCircle(
      GAME_CONFIG.emitterAnchor.x,
      GAME_CONFIG.emitterAnchor.y,
      90 + this.beatPulse * 24,
    );
    this.mid.strokeCircle(
      GAME_CONFIG.emitterAnchor.x,
      GAME_CONFIG.emitterAnchor.y,
      160 + syncIntensity * 40,
    );

    this.streams.forEach((stream, index) => {
      stream.x -= stream.speed * deltaSeconds;
      if (stream.x + stream.length < 0) {
        this.resetStream(stream);
      }
      const wobble = Math.sin(elapsedSeconds * 2 + index) * 12 * (1 + distortionLevel);
      this.flow.lineStyle(
        stream.thickness,
        index % 2 === 0 ? this.palette.primary : this.palette.secondary,
        0.14 + syncIntensity * 0.12,
      );
      this.flow.strokeLineShape(
        new Phaser.Geom.Line(
          stream.x,
          stream.y + wobble,
          stream.x - stream.length,
          stream.y + wobble,
        ),
      );
    });

    this.overlay.lineStyle(2, this.palette.primary, 0.12 + this.beatPulse * 0.45);
    this.overlay.strokeCircle(
      GAME_CONFIG.width * 0.58,
      GAME_CONFIG.height * 0.5,
      210 + this.beatPulse * 100 + syncIntensity * 20,
    );
    this.overlay.lineStyle(4, this.palette.secondary, 0.06 + this.beatPulse * 0.2);
    this.overlay.strokeRect(12, 12, GAME_CONFIG.width - 24, GAME_CONFIG.height - 24);

    if (distortionLevel > 0) {
      this.overlay.lineStyle(1, this.palette.accent, 0.1 + distortionLevel * 0.08);
      for (let index = 0; index < 14; index += 1) {
        const y = 40 + index * 46 + Math.sin(elapsedSeconds * 4 + index) * 8 * distortionLevel;
        this.overlay.strokeLineShape(
          new Phaser.Geom.Line(0, y, GAME_CONFIG.width, y + Math.sin(index + elapsedSeconds * 2) * 12 * distortionLevel),
        );
      }
    }
  }

  destroy(): void {
    this.disposers.forEach((dispose) => dispose());
    this.far.destroy();
    this.mid.destroy();
    this.flow.destroy();
    this.overlay.destroy();
  }

  private resetStar(star: Star): void {
    star.x = GAME_CONFIG.width + Phaser.Math.Between(8, 220);
    star.y = Phaser.Math.Between(0, GAME_CONFIG.height);
    star.speed =
      Phaser.Math.FloatBetween(0.08, 0.38) *
      90 *
      GAME_CONFIG.background.starSpeedMultiplier;
    star.size = Phaser.Math.FloatBetween(1, 2.4);
    star.twinkle = Phaser.Math.FloatBetween(0, Math.PI * 2);
  }

  private createStream(x: number): Stream {
    return {
      x,
      y: Phaser.Math.Between(0, GAME_CONFIG.height),
      length: Phaser.Math.Between(90, 220),
      speed:
        Phaser.Math.FloatBetween(100, 220) *
        GAME_CONFIG.background.streamSpeedMultiplier,
      thickness: Phaser.Math.FloatBetween(1, 1.9),
    };
  }

  private resetStream(stream: Stream): void {
    const refreshed = this.createStream(
      GAME_CONFIG.width +
        Phaser.Math.Between(80, GAME_CONFIG.background.streamSpawnPadding),
    );
    stream.x = refreshed.x;
    stream.y = refreshed.y;
    stream.length = refreshed.length;
    stream.speed = refreshed.speed;
    stream.thickness = refreshed.thickness;
  }
}
