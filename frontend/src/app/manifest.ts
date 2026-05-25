import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "UIWiz — AI UI Generator",
    short_name: "UIWiz",
    description:
      "Describe any UI in plain English and get production-ready Next.js + Tailwind code instantly.",
    start_url: "/",
    display: "standalone",
    background_color: "#080C14",
    theme_color: "#080C14",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
    categories: ["developer tools", "productivity", "utilities"],
  };
}
