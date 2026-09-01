import type { NextConfig } from "next";

const sqliteFiles = ["./prisma/dev.db"];

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "prisma"],
  outputFileTracingIncludes: {
    "/*": sqliteFiles,
    "/api/[...slug]": sqliteFiles,
  },
};

export default nextConfig;
