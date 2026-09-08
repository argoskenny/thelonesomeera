import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const allowSkip = process.argv.includes("--allow-skip");

function handleMissing(message) {
  if (allowSkip) {
    console.warn(`${message}; skipped because --allow-skip was provided`);
    return;
  }

  console.error(`${message}; refusing to preserve potentially stale output`);
  console.error("Use --allow-skip only for an intentional partial local checkout.");
  process.exit(1);
}

const syncTargets = [
  {
    name: "sox",
    sourceDir: "showcase/sox",
    targetDir: "public/showcase/sox",
    entries: ["index.html", "favicon.svg", "js", "assets"],
  },
  {
    name: "cod2",
    sourceDir: "showcase/cod2",
    targetDir: "public/showcase/cod2",
    entries: [
      { source: "dist/index.html", target: "index.html" },
      { source: "dist/assets", target: "assets" },
      { source: "public/audios", target: "audios" },
      { source: "public/textures", target: "textures" },
      { source: "public/intro_cover.png", target: "intro_cover.png" },
    ],
  },
  {
    name: "rooms",
    sourceDir: "showcase/room/dist",
    targetDir: "public/showcase/room",
    entries: ["index.html", "assets", "og.png"],
  },
  {
    name: "pulsesync",
    sourceDir: "showcase/pulsesync/dist",
    targetDir: "public/showcase/pulsesync",
    entries: ["index.html", "assets", "favicon.svg"],
  },
  {
    name: "mma",
    sourceDir: "showcase/mma",
    targetDir: "public/showcase/mma",
    entries: ["index.html", "app.js", "styles.css", "assets"],
  },
  {
    name: "colorful_kart",
    sourceDir: "showcase/colorful_kart/dist",
    targetDir: "public/showcase/colorful_kart",
    entries: ["index.html", "assets"],
  },
  {
    name: "bpd",
    sourceDir: "showcase/bpd",
    targetDir: "public/showcase/bpd",
    entries: ["index.html", "game.js", "levels.js", "style.css", "assets"],
  },
  {
    name: "mini_fantasy",
    sourceDir: "showcase/mini_fantasy/dist",
    targetDir: "public/showcase/mini_fantasy",
    entries: ["index.html", "assets", "preview.png"],
  },
  {
    name: "taiwan_night_market",
    sourceDir: "showcase/taiwan_night_market/dist",
    targetDir: "public/showcase/taiwan_night_market",
    entries: ["index.html", "assets", "audio", "data", "models", "preview.png"],
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

function ensureEntriesExist(sourceDir, entries) {
  for (const entry of entries) {
    const sourceEntry = typeof entry === "string" ? entry : entry.source;
    const sourcePath = path.join(sourceDir, sourceEntry);

    if (!fs.existsSync(sourcePath)) {
      return `${sourceDir}/${sourceEntry}`;
    }
  }

  return null;
}

for (const target of syncTargets) {
  const sourceDir = path.join(rootDir, target.sourceDir);
  const targetDir = path.join(rootDir, target.targetDir);

  if (!fs.existsSync(sourceDir)) {
    handleMissing(
      `[sync-static] missing source directory for ${target.name}: ${target.sourceDir}`,
    );
    continue;
  }

  const missingEntry = ensureEntriesExist(sourceDir, target.entries);
  if (missingEntry) {
    handleMissing(`[sync-static] missing entry for ${target.name}: ${missingEntry}`);
    continue;
  }

  const stagingDir = `${targetDir}.tmp`;
  fs.rmSync(stagingDir, { recursive: true, force: true });
  fs.mkdirSync(stagingDir, { recursive: true });

  for (const entry of target.entries) {
    const sourceEntry = typeof entry === "string" ? entry : entry.source;
    const targetEntry = typeof entry === "string" ? entry : entry.target;
    const sourcePath = path.join(sourceDir, sourceEntry);
    const targetPath = path.join(stagingDir, targetEntry);

    copyEntry(sourcePath, targetPath);
  }

  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.renameSync(stagingDir, targetDir);
  console.log(`[sync-static] synced ${target.sourceDir} -> ${target.targetDir}`);
}
