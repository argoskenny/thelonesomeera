import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PerspectiveCamera, Vector3 } from 'three';
import { Navigation } from '../src/shared/navigation.ts';
import { northAccessLayout, treads, stairZ, lowerX, topY, doorZ } from '../src/scenes/shirasagi/north-steps-layout.ts';

test('the north stairs connect the grounds, resting landing and closed keep door in both directions', () => {
  globalThis.window = new EventTarget();
  globalThis.document = new EventTarget();
  globalThis.matchMedia = () => ({ matches: true });
  const canvas = Object.assign(new EventTarget(), { focus() {} });
  const camera = new PerspectiveCamera();
  camera.position.set(lowerX - 1, 1.7, stairZ);
  const layout = northAccessLayout();
  const nav = new Navigation(camera, canvas, [
    { x: 0, z: 0, w: 38.5, d: 34.5, h: topY }, ...layout.obstacles,
  ], [{ name: 'North', label: 'North', position: camera.position.clone(),
    target: new Vector3(lowerX - 1, 1.7, stairZ - 1) }],
  { minX: -66, maxX: 66, minZ: -66, maxZ: 66, maxY: 62 }, [
    { x: 0, z: 0, w: 132, d: 132, y: 0,
      heightAt: (x, z) => Math.abs(x) < 19.24 && Math.abs(z) < 17.24 ? undefined : 0 },
    ...layout.surfaces,
  ]);
  nav.start();
  function walkTo(x, z) {
    for (let i = 0; i < 720; i++) {
      const dx = x - camera.position.x, dz = z - camera.position.z;
      const d = Math.hypot(dx, dz);
      if (d < .035) { nav.setTouch(0, 0); return; }
      nav.setTouch(dx / Math.max(.3, d), dz / Math.max(.3, d));
      nav.update(1 / 60);
    }
    assert.fail('Stuck at ' + camera.position.toArray() + ', destination ' + [x, z]);
  }
  const expectFloor = y => assert.ok(Math.abs(camera.position.y - 1.7 - y) < .01);
  const mid = treads.find(t => t.landing);
  walkTo((mid.from + mid.to) / 2, stairZ); expectFloor(5.3);
  walkTo(4.1, stairZ); expectFloor(topY);
  walkTo(4.1, doorZ - .28); expectFloor(topY);
  nav.setTouch(0, 1);
  for (let i = 0; i < 55; i++) nav.update(1 / 60);
  assert.ok(camera.position.z < doorZ - .19, 'the timber door stops walking');
  walkTo(4.1, stairZ);
  walkTo((mid.from + mid.to) / 2, stairZ); expectFloor(5.3);
  walkTo(lowerX - 1, stairZ); expectFloor(0);
  assert.equal(nav.mode, 'walk');
});
