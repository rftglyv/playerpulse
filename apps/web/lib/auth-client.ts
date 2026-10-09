import { createAuthClient } from "better-auth/react";

// Same-origin: Next proxies /api/* to the API, which mounts Better Auth at /api/auth/*.
export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3010"),
  basePath: "/api/auth",
});

export const { signIn, signUp, signOut, useSession } = authClient;

const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "That email and password don't match an account.",
  USER_ALREADY_EXISTS: "An account with this email already exists. Try signing in.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "An account with this email already exists. Try signing in.",
  PASSWORD_TOO_SHORT: "Password must be at least 8 characters.",
  PASSWORD_TOO_LONG: "Password is too long.",
  INVALID_EMAIL: "Enter a valid email address.",
  EMAIL_NOT_VERIFIED: "Verify your email before signing in.",
};

/** Map a Better Auth client error into a sentence a person can act on. */
export function authErrorMessage(err: { code?: string; message?: string; status?: number } | null | undefined): string {
  if (!err) return "Something went wrong. Try again.";
  if (err.code && MESSAGES[err.code]) return MESSAGES[err.code];
  if (err.status === 429) return "Too many attempts. Wait a minute and try again.";
  if (!err.status || err.status >= 500) return "Can't reach the sign-in service right now. Try again in a moment.";
  return err.message || "Something went wrong. Try again.";
}

/** Only allow same-origin relative redirects. */
export function safeNext(next: string | null | undefined, fallback = "/dashboard/overview"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}
