export const TOTAL_LAPS = 3;

export interface RankingEntry {
  id: string;
  name: string;
  color: number;
  totalProgress: number;
  finishTime: number | null;
}

export function wrapProgress(progress: number): number {
  return ((progress % 1) + 1) % 1;
}

export function lapFromProgress(totalProgress: number): number {
  return Math.min(TOTAL_LAPS, Math.max(1, Math.floor(Math.max(0, totalProgress)) + 1));
}

export function racePositionSuffix(position: number): string {
  if (position === 1) return "1ST";
  if (position === 2) return "2ND";
  if (position === 3) return "3RD";
  return `${position}TH`;
}

export function circularDistance(a: number, b: number): number {
  const difference = Math.abs(wrapProgress(a) - wrapProgress(b));
  return Math.min(difference, 1 - difference);
}

export function sortRankings<T extends RankingEntry>(racers: readonly T[]): T[] {
  return [...racers].sort((a, b) => {
    const aFinished = a.finishTime !== null;
    const bFinished = b.finishTime !== null;

    if (aFinished && bFinished) return (a.finishTime ?? Infinity) - (b.finishTime ?? Infinity);
    if (aFinished !== bFinished) return aFinished ? -1 : 1;
    return b.totalProgress - a.totalProgress;
  });
}

export function formatRaceTime(seconds: number | null): string {
  if (seconds === null) return "RACING";
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds - minutes * 60;
  return `${minutes}:${remaining.toFixed(2).padStart(5, "0")}`;
}
