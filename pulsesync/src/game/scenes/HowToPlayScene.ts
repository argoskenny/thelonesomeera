import Phaser from 'phaser';

interface EnemyCardSpec {
  texture: string;
  title: string;
  color: string;
  body: string;
}

const FRAME_MARGIN_X = 84;
const HEADER_TOP = 56;
const CONTENT_VIEWPORT = new Phaser.Geom.Rectangle(84, 136, 1112, 544);
const CLOSE_BUTTON_WIDTH = 112;
const CLOSE_BUTTON_HEIGHT = 40;

export class HowToPlayScene extends Phaser.Scene {
  private rings: Phaser.GameObjects.Image[] = [];
  private contentContainer!: Phaser.GameObjects.Container;
  private contentMaskShape!: Phaser.GameObjects.Graphics;
  private contentScrollTarget = 0;
  private contentScrollPosition = 0;
  private contentScrollMax = 0;

  constructor() {
    super('how-to-play');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#050816');
    this.createBackdrop();
    this.createHeader();
    this.createScrollableContent();
    this.createScrollHint();
    this.registerInputs();
  }

  update(_time: number, delta: number): void {
    const deltaSeconds = delta / 1000;
    this.rings[0].rotation += deltaSeconds * 0.08;
    this.rings[1].rotation -= deltaSeconds * 0.16;
    this.rings[2].rotation += deltaSeconds * 0.24;

    this.contentScrollPosition = Phaser.Math.Linear(
      this.contentScrollPosition,
      this.contentScrollTarget,
      1 - Math.exp(-14 * deltaSeconds),
    );
    this.contentContainer.y = CONTENT_VIEWPORT.y - this.contentScrollPosition;
  }

  private createBackdrop(): void {
    this.add
      .image(this.scale.width * 0.5, this.scale.height * 0.5, 'boss-ring')
      .setTint(0x173b6d)
      .setScale(3.05)
      .setAlpha(0.18);

    this.rings = [
      this.add
        .image(this.scale.width * 0.5, this.scale.height * 0.5, 'boss-ring')
        .setTint(0x35e7ff)
        .setScale(2.06)
        .setAlpha(0.14),
      this.add
        .image(this.scale.width * 0.5, this.scale.height * 0.5, 'boss-ring')
        .setTint(0xff4cb7)
        .setScale(1.34)
        .setAlpha(0.12),
      this.add
        .image(this.scale.width * 0.5, this.scale.height * 0.5, 'boss-ring')
        .setTint(0xdfff4f)
        .setScale(0.82)
        .setAlpha(0.08),
    ];

    this.add
      .rectangle(this.scale.width * 0.5, this.scale.height * 0.5, 1180, 656, 0x07111f, 0.88)
      .setStrokeStyle(2, 0x2a86cc, 0.26);
  }

  private createHeader(): void {
    const title = this.add
      .text(FRAME_MARGIN_X, HEADER_TOP, 'HOW TO PLAY', {
        fontFamily: 'Chakra Petch',
        fontSize: '38px',
        fontStyle: '700',
        color: '#f8fbff',
      })
      .setOrigin(0, 0)
      .setShadow(0, 0, '#35e7ff', 18);

    this.add
      .text(
        FRAME_MARGIN_X,
        HEADER_TOP + 42,
        'Read the combat loop, threat logic, and boss phase rules before synchronization.',
        {
          fontFamily: 'Chakra Petch',
          fontSize: '17px',
          color: '#b9d2eb',
        },
      )
      .setOrigin(0, 0);

    const closeX =
      this.scale.width - FRAME_MARGIN_X - CLOSE_BUTTON_WIDTH * 0.5;
    const closeY = title.y + CLOSE_BUTTON_HEIGHT * 0.5;
    const closeGlow = this.add
      .rectangle(closeX, closeY, CLOSE_BUTTON_WIDTH, CLOSE_BUTTON_HEIGHT, 0xff4cb7, 0.08)
      .setStrokeStyle(1, 0xff4cb7, 0.3);
    const closeLabel = this.add
      .text(closeX, closeY, 'CLOSE', {
        fontFamily: 'Chakra Petch',
        fontSize: '18px',
        fontStyle: '700',
        color: '#ffe6f4',
      })
      .setOrigin(0.5);
    const closeHit = this.add
      .zone(closeX, closeY, CLOSE_BUTTON_WIDTH, CLOSE_BUTTON_HEIGHT)
      .setInteractive({ useHandCursor: true });
    closeHit.on('pointerdown', () => {
      this.scene.start('menu');
    });
    closeHit.on('pointerover', () => {
      closeGlow.setFillStyle(0xff4cb7, 0.16);
      closeLabel.setColor('#ffffff');
    });
    closeHit.on('pointerout', () => {
      closeGlow.setFillStyle(0xff4cb7, 0.08);
      closeLabel.setColor('#ffe6f4');
    });
  }

