import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nginxConfig = readFileSync(path.join(repoRoot, "nginx.conf"), "utf8");

test("nginx forwards the original host to Next.js", () => {
  assert.match(nginxConfig, /proxy_set_header X-Forwarded-Host \$host;/);
});

test("nginx only gives immutable caching to content-hashed assets", () => {
  assert.match(
    nginxConfig,
    /\/showcase\/\.\*\/assets\/[\s\S]+?max-age=31536000, immutable/,
  );
  assert.match(
    nginxConfig,
    /location \^~ \/_next\/static\/[\s\S]+?max-age=31536000, immutable/,
  );
});

test("nginx revalidates mutable public files and static HTML", () => {
  assert.match(nginxConfig, /max-age=0, must-revalidate/);
  assert.match(
    nginxConfig,
    /location \/showcase\/[\s\S]+?Cache-Control "no-cache"/,
  );
  assert.match(
    nginxConfig,
    /location \/blog\/[\s\S]+?Cache-Control "no-cache"/,
  );
  assert.doesNotMatch(nginxConfig, /expires 7d/);
});
