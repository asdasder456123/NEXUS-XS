import { Client, Events, GatewayIntentBits } from "discord.js";
import { addNews } from "../news/storage.js";

function getDiscordConfig() {
  return {
    token: process.env.DISCORD_BOT_TOKEN?.trim(),
    newsChannelId: process.env.DISCORD_NEWS_CHANNEL_ID?.trim(),
  };
}

function extractUrls(text: string): string[] {
  return [...text.matchAll(/https?:\/\/[^\s<>()]+/gi)]
    .map((m) => m[0].replace(/[),.!?;:'"]+$/g, ""))
    .filter(Boolean);
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchMetadata(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const html = await response.text();

  const getMeta = (property: string) => {
    const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const match =
      html.match(
        new RegExp(
          `<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`,
          "i",
        ),
      ) ??
      html.match(
        new RegExp(
          `<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`,
          "i",
        ),
      );

    return match ? decodeHtml(match[1]) : "";
  };

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

  const title =
    getMeta("og:title") ||
    getMeta("twitter:title") ||
    (titleMatch ? decodeHtml(titleMatch[1]) : "") ||
    url;

  const description =
    getMeta("og:description") ||
    getMeta("twitter:description") ||
    getMeta("description") ||
    "";

  const image =
    getMeta("og:image") ||
    getMeta("twitter:image") ||
    undefined;

  let source: string | undefined;

  try {
    source = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    source = undefined;
  }

  return {
    title,
    description,
    image,
    source,
  };
}

export function startDiscordNewsBot(): Client | null {
  const { token, newsChannelId } = getDiscordConfig();

  if (!token || !newsChannelId) {
    console.warn(
      "[Discord News] Missing DISCORD_BOT_TOKEN or DISCORD_NEWS_CHANNEL_ID",
    );
    return null;
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  client.once(Events.ClientReady, (ready) => {
    console.log(`[Discord News] Logged in as ${ready.user.tag}`);
    console.log(`[Discord News] Listening on ${newsChannelId}`);
  });

  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;
    if (message.channelId !== newsChannelId) return;

    const urls = extractUrls(message.content);

    if (!urls.length) {
      return;
    }

    for (const url of urls) {
      try {
        const metadata = await fetchMetadata(url);

        await addNews({
          title: metadata.title,
          description:
            metadata.description || "لا يوجد وصف متاح لهذا الرابط.",
          url,
          image: metadata.image,
          source: metadata.source,
          author: message.author.username,
        });

        await message.react("📰");

        console.log(`[Discord News] Saved: ${url}`);
      } catch (error) {
        console.error(`[Discord News] Failed: ${url}`, error);
        await message.react("❌").catch(() => {});
      }
    }
  });

  client.login(token).catch((error) => {
    console.error("[Discord News] Login failed:", error);
  });

  return client;
}
