import { Router } from "express";
import {
  exchangeDiscordCode,
  getDiscordLoginUrl,
  getDiscordUser,
} from "./discord.js";

export const authRouter = Router();

authRouter.get("/discord", (_req, res) => {
  res.redirect(getDiscordLoginUrl());
});

authRouter.get("/discord/callback", async (req, res) => {
  try {
    const code = String(req.query.code ?? "");

    if (!code) {
      return res.status(400).json({
        error: "Missing Discord authorization code",
      });
    }

    const token = await exchangeDiscordCode(code);
    const user = await getDiscordUser(token.access_token);

    req.session.user = {
      id: String(user.id),
      username: String(user.global_name || user.username || "Discord User"),
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
