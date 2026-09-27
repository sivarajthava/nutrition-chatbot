import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// Ensure DATABASE_URL is set to a writable directory on Linux if not explicitly provided
if (!process.env.DATABASE_URL) {
  if (process.platform === "linux") {
    // In Docker/Railway with volume at /data, use /data/dev.db if /data exists and is writable, otherwise /tmp/dev.db
    if (fs.existsSync("/data")) {
      try {
        fs.accessSync("/data", fs.constants.W_OK);
        process.env.DATABASE_URL = "file:/data/dev.db";
      } catch {
        process.env.DATABASE_URL = "file:/tmp/dev.db";
      }
    } else {
      process.env.DATABASE_URL = "file:/tmp/dev.db";
    }
  } else {
    process.env.DATABASE_URL = "file:./prisma/dev.db";
  }
}

console.log(`[init-db] Initializing database with DATABASE_URL=${process.env.DATABASE_URL}`);

try {
  execSync("npx prisma db push --accept-data-loss", {
    stdio: "inherit",
    env: { ...process.env }
  });
  console.log("[init-db] Database push succeeded.");
} catch (err) {
  console.warn("[init-db] Warning: Database schema push encountered an issue, continuing server startup:", err?.message || err);
}
