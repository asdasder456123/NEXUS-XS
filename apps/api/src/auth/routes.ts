import { Router } from "express";
import {
  randomBytes,
  randomInt,
  scrypt,
  timingSafeEqual,
} from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const router = Router();
const scryptAsync = promisify(scrypt);

type User = {
  id: string;
  username: string;
  passwordHash?: string;
  discordId?: string;
  email?: string;
  name: string;
  avatar?: string;
  createdAt: string;
};

type Session = {
  userId: string;
  expiresAt: number;
};

type VerificationChallenge = {
  challenge: string;
  discordId: string;
  discordUsername: string;
  code?: string;
  codeSent: boolean;
  verified: boolean;
  expiresAt: number;
};

const dataDirectory = path.resolve(process.cwd(), "data/auth");
const usersFile = path.join(dataDirectory, "users.json");

const sessions = new Map<string, Session>();
const verificationChallenges = new Map<
  string,
  VerificationChallenge
>();

async function loadUsers(): Promise<User[]> {
  try {
    return JSON.parse(await readFile(usersFile, "utf8"));
  } catch {
    return [];
  }
}

async function saveUsers(users: User[]) {
  await mkdir(dataDirectory, { recursive: true });

  await writeFile(
    usersFile,
    JSON.stringify(users, null, 2),
    "utf8",
  );
}

function baseUrl() {
  return (
    process.env.BASE_URL ??
    `http://127.0.0.1:${process.env.PORT ?? "3000"}`
  ).replace(/\/$/, "");
}

function getSessionToken(req: any) {
  const raw = req.headers.cookie ?? "";
  const match = raw.match(/(?:^|; )nexus_session=([^;]+)/);

  return match?.[1] ?? null;
}

function createSession(res: any, userId: string) {
  const token = randomBytes(32).toString("base64url");
  const maxAge = 30 * 24 * 60 * 60 * 1000;

  sessions.set(token, {
    userId,
    expiresAt: Date.now() + maxAge,
  });

  const secure = baseUrl().startsWith("https://");

  res.setHeader(
    "Set-Cookie",
    [
      `nexus_session=${token}`,
      `Max-Age=${Math.floor(maxAge / 1000)}`,
      "HttpOnly",
      "SameSite=Lax",
      "Path=/",
      secure ? "Secure" : "",
    ]
      .filter(Boolean)
      .join("; "),
  );
}

function currentUser(req: any, users: User[]) {
  const token = getSessionToken(req);

  if (!token) return null;

  const session = sessions.get(token);

  if (!session || session.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }

  return (
    users.find((user) => user.id === session.userId) ??
    null
  );
}

function publicUser(user: User) {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
  };
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");

  const derived = (await scryptAsync(
    password,
    salt,
    64,
  )) as Buffer;

  return `${salt}:${derived.toString("hex")}`;
}

async function verifyPassword(
  password: string,
  stored: string,
) {
  const [salt, hex] = stored.split(":");

  if (!salt || !hex) return false;

  const expected = Buffer.from(hex, "hex");

  const actual = (await scryptAsync(
    password,
    salt,
    expected.length,
  )) as Buffer;

  return (
    actual.length === expected.length &&
    timingSafeEqual(actual, expected)
  );
}

function cleanupChallenges() {
  const now = Date.now();

  for (const [key, value] of verificationChallenges) {
    if (value.expiresAt < now) {
      verificationChallenges.delete(key);
    }
  }
}

export function getVerificationChallenge(
  challenge: string,
) {
  cleanupChallenges();
  return verificationChallenges.get(challenge);
}

function cleanupVerificationChallenges(): void {
  const now = Date.now();

  for (const [challenge, item] of verificationChallenges) {
    if (item.expiresAt < now) {
      verificationChallenges.delete(challenge);
    }
  }
}

export function completeDiscordVerification(
  challenge: string,
  discordId: string,
): string | null {
  cleanupVerificationChallenges();

  const item = verificationChallenges.get(challenge);
  if (!item || item.expiresAt < Date.now()) {
    return null;
  }

  if (item.discordId !== discordId) {
    return null;
  }

  if (item.codeSent && item.code) {
    return item.code;
  }

  const code = String(randomInt(1000, 10000));

  item.code = code;
  item.codeSent = true;
  item.verified = false;

  return code;
}

export function getPendingDiscordVerifications(): Array<{
  challenge: string;
  discordId: string;
}> {
  cleanupVerificationChallenges();

  return Array.from(verificationChallenges.values())
    .filter((item) => !item.codeSent && !item.verified)
    .map((item) => ({
      challenge: item.challenge,
      discordId: item.discordId,
    }));
}

export function resetDiscordVerification(
  challenge: string,
  discordId: string,
): void {
  const item = verificationChallenges.get(challenge);

  if (!item || item.discordId !== discordId) {
    return;
  }

  item.code = undefined;
  item.codeSent = false;
  item.verified = false;
}

/*
 * Current session
 */
router.get("/me", async (req, res) => {
  const users = await loadUsers();
  const user = currentUser(req, users);

  res.json({
    authenticated: Boolean(user),
    user: user ? publicUser(user) : null,
  });
});

/*
 * Login for existing accounts.
 */
