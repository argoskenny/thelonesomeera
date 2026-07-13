import type { LevelDefinition, TimelineCue } from '@/game/types/GameTypes';

const KIND_ORDER: TimelineCue['kind'][] = ['phase', 'visual', 'music', 'boss', 'spawn'];

function compareCues(left: TimelineCue, right: TimelineCue): number {
  if (left.at !== right.at) {
    return left.at - right.at;
  }

  return KIND_ORDER.indexOf(left.kind) - KIND_ORDER.indexOf(right.kind);
}

export function validateBeatmap(level: LevelDefinition): string[] {
  const issues: string[] = [];

  if (level.beatGrid.bpm <= 0) {
    issues.push('Beatmap bpm must be greater than 0.');
  }

  if (level.totalBars <= 0) {
    issues.push('Beatmap totalBars must be greater than 0.');
  }

  const sortedPhases = [...level.phases].sort((left, right) => left.startBar - right.startBar);
  sortedPhases.forEach((phase, index) => {
    if (phase.endBar <= phase.startBar) {
      issues.push(`Phase "${phase.key}" has an invalid range.`);
    }

    const previousPhase = sortedPhases[index - 1];
    if (previousPhase && previousPhase.endBar > phase.startBar) {
      issues.push(`Phase "${phase.key}" overlaps with "${previousPhase.key}".`);
    }
  });

  level.cues.forEach((cue, index) => {
    if (cue.at < 0) {
      issues.push(`Cue "${cue.id}" cannot start before 0.`);
    }

    const previousCue = level.cues[index - 1];
    if (previousCue && compareCues(previousCue, cue) > 0) {
      issues.push(`Cue "${cue.id}" is out of chronological order.`);
    }
  });

  return issues;
}

export function loadBeatmap(level: LevelDefinition): LevelDefinition {
  const cues = [...level.cues].sort(compareCues);
  const normalizedLevel = {
    ...level,
    phases: [...level.phases].sort((left, right) => left.startBar - right.startBar),
    cues,
  };

  const issues = validateBeatmap(normalizedLevel);
  if (issues.length > 0) {
    throw new Error(`Invalid beatmap "${level.id}": ${issues.join(' ')}`);
  }

  return normalizedLevel;
}
