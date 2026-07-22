import type { Game } from "./types";

const SITE_URL = "https://www.yonoworld.xyz";


// ✅ force static generation
export const dynamic = "force-static";

export default async function sitemap() {
 

  const staticPages = [
    {
      url: SITE_URL,
      lastModified: new Date(),
    },
    {
      url: `${SITE_URL}/all-yono-games`,
      lastModified: new Date(),
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: new Date(),
    },
    {
      url: `${SITE_URL}/privacy-policy`,
      lastModified: new Date(),
    },
  ];

 


  return [...staticPages];
}