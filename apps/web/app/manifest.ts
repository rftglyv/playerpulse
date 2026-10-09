import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PlayerPulse",
    short_name: "PlayerPulse",
    description: "Player complaints in. Real bugs out.",
    start_url: "/dashboard/overview",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2563eb",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/brand/mark.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
