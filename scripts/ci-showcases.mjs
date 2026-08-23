import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const projects = [
  "androidtest",
  "cod2",
  "room",
  "pulsesync",
  "colorful_kart",
  "mini_fantasy",
];

for (const project of projects) {
  const projectDir = path.join("showcase", project);
  const lockfile = path.join(repoRoot, projectDir, "package-lock.json");

  if (!fs.existsSync(lockfile)) {
    console.error(`[ci:showcases] missing lockfile: ${projectDir}/package-lock.json`);
    process.exit(1);
  }

  console.log(`[ci:showcases] installing ${project}`);
  const result = spawnSync(
    "npm",
    ["--prefix", projectDir, "ci", "--include=dev"],
    {
      cwd: repoRoot,
      stdio: "inherit",
      shell: false,
    },
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
