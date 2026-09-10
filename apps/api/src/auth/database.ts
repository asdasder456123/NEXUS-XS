import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);
const projectRoot = path.resolve(currentDirectory, "../../..");

const dataDirectory = path.join(projectRoot, "data", "database");

fs.mkdirSync(dataDirectory, { recursive: true });

const database = new Database(
  path.join(dataDirectory, "nexus-xs.db"),
);

database.pragma("journal_mode = WAL");

database.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_users_username
  ON users(username);
`);

export type User = {
  id: string;
  username: string;
  createdAt: string;
};

type StoredUser = User & {
  passwordHash: string;
  passwordSalt: string;
};

const insertUser = database.prepare(`
  INSERT INTO users (
    id,
    username,
    password_hash,
    password_salt,
    created_at
  )
  VALUES (?, ?, ?, ?, ?)
`);

const findUserByUsername = database.prepare(`
  SELECT
    id,
    username,
    password_hash AS passwordHash,
    password_salt AS passwordSalt,
    created_at AS createdAt
  FROM users
  WHERE username = ?
  LIMIT 1
`);

const findUserById = database.prepare(`
  SELECT
    id,
    username,
    password_hash AS passwordHash,
    password_salt AS passwordSalt,
    created_at AS createdAt
  FROM users
  WHERE id = ?
  LIMIT 1
`);

export function createUser(
  username: string,
  passwordHash: string,
  passwordSalt: string,
): User {
  const id = cryptoRandomId();
  const createdAt = new Date().toISOString();

  insertUser.run(
    id,
    username,
    passwordHash,
    passwordSalt,
    createdAt,
  );

  return {
    id,
    username,
    createdAt,
  };
}

export function getUserByUsername(
  username: string,
): StoredUser | undefined {
  return findUserByUsername.get(username) as
    | StoredUser
    | undefined;
}

export function getUserById(
  id: string,
): User | undefined {
  return findUserById.get(id) as User | undefined;
}

function cryptoRandomId() {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}-${Math.random()
    .toString(36)
    .slice(2)}`;
}