  private createScrollableContent(): void {
    this.add
      .rectangle(
        CONTENT_VIEWPORT.centerX,
        CONTENT_VIEWPORT.centerY,
        CONTENT_VIEWPORT.width,
        CONTENT_VIEWPORT.height,
        0x07111f,
        0.92,
      );

    this.contentMaskShape = this.add.graphics();
    this.contentMaskShape.fillStyle(0xffffff, 1);
    this.contentMaskShape.fillRect(
      CONTENT_VIEWPORT.x,
      CONTENT_VIEWPORT.y,
      CONTENT_VIEWPORT.width,
      CONTENT_VIEWPORT.height,
    );
    this.contentMaskShape.setVisible(false);

    this.contentContainer = this.add.container(CONTENT_VIEWPORT.x, CONTENT_VIEWPORT.y);
    this.contentContainer.setMask(this.contentMaskShape.createGeometryMask());

    let y = 0;

    y += this.createInfoPanel(
      this.contentContainer,
      0,
      y,
      CONTENT_VIEWPORT.width,
      'CONTROL LOOP',
      [
        'Move cursor with mouse.',
        'Hold Left Mouse Button to queue locks.',
        'Release to fire a sequential salvo.',
        'Right Mouse / Space / Shift triggers Pulse Burst.',
      ],
      '#7defff',
    );
    y += 20;

    y += this.createInfoPanel(
      this.contentContainer,
      0,
      y,
      CONTENT_VIEWPORT.width,
      'STAGE FLOW',
      [
        'Signal Primer teaches lock timing.',
        'Cascade adds mixed enemy pressure.',
        'Overclock increases density and threat count.',
        'Finale is a 3-phase boss fight.',
      ],
      '#ff93cf',
    );
    y += 20;

    y += this.createInfoPanel(
      this.contentContainer,
      0,
      y,
      CONTENT_VIEWPORT.width,
      'DAMAGE RULES',
      [
        'Regular enemies do not damage by contact in this demo.',
        'Integrity loss comes from Sniper Sigils, Distortion Mines, and boss attacks.',
        '0 integrity triggers the vessel destruction sequence.',
      ],
      '#ecff8a',
    );
    y += 34;

    this.contentContainer.add(
      this.add
        .text(0, y, 'ENEMY MODULES', {
          fontFamily: 'Chakra Petch',
          fontSize: '28px',
          fontStyle: '700',
          color: '#f8fbff',
        })
        .setOrigin(0, 0),
    );
    y += 34;

    this.contentContainer.add(
      this.add
        .text(
          0,
          y,
          'Each enemy module has a different combat role. Threat units are the ones that actually damage the player.',
          {
            fontFamily: 'Chakra Petch',
            fontSize: '15px',
            color: '#b9d2eb',
            wordWrap: { width: CONTENT_VIEWPORT.width },
          },
        )
        .setOrigin(0, 0),
    );
    y += 46;

    const cards: EnemyCardSpec[] = [
      {
        texture: 'enemy-drone',
        title: 'Pulse Drone',
        color: '#7defff',
        body: 'Basic 1-lock target. Adds tempo pressure, but has no direct attack.',
      },
      {
        texture: 'enemy-shield',
        title: 'Shield Node',
        color: '#ff93cf',
        body: '2-lock armored target. Slows clean clears and forces better queue timing.',
      },
      {
        texture: 'enemy-cluster',
        title: 'Chain Cluster',
        color: '#ecff8a',
        body: 'Fragile cluster node. Linked units can detonate together for chain clears.',
      },
      {
        texture: 'enemy-sniper',
        title: 'Sniper Sigil',
        color: '#ff9cb0',
        body: 'Threat unit. Charges about 4.5 seconds, draws a line, then hits for 8 integrity.',
      },
      {
        texture: 'enemy-mine',
        title: 'Distortion Mine',
        color: '#baa7ff',
        body: 'Threat unit. Pulses roughly every 2.6 seconds and hits for 5 integrity.',
      },
    ];

    cards.forEach((card, index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      this.createEnemyCard(
        this.contentContainer,
        column * 566,
        y + row * 148,
        546,
        128,
        card,
      );
    });
    y += 448;

    y += this.createInfoPanel(
      this.contentContainer,
      0,
      y,
      CONTENT_VIEWPORT.width,
      'BOSS: THE GATE OF EDEN',
      [
        'Phase 1: all outer nodes can be targeted freely, but each node has 5x the previous durability. Every 8 beats, each surviving node spawns a Sniper Sigil.',
        'Phase 2: the core stays open at all times. Every 4 beats it spawns 4 Distortion Mines from the core, they scatter outward, then drive toward the player. At half health, the outer nodes regenerate with a 1-second invulnerable recovery and the fight returns to Phase 1.',
        'Phase 3: the core stays open, orbital units rotate in as extra targets, and the boss attacks every four beats for 7 integrity.',
      ],
      '#7defff',
      13,
      6,
    );
    y += 18;

    this.contentContainer.add(
      this.add
        .text(
          0,
          y,
          'Priority rule: clear Sniper Sigils and Distortion Mines before farming score from regular targets.',
          {
            fontFamily: 'Chakra Petch',
            fontSize: '15px',
            color: '#dfff4f',
            wordWrap: { width: CONTENT_VIEWPORT.width - 160 },
          },
        )
        .setOrigin(0, 0),
    );

    const bottom = y + 42;
    this.contentScrollMax = Math.max(0, bottom - CONTENT_VIEWPORT.height);
  }

