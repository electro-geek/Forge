import type { Metadata } from "next";
import LandingClient from "./_components/LandingClient";

export const metadata: Metadata = {
  title: "UIWiz — Build stunning UI with one prompt",
  description:
    "Describe any UI in plain English and get production-ready Next.js + Tailwind code instantly. Powered by Gemini — bring your own API key, no subscriptions, no limits.",
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  return <LandingClient />;
}
