#!/usr/bin/env node
// Prevent Expo from detecting non-interactive mode when run via turbo/IDE
process.env.CI = "false";
process.env.EXPO_NO_DOTENV = "1";
const { spawn } = require("child_process");
// --lan pre-selects connection type to avoid interactive prompts
const proc = spawn("npx", ["expo", "start", "--lan"], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});
proc.on("exit", (code) => process.exit(code || 0));
