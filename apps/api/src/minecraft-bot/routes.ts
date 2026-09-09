import { Router } from "express";
import mineflayer, { Bot } from "mineflayer";

const router = Router();

type BotStatus =
  | "connecting"
  | "online"
  | "offline"
  | "error"
  | "stopped";

type BotRecord = {
  key: string;
  host: string;
  port: number;
  username: string;
  bot: Bot;
  status: BotStatus;
};

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  author: string;
  text: string;
  createdAt: string;
};

const bots = new Map<string, BotRecord>();
const messages: ChatMessage[] = [];

let messageId = 1;

function addMessage(
  role: ChatMessage["role"],
  author: string,
  text: string,
) {
  messages.push({
    id: messageId++,
    role,
    author,
    text,
    createdAt: new Date().toISOString(),
  });

  if (messages.length > 300) {
    messages.splice(0, messages.length - 300);
  }
}

function botKey(host: string, port: number, username: string) {
  return `${host.toLowerCase()}:${port}:${username.toLowerCase()}`;
}

function parseCommand(text: string) {
  const parts = text.trim().split(/\s+/);

  return {
    command: parts[0]?.toLowerCase() ?? "",
    args: parts.slice(1),
  };
}

function findBot(host: string, port: number, username: string) {
  return bots.get(botKey(host, port, username));
}

function botInfo(record: BotRecord) {
  return `${record.username} @ ${record.host}:${record.port}`;
}

function sendMinecraftCommand(record: BotRecord, command: string) {
  const normalized = command.trim();

  if (!normalized.startsWith("/")) {
    throw new Error("Minecraft command must start with /");
  }

  record.bot.chat(normalized);
}

router.get("/chat", (_req, res) => {
  res.json({
    ok: true,
    messages,
  });
});

