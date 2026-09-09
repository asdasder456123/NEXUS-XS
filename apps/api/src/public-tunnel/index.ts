import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";

const WEB_URL = "http://127.0.0.1:5173";

const PUBLIC_URL_CHANNELS = [
  "1547158553490493500",
  "1545258351431127142",
];

let tunnelProcess: ChildProcessWithoutNullStreams | null = null;
let lastAnnouncedUrl = "";

function getDiscordToken(): string | undefined {
  return process.env.DISCORD_BOT_TOKEN;
}

async function waitForWeb() {
  for (;;) {
    try {
      const response = await fetch(WEB_URL);

      if (response.ok || response.status < 500) {
        console.log("[Tunnel] Web server is ready.");
        return;
      }
    } catch {
      // Web server is not ready yet.
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

async function announcePublicUrl(url: string) {
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

function handleOutput(chunk: Buffer) {
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

export async function startPublicTunnel() {
  if (tunnelProcess) {
    console.log("[Tunnel] Already running.");
    return;
  }

  await waitForWeb();

  console.log("[Tunnel] Starting Cloudflare Quick Tunnel...");

  tunnelProcess = spawn(
    "cloudflared",
    [
      "tunnel",
      "--url",
      WEB_URL,
    ],
    {
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  tunnelProcess.stdout.on("data", handleOutput);
  tunnelProcess.stderr.on("data", handleOutput);

  tunnelProcess.on("error", (error) => {
    console.error("[Tunnel] Failed to start cloudflared:", error);
    tunnelProcess = null;
  });

  tunnelProcess.on("exit", (code, signal) => {
    console.log(
      `[Tunnel] cloudflared exited (code=${code}, signal=${signal ?? "none"})`,
    );

    tunnelProcess = null;
  });
}

export function stopPublicTunnel() {
  if (!tunnelProcess) {
    return;
  }

  console.log("[Tunnel] Stopping Cloudflare Tunnel...");

  tunnelProcess.kill("SIGTERM");
  tunnelProcess = null;
}
