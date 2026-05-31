import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("root lint has a checked-in ESLint configuration", () => {
  assert.ok(existsSync(path.join(repoRoot, "eslint.config.mjs")));
});

test("root lint runs through the ESLint CLI", () => {
  const packageJson = JSON.parse(
    readFileSync(path.join(repoRoot, "package.json"), "utf8"),
  );
  assert.equal(packageJson.scripts.lint, "eslint .");
});

test("TypeScript incremental build info is ignored and not tracked", () => {
  const gitignore = readFileSync(path.join(repoRoot, ".gitignore"), "utf8");
  assert.match(gitignore, /^tsconfig\.tsbuildinfo$/m);
});
