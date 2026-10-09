import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Search and AI crawlers may read the public landing page; the app and API are private.
const AI_BOTS = ["GPTBot", "ChatGPT-User", "OAI-SearchBot", "ClaudeBot", "Claude-Web", "anthropic-ai", "PerplexityBot", "Google-Extended", "Bingbot", "Applebot"];

export default function robots(): MetadataRoute.Robots {
  const disallow = ["/dashboard", "/api", "/login", "/signup"];
  return {
    rules: [{ userAgent: "*", allow: "/", disallow }, ...AI_BOTS.map((userAgent) => ({ userAgent, allow: "/", disallow }))],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
