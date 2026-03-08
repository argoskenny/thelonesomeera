import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const tasks = [
  {
    name: "androidtest",
    checkPath: "androidtest/package.json",
    command: ["npm", "run", "build:androidtest"],
  },
  {
    name: "cod2",
    checkPath: "cod2/package.json",
    command: ["npm", "run", "build:cod2"],
  },
  {
    name: "pulsesync",
    checkPath: "pulsesync/package.json",
    command: ["npm", "run", "build:pulsesync"],
  },
];

for (const task of tasks) {
  const checkPath = path.join(rootDir, task.checkPath);

  if (!fs.existsSync(checkPath)) {
    console.warn(`[build:standalone] skipped ${task.name}: missing ${task.checkPath}`);
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

const syncResult = spawnSync("npm", ["run", "sync:static"], {
  cwd: rootDir,
  stdio: "inherit",
  shell: false,
});

if (syncResult.status !== 0) {
  process.exit(syncResult.status ?? 1);
}
