import { Router } from "express";
import {
  randomBytes,
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
  googleId?: string;
  discordId?: string;
  email: string;
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
  google: {
    sub: string;
    email: string;
    name: string;
    picture?: string;
  };
  code?: string;
  discordId?: string;
  expiresAt: number;
  verified: boolean;
};

const dataDirectory = path.resolve(process.cwd(), "data/auth");
const usersFile = path.join(dataDirectory, "users.json");

const sessions = new Map<string, Session>();
const oauthStates = new Map<string, number>();
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

export function completeDiscordVerification(
  challenge: string,
  discordId: string,
): string | null {
  cleanupChallenges();

  const item = verificationChallenges.get(challenge);

  if (!item || item.expiresAt < Date.now()) {
    return null;
  }

  if (item.discordId && item.discordId !== discordId) {
    return null;
  }

  const code = String(
    Math.floor(100000 + Math.random() * 900000),
  );

  item.discordId = discordId;
  item.code = code;

  return code;
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
router.get("/discord", (_req, res) => {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri =
    process.env.DISCORD_REDIRECT_URI ??
    `${baseUrl()}/auth/discord/callback`;

  if (!clientId) {
    res.status(503).send("Discord login is not configured yet.");
    return;
  }

  const state = randomBytes(32).toString("base64url");

  oauthStates.set(
    state,
    Date.now() + 10 * 60 * 1000,
  );

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify email",
    state,
  });

  res.redirect(
    `https://discord.com/oauth2/authorize?${params.toString()}`,
  );
});

/*
 * Discord OAuth callback.
 */
router.get("/discord/callback", async (req, res) => {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri =
    process.env.DISCORD_REDIRECT_URI ??
    `${baseUrl()}/auth/discord/callback`;

  const code =
    typeof req.query.code === "string"
      ? req.query.code
      : "";

  const state =
    typeof req.query.state === "string"
      ? req.query.state
      : "";

  if (!clientId || !clientSecret || !code || !state) {
    res.redirect("/?auth_error=discord");
    return;
  }

  const stateExpiresAt = oauthStates.get(state);
  oauthStates.delete(state);

  if (!stateExpiresAt || stateExpiresAt < Date.now()) {
    res.redirect("/?auth_error=discord_state");
    return;
  }

  try {
    const tokenResponse = await fetch(
      "https://discord.com/api/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
        }),
      },
    );

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();

      console.error(
        "[Auth] Discord token exchange rejected:",
        tokenResponse.status,
        errorText,
      );

      throw new Error(
        `Discord token exchange failed (${tokenResponse.status})`,
      );
    }

    const tokens = (await tokenResponse.json()) as {
      access_token?: string;
    };

    if (!tokens.access_token) {
      throw new Error("Discord access token missing");
    }

    const profileResponse = await fetch(
      "https://discord.com/api/users/@me",
      {
        headers: {
          Authorization:
            `Bearer ${tokens.access_token}`,
        },
      },
    );

    if (!profileResponse.ok) {
      throw new Error("Discord profile request failed");
    }

    const profile = (await profileResponse.json()) as {
      id?: string;
      username?: string;
      global_name?: string;
      email?: string;
      avatar?: string;
    };

    if (!profile.id) {
      throw new Error("Discord profile is incomplete");
    }

    cleanupChallenges();

    const challenge = randomBytes(12).toString("hex");

    const existingChallenge = verificationChallenges.get(challenge);

    if (!existingChallenge) {
      verificationChallenges.set(challenge, {
        challenge,
        google: {
          sub: "",
          email: profile.email ?? "",
          name:
            profile.global_name ??
            profile.username ??
            "Discord User",
        },
        discordId: profile.id,
        expiresAt: Date.now() + 10 * 60 * 1000,
        verified: true,
      });
    }

    res.redirect(
      `/?auth_challenge=${encodeURIComponent(challenge)}`,
    );
  } catch (error) {
    console.error(
      "[Auth] Discord login failed:",
      error,
    );

    res.redirect("/?auth_error=discord");
  }
});

/*
 * Discord verification status.
 */
router.get("/discord/status", (req, res) => {
  const challenge =
    typeof req.query.challenge === "string"
      ? req.query.challenge
      : "";

  cleanupChallenges();

  const item = verificationChallenges.get(challenge);

  if (!item) {
    res.status(404).json({
      ok: false,
      error: "رمز التحقق غير صالح أو انتهت صلاحيته.",
    });

    return;
  }

  res.json({
    ok: true,
    discordLinked: Boolean(item.discordId),
    verified: item.verified,
    expiresAt: item.expiresAt,
  });
});

/*
 * Verify the six-digit Discord code.
 */
