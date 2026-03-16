#!/usr/bin/env node
process.env.CI = "false";
const { spawn } = require("child_process");
const proc = spawn("npx", ["expo", "start"], { stdio: "inherit", shell: true, env: process.env });
proc.on("exit", (code) => process.exit(code || 0));
