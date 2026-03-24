#!/usr/bin/env node
const { spawn } = require("child_process");

const proc = spawn("npx", ["react-native", "start", "--reset-cache"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env },
});
proc.on("exit", (code) => process.exit(code || 0));
