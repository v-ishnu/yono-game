import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import slugify from "slugify";
import Media from "../model/media.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getMimeType = (ext) => {
  const mimes = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".bmp": "image/bmp",
    ".tiff": "image/tiff",
    ".ico": "image/x-icon",
  };
  return mimes[ext] || "application/octet-stream";
};

/**
 * Creates or retrieves a Media document in MongoDB for an uploaded file.
 * Prevents duplicate records by checking both full URL and filename.
 */
export const createOrGetMediaRecord = async ({
  filename,
  relativeUrl,
  req,
  fileBuffer,
  mimetype,
  alt = "",
  title = "",
}) => {
  const baseUrl = process.env.BACKEND_URL || (req ? `${req.protocol}://${req.get("host")}` : "");
  const url = relativeUrl.startsWith("http") ? relativeUrl : `${baseUrl}${relativeUrl}`;
  const size = fileBuffer ? fileBuffer.length : (req?.file?.size || 0);
  const ext = path.extname(filename).toLowerCase();
  const mimeType = mimetype || req?.file?.mimetype || getMimeType(ext);

  // Extract alt and title from options or req.body (checking logoAlt / logoTitle as fallbacks)
  const finalAlt = alt || req?.body?.alt || req?.body?.logoAlt || "";
  const finalTitle = title || req?.body?.title || req?.body?.logoTitle || "";

  // Check if Media record already exists by url OR filename to prevent duplicate entries
  let media = await Media.findOne({ $or: [{ url }, { filename }] });
  if (!media) {
    media = await Media.create({
      url,
      filename,
      alt: finalAlt,
      title: finalTitle,
      size,
      mimeType,
    });
    console.log(`🖼️ Created Media record for: ${filename}`);
  }
  return media;
};

export const saveToFrontendUploads = async (fileBuffer, originalName, req, options = {}) => {
  const ext = path.extname(originalName).toLowerCase();
  const allowedExtensions = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".bmp", ".tiff", ".ico"];

  if (!ext || !allowedExtensions.includes(ext)) {
    throw new Error("Only image files are allowed!");
  }

  // 1. Sanitize the filename to prevent path traversal and shell execution issues
  const baseName = path.basename(originalName, path.extname(originalName));
  const sanitizedBase = baseName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const cleanFilename = `${sanitizedBase}${ext}`;

  // Path to backend public upload directory (relative to this file's location)
  const uploadPath = path.resolve(__dirname, "..", "..", "public", "upload");

  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  // 2. Prevent overwriting existing files by appending a sequential number suffix
  let filename = cleanFilename;
  let filePath = path.join(uploadPath, filename);
  let fileCount = 1;

  while (fs.existsSync(filePath)) {
    filename = `${sanitizedBase}_${fileCount}${ext}`;
    filePath = path.join(uploadPath, filename);
    fileCount++;
  }

  await fs.promises.writeFile(filePath, fileBuffer);

  const relativeUrl = `/upload/${filename}`;

  // Save/ensure Media database record for every uploaded image
  try {
    await createOrGetMediaRecord({
      filename,
      relativeUrl,
      req,
      fileBuffer,
      mimetype: req?.file?.mimetype || options.mimetype,
      alt: options.alt,
      title: options.title,
    });
  } catch (dbErr) {
    console.error("🚨 Failed to save Media record:", dbErr);
  }

  return relativeUrl;
};

export const deleteLocalFile = async (url) => {
  if (!url) return;
  try {
    const uploadIndex = url.indexOf("/upload/");
    if (uploadIndex !== -1) {
      const filename = url.substring(uploadIndex + 8).split(/[?#]/)[0];
      const safeFilename = path.basename(filename);
      const filePath = path.resolve(__dirname, "..", "..", "public", "upload", safeFilename);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        console.log(`🗑️ Successfully deleted local file: ${filePath}`);
      }
    }
  } catch (error) {
    console.error("🚨 Error deleting local file:", error);
  }
};
