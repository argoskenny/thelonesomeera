import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
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

const tasks = [
  {
    name: "androidtest",
    checkPath: "showcase/androidtest/package.json",
    command: ["npm", "run", "build:androidtest"],
  },
  {
    name: "cod2",
    checkPath: "showcase/cod2/package.json",
    command: ["npm", "run", "build:cod2"],
  },
  {
    name: "rooms",
    checkPath: "showcase/room/package.json",
    command: ["npm", "run", "build:rooms"],
  },
  {
    name: "pulsesync",
    checkPath: "showcase/pulsesync/package.json",
    command: ["npm", "run", "build:pulsesync"],
  },
  {
    name: "colorful_kart",
    checkPath: "showcase/colorful_kart/package.json",
    command: ["npm", "run", "build:colorful_kart"],
  },
  {
    name: "mini_fantasy",
    checkPath: "showcase/mini_fantasy/package.json",
    command: ["npm", "run", "build:mini_fantasy"],
  },
];

for (const task of tasks) {
  const checkPath = path.join(rootDir, task.checkPath);

  if (!fs.existsSync(checkPath)) {
    handleMissing(`[build:standalone] missing ${task.name}: ${task.checkPath}`);
    continue;
  }

  console.log(`[build:standalone] running ${task.command.join(" ")}`);
  const result = spawnSync(task.command[0], task.command.slice(1), {
    cwd: rootDir,
    stdio: "inherit",
    shell: false,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const syncArgs = ["run", "sync:static"];
if (allowSkip) {
  syncArgs.push("--", "--allow-skip");
}

const syncResult = spawnSync("npm", syncArgs, {
  cwd: rootDir,
  stdio: "inherit",
  shell: false,
});

if (syncResult.status !== 0) {
  process.exit(syncResult.status ?? 1);
}
