import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nginxConfig = readFileSync(path.join(repoRoot, "nginx.conf"), "utf8");

test("admin routes stay on the primary hostname", () => {
  assert.doesNotMatch(nginxConfig, /admin\.thelonesomeera\.com/);
  assert.doesNotMatch(nginxConfig, /location (?:= |\^~ )?\/admin/);
});

test("nginx forwards the original host to Next.js", () => {
  assert.match(nginxConfig, /proxy_set_header X-Forwarded-Host \$host;/);
});
