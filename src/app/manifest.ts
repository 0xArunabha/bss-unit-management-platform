import type { MetadataRoute } from "next";
import { identity } from "@/lib/identity";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: identity.fullName,
    short_name: identity.name,
    description: identity.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f5f3ea",
    theme_color: "#bf5029",
    icons: [
      {
        src: "/images/app-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/images/app-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/images/app-icon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
