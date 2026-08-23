import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath: string) {
  return readFileSync(path.join(repoRoot, relativePath), "utf8");
}

test("standalone builds fail closed when a registered source is missing", () => {
  const buildScript = read("scripts/build-standalone.mjs");
  const syncScript = read("scripts/sync-static-apps.mjs");

  for (const script of [buildScript, syncScript]) {
    assert.match(script, /refusing to preserve potentially stale output/);
    assert.match(script, /process\.exit\(1\)/);
    assert.match(script, /process\.argv\.includes\("--allow-skip"\)/);
  }
});

test("standalone build forwards an explicit partial-checkout override to sync", () => {
  const buildScript = read("scripts/build-standalone.mjs");

  assert.match(buildScript, /syncArgs\.push\("--", "--allow-skip"\)/);
});
