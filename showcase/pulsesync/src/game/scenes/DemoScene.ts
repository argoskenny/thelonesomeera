import Phaser from 'phaser';
import { getProceduralBGMSong } from '@/game/audio/bgm/catalog';
import { getSelectedProceduralBGMSongId } from '@/game/audio/bgm/selection';
import { createDemoLevel, DEMO_LEVEL } from '@/game/content/beatmaps/DemoBeatmap';
import { GAME_CONFIG } from '@/game/content/config/gameConfig';
import { VISUAL_PALETTES } from '@/game/content/palette/palettes';
import { evaluateBeatWindow } from '@/game/gameplay/bonusWindow';
import { BossSystem } from '@/game/gameplay/BossSystem';
import { CollisionSystem } from '@/game/gameplay/CollisionSystem';
import { ComboSystem } from '@/game/gameplay/ComboSystem';
import { DamageSystem } from '@/game/gameplay/DamageSystem';
import { EnemySystem } from '@/game/gameplay/EnemySystem';
import { LockOnSystem } from '@/game/gameplay/LockOnSystem';
import { PlayerCursor } from '@/game/gameplay/PlayerCursor';
import { PlayerEmitterVessel } from '@/game/gameplay/PlayerEmitterVessel';
import { ProjectileSystem } from '@/game/gameplay/ProjectileSystem';
import { SyncGaugeSystem } from '@/game/gameplay/SyncGaugeSystem';
import { BackgroundRenderer } from '@/game/rendering/background/BackgroundRenderer';
import { HUD } from '@/game/rendering/ui/HUD';
import { BeatSystem } from '@/game/systems/BeatSystem';
import { BGMSystem } from '@/game/systems/BGMSystem';
import { CameraFXSystem } from '@/game/systems/CameraFXSystem';
import { EventBus } from '@/game/systems/EventBus';
import { FXSystem } from '@/game/systems/FXSystem';
import { SFXSystem } from '@/game/systems/SFXSystem';
import { TimelineSystem } from '@/game/systems/TimelineSystem';
import type { GameEventMap } from '@/game/types/GameEvents';
import type { LevelPhase, ResultSummary } from '@/game/types/GameTypes';
import type { DamageableTarget } from '@/game/types/RuntimeTypes';
import { secondsForBarBeat } from '@/game/utils/math';

export class DemoScene extends Phaser.Scene {
  private level = DEMO_LEVEL;
  private levelDurationSeconds = secondsForBarBeat(
    DEMO_LEVEL.totalBars,
    0,
    DEMO_LEVEL.beatGrid.bpm,
    DEMO_LEVEL.beatGrid.beatsPerBar,
  );
  private bus!: EventBus<GameEventMap>;
  private beatSystem!: BeatSystem;
  private timelineSystem!: TimelineSystem;
  private bgmSystem!: BGMSystem;
  private sfxSystem!: SFXSystem;
  private background!: BackgroundRenderer;
  private fxSystem!: FXSystem;
  private cameraFX!: CameraFXSystem;
  private playerEmitterVessel!: PlayerEmitterVessel;
  private playerCursor!: PlayerCursor;
  private lockOnSystem!: LockOnSystem;
  private projectileSystem!: ProjectileSystem;
  private comboSystem!: ComboSystem;
  private syncSystem!: SyncGaugeSystem;
  private enemySystem!: EnemySystem;
  private bossSystem!: BossSystem;
  private damageSystem!: DamageSystem;
  private hud!: HUD;
  private currentPhase: LevelPhase = DEMO_LEVEL.phases[0];
  private integrity = GAME_CONFIG.integrityMax;
  private burstReadyAtMs = 0;
  private paused = false;
  private resultQueued = false;
  private deathSequenceActive = false;
  private bossDefeatSequenceActive = false;
  private debugVisible = GAME_CONFIG.debug.overlayEnabledByDefault;
  private ready = false;
  private loadingText!: Phaser.GameObjects.Text;
  private uiCamera!: Phaser.Cameras.Scene2D.Camera;
  private readonly uiObjects = new Set<Phaser.GameObjects.GameObject>();
  private lastCameraSyncCount = -1;

  constructor() {
    super('demo');
  }

