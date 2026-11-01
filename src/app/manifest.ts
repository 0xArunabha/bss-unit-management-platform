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
    background_color: "#f8f9f6",
    theme_color: "#e66543",
    icons: [
      { src: "/images/app-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/images/app-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
