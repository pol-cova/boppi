import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Boppi — little moments, one tiny song",
    short_name: "Boppi",
    description: "Turn one little thing from today into a tiny song with your people.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f3ed",
    theme_color: "#d8ff77",
  };
}
