const fs = require("fs");
const YAML = require("yaml");
require("dotenv").config();

const CONFIG_PATH = "./config.yaml";

if (!fs.existsSync(CONFIG_PATH)) {
  throw new Error("❌ config.yaml غير موجود");
}

const config = YAML.parse(
  fs.readFileSync(CONFIG_PATH, "utf8")
);

function getDiscordConfig() {
  return {
    token: process.env.DISCORD_TOKEN || "",
    enabled: config?.platform?.discord?.enabled ?? true,
  };
}

function getAIConfig() {
  return {
    providers: config?.ai?.providers || [],
    primary: config?.ai?.primary || "",
    fallbacks: config?.ai?.fallbacks || [],
    rotation: config?.ai?.rotation || "failover",
    timeout: config?.ai?.timeout_seconds || 60,
    maxRetries: config?.ai?.max_retries || 3,
    globalTimeout: config?.ai?.global_timeout_seconds || 180,
  };
}

function getBotConfig() {
  return {
    name: config?.bot?.name || "Super ABG",
    developer: config?.bot?.developer || "",
  };
}

function getMemoryConfig() {
  return {
    enabled: config?.memory?.enabled ?? true,
    file: config?.memory?.file || "memory.json",
    maxMessagesPerUser:
      config?.memory?.max_messages_per_user ?? 20,
  };
}

function getSessionConfig() {
  return {
    timeoutMs: config?.session?.timeout_ms ?? 300000,
  };
}

function getTypingConfig() {
  return {
    min: config?.typing?.min ?? 700,
    max: config?.typing?.max ?? 3500,
    charDelay: config?.typing?.charDelay ?? 35,
    betweenLines: config?.typing?.betweenLines ?? 800,
  };
}

function getModelConfig() {
  const primary = config?.ai?.primary;
  const providers = config?.ai?.providers || [];
  const provider = providers.find(p => p.name === primary);

  return {
    model: provider?.model || provider?.models?.[0] || "",
  };
}

function getSecurityConfig() {
  return config?.security || {};
}

module.exports = {
  config,
  getDiscordConfig,
  getAIConfig,
  getBotConfig,
  getMemoryConfig,
  getSessionConfig,
  getTypingConfig,
  getModelConfig,
  getSecurityConfig,
};
