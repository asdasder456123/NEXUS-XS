import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export type ChatMessage = {
  id: string;
  authorId: string;
  author: string;
  avatar?: string;
  text: string;
  createdAt: string;
};

const filePath = path.resolve(process.cwd(), "data/chat/messages.json");

async function ensureStorage() {
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, "[]\n", "utf8");
  }
}

export async function getChatMessages(): Promise<ChatMessage[]> {
  await ensureStorage();

  const raw = await fs.readFile(filePath, "utf8");
  const messages = JSON.parse(raw) as ChatMessage[];

  return messages.slice(-100);
}

export async function addChatMessage(
  input: Omit<ChatMessage, "id" | "createdAt">,
): Promise<ChatMessage> {
  const messages = await getChatMessages();

  const message: ChatMessage = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  messages.push(message);

  await fs.writeFile(
    filePath,
    JSON.stringify(messages.slice(-100), null, 2) + "\n",
    "utf8",
  );

  return message;
}
