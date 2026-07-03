import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GigOn — find gigs nearby",
    short_name: "GigOn",
    description:
      "Short, local gigs matched with trusted people nearby. Free during the pilot.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { src: "/icon-512.png", type: "image/png", sizes: "512x512" },
      {
        src: "/icon-maskable-512.png",
        type: "image/png",
        sizes: "512x512",
        purpose: "maskable",
      },
    ],
  };
}
