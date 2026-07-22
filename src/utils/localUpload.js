import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import slugify from "slugify";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const saveToFrontendUploads = async (fileBuffer, originalName) => {
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

  return `/upload/${filename}`;
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
