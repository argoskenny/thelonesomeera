import { execFileSync } from "child_process";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

function resolvePrismaEngineLibraryPath(): string | undefined {
  if (process.env.PRISMA_QUERY_ENGINE_LIBRARY) {
    return process.env.PRISMA_QUERY_ENGINE_LIBRARY;
  }

  const engineName =
    process.platform === "darwin" && process.arch === "arm64"
      ? "libquery_engine-darwin-arm64.dylib.node"
      : process.platform === "darwin" && process.arch === "x64"
        ? "libquery_engine-darwin.dylib.node"
        : undefined;

  if (!engineName) return undefined;

  let cursor = process.cwd();
  for (let depth = 0; depth < 5; depth += 1) {
    const candidates = [
      path.join(cursor, "node_modules/.prisma/client", engineName),
      path.join(cursor, "node_modules/prisma", engineName),
      path.join(cursor, "node_modules/@prisma/engines", engineName),
    ];

    const found = candidates.find((candidate) => fs.existsSync(candidate));
    if (found) {
      tryClearMacQuarantine(found);
      return found;
    }

    const parent = path.dirname(cursor);
    if (parent === cursor) break;
    cursor = parent;
  }

  return undefined;
}

function tryClearMacQuarantine(filePath: string): void {
  if (process.platform !== "darwin") return;

  try {
    execFileSync("xattr", ["-d", "com.apple.quarantine", filePath], {
      stdio: "ignore",
    });
  } catch {
    // ignore if attribute does not exist or command is unavailable
  }
}

const prismaEngineLibraryPath = resolvePrismaEngineLibraryPath();
if (prismaEngineLibraryPath) {
  process.env.PRISMA_QUERY_ENGINE_LIBRARY = prismaEngineLibraryPath;
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
