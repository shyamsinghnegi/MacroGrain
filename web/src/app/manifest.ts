import type { MetadataRoute } from "next"

// Makes the app installable as a real PWA (Chrome's "Install app" /
// "Add to Home Screen") with a proper name, icon, and theme color instead
// of Chrome falling back to a generic shortcut using just the page title.
// Uses next/manifest's file convention - Next.js serves this at
// /manifest.webmanifest automatically, no separate public/manifest.json needed.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Macrograin",
    short_name: "Macrograin",
    description: "Macro and calorie tracker",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    icons: [
      {
        src: "/api/icon?size=192",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/api/icon?size=512",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/api/icon?size=512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
