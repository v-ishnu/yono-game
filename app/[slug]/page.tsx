import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AppCard from "../components/AppCard";
import Link from "next/link";
import type { Game } from "../types";

const SITE_URL = "https://allyonoogames.com";
const SITE_NAME = "All Yono Games";
const API = process.env.NEXT_PUBLIC_API_URL || "https://api.allyonoogames.com/api";

async function getGameBySlug(slug: string): Promise<Game | null> {
  try {
    const res = await fetch(`${API}/get-all-game`, { next: { revalidate: 60 } });
    const data = await res.json();
    const games: Game[] = (data.data || []).filter(Boolean);
    return games.find((g) => g.slug === slug) || null;
  } catch {
    return null;
  }
}

async function getAllGames(): Promise<Game[]> {
  try {
    const res = await fetch(`${API}/get-all-game`, { next: { revalidate: 60 } });
    const data = await res.json();
    return (data.data || []).filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Pre-renders all game slug pages at build time so Googlebot always finds
 * fully-rendered HTML. Falls back to on-demand ISR for any new games added
 * after the last build (Next.js default with `revalidate: 60`).
 */
export async function generateStaticParams() {
  const games = await getAllGames();

  return games.map((game) => ({
    slug: game.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  if (!game) return { title: "App Not Found" };

  const plainDescription = (game.longDescription || game.description || "")
    .replace(/<[^>]*>?/gm, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);

  const title = `${game.name} APK Download – ₹${game.signupBonus} Bonus | ${SITE_NAME}`;

  // Natural, unique description per game — avoids the mechanical template that
  // triggers Google's duplicate-content filter.
  const description = [
    `${game.name} is a ${game.category } app`,
    game.signupBonus ? `offering a ₹${game.signupBonus} signup bonus` : "",
    game.minWithdraw ? `with a minimum withdrawal of ₹${game.minWithdraw}` : "",
    `and a ${game.rating || "4"}/5 star rating.`,
    plainDescription ? plainDescription + "." : "",
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 160);

  const keywords = [
    game.name,
    `${game.name} APK`,
    `${game.name} download`,
    `${game.name} app`,
    ...(game.tags || []),
    "all yono games",
    "yono games",
    "allyonoogames.com",
  ].join(", ");

  return {
    title,
    description,
    keywords,
    alternates: { canonical: `${SITE_URL}/${game.slug}` },
    openGraph: {
      type: "website",
      url: `${SITE_URL}/${game.slug}`,
      siteName: SITE_NAME,
      title,
      description,
      images: game.logoUrl ? [{ url: game.logoUrl, width: 128, height: 128, alt: `${game.name} logo` }] : [],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: game.logoUrl ? [game.logoUrl] : [],
    },
  };
}

export default async function AppDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [game, allGames] = await Promise.all([getGameBySlug(slug), getAllGames()]);

  if (!game) notFound();

  // Related: same category, exclude current game, max 6
  const relatedApps = allGames
    .filter((g) => g._id !== game._id && g.category === game.category)
    .slice(0, 6);

  // If fewer than 3 related in same category, fill with other games
  const related =
    relatedApps.length >= 2
      ? relatedApps
      : allGames.filter((g) => g._id !== game._id).slice(0, 6);

  const rating = game.rating || 0;
  const stars = Array.from({ length: 5 }, (_, i) => ({
    filled: i < Math.floor(rating),
    half: !( i < Math.floor(rating)) && i < rating,
  }));

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-blue-600 font-medium">{game.name}</span>
        </nav>

        {/* JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: game.name,
              applicationCategory: "GameApplication",
              operatingSystem: "Android",
              offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: rating,
                ratingCount: Math.floor(rating * 1000),
                bestRating: 5,
                worstRating: 1,
              },
              description: (game.description || "").replace(/<[^>]*>?/gm, ''),
              url: `${SITE_URL}/${game.slug}`,
              image: game.logoUrl,
              author: { "@type": "Organization", name: SITE_NAME },
            }),
          }}
        />

        {/* App Detail Card */}
        <div className="bg-white rounded-2xl border border-blue-100 shadow-md p-4 sm:p-6 mb-6">
          <div className="flex items-start gap-5">
            {/* Logo */}
            <div className="shrink-0 w-24 h-24 rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center">
              {game.logoUrl ? (
                <Image
                  src={game.logoUrl}
                  alt={`${game.name} logo`}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                  priority
                  unoptimized
                />
              ) : (
                <span className="text-5xl">{game.icon || "🎮"}</span>
              )}
            </div>

            {/* Title + Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-extrabold text-slate-800">{game.name}</h1>
              <div className="text-blue-600 font-medium text-sm mt-0.5" dangerouslySetInnerHTML={{ __html: game.description || "" }} />
              {game.isNewGame && (
                <span className="inline-flex mt-2 items-center bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">
                  ✨ New App
                </span>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-blue-50">
            {/* Rating */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-0.5">
                {stars.map((star, i) => (
                  <svg key={i} className={`w-4 h-4 ${star.filled ? "text-yellow-400" : star.half ? "text-yellow-300" : "text-gray-300"}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-slate-600 font-semibold text-sm">{rating} Ratings</span>
            </div>

            {/* Size */}
            <div className="flex flex-col items-center gap-1">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="text-slate-600 font-semibold text-sm">{game.size || "N/A"}</span>
            </div>

            {/* Free/Paid */}
            <div className="flex flex-col items-center gap-1">
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-slate-600 font-semibold text-sm">{game.isFree ? "Free" : "Paid"}</span>
            </div>

            {/* Bonus */}
            <div className="flex flex-col items-center gap-1">
              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
              <span className="text-slate-600 font-semibold text-sm">₹{game.signupBonus} Bonus</span>
            </div>
          </div>

          {/* Download Buttons */}
          <div className="mt-6 flex flex-col gap-3">
            <a
              href={game.downloadUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex flex-wrap items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-sm sm:text-base py-3 sm:py-4 px-4 text-center rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 uppercase tracking-wide"
            >
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Download {game.name} APK</span>
            </a>
            <a
              href="https://t.me/+xiZV9WhjGl05OWU9"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex flex-wrap items-center justify-center gap-2 border-2 border-blue-500 text-blue-600 hover:bg-blue-50 font-semibold text-xs sm:text-sm py-2.5 px-4 text-center rounded-xl transition-all duration-200"
            >
              <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12.002 12.002 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              <span>Join Our Telegram Channel</span>
            </a>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-3 sm:p-6 mb-6">
          <div className="text-slate-600 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: game.longDescription || "" }} />

          {/* Key details */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-xl p-3">
              <span className="text-xs text-blue-500 font-medium">Category</span>
              <p className="text-slate-700 font-semibold text-sm mt-0.5">{game.category}</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3">
              <span className="text-xs text-emerald-600 font-medium">Signup Bonus</span>
              <p className="text-slate-700 font-semibold text-sm mt-0.5">₹{game.signupBonus}</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-3">
              <span className="text-xs text-orange-500 font-medium">Min Withdraw</span>
              <p className="text-slate-700 font-semibold text-sm mt-0.5">₹{game.minWithdraw}</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-3">
              <span className="text-xs text-purple-500 font-medium">App Size</span>
              <p className="text-slate-700 font-semibold text-sm mt-0.5">{game.size}</p>
            </div>
          </div>

          {/* Tags */}
          {(game.tags || []).length > 0 && (
            <div className="mt-5">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {(game.tags || []).map((tag) => (
                  <span key={tag} className="bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1 rounded-full hover:bg-blue-200 transition-colors cursor-default">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* FAQs */}
        {(game.faqs || []).length > 0 && (
          <div className="mt-2 mb-6 flex flex-col gap-4">
            {game.faqs!.map((faq, idx) => (
              <details key={idx} className="bg-[#ccff80] rounded-xl border border-[#b2e666] text-black shadow-sm group overflow-hidden">
                <summary className="font-bold text-[15px] p-4 sm:p-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden flex justify-between items-center bg-[#c5f57a] hover:bg-[#bdf071] transition-colors">
                  <span>Q.{idx + 1} &nbsp; {faq.question}</span>
                  <span className="transition-transform duration-200 group-open:rotate-180 shrink-0 ml-4">
                    <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <div className="text-[14px] whitespace-pre-line leading-relaxed px-4 sm:px-5 pb-5 pt-4 border-t border-[#aee05f]">
                  <span className="font-bold">Answer: </span>
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        )}

        {/* Related Apps */}
        {related.length > 0 && (
          <div>
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center font-bold py-3 rounded-t-xl flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              Other Related Apps
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
