import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to UIWiz with Google to start generating production-ready Next.js UI components from natural language descriptions.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/login" },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
