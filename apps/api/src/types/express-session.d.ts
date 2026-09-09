import "express-session";

declare module "express-session" {
  interface SessionData {
    oauthState?: string;
    user?: {
      id: string;
      username: string;
      avatar?: string;
    };
  }
}
