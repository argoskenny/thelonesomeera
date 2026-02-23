import { PrismaClient } from "@prisma/client";
import path from "path";

function buildDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL ?? "";

  // 已是絕對路徑，直接使用
  if (envUrl.startsWith("file:/") && envUrl.charAt(5) === "/") {
    return envUrl;
  }

  // 相對路徑：解析為基於專案根目錄的絕對路徑
  // standalone 模式下 process.cwd() 可能不在專案根目錄
  const relative = envUrl.replace("file:", "").replace("./", "");
  const dbPath = path.resolve(process.cwd(), relative);
  return `file:${dbPath}`;
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: buildDatabaseUrl(),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