  private createScrollHint(): void {
    this.add
      .text(
        this.scale.width - FRAME_MARGIN_X,
        CONTENT_VIEWPORT.bottom + 14,
        'Mouse wheel / Up / Down to scroll  •  Esc closes',
        {
          fontFamily: 'Chakra Petch',
          fontSize: '14px',
          color: '#9fb6cb',
        },
      )
      .setOrigin(1, 0);
  }

  private createInfoPanel(
    container: Phaser.GameObjects.Container,
    x: number,
    y: number,
    width: number,
    title: string,
    lines: string[],
    accent: string,
    bodySize = 14,
    lineSpacing = 8,
  ): number {
    const accentColor = Phaser.Display.Color.HexStringToColor(accent).color;
    const titleText = this.add
      .text(x + 24, y + 18, title, {
        fontFamily: 'Chakra Petch',
        fontSize: '19px',
        fontStyle: '700',
        color: accent,
      })
      .setOrigin(0, 0);
    const bodyText = this.add
      .text(
        x + 24,
        y + 50,
        lines.map((line) => `• ${line}`).join('\n'),
        {
          fontFamily: 'Chakra Petch',
          fontSize: `${bodySize}px`,
          color: '#d2e1ef',
          wordWrap: { width: width - 48 },
          lineSpacing,
        },
      )
      .setOrigin(0, 0);
    const height = Math.max(96, bodyText.height + 68);
    const panel = this.add
      .rectangle(x + width * 0.5, y + height * 0.5, width, height, 0x0a1626, 0.9)
      .setStrokeStyle(1, accentColor, 0.26);
    const stripe = this.add.rectangle(x + 8, y + height * 0.5, 4, height, accentColor, 0.95);

    container.add([panel, stripe, titleText, bodyText]);
    return height;
  }

  private createEnemyCard(
    container: Phaser.GameObjects.Container,
    x: number,
    y: number,
    width: number,
    height: number,
    card: EnemyCardSpec,
  ): void {
    const accentColor = Phaser.Display.Color.HexStringToColor(card.color).color;
    const panel = this.add
      .rectangle(x + width * 0.5, y + height * 0.5, width, height, 0x091626, 0.92)
      .setStrokeStyle(1, accentColor, 0.3);
    const stripe = this.add.rectangle(x + 8, y + height * 0.5, 4, height, accentColor, 0.95);
    const ring = this.add
      .image(x + 66, y + height * 0.5, 'fx-ring')
      .setScale(0.94)
      .setTint(accentColor)
      .setAlpha(0.2)
      .setBlendMode(Phaser.BlendModes.ADD);
    const icon = this.add
      .image(x + 66, y + height * 0.5, card.texture)
      .setScale(1.02)
      .setTint(0xf8fbff)
      .setBlendMode(Phaser.BlendModes.ADD);
    const title = this.add
      .text(x + 118, y + 18, card.title, {
        fontFamily: 'Chakra Petch',
        fontSize: '19px',
        fontStyle: '700',
        color: card.color,
      })
      .setOrigin(0, 0);
    const body = this.add
      .text(x + 118, y + 48, card.body, {
        fontFamily: 'Chakra Petch',
        fontSize: '14px',
        color: '#d2e1ef',
        wordWrap: { width: width - 136 },
        lineSpacing: 6,
      })
      .setOrigin(0, 0);

    container.add([panel, stripe, ring, icon, title, body]);
  }

  private registerInputs(): void {
    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.start('menu');
    });
    this.input.keyboard?.on('keydown-UP', () => {
      this.scrollBy(-96);
    });
    this.input.keyboard?.on('keydown-DOWN', () => {
      this.scrollBy(96);
    });
    this.input.on('wheel', (_pointer: unknown, _currentlyOver: unknown, _dx: number, dy: number) => {
      this.scrollBy(dy * 0.9);
    });
  }

  private scrollBy(delta: number): void {
    this.contentScrollTarget = Phaser.Math.Clamp(
      this.contentScrollTarget + delta,
      0,
      this.contentScrollMax,
    );
  }
}
