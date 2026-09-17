import test from "node:test";
import assert from "node:assert/strict";
import {
  sampleJourney,
  jungleDepth,
  coverFrame,
  HERO_NEAR_DEPTH,
} from "../src/hero-state.ts";

test("scroll poses are reversible and independent of traversal history", () => {
  const forward = Array.from({ length: 101 }, (_, i) => sampleJourney(i / 100));
  for (let i = 100; i >= 0; i--)
    assert.deepEqual(sampleJourney(i / 100), forward[i]);
  assert.equal(sampleJourney(0).entranceOpacity, 1);
  assert.equal(sampleJourney(0).typeOpacity, 1);
  assert.equal(sampleJourney(1).typeOpacity, 0);
  assert.equal(sampleJourney(1).threshold, 1);
  assert.deepEqual(sampleJourney(NaN), sampleJourney(0));
  assert.deepEqual(sampleJourney(2), sampleJourney(1));
});
test("the dolly stays before the nearest plane and creates substantially different depth rates", () => {
  for (const mobile of [false, true]) {
    let previous = 0;
    for (let i = 0; i <= 100; i++) {
      const { travel } = sampleJourney(i / 100, mobile);
      assert.ok(travel >= previous && travel < HERO_NEAR_DEPTH - 1);
      previous = travel;
    }
    const travel = sampleJourney(1, mobile).travel;
    const nearRate = HERO_NEAR_DEPTH / (HERO_NEAR_DEPTH - travel) - 1;
    const distance = jungleDepth(0.727, 0.49);
    const farRate = distance / (distance - travel) - 1;
    assert.ok(nearRate > farRate * 8);
  }
});
test("image projection covers mobile, landscape and desktop entrances without stretching", () => {
  for (const [w, h] of [
    [390, 844],
    [375, 667],
    [844, 390],
    [1440, 900],
    [2560, 1080],
  ]) {
    const frame = coverFrame(w, h);
    assert.ok(frame.left <= 0 && frame.top <= 0);
    assert.ok(frame.left + frame.width >= w && frame.top + frame.height >= h);
    assert.ok(Math.abs(frame.width / frame.height - 1.5) < 1e-10);
  }
});