router.post("/login", async (req, res) => {
  const username = String(
    req.body?.username ?? "",
  ).trim();

  const password = String(
    req.body?.password ?? "",
  );

  const users = await loadUsers();

  const user = users.find(
    (item) =>
      item.username.toLowerCase() ===
      username.toLowerCase(),
  );

  if (
    !user?.passwordHash ||
    !(await verifyPassword(
      password,
      user.passwordHash,
    ))
  ) {
    res.status(401).json({
      ok: false,
      error:
        "اسم المستخدم أو كلمة المرور غير صحيحة.",
    });

    return;
  }

  createSession(res, user.id);

  res.json({
    ok: true,
    user: publicUser(user),
  });
});

/*
 * Start Discord OAuth.
 */
router.post("/discord/start", (req, res) => {
  const discordUsername = String(req.body?.discordUsername ?? "").trim();
  const discordId = String(req.body?.discordId ?? "").trim();

  if (discordUsername.length < 2 || discordUsername.length > 100) {
    return res.status(400).json({
      error: "Discord username must be between 2 and 100 characters.",
    });
  }

  if (!/^\d{17,20}$/.test(discordId)) {
    return res.status(400).json({
      error: "Enter a valid Discord user ID.",
    });
  }

  cleanupVerificationChallenges();

  const challenge = randomBytes(16).toString("hex");
  const expiresAt = Date.now() + 10 * 60 * 1000;

  verificationChallenges.set(challenge, {
    challenge,
    discordId,
    discordUsername,
    codeSent: false,
    verified: false,
    expiresAt,
  });

  return res.json({
    challenge,
    expiresAt,
  });
});

router.get("/discord/status", (req, res) => {
  const challenge = String(req.query.challenge ?? "").trim();

  const item = verificationChallenges.get(challenge);

  if (!item || item.expiresAt < Date.now()) {
    verificationChallenges.delete(challenge);
    return res.status(404).json({
      error: "Verification challenge expired or not found.",
    });
  }

  return res.json({
    verified: item.verified,
    codeSent: item.codeSent,
    discordUsername: item.discordUsername,
    expiresAt: item.expiresAt,
  });
});

router.post("/discord/verify", (req, res) => {
  const challenge = String(req.body?.challenge ?? "").trim();
  const code = String(req.body?.code ?? "").trim();

  const item = verificationChallenges.get(challenge);

  if (!item || item.expiresAt < Date.now()) {
    verificationChallenges.delete(challenge);
    return res.status(400).json({
      error: "Verification challenge expired or not found.",
    });
  }

  if (!item.codeSent || !item.code) {
    return res.status(400).json({
      error: "The Discord bot has not sent a verification code yet.",
    });
  }

  if (!/^\d{4}$/.test(code)) {
    return res.status(400).json({
      error: "Enter the 4-digit verification code.",
    });
  }

  if (code !== item.code) {
    return res.status(400).json({
      error: "Incorrect verification code.",
    });
  }

  item.verified = true;
  item.code = undefined;

  return res.json({
    verified: true,
  });
});

router.post("/register", async (req, res) => {
  const challenge = String(
    req.body?.challenge ?? "",
  ).trim();

  const username = String(
    req.body?.username ?? "",
  ).trim();

  const password = String(
    req.body?.password ?? "",
  );

  const confirmPassword = String(
    req.body?.confirmPassword ?? "",
  );

  cleanupVerificationChallenges();

  const verification =
    verificationChallenges.get(challenge);

  if (
    !verification ||
    !verification.verified ||
    verification.expiresAt < Date.now()
  ) {
    res.status(403).json({
      ok: false,
      error: "يجب إكمال التحقق من Discord أولًا.",
    });

    return;
  }

  if (!/^[a-zA-Z0-9_.-]{3,24}$/.test(username)) {
    res.status(400).json({
      ok: false,
      error: "اسم المستخدم غير صالح.",
    });

    return;
  }

  if (password.length < 8 || password.length > 128) {
    res.status(400).json({
      ok: false,
      error:
        "كلمة المرور يجب أن تكون بين 8 و128 حرفًا.",
    });

    return;
  }

  if (password !== confirmPassword) {
    res.status(400).json({
      ok: false,
      error: "كلمتا المرور غير متطابقتين.",
    });

    return;
  }

  const users = await loadUsers();

  const usernameExists = users.some(
    (user) =>
      user.username.toLowerCase() ===
      username.toLowerCase(),
  );

  if (usernameExists) {
    res.status(409).json({
      ok: false,
      error: "اسم المستخدم مستخدم بالفعل.",
    });

    return;
  }

  const discordExists = users.some(
    (user) =>
      user.discordId === verification.discordId,
  );

  if (discordExists) {
    res.status(409).json({
      ok: false,
      error:
        "حساب Discord هذا مرتبط بحساب NΞXUS XS بالفعل.",
    });

    return;
  }

  const user: User = {
    id: randomBytes(16).toString("hex"),
    username,
    passwordHash: await hashPassword(password),
    discordId: verification.discordId,
    email: undefined,
    name: verification.discordUsername || username,
    createdAt: new Date().toISOString(),
  };

  users.push(user);

  await saveUsers(users);

  verificationChallenges.delete(challenge);

  createSession(res, user.id);

  res.json({
    ok: true,
    user: publicUser(user),
  });
});

/*
 * Logout
 */
router.post("/logout", (req, res) => {
  const token = getSessionToken(req);

  if (token) {
    sessions.delete(token);
  }

  res.setHeader(
    "Set-Cookie",
    "nexus_session=; Max-Age=0; HttpOnly; SameSite=Lax; Path=/",
  );

  res.json({ ok: true });
});

export { router as authRouter };
