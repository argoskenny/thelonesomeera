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
  assert.match(deployScript, /npm run ci:showcases/);
});

test("deploy script keeps devDependencies available during every build install", () => {
  assert.match(deployScript, /npm ci --include=dev/);
  assert.match(deployScript, /npm run ci:showcases/);
});

test("deploy script runs the complete release verification gate", () => {
  assert.match(deployScript, /npm run verify:release/);
  assert.doesNotMatch(deployScript, /npm run build:standalone\n/);
});

test("deploy script preserves existing SSL configuration", () => {
  assert.match(deployScript, /偵測到現有 SSL\/Certbot 設定，跳過寫入/);
});

test("deploy script aborts and restores state when nginx validation fails", () => {
  assert.match(deployScript, /if sudo nginx -t 2>&1; then/);
  assert.match(deployScript, /還原 Nginx 設定/);
  assert.match(deployScript, /移除本次首次部署建立的無效設定/);
  assert.match(
    deployScript,
    /else\n\s+echo "  ✗ Nginx[\s\S]+?return 1\n\s+fi/,
  );
});

test("deploy script requires an HTTP health check before reporting success", () => {
  assert.match(deployScript, /wait_for_http\(\)/);
  assert.match(
    deployScript,
    /pm2 start ecosystem\.config\.js[\s\S]+?wait_for_http "\$HEALTHCHECK_URL" "Next\.js"[\s\S]+?部署完成/,
  );
});
