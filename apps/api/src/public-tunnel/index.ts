import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const WEB_URL = "http://127.0.0.1:3000";

const PUBLIC_URL_CHANNELS = [
  "1547158553490493500",
  "1545258351431127142",
];

let tunnelProcess: ChildProcess | null = null;
let lastAnnouncedUrl = "";

function getProjectRoot(): string {
  const currentFile = fileURLToPath(import.meta.url);
  const currentDirectory = path.dirname(currentFile);

  return path.resolve(currentDirectory, "../../../..");
}

function getCloudflaredPath(): string {
  return path.join(
    getProjectRoot(),
    ".cloudflared-bin",
    "cloudflared",
  );
}

function getDiscordToken(): string | undefined {
  return process.env.DISCORD_BOT_TOKEN;
}

async function announcePublicUrl(url: string): Promise<void> {
  if (url === lastAnnouncedUrl) {
    return;
  }

  const token = getDiscordToken();

  if (!token) {
    console.error("[Tunnel] DISCORD_BOT_TOKEN is missing.");
    return;
  }

  lastAnnouncedUrl = url;

  const message = [
    "🌐 **NΞXUS XS متاح الآن على الإنترنت**",
    "",
    `🔗 ${url}`,
    "",
    "يمكن الدخول إلى الشبكة من الرابط المؤقت الحالي.",
  ].join("\n");

  for (const channelId of PUBLIC_URL_CHANNELS) {
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
            content: message,
          }),
        },
      );

      if (!response.ok) {
        const body = await response.text();

        console.error(
          `[Tunnel] Failed to announce URL in ${channelId}: ${response.status} ${body}`,
        );

        continue;
      }

      console.log(`[Tunnel] Public URL announced in ${channelId}`);
    } catch (error) {
      console.error(
        `[Tunnel] Discord announcement failed for ${channelId}:`,
        error,
      );
    }
  }
}

function handleOutput(chunk: Buffer): void {
  const text = chunk.toString();

  process.stdout.write(`[Cloudflare] ${text}`);

  const matches = text.match(
    /https:\/\/[a-z0-9-]+\.trycloudflare\.com/gi,
  );

  if (!matches) {
    return;
  }

  for (const url of matches) {
    void announcePublicUrl(url);
  }
}

export async function startPublicTunnel(): Promise<void> {
  if (tunnelProcess) {
    console.log("[Tunnel] Already running.");
    return;
  }

  console.log("[Tunnel] Starting Cloudflare Quick Tunnel...");

  const cloudflaredPath = getCloudflaredPath();

  console.log(`[Tunnel] Using cloudflared: ${cloudflaredPath}`);

  const child = spawn(
    cloudflaredPath,
    [
      "tunnel",
      "--url",
      WEB_URL,
    ],
    {
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  tunnelProcess = child;

  child.stdout?.on("data", handleOutput);
  child.stderr?.on("data", handleOutput);

  child.on("error", (error: Error) => {
    console.error("[Tunnel] Failed to start cloudflared:", error);

    if (tunnelProcess === child) {
      tunnelProcess = null;
    }
  });

  child.on(
    "exit",
    (code: number | null, signal: NodeJS.Signals | null) => {
      console.log(
        `[Tunnel] cloudflared exited (code=${code}, signal=${signal ?? "none"})`,
      );

      if (tunnelProcess === child) {
        tunnelProcess = null;
      }
    },
  );
}

export function stopPublicTunnel(): void {
  const child = tunnelProcess;

  if (!child) {
    return;
  }

  console.log("[Tunnel] Stopping Cloudflare Tunnel...");

  child.kill("SIGTERM");

  tunnelProcess = null;
}
