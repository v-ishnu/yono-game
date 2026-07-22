import dotenv from "dotenv";
dotenv.config();

console.log("CLOUDINARY_CLOUD_NAME:", JSON.stringify(process.env.CLOUDINARY_CLOUD_NAME));
console.log("CLOUDINARY_API_KEY:", JSON.stringify(process.env.CLOUDINARY_API_KEY));
console.log("CLOUDINARY_API_SECRET:", JSON.stringify(process.env.CLOUDINARY_API_SECRET));

import { uploadToCloudinary } from "./src/config/cloudinary.config.js";

try {
  // Let's use a small buffer representing a tiny 1x1 transparent GIF
  const gifBuffer = Buffer.from(
    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    "base64"
  );
  console.log("Uploading test GIF buffer to Cloudinary...");
  const result = await uploadToCloudinary(gifBuffer);
  console.log("Upload Success! Result URL:", result.secure_url);
} catch (error) {
  console.error("Upload Error:", error);
}
