#!/usr/bin/env node
/**
 * Sequential monorepo build with progress logs (for low-resource / SSH hosts
 * where `tsc` and `next build` run silently for a long time).
 */
const { spawnSync } = require("child_process");

const steps = [
  ["@fatsoma/shared", ["run", "build", "-w", "@fatsoma/shared"]],
  ["@fatsoma/api-client", ["run", "build", "-w", "@fatsoma/api-client"]],
  ["@fatsoma/api", ["run", "build", "-w", "@fatsoma/api"]],
  ["@fatsoma/web", ["run", "build", "-w", "@fatsoma/web"]],
  ["@fatsoma/admin", ["run", "build", "-w", "@fatsoma/admin"]],
];

for (const [name, args] of steps) {
  console.log(`\n>>> Building ${name} …`);
  const r = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, FORCE_COLOR: "1" },
  });
  if (r.status !== 0) {
    console.error(`\n!!! Build failed at ${name} (exit ${r.status})`);
    process.exit(r.status ?? 1);
  }
}

console.log("\n>>> build:server finished successfully.");
