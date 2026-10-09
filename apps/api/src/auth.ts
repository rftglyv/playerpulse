import { db, schema } from "@playerpulse/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { Elysia } from "elysia";

const trustedOrigins = (process.env.TRUSTED_ORIGINS || "http://localhost:3000,http://localhost:3010,http://localhost:3100")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  basePath: "/api/auth",
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins,
  advanced: {
    cookiePrefix: "playerpulse",
    useSecureCookies: process.env.BETTER_AUTH_URL?.startsWith("https://") ?? false,
    defaultCookieAttributes: { httpOnly: true, sameSite: "lax", path: "/" },
  },
});

export type AuthUser = typeof auth.$Infer.Session.user;

/** Mounts /api/auth/* and adds the `auth: true` route option (401 when there is no session). */
export const authPlugin = new Elysia({ name: "auth" })
  .all("/auth/*", ({ request }) => auth.handler(request), { detail: { hide: true } })
  .macro({
    auth: {
      async resolve({ status, request: { headers } }) {
        const session = await auth.api.getSession({ headers });
        if (!session) return status(401, { error: "sign in required" });
        return { user: session.user, session: session.session };
      },
    },
  });
