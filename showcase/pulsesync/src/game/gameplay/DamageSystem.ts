import { ENEMY_ARCHETYPES } from '@/game/content/config/enemyConfig';
import { GAME_CONFIG } from '@/game/content/config/gameConfig';
import type { BossSystem } from '@/game/gameplay/BossSystem';
import type { ComboSystem } from '@/game/gameplay/ComboSystem';
import type { EnemySystem } from '@/game/gameplay/EnemySystem';
import type { SyncGaugeSystem } from '@/game/gameplay/SyncGaugeSystem';
import type { FXSystem } from '@/game/systems/FXSystem';
import type { CameraFXSystem } from '@/game/systems/CameraFXSystem';
import { EventBus } from '@/game/systems/EventBus';
import type { GameEventMap } from '@/game/types/GameEvents';
import type { DamageContext, DamageResult, DamageableTarget } from '@/game/types/RuntimeTypes';

export class DamageSystem {
  constructor(
    private readonly enemySystem: EnemySystem,
    private readonly bossSystem: BossSystem,
    private readonly comboSystem: ComboSystem,
    private readonly syncGaugeSystem: SyncGaugeSystem,
    private readonly fxSystem: FXSystem,
    private readonly cameraFX: CameraFXSystem,
    private readonly bus: EventBus<GameEventMap>,
  ) {}

  applyTargetDamage(
    target: DamageableTarget,
    context: DamageContext,
  ): DamageResult | null {
    const result =
      target.owner === 'enemy'
        ? this.enemySystem.applyDamage(target.id, context.amount, context.source)
        : this.bossSystem.applyDamage(target.id, context.amount);

    if (!result) {
      return null;
    }

    this.fxSystem.spawnImpact(result.target.x, result.target.y, result.target.color);
    this.cameraFX.pulse(context.onBeat ? 1.15 : 0.86);
    const comboState = this.comboSystem.apply({ type: 'hit', onBeat: context.onBeat });
    this.syncGaugeSystem.apply({ type: 'hit', onBeat: context.onBeat });
    this.bus.emit('enemy:hit', {
      targetId: result.target.id,
      owner: result.target.owner,
      enemyType: result.target.enemyType,
      x: result.target.x,
      y: result.target.y,
      damage: context.amount,
      destroyed: result.destroyed,
      onBeat: context.onBeat,
    });
    this.trySpecialHitShake(result.target, comboState.score);

    if (result.destroyed) {
      this.fxSystem.spawnExplosion(result.target.x, result.target.y, result.target.color);
      const destroyState = this.comboSystem.apply({
        type: 'destroy',
        onBeat: context.onBeat,
        scoreValue: result.scoreValue,
        chain: result.chain,
      });
      this.syncGaugeSystem.apply({
        type: 'destroy',
        onBeat: context.onBeat,
        chain: result.chain,
      });
      this.bus.emit('enemy:destroyed', {
        targetId: result.target.id,
        owner: result.target.owner,
        enemyType: result.target.enemyType,
        x: result.target.x,
        y: result.target.y,
        damage: context.amount,
        destroyed: true,
        onBeat: context.onBeat,
      });
      this.trySpecialHitShake(result.target, destroyState.score, true);
    }

    if (result.phaseCleared) {
      this.comboSystem.apply({ type: 'bossPhaseClear', scoreValue: 640 });
      this.syncGaugeSystem.apply({ type: 'bossPhaseClear' });
      this.cameraFX.phaseChange();
    }

    return result;
  }

  applyBurst(
    targets: ReadonlyArray<DamageableTarget>,
    perfect: boolean,
    amount: number,
  ): DamageResult[] {
    const uniqueTargets = Array.from(new Map(targets.map((target) => [target.id, target])).values());
    const results = uniqueTargets
      .map((target) =>
        this.applyTargetDamage(target, {
          amount,
          onBeat: perfect,
          source: 'burst',
        }),
      )
      .filter((result): result is DamageResult => Boolean(result));

    this.comboSystem.apply({
      type: 'burst',
      perfect,
      targets: results.length,
    });
    this.syncGaugeSystem.apply({
      type: 'burst',
      perfect,
      targets: results.length,
    });
    this.bus.emit('burst:used', {
      perfect,
      targets: results.length,
    });
    return results;
  }

  private trySpecialHitShake(
    target: DamageableTarget,
    score: number,
    destroyed = false,
  ): void {
    if (score < GAME_CONFIG.specialHitFX.scoreThreshold) {
      return;
    }

    let intensity = 0;
    if (target.owner === 'boss') {
      intensity = GAME_CONFIG.specialHitFX.bossIntensity;
    } else if (target.enemyType) {
      const threat = ENEMY_ARCHETYPES[target.enemyType].threat;
      if (threat < 2) {
        return;
      }

      if (target.enemyType === 'shield-node') {
        intensity = GAME_CONFIG.specialHitFX.shieldNodeIntensity;
      } else if (target.enemyType === 'sniper-sigil') {
        intensity = GAME_CONFIG.specialHitFX.sniperSigilIntensity;
      } else if (target.enemyType === 'distortion-mine') {
        intensity = GAME_CONFIG.specialHitFX.distortionMineIntensity;
      } else {
        intensity = 0.9 + threat * 0.18;
      }
    }

    if (intensity <= 0) {
      return;
    }

    this.fxSystem.spawnSpecialHit(target.x, target.y, target.color, intensity);
    this.cameraFX.specialHit(destroyed ? intensity * 1.08 : intensity);
  }
}
