import { app } from "./app";
import { MAX_BODY_BYTES } from "./limits";

const port = Number(process.env.PORT ?? 4000);
app.listen({ port, hostname: "0.0.0.0", maxRequestBodySize: MAX_BODY_BYTES });
console.log(`PlayerPulse API on :${port} · docs at /api/docs`);
