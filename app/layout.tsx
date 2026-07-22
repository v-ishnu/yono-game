import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const SITE_NAME = "Yono World";
const SITE_URL = "https://yonoworld.xyz";
const SITE_DESCRIPTION =
  "Discover and download 50+ top Yono earning apps — Yono Rummy, Yono 777, Jaiho Games, Slots & more. Compare signup bonuses, withdrawal limits, and ratings on Yono World.";

const ALL_KEYWORDS = [
  "all yono games", "yono games", "yonoworld.xyz",
  "yono rummy", "yono 777", "jaiho games", "yono slots",
  "earning apps india", "real money games india",
  "yono games list 2026", "yono app download",
  "best yono apps", "top earning apps india",
  "download yono apk", "yono games apk free",
].join(", ");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} – Download All Yono Rummy, Slots & Earning Apps`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: ALL_KEYWORDS,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
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
    locale: "en_IN",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} – Download All Yono Games`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} – All Yono Games Download`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} – Download All Yono Games`,
    description: SITE_DESCRIPTION,
    images: [`${SITE_URL}/og-image.png`],
  },
  alternates: {
    canonical: SITE_URL,
  },
};

// Organisation JSON-LD schema
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/logo.jpeg`,
  sameAs: ["https://t.me/+xiZV9WhjGl05OWU9"],
  contactPoint: {
    "@type": "ContactPoint",
    email: "support@AllYonoGames.com",
    contactType: "customer support",
  },
};

// Website JSON-LD with sitelinks searchbox
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        {/* Do NOT place a hardcoded canonical here — Next.js injects per-page
            canonical from each page's `alternates.canonical` metadata export.
            A hardcoded canonical here would override every game page to point
            to the homepage, causing GSC "Alternate page with proper canonical"
            errors across the entire site. */}
        <meta name="geo.region" content="IN" />
        <meta name="geo.placename" content="India" />
        <meta name="language" content="English" />
        <Script
          id="org-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <Script
          id="website-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50"><Providers>{children}</Providers></body>
    </html>
  );
}
