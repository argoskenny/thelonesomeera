import { describe, expect, it } from "vitest";
import { SCENE_CONFIG } from "../src/config/sceneConfig";

describe("scene configuration", () => {
  it("uses meters and the reference room dimensions", () => {
    expect(SCENE_CONFIG.units).toBe("meters");
    expect(SCENE_CONFIG.room).toMatchObject({ width: 3.6, depth: 3, height: 2.7 });
    expect(SCENE_CONFIG.player.height).toBe(1.8);
  });

  it("keeps all declared sizes positive", () => {
    const sizes = [
      SCENE_CONFIG.furniture.desk.size,
      SCENE_CONFIG.furniture.chair.size,
      SCENE_CONFIG.furniture.bookshelf.size,
      SCENE_CONFIG.furniture.cabinet.size,
    ];
    for (const size of sizes) {
      expect(size.width).toBeGreaterThan(0);
      expect(size.depth).toBeGreaterThan(0);
      expect(size.height).toBeGreaterThan(0);
    }
  });

  it("places the chair on the entrance side of the desk", () => {
    expect(SCENE_CONFIG.furniture.chair.position[2]).toBeGreaterThan(
      SCENE_CONFIG.furniture.desk.position[2],
    );
  });
});
