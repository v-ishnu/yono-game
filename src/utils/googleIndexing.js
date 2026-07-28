import { google } from "googleapis";

// Error codes for structured error responses
const ERROR_CODES = {
  MISSING_CLIENT_EMAIL: "MISSING_CLIENT_EMAIL",
  MISSING_PRIVATE_KEY: "MISSING_PRIVATE_KEY",
  INVALID_PEM_FORMAT: "INVALID_PEM_FORMAT",
  INVALID_URL: "INVALID_URL",
  AUTH_FAILED: "AUTH_FAILED",
  INDEXING_API_ERROR: "INDEXING_API_ERROR",
};

// Domains/IPs that must never be submitted to Google Indexing
const BLOCKED_HOSTS = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "10.",
  "172.16.",
  "172.17.",
  "172.18.",
  "172.19.",
  "172.20.",
  "172.21.",
  "172.22.",
  "172.23.",
  "172.24.",
  "172.25.",
  "172.26.",
  "172.27.",
  "172.28.",
  "172.29.",
  "172.30.",
  "172.31.",
  "192.168.",
];

/**
 * Normalizes a PEM private key from various environment variable formats.
 * Handles: escaped \n, literal newlines, wrapping quotes, base64-only bodies,
 * and extra whitespace. Returns a properly formatted PEM string.
 */
function normalizePrivateKey(raw) {
  if (!raw || typeof raw !== "string") return null;

  let key = raw.trim();

  // Remove wrapping single or double quotes
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1).trim();
  }

  // Replace escaped newlines (\\n literal two-char sequences) with real newlines
  key = key.replace(/\\n/g, "\n");

  // If the key already has proper PEM structure, clean it up and return
  if (key.includes("-----BEGIN") && key.includes("-----END")) {
    // Ensure proper line breaks around headers/footers
    key = key
      .replace(/-----BEGIN ([A-Z ]+)-----\s*/g, "-----BEGIN $1-----\n")
      .replace(/\s*-----END ([A-Z ]+)-----/g, "\n-----END $1-----");

    // Re-wrap the base64 body to 64-char lines (PEM standard)
    const lines = key.split("\n").map((l) => l.trim()).filter(Boolean);
    const header = lines[0];
    const footer = lines[lines.length - 1];
    const body = lines.slice(1, -1).join("");

    // Rewrap body to 64-char lines
    const wrapped = body.match(/.{1,64}/g) || [];
    return [header, ...wrapped, footer].join("\n");
  }

  // Key is raw base64 body only — wrap it in PEM headers
  // Strip any whitespace/newlines from the base64 content
  const base64Body = key.replace(/\s+/g, "");

  // Validate that it looks like base64
  if (!/^[A-Za-z0-9+/=]+$/.test(base64Body)) {
    return null;
  }

  // Wrap to 64-char lines per PEM spec
  const wrapped = base64Body.match(/.{1,64}/g) || [];
  return ["-----BEGIN PRIVATE KEY-----", ...wrapped, "-----END PRIVATE KEY-----"].join("\n");
}

/**
 * Validates the normalized private key has correct PEM structure.
 */
function validatePemKey(key) {
  if (!key) return { valid: false, reason: "Private key is empty or could not be parsed" };

  if (!key.startsWith("-----BEGIN PRIVATE KEY-----") && !key.startsWith("-----BEGIN RSA PRIVATE KEY-----")) {
    return { valid: false, reason: "Key does not start with a valid PEM header" };
  }

  if (!key.endsWith("-----END PRIVATE KEY-----") && !key.endsWith("-----END RSA PRIVATE KEY-----")) {
    return { valid: false, reason: "Key does not end with a valid PEM footer" };
  }

  const lines = key.split("\n");
  if (lines.length < 3) {
    return { valid: false, reason: "PEM key body is too short — likely truncated or empty" };
  }

  return { valid: true };
}

/**
 * Validates that a URL is suitable for Google Indexing API submission.
 * Must be an absolute HTTPS URL on a public, non-development domain.
 */
function validateIndexingUrl(url) {
  if (!url || typeof url !== "string") {
    return { valid: false, reason: "URL is empty or not a string" };
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return { valid: false, reason: `URL is not valid: ${url}` };
  }

  if (parsed.protocol !== "https:") {
    return { valid: false, reason: `URL must use HTTPS. Got: ${parsed.protocol}` };
  }

  const hostname = parsed.hostname;
  for (const blocked of BLOCKED_HOSTS) {
    if (hostname === blocked || hostname.startsWith(blocked)) {
      return { valid: false, reason: `URL points to a local/private address: ${hostname}` };
    }
  }

  // Block common development domains
  if (hostname.endsWith(".local") || hostname.endsWith(".test") || hostname.endsWith(".example")) {
    return { valid: false, reason: `URL uses a development domain: ${hostname}` };
  }

  return { valid: true };
}

/**
 * Creates a structured error with an error code for API responses.
 * Sensitive details are logged server-side only.
 * Optionally attaches googleError for pass-through from Google API.
 */
function createIndexingError(message, errorCode, internalDetail, googleError) {
  if (internalDetail) {
    console.error(`🔐 [GoogleIndexing] ${errorCode}: ${internalDetail}`);
  }
  const err = new Error(message);
  err.errorCode = errorCode;
  if (googleError) {
    err.googleError = googleError;
  }
  return err;
}

/**
 * Extracts a structured error object from a Google API error response.
 * The googleapis library wraps HTTP errors in a GaxiosError with response data.
 */
