import Phaser from 'phaser';
import { GAME_CONFIG } from '@/game/content/config/gameConfig';
import { damp } from '@/game/utils/math';

interface Vertex3 {
  x: number;
  y: number;
  z: number;
}

interface ProjectedVertex extends Vertex3 {
  screenX: number;
  screenY: number;
}

const PHI = (1 + Math.sqrt(5)) / 2;

const DODECAHEDRON_VERTICES: readonly Vertex3[] = [
  { x: 1, y: 1, z: 1 },
  { x: 1, y: 1, z: -1 },
  { x: 1, y: -1, z: 1 },
  { x: 1, y: -1, z: -1 },
  { x: -1, y: 1, z: 1 },
  { x: -1, y: 1, z: -1 },
  { x: -1, y: -1, z: 1 },
  { x: -1, y: -1, z: -1 },
  { x: 0, y: 1 / PHI, z: PHI },
  { x: 0, y: 1 / PHI, z: -PHI },
  { x: 0, y: -1 / PHI, z: PHI },
  { x: 0, y: -1 / PHI, z: -PHI },
  { x: 1 / PHI, y: PHI, z: 0 },
  { x: 1 / PHI, y: -PHI, z: 0 },
  { x: -1 / PHI, y: PHI, z: 0 },
  { x: -1 / PHI, y: -PHI, z: 0 },
  { x: PHI, y: 0, z: 1 / PHI },
  { x: PHI, y: 0, z: -1 / PHI },
  { x: -PHI, y: 0, z: 1 / PHI },
  { x: -PHI, y: 0, z: -1 / PHI },
] as const;

const DODECAHEDRON_EDGES = buildEdges(DODECAHEDRON_VERTICES);

function buildEdges(vertices: readonly Vertex3[]): Array<readonly [number, number]> {
  let minDistance = Number.POSITIVE_INFINITY;

  for (let first = 0; first < vertices.length; first += 1) {
    for (let second = first + 1; second < vertices.length; second += 1) {
      const distance = vertexDistance(vertices[first], vertices[second]);
      if (distance < minDistance) {
        minDistance = distance;
      }
    }
  }

  const threshold = minDistance * 1.02;
  const edges: Array<readonly [number, number]> = [];

  for (let first = 0; first < vertices.length; first += 1) {
    for (let second = first + 1; second < vertices.length; second += 1) {
      const distance = vertexDistance(vertices[first], vertices[second]);
      if (distance <= threshold) {
        edges.push([first, second]);
      }
    }
  }

  return edges;
}

function vertexDistance(a: Vertex3, b: Vertex3): number {
  return Math.sqrt(
    (a.x - b.x) ** 2 +
      (a.y - b.y) ** 2 +
      (a.z - b.z) ** 2,
  );
}

