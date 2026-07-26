import { google } from "googleapis";

/**
 * Publishes a game URL update to the Google Indexing API.
 * Requires GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY set in environment variables.
 *
 * @param {string} gameSlug - The unique slug of the game to index.
 * @returns {Promise<{ url: string, response: object }>}
 */
export const publishGoogleIndexing = async (gameSlug) => {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    throw new Error("Google Indexing API credentials not configured in backend environment (.env). Please set GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY.");
  }

  // Handle escaped newlines in env private key string
  if (typeof privateKey === "string" && privateKey.includes("\\n")) {
    privateKey = privateKey.replace(/\\n/g, "\n");
  }

  const publicSiteUrl = process.env.PUBLIC_SITE_URL || process.env.INDEXING_SITE_URL || "https://allyonoogames.com";
  const cleanBase = publicSiteUrl.replace(/\/$/, "");
  const gameUrl = `${cleanBase}/${gameSlug}`;

  const jwtClient = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/indexing"],
  });

  await jwtClient.authorize();

  const indexing = google.indexing({ version: "v3", auth: jwtClient });
  const response = await indexing.urlNotifications.publish({
    requestBody: {
      url: gameUrl,
      type: "URL_UPDATED",
    },
  });

  console.log(`🚀 Successfully submitted URL for Google Instant Indexing: ${gameUrl}`);
  return {
    url: gameUrl,
    response: response.data,
  };
};
