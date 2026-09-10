import crypto from "node:crypto";
import { Router } from "express";
import {
  exchangeDiscordCode,
  getDiscordLoginUrl,
  getDiscordUser,
} from "./discord.js";
import {
  createUser,
  getUserByUsername,
} from "./database.js";

export const authRouter = Router();

function normalizeUsername(value: string) {
  return value.trim();
}

function hashPassword(
  password: string,
  salt: Buffer,
) {
  return crypto.scryptSync(
    password,
    salt,
    64,
  );
}

function verifyPassword(
  password: string,
  saltHex: string,
  expectedHashHex: string,
) {
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(
    expectedHashHex,
    "hex",
  );

  const actual = hashPassword(
    password,
    salt,
  );

  return (
    actual.length === expected.length &&
    crypto.timingSafeEqual(actual, expected)
  );
}

authRouter.post("/register", (req, res) => {
  try {
    const username =
      typeof req.body?.username === "string"
        ? normalizeUsername(req.body.username)
        : "";

    const password =
      typeof req.body?.password === "string"
        ? req.body.password
        : "";

    if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) {
      return res.status(400).json({
        authenticated: false,
        error:
          "اسم المستخدم يجب أن يكون من 3 إلى 24 حرفًا أو رقمًا أو _",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        authenticated: false,
        error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل.",
      });
    }

    if (getUserByUsername(username)) {
      return res.status(409).json({
        authenticated: false,
        error: "اسم المستخدم مستخدم بالفعل.",
      });
    }

    const salt = crypto.randomBytes(16);
    const passwordHash = hashPassword(
      password,
      salt,
    );

    const user = createUser(
      username,
      passwordHash.toString("hex"),
      salt.toString("hex"),
    );

    req.session.user = {
      id: user.id,
      username: user.username,
    };

    return res.status(201).json({
      authenticated: true,
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (error) {
    console.error(
      "[Auth] Registration failed:",
      error,
    );

    return res.status(500).json({
      authenticated: false,
      error: "تعذر إنشاء الحساب.",
    });
  }
});

authRouter.post("/login", (req, res) => {
  try {
    const username =
      typeof req.body?.username === "string"
        ? normalizeUsername(req.body.username)
        : "";

    const password =
      typeof req.body?.password === "string"
        ? req.body.password
        : "";

    if (!username || !password) {
      return res.status(400).json({
        authenticated: false,
        error: "اسم المستخدم وكلمة المرور مطلوبان.",
      });
    }

    const user = getUserByUsername(username);

    if (
      !user ||
      !verifyPassword(
        password,
        user.passwordSalt,
        user.passwordHash,
      )
    ) {
      return res.status(401).json({
        authenticated: false,
        error: "اسم المستخدم أو كلمة المرور غير صحيحة.",
      });
    }

    req.session.user = {
      id: user.id,
      username: user.username,
    };

    return res.json({
      authenticated: true,
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (error) {
    console.error(
      "[Auth] Login failed:",
      error,
    );

    return res.status(500).json({
      authenticated: false,
      error: "تعذر تسجيل الدخول.",
    });
  }
});

authRouter.post("/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error(
        "[Auth] Logout failed:",
        error,
      );

      return res.status(500).json({
        authenticated: false,
        error: "تعذر تسجيل الخروج.",
      });
    }

    return res.json({
      authenticated: false,
      user: null,
    });
  });
});

authRouter.get("/discord", (req, res) => {
  const state = crypto.randomBytes(32).toString("hex");
  req.session.oauthState = state;

  res.redirect(getDiscordLoginUrl(state));
});

authRouter.get("/discord/callback", async (req, res) => {
  try {
    const code = String(req.query.code ?? "");
    const state = String(req.query.state ?? "");

    if (!state || state !== req.session.oauthState) {
      return res.status(400).json({
        error: "Invalid OAuth state",
      });
    }

    delete req.session.oauthState;

    if (!code) {
      return res.status(400).json({
        error: "Missing Discord authorization code",
      });
    }

    const token = await exchangeDiscordCode(code);
    const user = await getDiscordUser(token.access_token);

    req.session.user = {
      id: String(user.id),
      username: String(
        user.global_name ||
          user.username ||
          "Discord User",
      ),
      avatar:
        typeof user.avatar === "string"
          ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
          : undefined,
    };

    res.json({
      authenticated: true,
      user,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      authenticated: false,
      error: "Discord authentication failed",
    });
  }
});

authRouter.get("/me", (req, res) => {
  if (!req.session.user) {
    return res.json({
      authenticated: false,
      user: null,
    });
  }

  return res.json({
    authenticated: true,
    user: req.session.user,
  });
});
