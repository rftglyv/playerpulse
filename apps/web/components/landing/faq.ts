import { SITE, SITE_URL } from "@/lib/site";

/** Visible FAQ on the landing page; the same text feeds the FAQPage structured data. Numbers come from TESTING.md. */
export const FAQ: { q: string; a: string }[] = [
  {
    q: "What is PlayerPulse?",
    a: "PlayerPulse is an AI game QA tool. It reads player complaints from Steam reviews, Discord and in-game feedback, in Azerbaijani, Russian, English or a mix, checks each one against gameplay telemetry, and returns the real bugs ranked by players lost, with evidence and repro steps.",
  },
  {
    q: "How does it tell a real bug from a “too hard” complaint?",
    a: "A specific technical bug, such as a crash, falling through the floor, a lost save or overlapping text, is always reported; telemetry only sets its priority. A difficulty complaint is checked against that level: if deaths per player rose at least 1.4 times or completion fell by 5 points or more, it is a balance issue; otherwise it is dismissed with the numbers, for example Thorn Canyon at 85% → 84% completion.",
  },
  {
    q: "How accurate is it?",
    a: "On the team's synthetic test pack with planted issues, PlayerPulse found 5 of 5 issues with 0 false alarms and 100% message accuracy, against 59% for a keyword filter. On a held-out game it was never tuned on, it found 4 of 4 issues with 98% accuracy.",
  },
  {
    q: "What does a run cost?",
    a: "About $0.21 per 100 messages and around 30 seconds per run with Claude Sonnet 5.5 through OpenRouter. Claude Haiku 5.5 is about 15 times cheaper and still found all 5 test issues.",
  },
  {
    q: "What data do I need?",
    a: "A CSV of player messages (id, timestamp, channel, author, text) and a short game_info.json with your level names and patch notes. A per-level telemetry CSV is optional; without it PlayerPulse runs in community-only mode. Author handles are hashed before anything reaches the AI model.",
  },
];

export function jsonLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: SITE.name,
      url: SITE_URL,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web",
      description: SITE.description,
      image: `${SITE_URL}/og/og-home.png`,
      creator: { "@type": "Organization", name: "EnthuZone" },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
  ];
}
