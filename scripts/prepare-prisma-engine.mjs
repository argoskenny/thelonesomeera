import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

if (process.platform !== "darwin") {
  process.exit(0);
}

const target =
  process.arch === "arm64"
    ? "darwin-arm64"
    : process.arch === "x64"
      ? "darwin"
      : null;

if (!target) {
  console.log(`[prisma-engine] skip unsupported macOS arch: ${process.arch}`);
  process.exit(0);
}

const engineFile = `libquery_engine-${target}.dylib.node`;
const rootDir = process.cwd();
const prismaClientDir = path.join(rootDir, "node_modules/.prisma/client");
const targetPath = path.join(prismaClientDir, engineFile);
const esbuildShim = path.join(rootDir, "node_modules/esbuild/bin/esbuild");
const esbuildTarget = path.join(
  rootDir,
  `node_modules/@esbuild/${target}/bin/esbuild`,
);

const sourceCandidates = [
  path.join(rootDir, "node_modules/prisma", engineFile),
  path.join(rootDir, "node_modules/@prisma/engines", engineFile),
  targetPath,
];

const sourcePath = sourceCandidates.find((candidate) => fs.existsSync(candidate));
if (!sourcePath) {
  console.warn(`[prisma-engine] cannot find ${engineFile} in known paths`);
  process.exit(0);
}

if (!fs.existsSync(targetPath)) {
  fs.mkdirSync(prismaClientDir, { recursive: true });
  fs.copyFileSync(sourcePath, targetPath);
  console.log(`[prisma-engine] copied ${engineFile} to node_modules/.prisma/client`);
}

if (fs.existsSync(esbuildShim) && !fs.existsSync(esbuildTarget)) {
  fs.mkdirSync(path.dirname(esbuildTarget), { recursive: true });
  fs.copyFileSync(esbuildShim, esbuildTarget);
  fs.chmodSync(esbuildTarget, 0o755);
  console.log("[runtime] repaired missing @esbuild binary");
}

const dirs = [
  path.join(rootDir, "node_modules/prisma"),
  path.join(rootDir, "node_modules/@prisma"),
  path.join(rootDir, "node_modules/.prisma"),
  path.join(rootDir, "node_modules/esbuild"),
  path.join(rootDir, "node_modules/@esbuild"),
  path.join(rootDir, "node_modules/tsx"),
].filter((dirPath) => fs.existsSync(dirPath));

for (const dirPath of dirs) {
  try {
    execFileSync("xattr", ["-dr", "com.apple.quarantine", dirPath], {
      stdio: "ignore",
    });
  } catch {
    // ignore command failure
  }
}

for (const filePath of [sourcePath, targetPath]) {
  try {
    execFileSync("xattr", ["-d", "com.apple.quarantine", filePath], {
      stdio: "ignore",
    });
  } catch {
    // ignore missing attribute
  }
}
