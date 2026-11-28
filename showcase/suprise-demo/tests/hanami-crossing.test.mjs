import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PerspectiveCamera, Vector3 } from 'three';
import { Navigation } from '../src/shared/navigation.ts';
import { bridgeZ, deckHeight, walkable, westBank } from '../src/scenes/hanami/crossing.ts';

test('a walker can cross the Hanami bridge, descend to the far bank, and return to the path', () => {
  globalThis.window = new EventTarget();
  globalThis.document = new EventTarget();
  globalThis.matchMedia = () => ({matches: true});
  const canvas = Object.assign(new EventTarget(), {focus() {}});
  const camera = new PerspectiveCamera();
  camera.position.set(0, 1.7, bridgeZ);
  const nav = new Navigation(camera, canvas, [], [{
    name: 'bridge', label: 'bridge', position: camera.position.clone(),
    target: new Vector3(0, 1.7, bridgeZ - 1),
  }], {minX: -37, maxX: 27, minZ: -110, maxZ: 35, maxY: 22}, walkable);
  nav.start();
  function traverse(until, direction) {
    nav.setTouch(direction, 0);
    for (let frame = 0; frame < 1200; frame++) {
      nav.update(1 / 60);
      if ((camera.position.x - until) * direction >= 0) return;
    }
    assert.fail('Walker stopped at x = ' + camera.position.x);
  }
  traverse(-16, -1);
  assert.equal(camera.position.y, 1.7 + deckHeight);
  traverse(-35, -1);
  assert.equal(camera.position.y, 1.7 + westBank);
  traverse(-.5, 1);
  assert.equal(camera.position.y, 1.7);
});
