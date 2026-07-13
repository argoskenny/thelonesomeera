import Phaser from 'phaser';
import { GAME_CONFIG } from '@/game/content/config/gameConfig';

interface PooledImage {
  image: Phaser.GameObjects.Image;
}

export class FXSystem {
  private readonly ringPool: PooledImage[];
  private readonly shardPool: PooledImage[];
  private readonly flashOverlay: Phaser.GameObjects.Rectangle;
  private readonly chromaticPrimary: Phaser.GameObjects.Graphics;
  private readonly chromaticSecondary: Phaser.GameObjects.Graphics;
  private readonly scanlineOverlay: Phaser.GameObjects.Graphics;
  private readonly glitchOverlay: Phaser.GameObjects.Graphics;
  private primary = 0x35e7ff;
  private secondary = 0xff4cb7;
  private accent = 0xdfff4f;

  constructor(
    private readonly scene: Phaser.Scene,
    registerWorldObject?: (
      objects: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[],
    ) => void,
  ) {
    this.ringPool = Array.from({ length: 30 }, () => ({
      image: this.scene.add
        .image(0, 0, 'fx-ring')
        .setVisible(false)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(88),
    }));
    this.shardPool = Array.from({ length: 64 }, () => ({
      image: this.scene.add
        .image(0, 0, 'fx-shard')
        .setVisible(false)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(88),
    }));
    this.flashOverlay = this.scene.add
      .rectangle(
        GAME_CONFIG.width * 0.5,
        GAME_CONFIG.height * 0.5,
        GAME_CONFIG.width,
        GAME_CONFIG.height,
        0xffffff,
        0,
      )
      .setDepth(92)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.chromaticPrimary = this.scene.add
      .graphics()
      .setDepth(93)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0);
    this.chromaticSecondary = this.scene.add
      .graphics()
      .setDepth(94)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0);
    this.scanlineOverlay = this.scene.add
      .graphics()
      .setDepth(95)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0);
    this.glitchOverlay = this.scene.add
      .graphics()
      .setDepth(96)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0);
    registerWorldObject?.([
      ...this.ringPool.map((entry) => entry.image),
      ...this.shardPool.map((entry) => entry.image),
      this.flashOverlay,
      this.chromaticPrimary,
      this.chromaticSecondary,
      this.scanlineOverlay,
      this.glitchOverlay,
    ]);
  }

  setPalette(primary: number, secondary: number, accent: number): void {
    this.primary = primary;
    this.secondary = secondary;
    this.accent = accent;
  }

  spawnLockFeedback(x: number, y: number): void {
    this.spawnRing(x, y, this.primary, 0.3, 1.05, 180, 0.42);
    this.spawnShards(x, y, this.secondary, 4, 46, 160);
  }

  spawnImpact(x: number, y: number, color: number): void {
    this.spawnRing(x, y, 0xffffff, 0.18, 0.74, 140, 0.54);
    this.spawnRing(x, y, color, 0.24, 0.92, 220, 0.35);
    this.spawnShards(x, y, color, GAME_CONFIG.quality.impactShards, 90, 220);
  }

  spawnExplosion(x: number, y: number, color: number): void {
    this.spawnRing(x, y, 0xffffff, 0.22, 1.25, 180, 0.68);
    this.spawnRing(x, y, color, 0.34, 1.75, 340, 0.46);
    this.spawnShards(x, y, color, GAME_CONFIG.quality.burstShards, 160, 360);
  }

  spawnBurst(centerX: number, centerY: number, perfect: boolean): void {
    this.spawnRing(centerX, centerY, perfect ? this.accent : this.primary, 0.4, 8.4, 520, 0.38);
    this.flashOverlay.setAlpha(perfect ? 0.22 : 0.14);
    this.scene.tweens.add({
      targets: this.flashOverlay,
      alpha: 0,
      duration: 220,
      ease: 'quad.out',
    });
  }

  spawnSpecialHit(centerX: number, centerY: number, color: number, intensity: number): void {
    const clamped = Phaser.Math.Clamp(intensity, 0.8, 2.4);
    const impactRadius = 42 + clamped * 22;
    const offset = 5 + clamped * 4;

    this.scene.tweens.killTweensOf([
      this.flashOverlay,
      this.chromaticPrimary,
      this.chromaticSecondary,
      this.scanlineOverlay,
      this.glitchOverlay,
    ]);

    this.flashOverlay.setFillStyle(color, 1);
    this.flashOverlay.setAlpha(0.06 + clamped * 0.04);

    this.chromaticPrimary.clear();
    this.chromaticPrimary.lineStyle(2, this.primary, 0.22 + clamped * 0.08);
    this.chromaticPrimary.strokeRect(8, 8, GAME_CONFIG.width - 16, GAME_CONFIG.height - 16);
    this.chromaticPrimary.strokeCircle(centerX - offset, centerY, impactRadius);
    this.chromaticPrimary.strokeCircle(centerX - offset * 1.6, centerY, impactRadius * 1.34);
    this.chromaticPrimary.setPosition(-offset, 0).setAlpha(0.28 + clamped * 0.08);

    this.chromaticSecondary.clear();
    this.chromaticSecondary.lineStyle(2, this.secondary, 0.18 + clamped * 0.1);
    this.chromaticSecondary.strokeRect(12, 12, GAME_CONFIG.width - 24, GAME_CONFIG.height - 24);
    this.chromaticSecondary.strokeCircle(centerX + offset, centerY, impactRadius * 0.9);
    this.chromaticSecondary.strokeCircle(centerX + offset * 1.5, centerY, impactRadius * 1.16);
    this.chromaticSecondary.setPosition(offset, 0).setAlpha(0.24 + clamped * 0.1);

    this.scanlineOverlay.clear();
    for (let y = 0; y <= GAME_CONFIG.height; y += 14) {
      const alpha = 0.025 + Phaser.Math.FloatBetween(0, 0.05) * clamped;
      this.scanlineOverlay.lineStyle(1, 0xffffff, alpha);
      this.scanlineOverlay.strokeLineShape(
        new Phaser.Geom.Line(0, y, GAME_CONFIG.width, y + Phaser.Math.Between(-1, 1)),
      );
    }
    for (let index = 0; index < 4; index += 1) {
      const y = Phaser.Math.Between(24, GAME_CONFIG.height - 24);
      this.scanlineOverlay.lineStyle(2, this.accent, 0.08 + clamped * 0.05);
      this.scanlineOverlay.strokeLineShape(
        new Phaser.Geom.Line(0, y, GAME_CONFIG.width, y),
      );
    }
    this.scanlineOverlay.setAlpha(0.24 + clamped * 0.08);

    this.glitchOverlay.clear();
    for (let index = 0; index < Math.round(4 + clamped * 3); index += 1) {
      const sliceY = Phaser.Math.Between(12, GAME_CONFIG.height - 36);
      const sliceHeight = Phaser.Math.Between(8, 24);
      const sliceX = Phaser.Math.Between(0, 240);
      const sliceWidth = Phaser.Math.Between(140, 420);
      const tint = index % 2 === 0 ? this.secondary : this.primary;
      this.glitchOverlay.fillStyle(tint, 0.08 + clamped * 0.04);
      this.glitchOverlay.fillRect(sliceX, sliceY, sliceWidth, sliceHeight);
      this.glitchOverlay.lineStyle(1, 0xffffff, 0.1 + clamped * 0.05);
      this.glitchOverlay.strokeRect(
        sliceX + Phaser.Math.Between(-12, 12),
        sliceY,
        sliceWidth,
        sliceHeight,
      );
    }
    this.glitchOverlay.setAlpha(0.22 + clamped * 0.08);

    this.scene.tweens.add({
      targets: this.flashOverlay,
      alpha: 0,
      duration: 120 + clamped * 35,
      ease: 'quad.out',
    });
    this.scene.tweens.add({
      targets: this.chromaticPrimary,
      x: 0,
      alpha: 0,
      duration: 150 + clamped * 45,
      ease: 'quad.out',
      onComplete: () => {
        this.chromaticPrimary.clear();
      },
    });
    this.scene.tweens.add({
      targets: this.chromaticSecondary,
      x: 0,
      alpha: 0,
      duration: 150 + clamped * 45,
      ease: 'quad.out',
      onComplete: () => {
        this.chromaticSecondary.clear();
      },
    });
    this.scene.tweens.add({
      targets: this.scanlineOverlay,
      alpha: 0,
      duration: 100 + clamped * 30,
      ease: 'quad.out',
      onComplete: () => {
        this.scanlineOverlay.clear();
      },
    });
    this.scene.tweens.add({
      targets: this.glitchOverlay,
      alpha: 0,
      duration: 90 + clamped * 28,
      ease: 'quad.out',
      onComplete: () => {
        this.glitchOverlay.clear();
      },
    });
  }

  spawnTrail(x: number, y: number, color: number): void {
    const pooled = this.shardPool.find((entry) => !entry.image.visible);
    if (!pooled) {
      return;
    }

    pooled.image
      .setVisible(true)
      .setPosition(x, y)
      .setTint(color)
      .setScale(0.24)
      .setAlpha(0.38)
      .setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2));

    this.scene.tweens.add({
      targets: pooled.image,
      alpha: 0,
      scale: 0.12,
      duration: 120,
      onComplete: () => {
        pooled.image.setVisible(false);
      },
    });
  }

  private spawnRing(
    x: number,
    y: number,
    color: number,
    fromScale: number,
    toScale: number,
    duration: number,
    alpha: number,
  ): void {
    const pooled = this.ringPool.find((entry) => !entry.image.visible);
    if (!pooled) {
      return;
    }

    pooled.image
      .setVisible(true)
      .setPosition(x, y)
      .setTint(color)
      .setScale(fromScale)
      .setAlpha(alpha);

    this.scene.tweens.add({
      targets: pooled.image,
      scale: toScale,
      alpha: 0,
      duration,
      ease: 'quad.out',
      onComplete: () => {
        pooled.image.setVisible(false);
      },
    });
  }

  private spawnShards(
    x: number,
    y: number,
    color: number,
    count: number,
    speed: number,
    duration: number,
  ): void {
    for (let index = 0; index < count; index += 1) {
      const pooled = this.shardPool.find((entry) => !entry.image.visible);
      if (!pooled) {
        return;
      }

      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.FloatBetween(speed * 0.5, speed);
      pooled.image
        .setVisible(true)
        .setPosition(x, y)
        .setTint(color)
        .setScale(Phaser.Math.FloatBetween(0.3, 0.75))
        .setAlpha(0.7)
        .setRotation(angle);

      this.scene.tweens.add({
        targets: pooled.image,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        duration,
        ease: 'quad.out',
        onComplete: () => {
          pooled.image.setVisible(false);
        },
      });
    }
  }
}
