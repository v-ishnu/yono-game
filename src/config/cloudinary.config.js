import { v2 as cloudinary } from "cloudinary";
import multer from "multer";

import dotenv from "dotenv";
dotenv.config();


const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME?.replace(/['"]/g, "").trim();
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY?.replace(/['"]/g, "").trim();
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET?.replace(/['"]/g, "").trim();

// const {
//   CLOUDINARY_CLOUD_NAME,
//   CLOUDINARY_API_KEY,
//   CLOUDINARY_API_SECRET,
// } = process.env;

// Debug logs
if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error("❌ Cloudinary env vars missing");
} else {
  console.log("✅ Cloudinary config loaded:", CLOUDINARY_CLOUD_NAME);
}

// Configure cloudinary
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

// Use memory storage (IMPORTANT)
const storage = multer.memoryStorage();

export const upload = multer({ storage });

export const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: "auto", folder: "yono_games" },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    uploadStream.end(fileBuffer);
  });
};

export default cloudinary;