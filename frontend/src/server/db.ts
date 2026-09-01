import { copyFileSync, existsSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function findSqliteFile() {
  const names = [
    path.join(process.cwd(), "prisma", "dev.db"),
    path.join(process.cwd(), "frontend", "prisma", "dev.db"),
    path.join("/var/task", "prisma", "dev.db"),
    path.join("/var/task", "frontend", "prisma", "dev.db"),
  ];
  return names.find((p) => existsSync(p));
}

function databaseUrl() {
  if (!process.env.VERCEL) {
    return process.env.DATABASE_URL || "file:./dev.db";
  }
  // Serverless filesystem is read-only except /tmp.
  const to = "/tmp/instant-mechanic.db";
  const from = findSqliteFile();
  if (!from) {
    throw new Error(
      "SQLite file missing in the Vercel bundle. Expected prisma/dev.db next to the app."
    );
  }
  copyFileSync(from, to);
  return `file:${to}`;
}

process.env.DATABASE_URL = databaseUrl();

export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
