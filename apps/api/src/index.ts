import { app } from "./app";
import { seedDemo } from "./service";

const port = Number(process.env.PORT ?? 4000);
const seeded = await seedDemo().catch((err) => {
  console.error("demo seed failed:", err);
  return 0;
});
app.listen({ port, hostname: "0.0.0.0" });
console.log(`PlayerPulse API on :${port}${seeded ? ` (seeded ${seeded} demo runs)` : ""} · docs at /api/docs`);
