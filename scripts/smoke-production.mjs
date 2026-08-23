import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const serverPath = path.join(repoRoot, ".next", "standalone", "server.js");
const hostname = "127.0.0.1";
const port = process.env.SMOKE_PORT || "3100";
const baseUrl = `http://${hostname}:${port}`;

if (!fs.existsSync(serverPath)) {
  throw new Error("Missing production server. Run npm run build before npm run smoke.");
}

const server = spawn(process.execPath, [serverPath], {
  cwd: repoRoot,
  env: {
    ...process.env,
    HOSTNAME: hostname,
    NEXT_TELEMETRY_DISABLED: "1",
    NODE_ENV: "production",
    PORT: port,
  },
  stdio: ["ignore", "pipe", "pipe"],
});

let serverOutput = "";
for (const stream of [server.stdout, server.stderr]) {
  stream.on("data", (chunk) => {
    serverOutput = `${serverOutput}${chunk}`.slice(-12_000);
  });
}

async function stopServer() {
  if (server.exitCode !== null) {
    return;
  }

  server.kill("SIGTERM");
  await Promise.race([once(server, "exit"), delay(3_000)]);

  if (server.exitCode === null) {
    server.kill("SIGKILL");
    await once(server, "exit");
  }
}

async function waitUntilReady() {
  for (let attempt = 1; attempt <= 40; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(`Production server exited early.\n${serverOutput}`);
    }

    try {
      const response = await fetch(baseUrl, {
        signal: AbortSignal.timeout(2_000),
      });
      if (response.ok) {
        return;
      }
    } catch {
      // The standalone server may still be starting.
    }

    await delay(250);
  }

  throw new Error(`Production server did not become ready.\n${serverOutput}`);
}

const checks = [
  ["/", "The Lonesome Era"],
  ["/demo", "把想法做成"],
  ["/blog", "把做過的事"],
  ["/about", "做能被使用的東西"],
  ["/demo/ai-hub", "AI Hub"],
  ["/blog/selfie-cat-development.html", "Selfie Cat"],
  ["/showcase/mini_fantasy/", "迷你奇境"],
  ["/robots.txt", "Sitemap: https://thelonesomeera.com/sitemap.xml"],
  ["/sitemap.xml", "<lastmod>2025-05-20</lastmod>"],
];

try {
  await waitUntilReady();

  for (const [route, expectedText] of checks) {
    const response = await fetch(`${baseUrl}${route}`, {
      redirect: "follow",
      signal: AbortSignal.timeout(5_000),
    });
    const body = await response.text();

    if (!response.ok) {
      throw new Error(`${route} returned HTTP ${response.status}`);
    }
    if (!body.includes(expectedText)) {
      throw new Error(`${route} did not include expected text: ${expectedText}`);
    }

    console.log(`[smoke] ${route} -> ${response.status}`);
  }
} finally {
  await stopServer();
}
