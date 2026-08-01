import { describe, expect, it } from "vitest";
import {
  acceptQuest,
  collectBerry,
  completeQuest,
  defeatBoss,
  initialAdventureState,
  openChest,
} from "../src/game/state";

describe("adventure progression", () => {
  it("requires the quest before berries can be collected", () => {
    const state = collectBerry(initialAdventureState());
    expect(state.berries).toBe(0);
  });

  it("moves from collection to hand-in after three berries", () => {
    let state = acceptQuest(initialAdventureState());
    state = collectBerry(state);
    state = collectBerry(state);
    state = collectBerry(state);
    expect(state).toMatchObject({ berries: 3, questStage: "ready" });
  });

  it("unlocks boss completion only after handing in the quest", () => {
    const locked = defeatBoss(initialAdventureState());
    expect(locked.bossDefeated).toBe(false);

    let ready = acceptQuest(initialAdventureState());
    ready = collectBerry(ready);
    ready = collectBerry(ready);
    ready = collectBerry(ready);
    const complete = completeQuest(ready);
    expect(defeatBoss(complete).bossDefeated).toBe(true);
  });

  it("only rewards a treasure chest once", () => {
    const once = openChest(initialAdventureState(), "village-chest");
    const twice = openChest(once, "village-chest");
    expect(twice.coins).toBe(12);
    expect(twice.potions).toBe(1);
  });
});
