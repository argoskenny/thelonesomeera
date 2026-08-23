import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath: string) {
  return readFileSync(path.join(repoRoot, relativePath), "utf8");
}

test("release verification covers root checks, showcases, builds, and smoke", () => {
  const packageJson = JSON.parse(read("package.json"));
  const releaseScript = packageJson.scripts["verify:release"];

  for (const command of [
    "verify:root",
    "verify:showcases",
    "build:standalone",
    "npm run build",
    "npm run smoke",
  ]) {
    assert.match(releaseScript, new RegExp(command.replace(":", "\\:")));
  }
});

test("showcase dependency installation is complete and fail closed", () => {
  const installScript = read("scripts/ci-showcases.mjs");

  for (const project of [
    "androidtest",
    "cod2",
    "room",
    "pulsesync",
    "colorful_kart",
    "mini_fantasy",
  ]) {
    assert.match(installScript, new RegExp(`"${project}"`));
  }

  assert.match(installScript, /missing lockfile/);
  assert.match(installScript, /process\.exit\(1\)/);
});

test("CI runs the same release gate and checks generated output", () => {
  const workflow = read(".github/workflows/verify.yml");

  assert.match(workflow, /npm ci/);
  assert.match(workflow, /npm run ci:showcases/);
  assert.match(workflow, /npm run verify:release/);
  assert.match(workflow, /npm run check:generated/);
});

test("production smoke test covers main, nested, blog, and showcase routes", () => {
  const smokeScript = read("scripts/smoke-production.mjs");

  for (const route of [
    "/demo",
    "/blog",
    "/about",
    "/demo/ai-hub",
    "/blog/selfie-cat-development.html",
    "/showcase/mini_fantasy/",
    "/robots.txt",
    "/sitemap.xml",
  ]) {
    assert.match(smokeScript, new RegExp(route.replaceAll("/", "\\/")));
  }
});
