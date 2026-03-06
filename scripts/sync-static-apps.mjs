import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const syncTargets = [
  {
    name: "sox",
    sourceDir: "sox",
    targetDir: "public/sox",
    entries: ["index.html", "favicon.svg", "js", "assets"],
  },
  {
    name: "cod2",
    sourceDir: "cod2/dist",
    targetDir: "public/cod2",
    entries: ["index.html", "assets", "audios", "textures"],
  },
];

function copyEntry(sourcePath, targetPath) {
  const stat = fs.statSync(sourcePath);

  if (path.basename(sourcePath) === ".DS_Store") {
    return;
  }

  if (stat.isDirectory()) {
    fs.mkdirSync(targetPath, { recursive: true });

    for (const child of fs.readdirSync(sourcePath)) {
      copyEntry(path.join(sourcePath, child), path.join(targetPath, child));
    }

    return;
  }

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(sourcePath, targetPath);
}

for (const target of syncTargets) {
  const sourceDir = path.join(rootDir, target.sourceDir);
  const targetDir = path.join(rootDir, target.targetDir);

  if (!fs.existsSync(sourceDir)) {
    throw new Error(`[sync-static] missing source directory: ${target.sourceDir}`);
  }

  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.mkdirSync(targetDir, { recursive: true });

  for (const entry of target.entries) {
    const sourcePath = path.join(sourceDir, entry);
    const targetPath = path.join(targetDir, entry);

    if (!fs.existsSync(sourcePath)) {
      throw new Error(`[sync-static] missing ${target.sourceDir}/${entry}`);
    }

    copyEntry(sourcePath, targetPath);
  }

  console.log(`[sync-static] synced ${target.sourceDir} -> ${target.targetDir}`);
}
