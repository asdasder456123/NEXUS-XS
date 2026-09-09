import fs from "node:fs";
import path from "node:path";

export type StoredMessage = {
  role: "user" | "assistant";
  text: string;
  createdAt: string;
};

export type ChatSession = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: StoredMessage[];
};

type Database = Record<string, ChatSession[]>;

const DATA_DIR = path.resolve(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "ai-sessions.json");

function ensureDatabase() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({}, null, 2), "utf8");
  }
}

function readDatabase(): Database {
  ensureDatabase();

  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(raw) as Database;
  } catch {
    return {};
  }
}

function writeDatabase(db: Database) {
  ensureDatabase();

  const tempFile = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), "utf8");
  fs.renameSync(tempFile, DATA_FILE);
}

function getSessions(db: Database, clientId: string) {
  if (!db[clientId]) {
    db[clientId] = [];
  }

  return db[clientId];
}

export function listSessions(clientId: string) {
  const db = readDatabase();

  return getSessions(db, clientId)
    .map((session) => ({
      id: session.id,
      title: session.title,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      messageCount: session.messages.length,
    }))
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() -
        new Date(a.updatedAt).getTime(),
    );
}

export function getSession(clientId: string, sessionId: string) {
  const db = readDatabase();

  return getSessions(db, clientId).find(
    (session) => session.id === sessionId,
  );
}

export function createSession(
  clientId: string,
  title = "New conversation",
) {
  const db = readDatabase();
  const sessions = getSessions(db, clientId);

  const now = new Date().toISOString();

  const session: ChatSession = {
    id: crypto.randomUUID(),
    title,
    createdAt: now,
    updatedAt: now,
    messages: [],
  };

  sessions.push(session);
  writeDatabase(db);

  return session;
}

export function addMessage(
  clientId: string,
  sessionId: string,
  role: "user" | "assistant",
  text: string,
) {
  const db = readDatabase();
  const session = getSessions(db, clientId).find(
    (item) => item.id === sessionId,
  );

  if (!session) {
    return null;
  }

  session.messages.push({
    role,
    text,
    createdAt: new Date().toISOString(),
  });

  session.updatedAt = new Date().toISOString();

  if (
    session.title === "New conversation" &&
    role === "user"
  ) {
    const cleanTitle = text.replace(/\s+/g, " ").trim();

    session.title =
      cleanTitle.length > 60
        ? `${cleanTitle.slice(0, 60)}…`
        : cleanTitle || "New conversation";
  }

  writeDatabase(db);

  return session;
}

export function deleteSession(
  clientId: string,
  sessionId: string,
) {
  const db = readDatabase();
  const sessions = getSessions(db, clientId);

  const index = sessions.findIndex(
    (session) => session.id === sessionId,
  );

  if (index === -1) {
    return false;
  }

  sessions.splice(index, 1);
  writeDatabase(db);

  return true;
}
