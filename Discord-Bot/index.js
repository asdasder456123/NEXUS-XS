require("dotenv").config();
const fs = require("fs");
const { Client, GatewayIntentBits } = require("discord.js");
const { Groq } = require("groq-sdk");
const {
  getDiscordConfig,
  getAIConfig,
  getBotConfig,
  getMemoryConfig,
  getSessionConfig,
  getTypingConfig,
  getModelConfig
} = require("./config-loader");

let insultsConfig = {
  enabled: false,
  categories: {},
  behavior: {},
  response: {}
};

try {
  if (fs.existsSync("./insults.json")) {
    insultsConfig = JSON.parse(fs.readFileSync("./insults.json", "utf8"));
    console.log("🛡️ Insults Config Loaded");
  }
} catch (e) {
  console.log("⚠️ insults.json غير صالح:", e.message);
}

function normalizeArabic(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[ًٌٍَُِّْـ]/g, "");
}

function detectInsult(text) {
  if (!insultsConfig.enabled) return false;

  const source = insultsConfig.behavior?.normalize_arabic
    ? normalizeArabic(text)
    : String(text || "").toLowerCase();

  const categories = insultsConfig.categories || {};

  for (const [category, words] of Object.entries(categories)) {
    if (!Array.isArray(words)) continue;

    for (const word of words) {
      if (!word || String(word).startsWith("ضع_")) continue;

      const target = insultsConfig.behavior?.normalize_arabic
        ? normalizeArabic(word)
        : String(word).toLowerCase();

      if (target && source.includes(target)) {
        return { category, word: target };
      }
    }
  }

  return false;
}

console.log("DEBUG: loading Discord config");
const discordConfig = getDiscordConfig();
console.log("DEBUG: Discord config loaded");
console.log("DEBUG: loading AI config");
const aiConfig = getAIConfig();
console.log("DEBUG: AI config loaded");

const botConfig = getBotConfig();
const memoryConfig = getMemoryConfig();
const sessionConfig = getSessionConfig();
const typingConfig = getTypingConfig();
const modelConfig = getModelConfig();

if (!fs.existsSync("./system.txt")) {
  console.log("❌ system.txt غير موجود");
  process.exit(1);
}


const systemPrompt = fs.readFileSync(
  "./system.txt",
  "utf8"
);

let maintenance = {
  enabled: false,
  message: "⚙️ Super ABG حاليا تحت التطوير والتحديث، حاول لاحقاً."
};

if (fs.existsSync("./maintenance.json")) {
  maintenance = JSON.parse(
    fs.readFileSync("./maintenance.json", "utf8")
  );
}

let memory = {};

if (fs.existsSync("./memory.json")) {
  memory = JSON.parse(
    fs.readFileSync("./memory.json", "utf8")
  );
}

