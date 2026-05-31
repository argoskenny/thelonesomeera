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

test("deploy script configures the dedicated admin hostname", () => {
  assert.match(deployScript, /ADMIN_HOSTNAME=admin\.thelonesomeera\.com/);
});

test("deploy script refuses SSL deployments without the admin nginx hostname", () => {
  assert.match(
    deployScript,
    /sudo grep -Rqs "server_name\[\[:space:\]\]\.\*admin\\\\\.thelonesomeera\\\\\.com"/,
  );
  assert.match(deployScript, /Nginx 尚未設定 admin\.thelonesomeera\.com/);
});
