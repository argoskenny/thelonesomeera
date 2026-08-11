import { cpSync, existsSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const standaloneRoot = path.join(repoRoot, ".next", "standalone");

if (!existsSync(standaloneRoot)) {
  throw new Error("Missing .next/standalone. Run next build first.");
}

function replaceDirectory(source, destination) {
  rmSync(destination, { recursive: true, force: true });
  cpSync(source, destination, { recursive: true });
}

replaceDirectory(
  path.join(repoRoot, "public"),
  path.join(standaloneRoot, "public"),
);
replaceDirectory(
  path.join(repoRoot, ".next", "static"),
  path.join(standaloneRoot, ".next", "static"),
);

console.log("Prepared standalone public and Next.js static assets.");
