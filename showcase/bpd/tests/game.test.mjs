import test from "node:test";
import assert from "node:assert/strict";
import { LEVELS } from "../levels.js";

const DIRECTIONS = [
  [0, -1],
  [0, 1],
  [-1, 0],
  [1, 0],
];

const keyOf = (x, y) => `${x},${y}`;

function parseLevel(level) {
  const parsed = {
    width: level.map[0].length,
    height: level.map.length,
    walls: new Set(),
    sigils: new Set(),
    traps: new Set(),
    resets: new Set(),
    blocks: new Set(),
    player: null,
    door: null,
    key: null,
  };

  level.map.forEach((row, y) => {
    [...row].forEach((tile, x) => {
      const position = keyOf(x, y);
      if (tile === "#") parsed.walls.add(position);
      if (tile === "S") parsed.sigils.add(position);
      if (tile === "T") parsed.traps.add(position);
      if (tile === "R") parsed.resets.add(position);
      if (tile === "B") parsed.blocks.add(position);
      if (tile === "P") parsed.player = position;
      if (tile === "D") parsed.door = position;
      if (tile === "K") parsed.key = position;
    });
  });

  return parsed;
}

function stateId(player, blocks, hasKey) {
  return `${player}|${[...blocks].sort().join(";")}|${hasKey ? 1 : 0}`;
}

function isSolved(level) {
  const parsed = parseLevel(level);
  const queue = [{ player: parsed.player, blocks: parsed.blocks, hasKey: false }];
  const visited = new Set([stateId(parsed.player, parsed.blocks, false)]);

  while (queue.length > 0) {
    const current = queue.shift();
    const [playerX, playerY] = current.player.split(",").map(Number);
    const allSigilsAwake = [...parsed.sigils].every((sigil) => current.blocks.has(sigil));
    const doorOpen = allSigilsAwake && (!parsed.key || current.hasKey);

    for (const [dx, dy] of DIRECTIONS) {
      const target = keyOf(playerX + dx, playerY + dy);
      if (parsed.walls.has(target) || parsed.traps.has(target) || parsed.resets.has(target)) continue;
      if (target === parsed.door && !doorOpen) continue;
      if (target === parsed.door && doorOpen) return true;

      const nextBlocks = new Set(current.blocks);
      if (nextBlocks.has(target)) {
        const beyond = keyOf(playerX + dx * 2, playerY + dy * 2);
        if (
          parsed.walls.has(beyond) ||
          parsed.traps.has(beyond) ||
          parsed.resets.has(beyond) ||
          nextBlocks.has(beyond) ||
          beyond === parsed.door
        ) {
          continue;
        }
        nextBlocks.delete(target);
        nextBlocks.add(beyond);
      }

      const hasKey = current.hasKey || target === parsed.key;
      const id = stateId(target, nextBlocks, hasKey);
      if (visited.has(id)) continue;
      visited.add(id);
      queue.push({ player: target, blocks: nextBlocks, hasKey });
    }
  }

  return false;
}

test("the game contains exactly five valid rooms", () => {
  assert.equal(LEVELS.length, 5);

  LEVELS.forEach((level) => {
    const width = level.map[0].length;
    assert.ok(level.name);
    assert.ok(level.hint);
    assert.equal(level.map.length, 8);
    assert.ok(level.map.every((row) => row.length === width));

    const tiles = level.map.join("");
    assert.equal([...tiles].filter((tile) => tile === "P").length, 1);
    assert.equal([...tiles].filter((tile) => tile === "D").length, 1);
    assert.equal([...tiles].filter((tile) => tile === "B").length, [...tiles].filter((tile) => tile === "S").length);
  });
});

test("every room has a path to its open door", () => {
  LEVELS.forEach((level) => {
    assert.equal(isSolved(level), true, `${level.name} should be solvable`);
  });
});
