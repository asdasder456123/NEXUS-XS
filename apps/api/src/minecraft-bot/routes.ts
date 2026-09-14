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
  bot: Bot | null;
  status: BotStatus;
  autoReconnect: boolean;
  connectionId: number;
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

let activeBotKey: string | null = null;
let messageId = 1;

const CONNECT_TIMEOUT = 30_000;

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

  if (!record.bot || record.status !== "online") {
    throw new Error("Minecraft bot is not online");
  }

  record.bot.chat(normalized);
}

function connectBot(record: BotRecord) {
  /*
   * مهم:
   * لا يوجد Auto-Reconnect.
   * كل استدعاء لـ !start ينشئ Bot واحد فقط.
   * إذا فشل الاتصال أو خرج Bot، يتوقف هذا الـBot فقط.
   */
  const connectionId = ++record.connectionId;

  record.status = "connecting";
  record.bot = null;

  console.log(
    `[Minecraft:${record.username}] Connecting to ${record.host}:${record.port}...`,
  );

  let bot: Bot;

  try {
    bot = mineflayer.createBot({
      host: record.host,
      port: record.port,
      username: record.username,
    });
  } catch (error) {
    console.error(
      `[Minecraft:${record.username}] Failed to create bot:`,
      error,
    );

    record.status = "error";
    record.bot = null;

    addMessage(
      "assistant",
      "MC",
      `❌ فشل إنشاء البوت ${botInfo(record)}. البوت توقف، حاول تشغيله مرة أخرى.`,
    );

    return;
  }

  record.bot = bot;

  let finished = false;
  let failureReported = false;

  const stopThisBot = (
    message: string,
    status: BotStatus = "stopped",
  ) => {
    if (connectionId !== record.connectionId) {
      return;
    }

    if (finished && failureReported) {
      return;
    }

    finished = true;
    failureReported = true;

    record.status = status;

    if (record.bot === bot) {
      record.bot = null;
    }

    if (activeBotKey === record.key) {
      activeBotKey = null;
    }

    addMessage("assistant", "MC", message);
  };

  const timeout = setTimeout(() => {
    if (connectionId !== record.connectionId) {
      return;
    }

    stopThisBot(
      `⏱️ انتهت مهلة الاتصال للبوت ${botInfo(record)}. البوت توقف، حاول تشغيله مرة أخرى.`,
      "stopped",
    );

    try {
      bot.quit("Connection timeout");
    } catch {}
  }, CONNECT_TIMEOUT);

  bot.once("spawn", () => {
    if (connectionId !== record.connectionId) {
      return;
    }

    clearTimeout(timeout);

    finished = false;
    failureReported = false;

    record.status = "online";
    record.bot = bot;

    activeBotKey = record.key;

    addMessage(
      "assistant",
      "MC",
      `🟢 البوت دخل السيرفر بنجاح: ${botInfo(record)}`,
    );

    console.log(
      `[Minecraft:${record.username}] Online.`,
    );
  });

  bot.on("messagestr", (message) => {
    if (connectionId !== record.connectionId) {
      return;
    }

    const text = String(message).trim();

    if (!text) {
      return;
    }

    console.log(
      `[Minecraft:${record.username}] ${text}`,
    );
  });

  bot.on("error", (error) => {
    if (connectionId !== record.connectionId) {
      return;
    }

    console.error(
      `[Minecraft:${record.username}]`,
      error,
    );

    clearTimeout(timeout);

    stopThisBot(
      `❌ خطأ في البوت ${botInfo(record)}: ${
        error instanceof Error
          ? error.message
          : "Unknown error"
      } — البوت توقف، حاول تشغيله مرة أخرى.`,
      "error",
    );

    try {
      bot.quit("Bot error");
    } catch {}
  });

  bot.on("end", () => {
    if (connectionId !== record.connectionId) {
      return;
    }

    clearTimeout(timeout);

    if (record.bot === bot) {
      record.bot = null;
    }

    if (activeBotKey === record.key) {
      activeBotKey = null;
    }

    console.log(
      `[Minecraft:${record.username}] Connection ended.`,
    );

    if (record.status === "stopped" || failureReported) {
      return;
    }

    record.status = "stopped";

    addMessage(
      "assistant",
      "MC",
      `🔴 البوت خرج من السيرفر: ${botInfo(record)} — تم إيقافه. حاول تشغيله مرة أخرى.`,
    );
  });
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

    if (
      !host ||
      !Number.isInteger(port) ||
      port < 1 ||
      port > 65535
    ) {
      addMessage(
        "assistant",
        "MC",
        "❌ IP أو PORT غير صالح.",
      );

      return res.json({ ok: true });
    }

    const key = botKey(
      host,
      port,
      username,
    );

    const existing = bots.get(key);

    if (existing) {
      if (
        existing.status === "online" ||
        existing.status === "connecting"
      ) {
        addMessage(
          "assistant",
          "MC",
          `⚠️ البوت يعمل بالفعل: ${botInfo(existing)} — الحالة: ${existing.status}`,
        );

        return res.json({ ok: true });
      }

      /*
       * نفس Bot لا يتم إنشاء نسخة ثانية منه.
       * المستخدم يستطيع تشغيله مرة أخرى يدويًا.
       */
      existing.connectionId++;
      existing.autoReconnect = false;
      existing.status = "connecting";
      existing.bot = null;

      addMessage(
        "assistant",
        "MC",
        `🔄 إعادة تشغيل البوت: ${botInfo(existing)}...`,
      );

      connectBot(existing);

      return res.json({ ok: true });
    }

    const record: BotRecord = {
      key,
      host,
      port,
      username,
      bot: null,
      status: "connecting",
      autoReconnect: false,
      connectionId: 0,
    };

    bots.set(key, record);

    addMessage(
      "assistant",
      "MC",
      `🟡 جاري تشغيل البوت ${username} على ${host}:${port} — إعادة الاتصال التلقائي معطلة.`,
    );

    connectBot(record);

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

    const record = findBot(
      host,
      port,
      username,
    );

    if (!record) {
      addMessage(
        "assistant",
        "MC",
        `❌ لم يتم العثور على البوت: ${username} @ ${host}:${port}`,
      );

      return res.json({ ok: true });
    }

    record.connectionId++;
    record.autoReconnect = false;
    record.status = "stopped";

    if (activeBotKey === record.key) {
      activeBotKey = null;
    }

    const bot = record.bot;
    record.bot = null;

    if (bot) {
      try {
        bot.quit("Stopped by NΞXUS XS");
      } catch {}
    }

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

    const record = findBot(
      host,
      port,
      username,
    );

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
      `ℹ️ ${botInfo(record)} — الحالة: ${record.status} — Auto-Reconnect: OFF`,
    );

    return res.json({ ok: true });
  }

  if (!command.startsWith("!")) {
    const record = activeBotKey
      ? bots.get(activeBotKey)
      : undefined;

    if (
      !record ||
      record.status !== "online" ||
      !record.bot
    ) {
      addMessage(
        "assistant",
        "MC",
        "⚠️ لا يوجد Minecraft Bot متصل حاليًا. شغّل البوت أولًا باستخدام !start IP PORT BOT_NAME",
      );

      return res.json({ ok: true });
    }

    try {
      record.bot.chat(text);

      addMessage(
        "assistant",
        "MC",
        `📤 تم إرسال الرسالة إلى ${record.username}: ${text}`,
      );
    } catch (error) {
      addMessage(
        "assistant",
        "MC",
        `❌ فشل إرسال الرسالة: ${
          error instanceof Error
            ? error.message
            : "Unknown error"
        }`,
      );
    }

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

    const minecraftCommand =
      args.slice(3).join(" ");

    const record = findBot(
      host,
      port,
      username,
    );

    if (!record) {
      addMessage(
        "assistant",
        "MC",
        `❌ لم يتم العثور على البوت: ${username} @ ${host}:${port}`,
      );

      return res.json({ ok: true });
    }

    if (
      record.status !== "online" ||
      !record.bot
    ) {
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
