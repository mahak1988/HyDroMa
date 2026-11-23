/**
 * Delete the local API database. Confirmation is required unless --yes is given.
 * Run: node services/api/scripts/reset.mjs [--yes]
 */
import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const file = resolve(process.cwd(), process.env.NOJIN_DB ?? "databases/api/nojin.db");

if (!existsSync(file)) {
  console.log("database file not found:", file);
  process.exit(0);
}

if (process.argv.includes("--yes") || process.env.NOJIN_RESET_YES === "1") {
  rmSync(file);
  for (const suffix of ["-wal", "-shm"]) {
    const side = file + suffix;
    if (existsSync(side)) rmSync(side);
  }
  console.log("removed:", file);
} else {
  console.log("refusing to delete", file, "— pass --yes to confirm.");
  process.exit(1);
}
