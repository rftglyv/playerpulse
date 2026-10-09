/** Public site URL, used for canonical links, Open Graph and the sitemap. Set NEXT_PUBLIC_SITE_URL at build time. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const SITE = {
  name: "PlayerPulse",
  title: "PlayerPulse: AI game QA that turns player complaints into verified bugs",
  description:
    "PlayerPulse reads Steam, Discord and in-game feedback in any language, checks it against gameplay telemetry, and ranks the real bugs by players lost.",
  tagline: "Player complaints in. Real bugs out.",
};