export class PlayerEmitterVessel {
  private static readonly SHELL_SCALE = 20;
  private static readonly DESTRUCTION_WINDUP_SECONDS = 2.5;
  private readonly shellBack: Phaser.GameObjects.Graphics;
  private readonly shellFront: Phaser.GameObjects.Graphics;
  private readonly shellHalo: Phaser.GameObjects.Image;
  private readonly shellAura: Phaser.GameObjects.Image;
  private readonly coreGlow: Phaser.GameObjects.Image;
  private readonly coreBloom: Phaser.GameObjects.Image;
  private readonly anchor = { ...GAME_CONFIG.emitterAnchor };
  private readonly anchorOffset = { x: 0, y: 0 };
  private rotation = {
    x: 0.7,
    y: -0.35,
    z: 0.22,
  };
  private angularVelocity = {
    x: 0.26,
    y: 0.19,
    z: -0.16,
  };
  private hitAngularVelocity = {
    x: 0,
    y: 0,
    z: 0,
  };
  private targetAngularVelocity = {
    x: 0.26,
    y: 0.19,
    z: -0.16,
  };
  private driftCountdown = 0;
  private hitSpinBoost = 0;
  private hitSpinHoldSeconds = 0;
  private firePulse = 0;
  private destructionElapsed = -1;
  private exploded = false;
  private primary = 0x35e7ff;
  private secondary = 0xff4cb7;
  private accent = 0xdfff4f;
  private danger = 0xff5a7c;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly onExplode: () => void,
    registerWorldObject?: (
      objects: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[],
    ) => void,
  ) {
    this.shellBack = this.scene.add
      .graphics()
      .setDepth(60)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.shellFront = this.scene.add
      .graphics()
      .setDepth(61)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.shellHalo = this.scene.add
      .image(this.anchor.x, this.anchor.y, 'fx-ring')
      .setDepth(59)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScale(1.14)
      .setAlpha(0.2);
    this.shellAura = this.scene.add
      .image(this.anchor.x, this.anchor.y, 'fx-ring')
      .setDepth(62)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScale(1.56)
      .setAlpha(0.1);
    this.coreBloom = this.scene.add
      .image(this.anchor.x, this.anchor.y, 'fx-particle')
      .setDepth(63)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScale(0.92)
      .setAlpha(0.24);
    this.coreGlow = this.scene.add
      .image(this.anchor.x, this.anchor.y, 'fx-particle')
      .setDepth(64)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScale(0.36)
      .setAlpha(1);

    this.pickNewSpinTarget(true);
    this.setPalette(this.primary, this.secondary, this.accent, this.danger);
    this.renderShell();
    registerWorldObject?.([
      this.shellBack,
      this.shellFront,
      this.shellHalo,
      this.shellAura,
      this.coreBloom,
      this.coreGlow,
    ]);
  }

  setPalette(primary: number, secondary: number, accent: number, danger: number): void {
    this.primary = primary;
    this.secondary = secondary;
    this.accent = accent;
    this.danger = danger;

    this.shellHalo.setTint(primary);
    this.shellAura.setTint(secondary);
    this.coreBloom.setTint(primary);
    this.coreGlow.setTint(accent);
  }

  update(deltaSeconds: number): void {
    if (this.destructionElapsed >= 0) {
      this.updateDestruction(deltaSeconds);
      return;
    }

    this.driftCountdown -= deltaSeconds;
    if (this.driftCountdown <= 0) {
      this.pickNewSpinTarget();
    }

    this.angularVelocity.x = damp(
      this.angularVelocity.x,
      this.targetAngularVelocity.x,
      1.1,
      deltaSeconds,
    );
    this.angularVelocity.y = damp(
      this.angularVelocity.y,
      this.targetAngularVelocity.y,
      1.1,
      deltaSeconds,
    );
    this.angularVelocity.z = damp(
      this.angularVelocity.z,
      this.targetAngularVelocity.z,
      1.1,
      deltaSeconds,
    );

    if (this.hitSpinHoldSeconds > 0) {
      this.hitSpinHoldSeconds = Math.max(0, this.hitSpinHoldSeconds - deltaSeconds);
      this.hitSpinBoost = damp(this.hitSpinBoost, 1, 16, deltaSeconds);
      this.hitAngularVelocity.x = damp(this.hitAngularVelocity.x, 1.8, 14, deltaSeconds);
      this.hitAngularVelocity.y = damp(this.hitAngularVelocity.y, -1.55, 14, deltaSeconds);
      this.hitAngularVelocity.z = damp(this.hitAngularVelocity.z, 1.95, 14, deltaSeconds);
    } else {
      this.hitSpinBoost = damp(this.hitSpinBoost, 0, 2.3, deltaSeconds);
      this.hitAngularVelocity.x = damp(this.hitAngularVelocity.x, 0, 2.1, deltaSeconds);
      this.hitAngularVelocity.y = damp(this.hitAngularVelocity.y, 0, 2.1, deltaSeconds);
      this.hitAngularVelocity.z = damp(this.hitAngularVelocity.z, 0, 2.1, deltaSeconds);
    }

    this.firePulse = damp(this.firePulse, 0, 8.5, deltaSeconds);
    this.anchorOffset.x = damp(this.anchorOffset.x, 0, 8, deltaSeconds);
    this.anchorOffset.y = damp(this.anchorOffset.y, 0, 8, deltaSeconds);

    this.rotation.x +=
      (this.angularVelocity.x + this.hitAngularVelocity.x) * deltaSeconds * (1 + this.hitSpinBoost * 1.6);
    this.rotation.y +=
      (this.angularVelocity.y + this.hitAngularVelocity.y) * deltaSeconds * (1 + this.hitSpinBoost * 1.6);
    this.rotation.z +=
      (this.angularVelocity.z + this.hitAngularVelocity.z) * deltaSeconds * (1 + this.hitSpinBoost * 1.6);

    const pulse = 0.5 + 0.5 * Math.sin(this.scene.time.now * 0.008);
    this.shellHalo.rotation += deltaSeconds * (0.18 + this.angularVelocity.z * 0.35);
    this.shellAura.rotation -= deltaSeconds * (0.12 + this.angularVelocity.x * 0.24 + this.hitSpinBoost * 1.7);
    this.shellHalo.setAlpha(0.14 + pulse * 0.08 + this.hitSpinBoost * 0.08 + this.firePulse * 0.08);
    this.shellHalo.setScale(1.02 + pulse * 0.06 + this.firePulse * 0.22);
    this.shellAura.setAlpha(0.08 + pulse * 0.05 + this.hitSpinBoost * 0.07 + this.firePulse * 0.05);
    this.shellAura.setScale(1.42 + pulse * 0.08 + this.firePulse * 0.16);
    this.coreBloom.setAlpha(0.16 + pulse * 0.22 + this.hitSpinBoost * 0.1 + this.firePulse * 0.2);
    this.coreBloom.setScale(0.78 + pulse * 0.18 + this.hitSpinBoost * 0.08 + this.firePulse * 0.34);
    this.coreGlow.setAlpha(0.88 + pulse * 0.12 + this.firePulse * 0.12);
    this.coreGlow.setScale(0.28 + pulse * 0.07 + this.hitSpinBoost * 0.04 + this.firePulse * 0.16);

    this.renderShell();
  }

  onFire(): void {
    if (this.destructionElapsed >= 0) {
      return;
    }
    this.firePulse = Math.max(this.firePulse, 1);
  }

  onHit(): void {
    if (this.destructionElapsed >= 0) {
      return;
    }
    this.hitSpinBoost = Math.max(this.hitSpinBoost, 1);
    this.hitSpinHoldSeconds = 1;
    this.hitAngularVelocity = {
      x: 1.8,
      y: -1.55,
      z: 1.95,
    };
    this.pickNewSpinTarget();
  }

  beginDestruction(): void {
    if (this.destructionElapsed >= 0 || this.exploded) {
      return;
    }

    this.destructionElapsed = 0;
    this.firePulse = Math.max(this.firePulse, 1.1);
    this.hitSpinBoost = 1;
    this.hitSpinHoldSeconds = 0;
    this.hitAngularVelocity = {
      x: 2.6,
      y: -2.2,
      z: 2.9,
    };
  }

  destroy(): void {
    this.shellBack.destroy();
    this.shellFront.destroy();
    this.shellHalo.destroy();
    this.shellAura.destroy();
    this.coreBloom.destroy();
    this.coreGlow.destroy();
  }

  private pickNewSpinTarget(initial = false): void {
    this.driftCountdown = Phaser.Math.FloatBetween(1.1, 2.4);
    this.targetAngularVelocity = {
      x: this.randomSpinComponent(),
      y: this.randomSpinComponent(),
      z: this.randomSpinComponent(),
    };

    if (initial) {
      this.angularVelocity = { ...this.targetAngularVelocity };
    }
  }

  private randomSpinComponent(): number {
    const magnitude = Phaser.Math.FloatBetween(0.08, 0.32);
    return magnitude * Phaser.Math.RND.sign();
  }

  private renderShell(): void {
    const projected = DODECAHEDRON_VERTICES.map((vertex) => this.projectVertex(vertex));
    const anchorX = this.anchor.x + this.anchorOffset.x;
    const anchorY = this.anchor.y + this.anchorOffset.y;

    this.shellBack.clear();
    this.shellFront.clear();

    DODECAHEDRON_EDGES.forEach(([fromIndex, toIndex]) => {
      const from = projected[fromIndex];
      const to = projected[toIndex];
      const averageDepth = (from.z + to.z) * 0.5;
      const normalizedDepth = Phaser.Math.Clamp((averageDepth + 54) / 108, 0, 1);
      const isFront = averageDepth >= 0;
      const color = isFront ? this.primary : this.secondary;
      const alpha =
        (isFront ? 0.24 : 0.1) +
        normalizedDepth * (isFront ? 0.5 : 0.16) +
        this.hitSpinBoost * (isFront ? 0.06 : 0.03);
      const lineWidth = isFront ? 2 : 1.35;
      const graphics = isFront ? this.shellFront : this.shellBack;

      graphics.lineStyle(lineWidth, color, alpha);
      graphics.strokeLineShape(
        new Phaser.Geom.Line(from.screenX, from.screenY, to.screenX, to.screenY),
      );
    });

    const coreRingColor = this.hitSpinBoost > 0.08 ? this.danger : this.accent;
    this.shellFront.lineStyle(
      1.05 + this.hitSpinBoost * 0.8 + this.firePulse * 0.75,
      coreRingColor,
      0.08 + this.hitSpinBoost * 0.2 + this.firePulse * 0.12,
    );
    this.shellFront.strokeCircle(
      anchorX,
      anchorY,
      12 + this.hitSpinBoost * 2.4 + this.firePulse * 3.2,
    );
    this.updateSpriteAnchors(anchorX, anchorY);
  }

  private projectVertex(vertex: Vertex3): ProjectedVertex {
    const anchorX = this.anchor.x + this.anchorOffset.x;
    const anchorY = this.anchor.y + this.anchorOffset.y;
    const scaled = {
      x: vertex.x * PlayerEmitterVessel.SHELL_SCALE,
      y: vertex.y * PlayerEmitterVessel.SHELL_SCALE,
      z: vertex.z * PlayerEmitterVessel.SHELL_SCALE,
    };
    const rotatedX = rotateX(scaled, this.rotation.x);
    const rotatedY = rotateY(rotatedX, this.rotation.y);
    const rotatedZ = rotateZ(rotatedY, this.rotation.z);
    const perspective = 120 / (180 + rotatedZ.z);

    return {
      ...rotatedZ,
      screenX: anchorX + rotatedZ.x * perspective,
      screenY: anchorY + rotatedZ.y * perspective,
    };
  }

  private updateDestruction(deltaSeconds: number): void {
    this.destructionElapsed += deltaSeconds;
    const progress = Phaser.Math.Clamp(
      this.destructionElapsed / PlayerEmitterVessel.DESTRUCTION_WINDUP_SECONDS,
      0,
      1,
    );
    const eased = Phaser.Math.Easing.Cubic.In(progress);
    const oscillation = this.scene.time.now * (0.035 + progress * 0.06);
    const shake = 2 + eased * 18;

    this.anchorOffset.x = Math.sin(oscillation * 1.3) * shake;
    this.anchorOffset.y = Math.cos(oscillation * 1.9) * shake * 0.85;
    this.firePulse = 0.9 + eased * 2.1;
    this.hitSpinBoost = 0.9 + eased * 2.3;
    this.hitAngularVelocity.x = 2.4 + eased * 7.6;
    this.hitAngularVelocity.y = -2 + eased * -6.8;
    this.hitAngularVelocity.z = 2.7 + eased * 8.8;
    this.rotation.x += (this.angularVelocity.x + this.hitAngularVelocity.x) * deltaSeconds * (2.2 + eased * 2.8);
    this.rotation.y += (this.angularVelocity.y + this.hitAngularVelocity.y) * deltaSeconds * (2.2 + eased * 2.8);
    this.rotation.z += (this.angularVelocity.z + this.hitAngularVelocity.z) * deltaSeconds * (2.4 + eased * 3.6);

    this.shellHalo.rotation += deltaSeconds * (1.2 + eased * 4.5);
    this.shellAura.rotation -= deltaSeconds * (1 + eased * 4);
    this.shellHalo.setAlpha(0.24 + eased * 0.34);
    this.shellHalo.setScale(1.08 + eased * 0.55);
    this.shellAura.setAlpha(0.14 + eased * 0.3);
    this.shellAura.setScale(1.48 + eased * 0.75);
    this.coreBloom.setAlpha(0.28 + eased * 0.58);
    this.coreBloom.setScale(0.92 + eased * 1.12);
    this.coreGlow.setAlpha(0.96);
    this.coreGlow.setScale(0.38 + eased * 0.72);
    this.coreGlow.setTint(progress > 0.72 ? 0xffffff : this.accent);

    this.renderShell();

    if (!this.exploded && this.destructionElapsed >= PlayerEmitterVessel.DESTRUCTION_WINDUP_SECONDS) {
      this.exploded = true;
      this.shellBack.clear().setVisible(false);
      this.shellFront.clear().setVisible(false);
      this.shellHalo.setVisible(false);
      this.shellAura.setVisible(false);
      this.coreBloom.setVisible(false);
      this.coreGlow.setVisible(false);
      this.onExplode();
    }
  }

  private updateSpriteAnchors(anchorX: number, anchorY: number): void {
    this.shellHalo.setPosition(anchorX, anchorY);
    this.shellAura.setPosition(anchorX, anchorY);
    this.coreBloom.setPosition(anchorX, anchorY);
    this.coreGlow.setPosition(anchorX, anchorY);
  }
}

function rotateX(vertex: Vertex3, angle: number): Vertex3 {
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  return {
    x: vertex.x,
    y: vertex.y * cos - vertex.z * sin,
    z: vertex.y * sin + vertex.z * cos,
  };
}

function rotateY(vertex: Vertex3, angle: number): Vertex3 {
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  return {
    x: vertex.x * cos + vertex.z * sin,
    y: vertex.y,
    z: -vertex.x * sin + vertex.z * cos,
  };
}

function rotateZ(vertex: Vertex3, angle: number): Vertex3 {
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  return {
    x: vertex.x * cos - vertex.y * sin,
    y: vertex.x * sin + vertex.y * cos,
    z: vertex.z,
  };
}
