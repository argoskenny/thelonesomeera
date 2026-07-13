import Phaser from 'phaser';

export class CameraFXSystem {
  private static readonly BOUNCE_SCALE = 0.95;
  private readonly camera: Phaser.Cameras.Scene2D.Camera;

  constructor(private readonly scene: Phaser.Scene) {
    this.camera = this.scene.cameras.main;
  }

  pulse(intensity = 1): void {
    const scaledIntensity = intensity * CameraFXSystem.BOUNCE_SCALE;
    this.camera.shake(70, 0.0016 * scaledIntensity, true);
    this.scene.tweens.add({
      targets: this.camera,
      zoom: 1 + (0.006 * scaledIntensity),
      duration: 90,
      yoyo: true,
      ease: 'quad.out',
    });
  }

  burst(perfect: boolean): void {
    this.camera.flash(120, perfect ? 255 : 140, perfect ? 255 : 220, 255, true);
    this.camera.shake(
      140,
      (perfect ? 0.0056 : 0.0036) * CameraFXSystem.BOUNCE_SCALE,
      true,
    );
    this.scene.tweens.add({
      targets: this.camera,
      zoom: 1 + ((perfect ? 0.032 : 0.018) * CameraFXSystem.BOUNCE_SCALE),
      duration: 180,
      yoyo: true,
      ease: 'quad.out',
    });
  }

  phaseChange(): void {
    this.camera.flash(180, 190, 255, 255, true);
    this.camera.shake(180, 0.0028 * CameraFXSystem.BOUNCE_SCALE, true);
  }

  specialHit(intensity: number): void {
    const clamped = Phaser.Math.Clamp(intensity, 0.8, 2.4);
    this.camera.shake(90 + clamped * 26, 0.0018 * clamped, true);
    this.scene.tweens.add({
      targets: this.camera,
      zoom: 1 + (0.0085 * clamped * CameraFXSystem.BOUNCE_SCALE),
      duration: 100 + clamped * 28,
      yoyo: true,
      ease: 'sine.out',
    });
  }
}
