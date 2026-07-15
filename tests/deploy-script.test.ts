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

test("deploy script tightens secret and database file permissions", () => {
  assert.match(deployScript, /chmod 600 "\$APP_DIR\/\.env\.local"/);
  assert.match(deployScript, /chmod 600 "\$DB_FILE"/);
});

test("deploy script preserves existing SSL configuration", () => {
  assert.match(deployScript, /偵測到現有 SSL\/Certbot 設定，跳過寫入/);
  assert.match(deployScript, /sed -i '\/\^ADMIN_HOSTNAME=\/d'/);
  assert.doesNotMatch(deployScript, /admin\.thelonesomeera\.com/);
});
