import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  create(): void {
    this.createTextures();
    this.scene.start('menu');
  }

  private createTextures(): void {
    const g = this.add.graphics();
    g.setVisible(false);

    g.clear();
    g.fillStyle(0xffffff, 0.1);
    g.fillCircle(32, 32, 30);
    g.fillStyle(0xffffff, 0.2);
    g.fillCircle(32, 32, 18);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(32, 32, 7);
    g.generateTexture('fx-particle', 64, 64);

    g.clear();
    g.lineStyle(4, 0xffffff, 1);
    g.strokeCircle(32, 32, 24);
    g.lineStyle(2, 0xffffff, 0.45);
    g.strokeCircle(32, 32, 16);
    g.generateTexture('fx-ring', 64, 64);

    g.clear();
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 2, 24, 4);
    g.generateTexture('fx-shard', 24, 8);

    g.clear();
    g.lineStyle(3, 0xffffff, 1);
    g.strokeCircle(64, 64, 30);
    g.strokeLineShape(new Phaser.Geom.Line(64, 10, 64, 40));
    g.strokeLineShape(new Phaser.Geom.Line(64, 88, 64, 118));
    g.strokeLineShape(new Phaser.Geom.Line(10, 64, 40, 64));
    g.strokeLineShape(new Phaser.Geom.Line(88, 64, 118, 64));
    g.generateTexture('ui-crosshair', 128, 128);

    g.clear();
    g.fillStyle(0xffffff, 0.9);
    g.fillPoints(
      [
        new Phaser.Geom.Point(16, 4),
        new Phaser.Geom.Point(28, 16),
        new Phaser.Geom.Point(16, 28),
        new Phaser.Geom.Point(4, 16),
      ],
      true,
    );
    g.generateTexture('fx-projectile', 32, 32);

    g.clear();
    g.lineStyle(4, 0xffffff, 1);
    g.strokeCircle(32, 32, 22);
    g.lineStyle(2, 0xffffff, 1);
    g.strokeLineShape(new Phaser.Geom.Line(16, 32, 48, 32));
    g.strokeLineShape(new Phaser.Geom.Line(32, 16, 32, 48));
    g.generateTexture('enemy-drone', 64, 64);

    g.clear();
    g.lineStyle(4, 0xffffff, 1);
    g.strokePoints(
      [
        new Phaser.Geom.Point(40, 8),
        new Phaser.Geom.Point(64, 24),
        new Phaser.Geom.Point(64, 56),
        new Phaser.Geom.Point(40, 72),
        new Phaser.Geom.Point(16, 56),
        new Phaser.Geom.Point(16, 24),
      ],
      true,
      true,
    );
    g.lineStyle(2, 0xffffff, 0.6);
    g.strokeCircle(40, 40, 14);
    g.generateTexture('enemy-shield', 80, 80);

    g.clear();
    g.fillStyle(0xffffff, 1);
    g.fillPoints(
      [
        new Phaser.Geom.Point(24, 0),
        new Phaser.Geom.Point(48, 24),
        new Phaser.Geom.Point(24, 48),
        new Phaser.Geom.Point(0, 24),
      ],
      true,
    );
    g.generateTexture('enemy-cluster', 48, 48);

    g.clear();
    g.lineStyle(4, 0xffffff, 1);
    g.strokeTriangle(36, 8, 64, 60, 8, 60);
    g.lineStyle(2, 0xffffff, 0.6);
    g.strokeCircle(36, 40, 10);
    g.generateTexture('enemy-sniper', 72, 72);

    g.clear();
    g.lineStyle(4, 0xffffff, 1);
    g.strokeCircle(36, 36, 18);
    for (let index = 0; index < 8; index += 1) {
      const angle = (index / 8) * Math.PI * 2;
      g.strokeLineShape(
        new Phaser.Geom.Line(
          36 + Math.cos(angle) * 18,
          36 + Math.sin(angle) * 18,
          36 + Math.cos(angle) * 28,
          36 + Math.sin(angle) * 28,
        ),
      );
    }
    g.generateTexture('enemy-mine', 72, 72);

    g.clear();
    g.lineStyle(4, 0xffffff, 1);
    g.strokeCircle(128, 128, 112);
    g.lineStyle(2, 0xffffff, 0.45);
    g.strokeCircle(128, 128, 92);
    for (let index = 0; index < 12; index += 1) {
      const angle = (index / 12) * Math.PI * 2;
      g.strokeLineShape(
        new Phaser.Geom.Line(
          128 + Math.cos(angle) * 100,
          128 + Math.sin(angle) * 100,
          128 + Math.cos(angle) * 120,
          128 + Math.sin(angle) * 120,
        ),
      );
    }
    g.generateTexture('boss-ring', 256, 256);

    g.clear();
    g.lineStyle(6, 0xffffff, 1);
    g.strokeCircle(80, 80, 54);
    g.lineStyle(3, 0xffffff, 0.5);
    g.strokeCircle(80, 80, 34);
    g.fillStyle(0xffffff, 0.22);
    g.fillCircle(80, 80, 18);
    g.generateTexture('boss-core', 160, 160);

    g.clear();
    g.fillStyle(0xffffff, 0.95);
    g.fillPoints(
      [
        new Phaser.Geom.Point(48, 4),
        new Phaser.Geom.Point(92, 54),
        new Phaser.Geom.Point(72, 124),
        new Phaser.Geom.Point(24, 124),
        new Phaser.Geom.Point(4, 54),
      ],
      true,
    );
    g.generateTexture('boss-petal', 96, 128);

    g.clear();
    g.lineStyle(4, 0xffffff, 1);
    g.strokeCircle(36, 36, 22);
    g.lineStyle(2, 0xffffff, 0.45);
    g.strokeCircle(36, 36, 10);
    g.generateTexture('boss-node', 72, 72);

    g.destroy();
  }
}
