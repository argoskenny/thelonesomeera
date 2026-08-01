export type QuestStage = "not-started" | "collecting" | "ready" | "complete";

export interface AdventureState {
  questStage: QuestStage;
  berries: number;
  openedChests: string[];
  defeatedEnemies: string[];
  coins: number;
  potions: number;
  bossDefeated: boolean;
}

export const initialAdventureState = (): AdventureState => ({
  questStage: "not-started",
  berries: 0,
  openedChests: [],
  defeatedEnemies: [],
  coins: 0,
  potions: 0,
  bossDefeated: false,
});

export function acceptQuest(state: AdventureState): AdventureState {
  if (state.questStage !== "not-started") return state;
  return { ...state, questStage: "collecting" };
}

export function collectBerry(state: AdventureState): AdventureState {
  if (state.questStage !== "collecting" || state.berries >= 3) return state;
  const berries = state.berries + 1;
  return {
    ...state,
    berries,
    questStage: berries === 3 ? "ready" : "collecting",
  };
}

export function completeQuest(state: AdventureState): AdventureState {
  if (state.questStage !== "ready") return state;
  return { ...state, questStage: "complete", coins: state.coins + 20 };
}

export function openChest(state: AdventureState, id: string): AdventureState {
  if (state.openedChests.includes(id)) return state;
  return {
    ...state,
    openedChests: [...state.openedChests, id],
    coins: state.coins + 12,
    potions: state.potions + 1,
  };
}

export function defeatEnemy(state: AdventureState, id: string): AdventureState {
  if (state.defeatedEnemies.includes(id)) return state;
  return {
    ...state,
    defeatedEnemies: [...state.defeatedEnemies, id],
    coins: state.coins + 3,
  };
}

export function defeatBoss(state: AdventureState): AdventureState {
  if (state.questStage !== "complete" || state.bossDefeated) return state;
  return { ...state, bossDefeated: true, coins: state.coins + 50 };
}

export function questCopy(state: AdventureState): { title: string; detail: string } {
  switch (state.questStage) {
    case "not-started":
      return { title: "和米菈談談", detail: "她在村屋前等你" };
    case "collecting":
      return { title: "替米菈找回月光莓", detail: `${state.berries} / 3` };
    case "ready":
      return { title: "把月光莓帶回給米菈", detail: "3 / 3" };
    case "complete":
      return state.bossDefeated
        ? { title: "村莊恢復平靜", detail: "冒險完成！" }
        : { title: "前往古樹谷地", detail: "擊敗苔角守衛" };
  }
}
