import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const deployScript = readFileSync(path.join(repoRoot, "deploy.sh"), "utf8");

test("deploy script does not make the entire app directory world-readable", () => {
  assert.doesNotMatch(deployScript, /chmod -R 755 "\$APP_DIR"/);
});

test("deploy script does not initialize removed admin or database state", () => {
  for (const removedMarker of [
    "ADMIN_PASSWORD",
    "JWT_SECRET",
    "DATABASE_URL",
    "DB_FILE",
    "SEED_DATABASE",
    "ARTICLE_COUNT",
    "prisma",
    "--seed",
  ]) {
    assert.doesNotMatch(deployScript, new RegExp(removedMarker, "i"));
  }
});

test("deploy script installs dependencies for every Vite showcase build", () => {
  assert.match(
    deployScript,
    /npm --prefix showcase\/colorful_kart ci --include=dev/,
  );
  assert.match(
    deployScript,
    /npm --prefix showcase\/mini_fantasy ci --include=dev/,
  );
});

test("deploy script keeps devDependencies available during every build install", () => {
  const installCommands = deployScript
    .split("\n")
    .filter((line) => line.includes("npm") && line.includes(" ci"));

  assert.equal(installCommands.length, 7);
  for (const command of installCommands) {
    assert.match(command, /ci --include=dev/);
  }
});

test("deploy script preserves existing SSL configuration", () => {
  assert.match(deployScript, /偵測到現有 SSL\/Certbot 設定，跳過寫入/);
});