function saveMemory() {
  fs.writeFileSync(
    "./memory.json",
    JSON.stringify(memory, null, 2)
  );
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

console.log("DEBUG: loading commands");
require("./commands")(client);
console.log("DEBUG: commands loaded");
console.log("DEBUG: loading security");
require("./security")(client);
console.log("DEBUG: security loaded");


const groq = new Groq({
  apiKey: aiConfig.providers.find(p => p.name === "my_groq")?.api_key
});



const activeUsers = new Map();

// 🧠 AI Request Control
const aiQueue = [];
let aiBusy = false;

const userRate = new Map();

const AI_CONTROL = {
  cooldownMs: 7000,          // وقت بسيط بين طلبات نفس المستخدم
  warningCooldownMs: 30000,   // منع تكرار التحذير بسرعة
  maxQueuePerUser: 2,
  maxSystemChars: 2000,
  maxHistoryMessages: 6,
  maxMessageChars: 500,
  maxTokens: 350
};

function getUserRate(userId) {
  if (!userRate.has(userId)) {
    userRate.set(userId, {
      lastRequest: 0,
      warningAt: 0,
      queued: 0
    });
  }

  return userRate.get(userId);
}

function queueAI(userId, task) {
  return new Promise((resolve, reject) => {
    const state = getUserRate(userId);

    if (state.queued >= AI_CONTROL.maxQueuePerUser) {
      reject(new Error("QUEUE_FULL"));
      return;
    }

    state.queued++;

    aiQueue.push({
      userId,
      task,
      resolve,
      reject
    });

    processAIQueue();
  });
}

async function processAIQueue() {
  if (aiBusy || aiQueue.length === 0) return;

  aiBusy = true;

  const item = aiQueue.shift();
  const state = getUserRate(item.userId);

  try {
    const wait =
      AI_CONTROL.cooldownMs -
      (Date.now() - state.lastRequest);

    if (wait > 0) {
      await new Promise(r => setTimeout(r, wait));
    }

    state.lastRequest = Date.now();

    const result = await item.task();
    item.resolve(result);

  } catch (err) {
    item.reject(err);

  } finally {
    state.queued = Math.max(0, state.queued - 1);
    aiBusy = false;

    setTimeout(processAIQueue, 250);
  }
}

function shouldRateLimit(userId) {
  const state = getUserRate(userId);
  return Date.now() - state.lastRequest < AI_CONTROL.cooldownMs;
}

function shouldWarn(userId) {
  const state = getUserRate(userId);

  if (Date.now() - state.warningAt < AI_CONTROL.warningCooldownMs) {
    return false;
  }

  state.warningAt = Date.now();
  return true;
}


// 💤 Super ABG Sleep / Wake System
const BOT_SLEEP_TIME = 10 * 60 * 1000; // 10 دقائق بدون تفاعل
let botSleeping = false;
let lastBotActivity = Date.now();

function wakeBot(reason = "interaction") {
  botSleeping = false;
  lastBotActivity = Date.now();
  console.log(`🟢 Super ABG Woke Up: ${reason}`);
}

function updateBotActivity() {
  lastBotActivity = Date.now();
  if (botSleeping) {
    wakeBot("new message");
  }
}

setInterval(() => {
  if (!botSleeping && Date.now() - lastBotActivity >= BOT_SLEEP_TIME) {
    botSleeping = true;
    console.log("💤 Super ABG دخل وضع الهدوء");
  }
}, 30 * 1000);



client.once("clientReady", () => {

  console.log("================================");
  console.log(`🤖 ${botConfig.name}`);
  console.log(`👤 ${client.user.tag}`);
  console.log(`📚 Users: ${Object.keys(memory).length}`);
  console.log("🎧 Voice System Ready");
  console.log("🟢 Ready");
  console.log("================================");

});


// 🎤 أمر دخول الصوت بالمنشن
client.on("messageCreate", async message => {
  if (message.author.bot) return;

  // 💤 Sleep/Wake: يتم التعامل مع حالة النوم بعد تحديد mentioned الأصلي


  const detectedInsult = detectInsult(message.content);

  if (detectedInsult) {
    console.log(
      `🛡️ Insult detected | category=${detectedInsult.category}`
    );

    // الكشف فقط — بدون توليد شتائم
    if (insultsConfig.behavior?.action_on_match === "flag") {
      console.log("⚠️ Message flagged for insult");
    }
  }

  if (message.author.bot) return;





  const mentioned =
    message.mentions.users.has(
      client.user.id
    );


  if (
    !mentioned &&
    !activeUsers.has(message.author.id)
  )
    return;



  const userId =
    message.author.id;



  const text =
    message.content
    .replace(
      new RegExp(`<@!?${client.user.id}>`, "g"),
      ""
    )
    .trim();



  if (!text)
    return;



  activeUsers.set(
    userId,
    Date.now()
  );



  if (!memory[userId])
    memory[userId] = [];



  memory[userId].push({
    role:"user",
    content:text
  });



  if(
    memory[userId].length >
    memoryConfig.maxMessagesPerUser
  ){

    memory[userId].shift();

  }



  saveMemory();



  try {


    const result =
      await groq.chat.completions.create({

        model: modelConfig.model,
        max_tokens: 180,
        temperature: 0.7,

        messages:[
          {
            role:"system",
            content: systemPrompt
          },

          ...memory[userId]
          .slice(-3)
          .map(m => ({
            role: m.role,
            content: String(m.content || "").slice(0, 350)
          }))

        ]
      });



    const reply =
    result.choices[0]
    .message.content;



    memory[userId].push({

      role:"assistant",
      content:reply

    });



    saveMemory();



    const lines =
    reply
    .split(/\n+/)
    .map(x=>x.trim())
    .filter(Boolean);



    for(
      const line of lines
    ){

      await message.channel.sendTyping();


      await new Promise(r=>
        setTimeout(
          r,
          Math.min(
            Math.max(
              line.length *
              typingConfig.charDelay,
              typingConfig.min
            ),
            typingConfig.max
          )
        )
      );


      await message.reply({

        content:line,

        allowedMentions:{
          repliedUser:false
        }

      });


      await new Promise(r=>
        setTimeout(
          r,
          typingConfig.betweenLines
        )
      );

    }



  } catch(err){

    console.error(err);


    fs.appendFileSync(
      "logs.txt",
      `${new Date().toISOString()}\n${err.stack || err}\n\n`
    );


    await message.reply({

      content:"⚠️ حصل خطأ داخلي.",

      allowedMentions:{
        repliedUser:false
      }

    }).catch(()=>{});


  }



  setTimeout(()=>{

    if(
      Date.now() -
      activeUsers.get(userId)
      >= sessionConfig.timeoutMs
    ){

      activeUsers.delete(userId);

    }

  }, sessionConfig.timeoutMs);


});









console.log("DEBUG: about to login to Discord");

client.login(discordConfig.token)
  .then(() => console.log("DEBUG: login promise resolved"))
  .catch(err => console.error("❌ LOGIN ERROR:", err));
