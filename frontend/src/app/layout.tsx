import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import Script from "next/script";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://uiwiz.live";

export const viewport: Viewport = {
  themeColor: "#080C14",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "UIWiz — AI UI Generator",
    template: "%s | UIWiz",
  },
  description:
    "Describe any UI in plain English and get production-ready Next.js + Tailwind code instantly. Powered by Gemini — bring your own API key, no subscriptions.",
  keywords: [
    "AI UI generator",
    "Next.js code generator",
    "Tailwind CSS generator",
    "Gemini AI",
    "UI builder",
    "React component generator",
    "no-code UI",
    "AI frontend builder",
  ],
  authors: [{ name: "UIWiz" }],
  creator: "UIWiz",
  publisher: "UIWiz",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "UIWiz",
    title: "UIWiz — Build stunning UI with one prompt",
    description:
      "Describe any UI in plain English and get production-ready Next.js + Tailwind code instantly. Bring your own Gemini API key — no subscriptions.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "UIWiz — AI UI Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "UIWiz — Build stunning UI with one prompt",
    description:
      "Describe any UI in plain English and get production-ready Next.js + Tailwind code instantly.",
    images: ["/opengraph-image"],
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
  },
  manifest: "/manifest.json",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "UIWiz",
  applicationCategory: "DeveloperApplication",
  description:
    "AI-powered UI generator that creates production-ready Next.js + Tailwind code from natural language descriptions.",
  url: siteUrl,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
  },
  operatingSystem: "Web",
  creator: { "@type": "Organization", name: "UIWiz" },
  featureList: [
    "Natural language to Next.js code",
    "Live Sandpack preview",
    "Version history",
    "Bring-your-own Gemini API key",
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap"
          rel="stylesheet"
        />
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body style={{ backgroundColor: "#080C14", color: "#E8ECF4" }}>
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#141828",
              border: "1px solid #232A42",
              color: "#E8ECF4",
            },
          }}
        />
      </body>
    </html>
  );
}
