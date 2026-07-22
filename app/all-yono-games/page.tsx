import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AppCard from "../components/AppCard";
import type { Game } from "../types";

const SITE_URL = "https://allyonoogames.com";
const SITE_NAME = "All Yono Games";
const API = process.env.NEXT_PUBLIC_API_URL || "https://api.allyonoogames.com/api";

export const metadata: Metadata = {
  title: `All Yono Games List 2026  | ${SITE_NAME}`,
  description:
    "Browse the complete list of All Yono Games — Yono , Yono 777, Jaiho Games, Slots & more. Compare bonuses, ratings. Updated daily.",
  keywords: [
    "all yono games list", "yono games 2026", "yono app list",
    "yono rummy list", "yono slots list", "jaiho games list",
    "all yono apps download", "best yono earning apps",
  ].join(", "),
  alternates: { canonical: `${SITE_URL}/all-yono-games` },
  openGraph: {
    title: `All Yono Games List 2026 | ${SITE_NAME}`,
    description:
      "Browse the complete list of All Yono Games — Yono , Yono 777, Jaiho Games, Slots & more. Compare bonuses, ratings. Updated daily.",
    url: `${SITE_URL}/all-yono-games`,
    siteName: SITE_NAME,
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: SITE_NAME }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `All Yono Games List 2026 | ${SITE_NAME}`,
    description: "Browse every Yono  app — compare bonuses, ratings.",
    images: [`${SITE_URL}/og-image.png`],
  },
};

async function getAllGames(): Promise<Game[]> {
  try {
    const res = await fetch(`${API}/get-all-game`, { next: { revalidate: 60 } });
    const data = await res.json();
    return (data.data || []).filter(Boolean);
  } catch {
    return [];
  }
}

export default async function YonoGamesPage() {
  const allGames = await getAllGames();
  
  const related = allGames.filter((g) => {
    const lowerTag = "yono";
    return g.name.toLowerCase().includes(lowerTag) || (g.tags || []).some((t) => t.toLowerCase() === lowerTag);
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-blue-600 font-medium">All Yono Games</span>
        </nav>

        {/* App Detail Card for All Yono Games */}
        <div className="bg-white rounded-2xl border border-blue-100 shadow-md p-4 mb-4">
          <div className="flex items-start gap-4">
            {/* Logo */}
            <div className="shrink-0 w-16 h-16 rounded-xl overflow-hidden shadow flex items-center justify-center bg-white border border-slate-100">
              <Image
                src="/logo.jpeg"
                alt="All Yono Games logo"
                width={64}
                height={64}
                className="w-full h-full object-cover"
                priority
                unoptimized
              />
            </div>

            {/* Title + Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-slate-800">All Yono Games</h1>
              <p className="text-blue-600 font-medium text-xs mt-0.5">Your hub for the best Yono slots, rummy, and earning apps.</p>
            </div>
          </div>



          <div className="mt-4 flex flex-col gap-3">
            <a
              href="https://t.me/+xiZV9WhjGl05OWU9"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 border-2 border-blue-500 text-blue-600 hover:bg-blue-50 font-semibold text-sm py-2.5 rounded-xl transition-all duration-200"
            >
              <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12.002 12.002 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              Join Our Telegram Channel
            </a>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-4 mb-5">
          <h2 className="text-slate-800 font-bold text-base mb-2 border-b border-blue-50 pb-2">
            All Yono Games Collection
          </h2>
          <p className="text-slate-600 text-xs leading-relaxed">
            Welcome to the ultimate hub for All Yono Games! Browse our curated selection below to discover new apps with the biggest signup bonuses and the lowest withdrawal limits. We regularly update this collection, so check back often or join our Telegram channel for the fastest updates!
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="bg-emerald-50 rounded-lg p-2">
              <span className="text-[10px] text-emerald-600 font-medium">Max Signup Bonus</span>
              <p className="text-slate-700 font-semibold text-xs mt-0.5">Up to ₹1000</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-2">
              <span className="text-[10px] text-orange-500 font-medium">Min Withdraw</span>
              <p className="text-slate-700 font-semibold text-xs mt-0.5">₹100</p>
            </div>
          </div>
        </div>

        {/* Related Apps */}
        {related.length > 0 && (
          <div>
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center font-bold py-3 rounded-t-xl flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              All Yono Games List
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <div className="flex flex-col gap-3 bg-white border border-blue-100 border-t-0 rounded-b-xl p-4 shadow-sm">
              {related.map((relGame, idx) => (
                <AppCard key={relGame._id} game={relGame} index={idx + 1} />
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
