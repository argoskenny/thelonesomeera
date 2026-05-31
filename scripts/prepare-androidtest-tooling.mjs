import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

if (process.platform !== "darwin") {
  process.exit(0);
}

const esbuildPackage =
  process.arch === "arm64"
    ? "@esbuild/darwin-arm64"
    : process.arch === "x64"
      ? "@esbuild/darwin-x64"
      : null;

if (!esbuildPackage) {
  process.exit(0);
}

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appDir = path.join(rootDir, "androidtest");
const targetBinary = path.join(appDir, "node_modules", esbuildPackage, "bin/esbuild");
const fallbackBinary = path.join(appDir, "node_modules/esbuild/bin/esbuild");

if (!fs.existsSync(targetBinary)) {
  if (!fs.existsSync(fallbackBinary)) {
    process.exit(0);
  }

  fs.mkdirSync(path.dirname(targetBinary), { recursive: true });
  fs.copyFileSync(fallbackBinary, targetBinary);
  fs.chmodSync(targetBinary, 0o755);
  console.log(`[androidtest-tooling] repaired ${esbuildPackage}/bin/esbuild`);
}

for (const target of [path.dirname(targetBinary), targetBinary, fallbackBinary].filter((target) =>
  fs.existsSync(target),
)) {
  try {
    execFileSync("xattr", ["-dr", "com.apple.quarantine", target], {
      stdio: "ignore",
    });
  } catch {
    // ignore missing attribute
  }
}
