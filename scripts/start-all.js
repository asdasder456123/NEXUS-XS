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




console.log("[NEXUS-XS] Unified runtime is alive.");

const https = require("node:https");
const fs = require("node:fs");

const cloudflaredPath = "/tmp/cloudflared";

async function installCloudflared() {
  const response = await fetch(
    "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64",
    { redirect: "follow" }
  );

  if (!response.ok) {
    throw new Error(`Download failed: HTTP ${response.status}`);
  }

  const data = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(cloudflaredPath, data);
  fs.chmodSync(cloudflaredPath, 0o755);
}

(async () => {
  try {
    if (!fs.existsSync(cloudflaredPath)) {
      console.log("[QuickTunnel] Installing cloudflared...");
      await installCloudflared();
      console.log("[QuickTunnel] cloudflared installed.");
    }

    start(
      "QuickTunnel",
      cloudflaredPath,
      ["tunnel", "--no-autoupdate", "--url", "http://127.0.0.1:3000"],
      process.cwd()
    );
  } catch (error) {
    console.error("[QuickTunnel] Failed to install/start cloudflared:", error);
  }
})();

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