function extractGoogleApiError(apiErr) {
  const googleError = {};
  const responseData = apiErr.response?.data;
  const errorDetail = responseData?.error;

  // Google's error envelope: { error: { code, message, status, details } }
  if (errorDetail) {
    googleError.code = errorDetail.code;
    googleError.message = errorDetail.message;
    googleError.status = errorDetail.status;
    if (errorDetail.details?.length) {
      googleError.details = errorDetail.details;
    }
  } else {
    // Fallback to top-level fields
    googleError.code = apiErr.code || apiErr.status || apiErr.response?.status;
    googleError.message = apiErr.message;
  }

  // Log the full error server-side for diagnostics
  console.error("🔍 [GoogleIndexing] Full Google API error:", JSON.stringify({
    status: apiErr.response?.status,
    statusText: apiErr.response?.statusText,
    errorCode: errorDetail?.code,
    errorMessage: errorDetail?.message,
    errorStatus: errorDetail?.status,
    errorDetails: errorDetail?.details,
  }, null, 2));

  return googleError;
}

/**
 * Publishes a game URL update to the Google Indexing API.
 * Validates credentials, normalizes the private key, validates the URL,
 * and surfaces the exact Google API error on failure.
 *
 * IMPORTANT: The Google Indexing API officially supports only pages with
 * JobPosting or BroadcastEvent structured data. Other page types may be
 * rejected by Google. This function logs a warning but still attempts
 * submission, as Google may index the URL regardless.
 *
 * @param {string} gameSlug - The unique slug of the game to index.
 * @returns {Promise<{ url: string, response: object, warning?: string }>}
 */
export const publishGoogleIndexing = async (gameSlug) => {
  // 1. Validate client email
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  if (!clientEmail) {
    throw createIndexingError(
      "Google authentication failed. Service account email is not configured.",
      ERROR_CODES.MISSING_CLIENT_EMAIL,
      "Neither GOOGLE_CLIENT_EMAIL nor GOOGLE_SERVICE_ACCOUNT_EMAIL is set in environment."
    );
  }

  // 2. Validate and normalize private key
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!rawKey) {
    throw createIndexingError(
      "Google authentication failed. Private key is not configured.",
      ERROR_CODES.MISSING_PRIVATE_KEY,
      "GOOGLE_PRIVATE_KEY is not set in environment."
    );
  }

  const privateKey = normalizePrivateKey(rawKey);
  const validation = validatePemKey(privateKey);
  if (!validation.valid) {
    throw createIndexingError(
      "Google authentication failed. Private key has an invalid format.",
      ERROR_CODES.INVALID_PEM_FORMAT,
      `PEM validation failed: ${validation.reason}. Key length: ${rawKey.length} chars. ` +
        `Has BEGIN header: ${rawKey.includes("BEGIN")}. Has escaped newlines: ${rawKey.includes("\\n")}.`
    );
  }

  // 3. Build and validate game URL
  const publicSiteUrl = process.env.PUBLIC_SITE_URL || process.env.INDEXING_SITE_URL || "https://allyonogamesstore.com";
  const cleanBase = publicSiteUrl.replace(/\/$/, "");
  const gameUrl = `${cleanBase}/${gameSlug}`;

  console.log(`📎 [GoogleIndexing] Submitting URL: ${gameUrl}`);

  const urlValidation = validateIndexingUrl(gameUrl);
  if (!urlValidation.valid) {
    throw createIndexingError(
      `Invalid URL for Google Indexing: ${urlValidation.reason}`,
      ERROR_CODES.INVALID_URL,
      `URL validation failed for "${gameUrl}": ${urlValidation.reason}`
    );
  }

  // 4. Warn about Indexing API page type limitations
  // Google Indexing API officially supports JobPosting and BroadcastEvent only.
  // Game pages may not have this structured data, so Google could reject them.
  const eligibilityWarning =
    "The Google Indexing API officially supports only pages with JobPosting or BroadcastEvent " +
    "structured data. Game pages may not be eligible. If Google rejects this request with " +
    "FAILED_PRECONDITION or 403, verify that the URL's domain is added as a property in " +
    "Google Search Console and that the service account email has Owner permissions on that property.";

  console.warn(`⚠️ [GoogleIndexing] ${eligibilityWarning}`);

  // 5. Authenticate with Google using JWT
  const jwtClient = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/indexing"],
  });

  try {
    await jwtClient.authorize();
    console.log("✅ [GoogleIndexing] JWT authorization successful.");
  } catch (authErr) {
    throw createIndexingError(
      "Google authentication failed. Could not authorize with the provided service account credentials.",
      ERROR_CODES.AUTH_FAILED,
      `JWT authorize() threw: ${authErr.message}`
    );
  }

  // 6. Call the Google Indexing API
  try {
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
      warning: eligibilityWarning,
    };
  } catch (apiErr) {
    const googleError = extractGoogleApiError(apiErr);

    // Build a user-facing message from Google's actual error
    let userMessage = googleError.message || apiErr.message || "Google Indexing API request failed.";

    // Add Search Console guidance for common errors
    if (googleError.status === "PERMISSION_DENIED" || googleError.code === 403) {
      userMessage += " Ensure the service account email is added as an Owner in Google Search Console for this property.";
    } else if (googleError.status === "FAILED_PRECONDITION" || googleError.code === 400) {
      userMessage +=
        " This may mean the URL's domain is not verified in Google Search Console, " +
        "or the page does not contain supported structured data (JobPosting / BroadcastEvent).";
    }

    throw createIndexingError(
      userMessage,
      ERROR_CODES.INDEXING_API_ERROR,
      `API call threw: ${apiErr.message}. Status: ${apiErr.code || apiErr.status || "unknown"}.`,
      googleError
    );
  }
};
