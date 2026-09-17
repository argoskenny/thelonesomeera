import test from "node:test";
import assert from "node:assert/strict";
import { generateFern } from "../src/fern.ts";

test("every specimen stays finite, centered and within a mobile-safe geometry budget", () => {
  for (const mode of [0, 1, 2])
    for (const complexity of [0.15, 0.75, 1, NaN]) {
      const data = generateFern(complexity, 76, mode);
      assert.equal(data.positions.length % 6, 0);
      assert.equal(data.positions.length, data.colors.length);
      assert.ok(data.positions.length < 500000);
      assert.ok(data.spores.length > 0);
      for (const value of data.positions)
        assert.ok(Number.isFinite(value) && Math.abs(value) < 12);
    }
});
test("regeneration changes morphology while a seed remains reproducible", () => {
  const first = generateFern(0.75, 76);
  assert.deepEqual(first, generateFern(0.75, 76));
  assert.notDeepEqual(first.positions, generateFern(0.75, 213).positions);
});
test("complexity and mode controls affect generated geometry", () => {
  assert.ok(
    generateFern(1, 76).positions.length >
      generateFern(0.15, 76).positions.length,
  );
  assert.ok(
    generateFern(0.75, 76, 2).spores.length >
      generateFern(0.75, 76, 0).spores.length,
  );
  assert.notDeepEqual(
    generateFern(0.75, 76, 1).positions,
    generateFern(0.75, 76, 0).positions,
  );
});
