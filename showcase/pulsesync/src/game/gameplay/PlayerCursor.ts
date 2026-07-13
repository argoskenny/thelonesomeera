import Phaser from 'phaser';
import { GAME_CONFIG } from '@/game/content/config/gameConfig';
import { damp } from '@/game/utils/math';

export interface CursorSnapshot {
  x: number;
  y: number;
}

export class PlayerCursor {
  private readonly container: Phaser.GameObjects.Container;
  private readonly trail: Phaser.GameObjects.Image[];
  private readonly history: CursorSnapshot[] = [];
  private readonly outer: Phaser.GameObjects.Image;
  private readonly inner: Phaser.GameObjects.Image;
  private readonly pulse: Phaser.GameObjects.Image;
  private position: CursorSnapshot = {
    x: GAME_CONFIG.width * 0.5,
    y: GAME_CONFIG.height * 0.5,
  };

  constructor(
    private readonly scene: Phaser.Scene,
    registerWorldObject?: (
      objects: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[],
    ) => void,
  ) {
    this.container = this.scene.add.container(this.position.x, this.position.y).setDepth(80);
    this.pulse = this.scene.add
      .image(0, 0, 'fx-ring')
      .setTint(0x35e7ff)
      .setAlpha(0.22)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScale(0.55);
    this.outer = this.scene.add
      .image(0, 0, 'ui-crosshair')
      .setTint(0xf6fbff)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScale(0.9);
    this.inner = this.scene.add
      .image(0, 0, 'fx-particle')
      .setTint(0xffffff)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScale(0.2);
    this.container.add([this.pulse, this.outer, this.inner]);

    this.trail = Array.from({ length: 8 }, () =>
      this.scene.add
        .image(this.position.x, this.position.y, 'fx-particle')
        .setTint(0x35e7ff)
        .setAlpha(0.1)
        .setScale(0.18)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(78),
    );
    registerWorldObject?.([...this.trail, this.container, this.pulse, this.outer, this.inner]);
  }

  update(deltaSeconds: number, charging: boolean, syncIntensity: number): void {
    const pointer = this.scene.input.activePointer;
    const targetX = Phaser.Math.Clamp(pointer.x, 48, GAME_CONFIG.width - 48);
    const targetY = Phaser.Math.Clamp(pointer.y, 48, GAME_CONFIG.height - 48);

    this.position = {
      x: damp(this.position.x, targetX, 18, deltaSeconds),
      y: damp(this.position.y, targetY, 18, deltaSeconds),
    };

    this.history.unshift({ ...this.position });
    if (this.history.length > this.trail.length + 4) {
      this.history.length = this.trail.length + 4;
    }

    this.trail.forEach((image, index) => {
      const sample = this.history[Math.min(index + 1, this.history.length - 1)];
      if (!sample) {
        return;
      }

      image.setPosition(sample.x, sample.y);
      image.setAlpha(0.22 - index * 0.02 + syncIntensity * 0.06);
      image.setScale(0.18 + index * 0.015);
    });

    this.outer.rotation += deltaSeconds * (charging ? 2.8 : 1.1);
    this.pulse.rotation -= deltaSeconds * 0.9;
    this.pulse.setScale(charging ? 0.78 + Math.sin(this.scene.time.now * 0.012) * 0.06 : 0.55);
    this.pulse.setAlpha(charging ? 0.34 + syncIntensity * 0.24 : 0.16);
    this.outer.setScale(charging ? 1.02 : 0.9);
    this.container.setPosition(this.position.x, this.position.y);
  }

  getSnapshot(): CursorSnapshot {
    return this.position;
  }

  destroy(): void {
    this.container.destroy(true);
    this.trail.forEach((image) => image.destroy());
  }
}
