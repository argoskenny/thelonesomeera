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
    sourceDir: "cod2",
    targetDir: "public/cod2",
    entries: [
      { source: "dist/index.html", target: "index.html" },
      { source: "dist/assets", target: "assets" },
      { source: "public/audios", target: "audios" },
      { source: "public/textures", target: "textures" },
      { source: "public/intro_cover.png", target: "intro_cover.png" },
    ],
  },
  {
    name: "pulsesync",
    sourceDir: "pulsesync/dist",
    targetDir: "public/pulsesync",
    entries: ["index.html", "assets", "favicon.svg"],
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
    console.warn(`[sync-static] skipped ${target.name}: missing source directory ${target.sourceDir}`);
    continue;
  }

  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.mkdirSync(targetDir, { recursive: true });

  for (const entry of target.entries) {
    const sourceEntry = typeof entry === "string" ? entry : entry.source;
    const targetEntry = typeof entry === "string" ? entry : entry.target;
    const sourcePath = path.join(sourceDir, sourceEntry);
    const targetPath = path.join(targetDir, targetEntry);

    if (!fs.existsSync(sourcePath)) {
      console.warn(`[sync-static] skipped ${target.name}: missing ${target.sourceDir}/${sourceEntry}`);
      fs.rmSync(targetDir, { recursive: true, force: true });
      fs.mkdirSync(targetDir, { recursive: true });
      continue;
    }

    copyEntry(sourcePath, targetPath);
  }

  console.log(`[sync-static] synced ${target.sourceDir} -> ${target.targetDir}`);
}