  create(): void {
    const selectedSong = getProceduralBGMSong(getSelectedProceduralBGMSongId(this));
    this.level = createDemoLevel(selectedSong.bpm);
    this.levelDurationSeconds = secondsForBarBeat(
      this.level.totalBars,
      0,
      this.level.beatGrid.bpm,
      this.level.beatGrid.beatsPerBar,
    );
    this.resetRunState();
    this.input.mouse?.disableContextMenu();
    this.uiCamera = this.cameras.add(0, 0, this.scale.width, this.scale.height, false, 'ui');
    this.uiCamera.setBackgroundColor('rgba(0,0,0,0)');
    this.bus = new EventBus<GameEventMap>();
    this.background = new BackgroundRenderer(this, this.bus, (objects) =>
      this.registerWorldObjects(objects),
    );
    this.fxSystem = new FXSystem(this, (objects) => this.registerWorldObjects(objects));
    this.cameraFX = new CameraFXSystem(this);
    this.comboSystem = new ComboSystem(this.bus);
    this.syncSystem = new SyncGaugeSystem(this.bus);
    this.enemySystem = new EnemySystem(
      this,
      (event) => {
        this.handleThreat(event.damage, event.x, event.y);
      },
      (objects) => this.registerWorldObjects(objects),
    );
    this.bossSystem = new BossSystem(
      this,
      (event) => {
        this.handleThreat(event.damage, event.x, event.y);
      },
      (enemyType, x, y, elapsedSeconds) => {
        this.enemySystem.spawnAt(enemyType, x, y, elapsedSeconds, {
          idPrefix: `boss-${enemyType}`,
          drift: enemyType === 'sniper-sigil' ? 10 : 12,
          scatter:
            enemyType === 'distortion-mine'
              ? {
                  angle: Phaser.Math.FloatBetween(0, Math.PI * 2),
                  radius: Phaser.Math.FloatBetween(96, 180),
                  durationSec: 0.3,
                }
              : undefined,
        });
      },
      (objects) => this.registerWorldObjects(objects),
    );
    this.damageSystem = new DamageSystem(
      this.enemySystem,
      this.bossSystem,
      this.comboSystem,
      this.syncSystem,
      this.fxSystem,
      this.cameraFX,
      this.bus,
    );
    this.playerEmitterVessel = new PlayerEmitterVessel(
      this,
      () => this.handlePlayerVesselExplosion(),
      (objects) => this.registerWorldObjects(objects),
    );
    this.playerCursor = new PlayerCursor(this, (objects) => this.registerWorldObjects(objects));
    this.lockOnSystem = new LockOnSystem(this, this.bus, (objects) =>
      this.registerWorldObjects(objects),
    );
    this.projectileSystem = new ProjectileSystem(
      this,
      (target) => {
        const onBeat = evaluateBeatWindow(
          this.beatSystem.getSnapshot().elapsedSeconds,
          this.level.beatGrid.bpm,
          GAME_CONFIG.burstBonusWindow,
        ).inWindow;
        const result = this.damageSystem.applyTargetDamage(target, {
          amount: 1,
          onBeat,
          source: 'projectile',
        });
        if (result?.bossDefeated) {
          this.startBossDefeatSequence();
        }
      },
      () => this.playerEmitterVessel.onFire(),
      (x, y, color) => this.fxSystem.spawnTrail(x, y, color),
      (objects) => this.registerWorldObjects(objects),
    );
    this.hud = new HUD(this, (objects) => this.registerUiObjects(objects));
    this.beatSystem = new BeatSystem(this.level.beatGrid, this.bus);
    this.timelineSystem = new TimelineSystem(this.level, this.bus);
    this.bgmSystem = new BGMSystem(
      this.bus,
      this.level.beatGrid,
      selectedSong.id,
    );
    this.sfxSystem = new SFXSystem(this.bus);
    this.loadingText = this.add
      .text(this.scale.width * 0.5, this.scale.height * 0.5, 'Synchronizing transport...', {
        fontFamily: 'Chakra Petch',
        fontSize: '24px',
        color: '#edf7ff',
      })
      .setOrigin(0.5)
      .setDepth(140);
    this.registerUiObjects(this.loadingText);

    this.registerBusBindings();
    this.registerInput();
    this.applyPalette(VISUAL_PALETTES.boot);
    this.comboSystem.reset();
    this.syncSystem.reset();
    this.syncCameraAssignments();
    void this.initializeAudioTimeline();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.beatSystem.stop();
      this.bgmSystem.dispose();
      this.sfxSystem.dispose();
      this.time.timeScale = 1;
      this.tweens.timeScale = 1;
      this.background.destroy();
      this.playerEmitterVessel.destroy();
      this.playerCursor.destroy();
      this.projectileSystem.destroy();
      this.enemySystem.destroy();
      this.bossSystem.destroy();
      this.bus.clear();
    });
  }

  private resetRunState(): void {
    this.currentPhase = this.level.phases[0];
    this.integrity = GAME_CONFIG.integrityMax;
    this.burstReadyAtMs = 0;
    this.paused = false;
    this.resultQueued = false;
    this.deathSequenceActive = false;
    this.bossDefeatSequenceActive = false;
    this.debugVisible = GAME_CONFIG.debug.overlayEnabledByDefault;
    this.ready = false;
    this.uiObjects.clear();
    this.lastCameraSyncCount = -1;

    this.time.timeScale = 1;
    this.tweens.timeScale = 1;
    this.cameras.main.resetFX();
    this.cameras.main.setAlpha(1);
    this.cameras.main.setZoom(1);
  }

  update(_time: number, delta: number): void {
    if (this.resultQueued) {
      return;
    }

    if (!this.ready) {
      return;
    }

    if (this.paused) {
      this.syncCameraAssignments();
      this.hud.update(this.buildHudState());
      return;
    }

    this.syncCameraAssignments();

    const deltaSeconds = delta / 1000;
    const beatSnapshot = this.beatSystem.update();
    this.background.update(
      deltaSeconds,
      beatSnapshot.elapsedSeconds,
      this.syncSystem.getState().intensity,
      this.enemySystem.getDistortionLevel(),
    );
    this.playerEmitterVessel.update(deltaSeconds);

    if (this.deathSequenceActive || this.bossDefeatSequenceActive) {
      this.hud.update(this.buildHudState());
      return;
    }

    this.timelineSystem.update(beatSnapshot.elapsedSeconds);
    this.bossSystem.update(deltaSeconds, beatSnapshot);
    this.enemySystem.update(deltaSeconds, beatSnapshot.elapsedSeconds);

    const lockTargets = this.getAllTargets();
    this.playerCursor.update(
      deltaSeconds,
      this.lockOnSystem.isCharging(),
      this.syncSystem.getState().intensity,
    );
    const cursor = this.playerCursor.getSnapshot();
    this.lockOnSystem.update(cursor.x, cursor.y, lockTargets);
    this.projectileSystem.update(deltaSeconds);

    this.hud.update(this.buildHudState());

    if (
      !this.resultQueued &&
      beatSnapshot.elapsedSeconds >= this.levelDurationSeconds &&
      !this.bossSystem.getHudState().active
    ) {
      this.queueResult(this.integrity > 0, 1200);
    }
  }

  private registerBusBindings(): void {
    this.bus.on('timeline:spawn', ({ cue }) => {
      this.enemySystem.spawn(cue, this.beatSystem.getSnapshot().elapsedSeconds);
    });
    this.bus.on('timeline:phase', ({ phase }) => {
      this.currentPhase = phase;
      this.cameraFX.phaseChange();
    });
    this.bus.on('timeline:visual', ({ cue }) => {
      this.applyPalette(VISUAL_PALETTES[cue.palette]);
    });
    this.bus.on('timeline:boss', ({ cue }) => {
      this.bossSystem.handleCommand(
        cue.command,
        cue.phase,
        this.beatSystem.getSnapshot().beatIndex,
      );
    });
    this.bus.on('lock:acquired', ({ x, y }) => {
      this.fxSystem.spawnLockFeedback(x, y);
    });
    this.bus.on('burst:used', ({ perfect }) => {
      const cursor = this.playerCursor.getSnapshot();
      this.fxSystem.spawnBurst(cursor.x, cursor.y, perfect);
      this.cameraFX.burst(perfect);
    });
  }

  private registerInput(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.paused || !this.ready || this.deathSequenceActive || this.bossDefeatSequenceActive) {
        return;
      }

      if (pointer.button === 0) {
        this.lockOnSystem.begin();
      }

      if (pointer.button === 2) {
        this.tryPulseBurst();
      }
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (
        this.paused ||
        !this.ready ||
        this.deathSequenceActive ||
        this.bossDefeatSequenceActive ||
        pointer.button !== 0
      ) {
        return;
      }

      const targetIndex = new Map([
        ...this.enemySystem.getTargetIndex(),
        ...this.bossSystem.getTargetIndex(),
      ]);
      const locks = this.lockOnSystem.release(targetIndex);
      if (locks.length === 0) {
        this.comboSystem.apply({ type: 'miss' });
        this.syncSystem.apply({ type: 'miss' });
        return;
      }

      this.projectileSystem.fireSequence(locks, (targetId) => this.findTargetById(targetId));
    });

    this.input.keyboard?.on('keydown-SPACE', () => {
      if (!this.ready || this.deathSequenceActive || this.bossDefeatSequenceActive) {
        return;
      }
      this.tryPulseBurst();
    });
    this.input.keyboard?.on('keydown-SHIFT', () => {
      if (!this.ready || this.deathSequenceActive || this.bossDefeatSequenceActive) {
        return;
      }
      this.tryPulseBurst();
    });
    this.input.keyboard?.on('keydown-ESC', () => {
      this.togglePause();
    });
    this.input.keyboard?.on('keydown-D', () => {
      this.debugVisible = !this.debugVisible;
      this.hud.setDebugVisible(this.debugVisible);
    });
  }

  private findTargetById(targetId: string): DamageableTarget | undefined {
    return [...this.enemySystem.getTargetables(), ...this.bossSystem.getTargetables()].find(
      (target) => target.id === targetId,
    );
  }

  private getAllTargets(): DamageableTarget[] {
    return [...this.enemySystem.getTargetables(), ...this.bossSystem.getTargetables()];
  }

  private tryPulseBurst(): void {
    if (
      !this.ready ||
      this.paused ||
      this.deathSequenceActive ||
      this.bossDefeatSequenceActive ||
      this.time.now < this.burstReadyAtMs
    ) {
      return;
    }

    const beatEval = evaluateBeatWindow(
      this.beatSystem.getSnapshot().elapsedSeconds,
      this.level.beatGrid.bpm,
      GAME_CONFIG.burstBonusWindow,
    );
    const targets = CollisionSystem.findTargetsInRadius(
      this.playerCursor.getSnapshot().x,
      this.playerCursor.getSnapshot().y,
      GAME_CONFIG.burstRadius,
      this.getAllTargets(),
    );
    const onBeat = beatEval.inWindow;
    const damage =
      GAME_CONFIG.burstDamage + (onBeat ? GAME_CONFIG.burstBeatBonusDamage : 0);
    const results = this.damageSystem.applyBurst(targets, onBeat, damage);
    if (results.some((result) => result.bossDefeated)) {
      this.startBossDefeatSequence();
    }
    this.burstReadyAtMs = this.time.now + GAME_CONFIG.burstCooldownSec * 1000;
  }

  private handleThreat(damage: number, x: number, y: number): void {
    if (this.deathSequenceActive || this.resultQueued) {
      return;
    }

    this.integrity = Math.max(0, this.integrity - damage);
    this.playerEmitterVessel.onHit();
    this.bus.emit('integrity:changed', {
      value: this.integrity,
      delta: -damage,
    });
    this.comboSystem.apply({ type: 'damage' });
    this.syncSystem.apply({ type: 'damage' });
    this.fxSystem.spawnExplosion(x, y, this.background.getPalette().danger);
    this.cameraFX.pulse(1.5);

    if (this.integrity <= 0) {
      this.startPlayerDeathSequence();
    }
  }

  private togglePause(): void {
    this.paused = !this.paused;
    if (this.paused) {
      this.beatSystem.pause();
      return;
    }

    this.beatSystem.resume();
  }

  private applyPalette(palette: (typeof VISUAL_PALETTES)[keyof typeof VISUAL_PALETTES]): void {
    this.fxSystem.setPalette(palette.primary, palette.secondary, palette.accent);
    this.enemySystem.setPalette(palette.primary, palette.secondary, palette.danger);
    this.bossSystem.setPalette(palette.primary, palette.secondary, palette.accent);
    this.hud.setPalette(palette.primary, palette.secondary, palette.accent, palette.danger);
    this.lockOnSystem.setPalette(palette.primary, palette.secondary);
    this.playerEmitterVessel.setPalette(
      palette.primary,
      palette.secondary,
      palette.accent,
      palette.danger,
    );
    this.projectileSystem.setPalette(palette.primary);
  }

  private buildHudState() {
    const beatSnapshot = this.beatSystem.getSnapshot();
    const combo = this.comboSystem.getState();
    const sync = this.syncSystem.getState();
    const boss = this.bossSystem.getHudState();
    return {
      phaseLabel: this.currentPhase.label,
      score: combo.score,
      combo: combo.combo,
      multiplier: combo.multiplier,
      syncGauge: sync.gauge,
      syncTier: sync.tier,
      integrity: this.integrity,
      burstReadyIn: Math.max(0, (this.burstReadyAtMs - this.time.now) / 1000),
      queuedLocks: this.lockOnSystem.getQueuedCount(),
      elapsedSeconds: beatSnapshot.elapsedSeconds,
      beatIndex: beatSnapshot.beatIndex,
      boss: boss.active ? boss : undefined,
      paused: this.paused,
      debugText: this.debugVisible
        ? [
            `Beat ${beatSnapshot.beatIndex}  Bar ${beatSnapshot.barIndex}  Phrase ${beatSnapshot.phraseIndex}`,
            `Phase ${this.currentPhase.key}  Targets ${this.getAllTargets().length}  Projectiles ${this.projectileSystem.isBusy() ? 'busy' : 'idle'}`,
            `Integrity ${this.integrity}  Sync ${sync.gauge.toFixed(1)}  Combo ${combo.combo}`,
          ].join('\n')
        : '',
    };
  }

  private startPlayerDeathSequence(): void {
    if (this.deathSequenceActive) {
      return;
    }

    this.deathSequenceActive = true;
    this.playerEmitterVessel.beginDestruction();
    this.cameraFX.pulse(2.4);
  }

  private handlePlayerVesselExplosion(): void {
    const { x, y } = GAME_CONFIG.emitterAnchor;
    const palette = this.background.getPalette();

    this.bus.emit('player:explode', { x, y });
    this.fxSystem.spawnExplosion(x, y, palette.primary);
    this.fxSystem.spawnExplosion(x, y, palette.danger);
    this.fxSystem.spawnBurst(x, y, true);
    this.time.delayedCall(90, () => {
      this.fxSystem.spawnExplosion(x + 18, y - 14, palette.highlight);
    });
    this.time.delayedCall(170, () => {
      this.fxSystem.spawnExplosion(x - 12, y + 22, palette.secondary);
    });
    this.cameraFX.burst(true);
    this.cameraFX.phaseChange();
    this.queueResult(false, 2000);
  }

  private startBossDefeatSequence(): void {
    if (this.bossDefeatSequenceActive || this.resultQueued) {
      return;
    }

    this.bossDefeatSequenceActive = true;
    this.lockOnSystem.cancel(new Map());
    const { x, y } = this.bossSystem.getCorePosition();
    const palette = this.background.getPalette();

    this.time.timeScale = 0.22;
    this.tweens.timeScale = 0.22;
    this.cameraFX.specialHit(2.4);
    this.sfxSystem.playBossDefeatStart();
    this.fxSystem.spawnSpecialHit(x, y, palette.highlight, 2.4);
    this.fxSystem.spawnExplosion(x, y, palette.primary);
    this.fxSystem.spawnBurst(x, y, true);
    this.time.delayedCall(110, () => {
      this.fxSystem.spawnSpecialHit(x, y, palette.secondary, 2.3);
      this.fxSystem.spawnExplosion(x + 24, y - 18, palette.secondary);
    });
    this.time.delayedCall(220, () => {
      this.fxSystem.spawnSpecialHit(x, y, palette.danger, 2.5);
      this.fxSystem.spawnExplosion(x - 26, y + 22, palette.danger);
    });

    this.time.delayedCall(320, () => {
      this.time.timeScale = 1;
      this.tweens.timeScale = 1;
      this.cameraFX.burst(true);
      this.cameraFX.phaseChange();

      const bursts = [
        { delay: 0, dx: 0, dy: 0, color: palette.primary, special: true },
        { delay: 70, dx: 124, dy: -46, color: palette.secondary, special: false },
        { delay: 130, dx: -136, dy: 58, color: palette.highlight, special: false },
        { delay: 210, dx: 66, dy: 142, color: palette.danger, special: true },
        { delay: 280, dx: -88, dy: -146, color: palette.primary, special: false },
        { delay: 360, dx: 178, dy: 30, color: palette.highlight, special: false },
        { delay: 430, dx: -182, dy: -18, color: palette.secondary, special: true },
        { delay: 520, dx: 18, dy: -176, color: palette.danger, special: false },
      ];
      bursts.forEach(({ delay, dx, dy, color, special }) => {
        this.time.delayedCall(delay, () => {
          this.sfxSystem.playBossDefeatBurst(delay);
          this.fxSystem.spawnExplosion(x + dx, y + dy, color);
          if (special) {
            this.fxSystem.spawnSpecialHit(x + dx, y + dy, color, 2.1);
            this.fxSystem.spawnBurst(x + dx, y + dy, true);
            this.cameraFX.specialHit(2.1);
          }
        });
      });

      this.time.delayedCall(760, () => {
        this.sfxSystem.playBossDefeatBurst(999);
        this.fxSystem.spawnSpecialHit(x, y, palette.highlight, 2.6);
        this.fxSystem.spawnExplosion(x, y, palette.highlight);
        this.fxSystem.spawnBurst(x, y, true);
        this.cameraFX.burst(true);
      });

      this.time.delayedCall(980, () => {
        this.bossSystem.hideDefeatedVisuals();
      });

      this.time.delayedCall(3980, () => {
        this.cameras.main.fadeOut(680, 3, 7, 18);
        this.uiCamera.fadeOut(680, 3, 7, 18);
      });
    });

    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.finishBossDefeatSequence();
    });
  }

  private finishBossDefeatSequence(): void {
    if (this.resultQueued) {
      return;
    }

    this.resultQueued = true;
    this.scene.start('result', this.createResultSummary(true));
  }

  private queueResult(cleared: boolean, delayMs: number): void {
    if (this.resultQueued) {
      return;
    }

    this.resultQueued = true;
    this.time.delayedCall(delayMs, () => {
      this.scene.start('result', this.createResultSummary(cleared));
    });
  }

  private createResultSummary(cleared: boolean): ResultSummary {
    const combo = this.comboSystem.getState();
    return {
      score: combo.score,
      maxCombo: combo.maxCombo,
      hits: combo.hits,
      kills: combo.kills,
      syncPeak: this.syncSystem.getPeakTier(),
      integrityLeft: this.integrity,
      levelTitle: this.level.title,
      cleared,
    };
  }

  private async initializeAudioTimeline(): Promise<void> {
    await this.bgmSystem.initialize();
    await this.sfxSystem.initialize();
    await this.beatSystem.start();
    this.ready = true;
    this.loadingText.destroy();
  }

  private registerWorldObjects(
    objects: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[],
  ): void {
    const entries = Array.isArray(objects) ? objects : [objects];
    this.uiCamera.ignore(entries);
    this.lastCameraSyncCount = -1;
  }

  private registerUiObjects(
    objects: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[],
  ): void {
    const entries = Array.isArray(objects) ? objects : [objects];
    entries.forEach((entry) => this.uiObjects.add(entry));
    this.cameras.main.ignore(entries);
    this.lastCameraSyncCount = -1;
  }

  private syncCameraAssignments(): void {
    const children = this.children.list as Phaser.GameObjects.GameObject[];
    if (children.length === this.lastCameraSyncCount) {
      return;
    }

    children.forEach((child) => {
      if (this.uiObjects.has(child)) {
        this.cameras.main.ignore(child);
        return;
      }

      this.uiCamera.ignore(child);
    });
    this.lastCameraSyncCount = children.length;
  }
}