router.post("/discord/verify", (req, res) => {
  const challenge = String(
    req.body?.challenge ?? "",
  ).trim();

  const code = String(
    req.body?.code ?? "",
  ).trim();

  cleanupChallenges();

  const item = verificationChallenges.get(challenge);

  if (!item || item.expiresAt < Date.now()) {
    res.status(400).json({
      ok: false,
      error: "رمز التحقق انتهت صلاحيته.",
    });

    return;
  }

  if (!item.discordId || !item.code) {
    res.status(400).json({
      ok: false,
      error:
        "لم يتم التحقق من Discord بعد. استخدم أمر verify في Discord.",
    });

    return;
  }

  if (item.code !== code) {
    res.status(401).json({
      ok: false,
      error: "كود Discord غير صحيح.",
    });

    return;
  }

  item.verified = true;

  res.json({
    ok: true,
  });
});

/*
 * Create a new account.
 *
 * Direct registration is intentionally disabled.
 * A valid Discord-verified Google challenge is required.
 */
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

  cleanupChallenges();

  const verification =
    verificationChallenges.get(challenge);

  if (
    !verification ||
    !verification.verified ||
    verification.expiresAt < Date.now() ||
    !verification.discordId
  ) {
    res.status(403).json({
      ok: false,
      error:
        "يجب إكمال التحقق من Google وDiscord أولًا.",
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

  const emailExists = users.some(
    (user) =>
      user.email.toLowerCase() ===
      verification.google.email.toLowerCase(),
  );

  if (emailExists) {
    res.status(409).json({
      ok: false,
      error:
        "هذا حساب Google لديه حساب NΞXUS XS بالفعل.",
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
    googleId: verification.google.sub,
    discordId: verification.discordId,
    email: verification.google.email,
    name:
      verification.google.name ||
      username,
    avatar: verification.google.picture,
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

/*
 * Google OAuth configuration.
 */
function googleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret =
    process.env.GOOGLE_CLIENT_SECRET;

  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ??
    `${baseUrl()}/auth/google/callback`;

  if (!clientId || !clientSecret) {
    return null;
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
  };
}

/*
 * Start Google login.
 */
router.get("/google", (_req, res) => {
  const config = googleConfig();

  if (!config) {
    res
      .status(503)
      .send("Google login is not configured yet.");

    return;
  }

  const state = randomBytes(32).toString(
    "base64url",
  );

  oauthStates.set(
    state,
    Date.now() + 10 * 60 * 1000,
  );

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
  });

  res.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
  );
});

/*
 * Google callback.
 */
router.get(
  "/google/callback",
  async (req, res) => {
    const config = googleConfig();

    const code =
      typeof req.query.code === "string"
        ? req.query.code
        : "";

    const state =
      typeof req.query.state === "string"
        ? req.query.state
        : "";

    if (!config || !code || !state) {
      res.redirect("/?auth_error=google");
      return;
    }

    const stateExpiresAt =
      oauthStates.get(state);

    oauthStates.delete(state);

    if (
      !stateExpiresAt ||
      stateExpiresAt < Date.now()
    ) {
      res.redirect("/?auth_error=state");
      return;
    }

    try {
      const tokenResponse = await fetch(
        "https://oauth2.googleapis.com/token",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            code,
            client_id: config.clientId,
            client_secret:
              config.clientSecret,
            redirect_uri:
              config.redirectUri,
            grant_type:
              "authorization_code",
          }),
        },
      );

      if (!tokenResponse.ok) {
        throw new Error(
          "Google token exchange failed",
        );
      }

      const tokens =
        (await tokenResponse.json()) as {
          access_token?: string;
        };

      if (!tokens.access_token) {
        throw new Error(
          "Google access token missing",
        );
      }

      const profileResponse = await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: {
            Authorization:
              `Bearer ${tokens.access_token}`,
          },
        },
      );

      if (!profileResponse.ok) {
        throw new Error(
          "Google profile request failed",
        );
      }

      const profile =
        (await profileResponse.json()) as {
          sub?: string;
          email?: string;
          name?: string;
          picture?: string;
        };

      if (!profile.sub || !profile.email) {
        throw new Error(
          "Google profile is incomplete",
        );
      }

      const users = await loadUsers();

      const existingUser =
        users.find(
          (item) =>
            item.googleId === profile.sub,
        ) ??
        users.find(
          (item) =>
            item.email.toLowerCase() ===
            profile.email!.toLowerCase(),
        );

      /*
       * Existing accounts can continue using
       * username/password. Google does not silently
       * create another account for them.
       */
      if (existingUser) {
        createSession(res, existingUser.id);
        res.redirect("/");
        return;
      }

      cleanupChallenges();

      const challenge = randomBytes(12).toString(
        "hex",
      );

      verificationChallenges.set(challenge, {
        challenge,
        google: {
          sub: profile.sub,
          email: profile.email,
          name: profile.name ?? "",
          picture: profile.picture,
        },
        expiresAt: Date.now() + 10 * 60 * 1000,
        verified: false,
      });

      res.redirect(
        `/?auth_challenge=${encodeURIComponent(
          challenge,
        )}`,
      );
    } catch (error) {
      console.error(
        "[Auth] Google login failed:",
        error,
      );

      res.redirect(
        "/?auth_error=google",
      );
    }
  },
);

export { router as authRouter };
