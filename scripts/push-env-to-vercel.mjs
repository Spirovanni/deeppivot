#!/usr/bin/env node
/**
 * Push environment variables to Vercel.
 * Prefers .env.local (Vercel CLI source) when present; otherwise uses .env.
 * Run: npm run vercel:env
 * Requires: vercel CLI linked (vercel link).
 */

import { readFileSync, existsSync } from "fs";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const envLocalPath = join(root, ".env.local");
const envPath = join(root, ".env");

// Prefer .env.local (matches Vercel CLI, production secrets); fallback to .env
const sourcePath = existsSync(envLocalPath) ? envLocalPath : envPath;
if (!existsSync(sourcePath)) {
  console.error("No .env.local or .env found. Create one from .env.example");
  process.exit(1);
}

console.log(`Using ${sourcePath === envLocalPath ? ".env.local" : ".env"}`);

const content = readFileSync(sourcePath, "utf-8");
const lines = content.split("\n");
const env = {};

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq <= 0) continue;
  const key = trimmed.slice(0, eq).trim();
  let val = trimmed.slice(eq + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  const commentIdx = val.indexOf(" #");
  if (commentIdx >= 0) val = val.slice(0, commentIdx).trim();
  if (!key || key.startsWith("#")) continue;
  env[key] = val;
}

const vars = Object.keys(env);
if (vars.length === 0) {
  console.error("No variables found in .env");
  process.exit(1);
}

console.log(`Pushing ${vars.length} variables to Vercel (production, preview, development)...`);

for (const key of vars) {
  const val = env[key];
  if (!val) continue;
  for (const env of ["production", "preview", "development"]) {
    const r = spawnSync("vercel", ["env", "add", key, env, "--force", "--yes"], {
      input: val,
      stdio: ["pipe", "inherit", "inherit"],
      cwd: root,
    });
    if (r.status !== 0) {
      console.error(`Failed: ${key} (${env})`);
    }
  }
  console.log(`  ✓ ${key}`);
}

console.log("Done. Redeploy for changes to take effect.");
