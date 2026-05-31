import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nginxConfig = readFileSync(path.join(repoRoot, "nginx.conf"), "utf8");

test("nginx defines a dedicated admin hostname", () => {
  assert.match(nginxConfig, /server_name admin\.thelonesomeera\.com;/);
});

test("public admin routes redirect to the dedicated admin hostname", () => {
  assert.match(
    nginxConfig,
    /location = \/admin\s+\{ return 302 \$scheme:\/\/admin\.thelonesomeera\.com\$request_uri; \}/,
  );
  assert.match(
    nginxConfig,
    /location \^~ \/admin\/\s+\{ return 302 \$scheme:\/\/admin\.thelonesomeera\.com\$request_uri; \}/,
  );
});

test("nginx forwards the public host to Next.js for hostname checks", () => {
  assert.match(nginxConfig, /proxy_set_header X-Forwarded-Host \$host;/);
});
