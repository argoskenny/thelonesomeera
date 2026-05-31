import assert from "node:assert/strict";
import { test } from "node:test";

import nextConfig from "../next.config.mjs";

test("admin and API responses declare hardened security headers", async () => {
  assert.equal(typeof nextConfig.headers, "function");

  const headers = await nextConfig.headers();
  const bySource = new Map(headers.map((entry) => [entry.source, entry.headers]));

  for (const source of ["/admin/:path*", "/api/:path*"]) {
    const routeHeaders = bySource.get(source);
    assert.ok(routeHeaders, `${source} is missing security headers`);

    const keys = new Set(routeHeaders.map((header) => header.key));
    assert.ok(keys.has("Content-Security-Policy"));
    assert.ok(keys.has("X-Content-Type-Options"));
    assert.ok(keys.has("X-Frame-Options"));
    assert.ok(keys.has("Referrer-Policy"));
    assert.ok(keys.has("Permissions-Policy"));
  }
});
