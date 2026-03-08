import type { ComboState } from '@/game/types/GameTypes';

export type ComboEvent =
  | { type: 'hit'; onBeat: boolean; scoreValue?: number }
  | { type: 'destroy'; onBeat: boolean; scoreValue: number; chain?: boolean }
  | { type: 'miss' }
  | { type: 'damage' }
  | { type: 'burst'; perfect: boolean; targets: number }
  | { type: 'bossPhaseClear'; scoreValue: number };

export function createInitialComboState(): ComboState {
  return {
    combo: 0,
    maxCombo: 0,
    score: 0,
    hits: 0,
    kills: 0,
    multiplier: 1,
  };
}

export function getComboMultiplier(combo: number): number {
  return 1 + Math.min(2, Math.floor(combo / 12) * 0.25);
}

export function applyComboEvent(
  state: ComboState,
  event: ComboEvent,
): ComboState {
  let combo = state.combo;
  let score = state.score;
  let hits = state.hits;
  let kills = state.kills;

  switch (event.type) {
    case 'hit': {
      combo += 1;
      hits += 1;
      score += Math.round((event.scoreValue ?? 90) * (event.onBeat ? 1.2 : 1));
      break;
    }
    case 'destroy': {
      combo += event.chain ? 3 : 2;
      kills += 1;
      score += Math.round(event.scoreValue * (event.onBeat ? 2.3 : 2));
      break;
    }
    case 'miss': {
      combo = Math.max(0, combo - 4);
      score = Math.max(0, score - 80);
      break;
    }
    case 'damage': {
      combo = Math.max(0, combo - 8);
      score = Math.max(0, score - 140);
      break;
    }
    case 'burst': {
      combo = event.perfect ? combo + 2 : Math.max(0, combo - 2);
      score += Math.round((event.perfect ? 210 : 80) * Math.max(1, event.targets));
      break;
    }
    case 'bossPhaseClear': {
      combo += 6;
      score += event.scoreValue;
      break;
    }
  }

  const maxCombo = Math.max(state.maxCombo, combo);
  const multiplier = getComboMultiplier(combo);

  return {
    combo,
    maxCombo,
    score,
    hits,
    kills,
    multiplier,
  };
}
