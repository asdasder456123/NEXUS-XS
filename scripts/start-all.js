const { spawn } = require("node:child_process");

const children = new Map();

function start(name, command, args, cwd) {
  console.log(`[${name}] Starting...`);

  const child = spawn(command, args, {
    cwd,
    env: process.env,
    stdio: ["inherit", "pipe", "pipe"],
  });

  children.set(name, child);

  child.stdout.on("data", (data) => {
    process.stdout.write(`[${name}] ${data}`);
  });

  child.stderr.on("data", (data) => {
    process.stderr.write(`[${name}] ${data}`);
  });

  child.on("error", (error) => {
    console.error(`[${name}] Process error:`, error);
  });

  child.on("exit", (code, signal) => {
    console.error(
      `[${name}] Stopped. code=${code ?? "null"} signal=${signal ?? "none"}`
    );
  });

  console.log(`[${name}] Process started.`);
}

console.log("[NEXUS-XS] Starting unified runtime...");
console.log("[NEXUS-XS] NEXUS runtime is running.");

start(
  "NEXUS",
  process.execPath,
  ["apps/api/dist/index.js"],
  process.cwd()
);

start(
  "ShinAI",
  "python3",
  ["main.py"],
  `${process.cwd()}/ShinAI-copy`
);


console.log("[NEXUS-XS] Unified runtime is alive.");

function shutdown(signal) {
  console.log(`[NEXUS-XS] Received ${signal}, stopping children...`);

  for (const [name, child] of children) {
    if (!child.killed) {
      console.log(`[${name}] Stopping...`);
      child.kill("SIGTERM");
    }
  }

  setTimeout(() => process.exit(0), 5000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