router.post("/chat", (req, res) => {
  const text =
    typeof req.body?.text === "string"
      ? req.body.text.trim()
      : "";

  if (!text) {
    return res.status(400).json({
      ok: false,
      error: "Message is required",
    });
  }

  addMessage(
    "user",
    "YOU",
    text,
  );

  const { command, args } = parseCommand(text);

  if (command === "!start") {
    if (args.length < 3) {
      addMessage(
        "assistant",
        "MC",
        "❌ الاستخدام: !start IP PORT BOT_NAME",
      );

      return res.json({ ok: true });
    }

    const host = args[0];
    const port = Number(args[1]);
    const username = args[2];

    if (!host || !Number.isInteger(port) || port < 1 || port > 65535) {
      addMessage(
        "assistant",
        "MC",
        "❌ IP أو PORT غير صالح.",
      );

      return res.json({ ok: true });
    }

    const key = botKey(host, port, username);

    const existing = bots.get(key);

    if (
      existing &&
      existing.status !== "offline" &&
      existing.status !== "stopped" &&
      existing.status !== "error"
    ) {
      addMessage(
        "assistant",
        "MC",
        `⚠️ البوت يعمل بالفعل: ${botInfo(existing)} — الحالة: ${existing.status}`,
      );

      return res.json({ ok: true });
    }

    addMessage(
      "assistant",
      "MC",
      `🟡 جاري تشغيل البوت ${username} على ${host}:${port}...`,
    );

    let bot: Bot;

    try {
      bot = mineflayer.createBot({
        host,
        port,
        username,
      });
    } catch (error) {
      console.error("Failed to create Minecraft bot:", error);

      addMessage(
        "assistant",
        "MC",
        `❌ فشل إنشاء البوت ${username}.`,
      );

      return res.json({ ok: true });
    }

    const record: BotRecord = {
      key,
      host,
      port,
      username,
      bot,
      status: "connecting",
    };

    bots.set(key, record);

    let finished = false;

    const timeout = setTimeout(() => {
      if (finished) return;

      finished = true;
      record.status = "error";

      addMessage(
        "assistant",
        "MC",
        `❌ انتهت مهلة الاتصال: ${botInfo(record)}`,
      );

      try {
        bot.quit("Connection timeout");
      } catch {}
    }, 30_000);

    bot.once("spawn", () => {
      if (finished) return;

      clearTimeout(timeout);

      record.status = "online";

      addMessage(
        "assistant",
        "MC",
        `🟢 البوت دخل السيرفر بنجاح: ${botInfo(record)}`,
      );
    });

    bot.on("messagestr", (message) => {
      const text = String(message).trim();

      if (!text) return;

      console.log(`[Minecraft:${username}] ${text}`);
    });

    bot.on("error", (error) => {
      console.error(
        `[Minecraft:${username}]`,
        error,
      );

      if (!finished) {
        record.status = "error";

        addMessage(
          "assistant",
          "MC",
          `❌ خطأ في البوت ${botInfo(record)}: ${error.message}`,
        );
      }
    });

    bot.on("end", () => {
      clearTimeout(timeout);

      if (!finished) {
        finished = true;

        if (record.status !== "stopped") {
          record.status = "offline";
        }

        addMessage(
          "assistant",
          "MC",
          `🔴 البوت خرج من السيرفر: ${botInfo(record)}`,
        );
      }
    });

    return res.json({ ok: true });
  }

  if (command === "!stop") {
    if (args.length < 3) {
      addMessage(
        "assistant",
        "MC",
        "❌ الاستخدام: !stop IP PORT BOT_NAME",
      );

      return res.json({ ok: true });
    }

    const host = args[0];
    const port = Number(args[1]);
    const username = args[2];

    const record = findBot(host, port, username);

    if (!record) {
      addMessage(
        "assistant",
        "MC",
        `❌ لم يتم العثور على البوت: ${username} @ ${host}:${port}`,
      );

      return res.json({ ok: true });
    }

    record.status = "stopped";

    try {
      record.bot.quit("Stopped by NΞXUS XS");
    } catch {}

    addMessage(
      "assistant",
      "MC",
      `🛑 تم إيقاف البوت: ${botInfo(record)}`,
    );

    return res.json({ ok: true });
  }

  if (command === "!status") {
    if (args.length < 3) {
      addMessage(
        "assistant",
        "MC",
        "❌ الاستخدام: !status IP PORT BOT_NAME",
      );

      return res.json({ ok: true });
    }

    const host = args[0];
    const port = Number(args[1]);
    const username = args[2];

    const record = findBot(host, port, username);

    if (!record) {
      addMessage(
        "assistant",
        "MC",
        `⚪ البوت غير موجود: ${username} @ ${host}:${port}`,
      );

      return res.json({ ok: true });
    }

    addMessage(
      "assistant",
      "MC",
      `ℹ️ ${botInfo(record)} — الحالة: ${record.status}`,
    );

    return res.json({ ok: true });
  }

  if (command === "!cmd") {
    if (args.length < 4) {
      addMessage(
        "assistant",
        "MC",
        "❌ الاستخدام: !cmd IP PORT BOT_NAME /command",
      );

      return res.json({ ok: true });
    }

    const host = args[0];
    const port = Number(args[1]);
    const username = args[2];

    const minecraftCommand = args.slice(3).join(" ");

    const record = findBot(host, port, username);

    if (!record) {
      addMessage(
        "assistant",
        "MC",
        `❌ لم يتم العثور على البوت: ${username} @ ${host}:${port}`,
      );

      return res.json({ ok: true });
    }

    if (record.status !== "online") {
      addMessage(
        "assistant",
        "MC",
        `⚠️ البوت ليس Online حاليًا. الحالة: ${record.status}`,
      );

      return res.json({ ok: true });
    }

    if (!minecraftCommand.startsWith("/")) {
      addMessage(
        "assistant",
        "MC",
        "❌ يجب أن يبدأ أمر Minecraft بعلامة /",
      );

      return res.json({ ok: true });
    }

    try {
      sendMinecraftCommand(
        record,
        minecraftCommand,
      );

      addMessage(
        "assistant",
        "MC",
        `📤 تم إرسال الأمر إلى ${record.username}: ${minecraftCommand}`,
      );
    } catch (error) {
      addMessage(
        "assistant",
        "MC",
        `❌ فشل إرسال الأمر: ${
          error instanceof Error
            ? error.message
            : "Unknown error"
        }`,
      );
    }

    return res.json({ ok: true });
  }

  addMessage(
    "assistant",
    "MC",
    "❌ أمر غير معروف. الأوامر المتاحة: !start, !stop, !status, !cmd",
  );

  return res.json({ ok: true });
});

export { router as minecraftBotRouter };
