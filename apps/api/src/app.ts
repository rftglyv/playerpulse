import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";
import { runRoutes } from "./routes/runs";
import { systemRoutes } from "./routes/system";
import { taskRoutes } from "./routes/tasks";

export const app = new Elysia({ prefix: "/api" })
  .use(openapi({ path: "/docs", documentation: { info: { title: "PlayerPulse API", version: "1.0.0" } } }))
  .onError(({ code, error, set }) => {
    if (code === "VALIDATION") {
      set.status = 422;
      return { error: "invalid request", detail: error.message };
    }
    if (code === "NOT_FOUND") {
      set.status = 404;
      return { error: "not found" };
    }
    console.error(error);
    set.status = 500;
    return { error: "internal error" };
  })
  .use(systemRoutes)
  .use(runRoutes)
  .use(taskRoutes);

export type App = typeof app;
