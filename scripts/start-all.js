const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const https = require("node:https");
const http = require("node:http");
const os = require("node:os");
require("dotenv").config({ path: path.join(process.cwd(), ".env") });

const children = new Map();

const DISCORD_TUNNEL_CHANNEL_IDS = (
  process.env.DISCORD_TUNNEL_CHANNEL_IDS ||
  "1545258351431127142,1547158553490493500,1423352888004186182"
)
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

let lastSentTunnelUrl = null;

async function sendTunnelUrlToDiscord(url) {
  const token = process.env.DISCORD_BOT_TOKEN?.trim();

  if (!token) {
    console.warn("[QuickTunnel] DISCORD_BOT_TOKEN is not configured.");
    return;
  }

  if (!DISCORD_TUNNEL_CHANNEL_IDS.length) {
    console.warn("[QuickTunnel] No Discord tunnel channels configured.");
    return;
  }

  if (url === lastSentTunnelUrl) {
    return;
  }

  lastSentTunnelUrl = url;

  for (const channelId of DISCORD_TUNNEL_CHANNEL_IDS) {
    try {
      const response = await fetch(
        `https://discord.com/api/v10/channels/${channelId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bot ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content:
              `🌐 **NΞXUS XS — Quick Tunnel**\\n\\n${url}\\n\\n` +
              `🔗 الرابط المؤقت الحالي للسيرفر.`,
          }),
        }
      );

      if (!response.ok) {
        const body = await response.text();
        console.error(
          `[QuickTunnel] Discord channel ${channelId} failed: HTTP ${response.status} ${body}`
        );
        continue;
      }

      console.log(
        `[QuickTunnel] Tunnel URL sent to Discord channel ${channelId}`
      );
    } catch (error) {
      console.error(
        `[QuickTunnel] Failed sending URL to Discord channel ${channelId}:`,
        error.message
      );
    }
  }
}
let shuttingDown = false;
let tunnelRestartTimer = null;

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
    const text = data.toString();
    process.stderr.write(`[${name}] ${text}`);

    if (name === "QuickTunnel") {
      const match = text.match(
        /https:\/\/[a-z0-9-]+\.trycloudflare\.com/i
      );

      if (match) {
        console.log(
          `[QuickTunnel] PUBLIC URL: ${match[0]}`
        );
        console.log(
          `[QuickTunnel] Forwarding to http://127.0.0.1:3000`
        );

        sendTunnelUrlToDiscord(match[0]).catch((error) => {
          console.error(
            "[QuickTunnel] Discord notification failed:",
            error.message
          );
        });
      }
    }
  });

  child.on("error", (error) => {
    console.error(`[${name}] Process error:`, error);

    if (name === "QuickTunnel" && !shuttingDown) {
      scheduleTunnelRestart();
    }
  });

  child.on("exit", (code, signal) => {
    console.error(
      `[${name}] Stopped. code=${code ?? "null"} signal=${signal ?? "none"}`
    );

    children.delete(name);

    if (name === "QuickTunnel" && !shuttingDown) {
      scheduleTunnelRestart();
    }
  });

  console.log(`[${name}] Process started.`);

  return child;
}

function scheduleTunnelRestart() {
  if (tunnelRestartTimer || shuttingDown) {
    return;
  }

  console.log(
    "[QuickTunnel] Tunnel stopped. Retrying in 5 seconds..."
  );

  tunnelRestartTimer = setTimeout(async () => {
    tunnelRestartTimer = null;

    if (!shuttingDown) {
      await startQuickTunnel();
    }
  }, 5000);
}

function waitForServer(url, attempts = 30) {
  return new Promise((resolve) => {
    let count = 0;

    const check = () => {
      count++;

      const req = http.get(url, (res) => {
        res.resume();

        if (res.statusCode && res.statusCode < 500) {
          console.log(`[QuickTunnel] NEXUS is ready on ${url}`);
          resolve(true);
          return;
        }

        retry();
      });

      req.on("error", retry);

      req.setTimeout(2000, () => {
        req.destroy();
        retry();
      });
    };

    const retry = () => {
      if (count >= attempts) {
        resolve(false);
        return;
      }

      setTimeout(check, 1000);
    };

    check();
  });
}

function getCloudflaredUrl() {
  const arch = os.arch();

  if (arch === "x64") {
    return "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64";
  }

  if (arch === "arm64") {
    return "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64";
  }

  throw new Error(`Unsupported architecture: ${arch}`);
}

function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        headers: {
          "User-Agent": "NEXUS-XS-QuickTunnel",
        },
      },
      (response) => {
        if (
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          response.resume();

          const redirected = new URL(
            response.headers.location,
            url
          ).toString();

          downloadFile(redirected, destination)
            .then(resolve)
            .catch(reject);

          return;
        }

        if (response.statusCode !== 200) {
          response.resume();

          reject(
            new Error(
              `Download failed: HTTP ${response.statusCode}`
            )
          );

          return;
        }

        const file = fs.createWriteStream(destination);

        response.pipe(file);

        file.on("finish", () => {
          file.close(() => resolve());
        });

        file.on("error", (error) => {
          file.destroy();
          reject(error);
        });
      }
    );

    request.on("error", reject);

    request.setTimeout(60000, () => {
      request.destroy(
        new Error("cloudflared download timed out")
      );
    });
  });
}

async function ensureCloudflared() {
  const binDir = path.join(process.cwd(), ".runtime");
  const binary = path.join(binDir, "cloudflared");

  if (fs.existsSync(binary)) {
    console.log("[QuickTunnel] cloudflared already installed.");
    return binary;
  }

  fs.mkdirSync(binDir, { recursive: true });

  const url = getCloudflaredUrl();

  console.log("[QuickTunnel] Installing cloudflared...");
  console.log(`[QuickTunnel] Architecture: ${os.arch()}`);

  const temp = `${binary}.download`;

  try {
    await downloadFile(url, temp);

    fs.renameSync(temp, binary);
    fs.chmodSync(binary, 0o755);

    console.log("[QuickTunnel] cloudflared installed.");

    return binary;
  } catch (error) {
    try {
      if (fs.existsSync(temp)) {
        fs.unlinkSync(temp);
      }
    } catch {}

    throw error;
  }
}

async function startQuickTunnel() {
  if (shuttingDown) {
    return;
  }

  try {
    const binary = await ensureCloudflared();

    const ready = await waitForServer(
      "http://127.0.0.1:3000"
    );

    if (!ready) {
      console.error(
        "[QuickTunnel] NEXUS did not become ready. Tunnel not started."
      );

      scheduleTunnelRestart();
      return;
    }

    console.log(
      "[QuickTunnel] Creating a new temporary Cloudflare URL..."
    );

    start(
      "QuickTunnel",
      binary,
      [
        "tunnel",
        "--no-autoupdate",
        "--url",
        "http://127.0.0.1:3000",
      ],
      process.cwd()
    );
  } catch (error) {
    console.error(
      "[QuickTunnel] Failed:",
      error.message
    );

    scheduleTunnelRestart();
  }
}

console.log("[NEXUS-XS] Starting unified runtime...");

start(
  "NEXUS",
  process.execPath,
  ["apps/api/dist/index.js"],
  process.cwd()
);

console.log("[NEXUS-XS] Unified runtime is alive.");

startQuickTunnel();

function shutdown(signal) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  console.log(
    `[NEXUS-XS] Received ${signal}, stopping children...`
  );

  if (tunnelRestartTimer) {
    clearTimeout(tunnelRestartTimer);
    tunnelRestartTimer = null;
  }

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
