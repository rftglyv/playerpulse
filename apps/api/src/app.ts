import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";
import { BodyTooLarge, MAX_BODY_BYTES, readCapped } from "./limits";
import { authPlugin } from "./auth";
import { runRoutes } from "./routes/runs";
import { systemRoutes } from "./routes/system";
import { taskRoutes } from "./routes/tasks";

export const app = new Elysia({ prefix: "/api" })
  .use(openapi({ path: "/docs", documentation: { info: { title: "PlayerPulse API", version: "1.0.0" } } }))
  // Reject oversized bodies before parsing (Bun's maxRequestBodySize in index.ts is the backstop for chunked uploads).
  .onRequest(({ request, set }) => {
    const len = Number(request.headers.get("content-length") ?? 0);
    if (len > MAX_BODY_BYTES) {
      set.status = 413;
      return { error: `request body too large (max ${MAX_BODY_BYTES / 1024 / 1024} MB)` };
    }
  })
  .onParse(async ({ request, contentType }) => {
    // Better Auth reads the raw body itself: hand Elysia a placeholder so the stream stays unread.
    if (new URL(request.url).pathname.startsWith("/api/auth/")) return {};
    // Chunked JSON bodies carry no content-length: stream them with a cap instead of trusting the header.
    if (request.headers.has("content-length") || !contentType?.startsWith("application/json")) return;
    const text = await readCapped(request);
    return text ? JSON.parse(text) : undefined;
  })
  .onError(({ code, error, set }) => {
    // Elysia wraps parser throws in ParseError, so look through `cause` too.
    if (error instanceof BodyTooLarge || (error as { cause?: unknown }).cause instanceof BodyTooLarge) {
      set.status = 413;
      return { error: `request body too large (max ${MAX_BODY_BYTES / 1024 / 1024} MB)` };
    }
    if (code === "VALIDATION") {
      set.status = 422;
      return { error: "invalid request", detail: error.message };
    }
    if (code === "PARSE") {
      set.status = 400;
      return { error: "malformed request body" };
    }
    if (code === "NOT_FOUND") {
      set.status = 404;
      return { error: "not found" };
    }
    console.error(error);
    set.status = 500;
    return { error: "internal error" };
  })
  .use(authPlugin)
  .use(systemRoutes)
  .use(runRoutes)
  .use(taskRoutes);

export type App = typeof app;
