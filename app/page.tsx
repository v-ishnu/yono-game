// Server component — exports SEO metadata and renders client component
import type { Metadata } from "next";
import HomeClient from "./_home_client";

const SITE_URL = "https://yonoworld.xyz";
const SITE_NAME = "Yono World";

const allKeywords = [
  "all yono games", "yono games", "yonoworld.xyz",
  "yono rummy", "yono 777", "jaiho games", "yono slots",
  "earning apps india", "real money games india",
  "yono games list 2026", "yono app download",
  "best yono apps", "top earning apps india",
  "download yono",
].join(", ");

export const metadata: Metadata = {
  title: `${SITE_NAME} – Download Yono`,
  description:
    "Discover 50+ Yono apps — compare signup bonuses, min withdrawal limits & user ratings. Find the best Yono , Slots & casino apps, updated daily.",
  keywords: allKeywords,
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} – Yono Games`,
    description:
      "Browse 50+ Yono apps with bonuses, ratings  — updated daily on Yono World.",
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} – Best Yono Apps 2026`,
    description: "Compare & download the top Yono, Slots & casino apps with the highest signup bonuses.",
    images: [`${SITE_URL}/og-image.png`],
  },
};

export default function HomePage() {
  return <HomeClient showFixedCard={true} />;
}
