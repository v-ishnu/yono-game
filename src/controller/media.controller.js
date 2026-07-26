import Media from "../model/media.model.js";
import { saveToFrontendUploads, createOrGetMediaRecord, getMimeType } from "../utils/localUpload.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getMedia = async (req, res, next) => {
  try {
    // 🔹 Sync disk files in public/upload folder with database to ensure all uploaded images are tracked
    const uploadPath = path.resolve(__dirname, "..", "..", "public", "upload");
    if (fs.existsSync(uploadPath)) {
      const files = await fs.promises.readdir(uploadPath);
      const allowedExtensions = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".bmp", ".tiff", ".ico"];
      const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`;

      for (const filename of files) {
        const ext = path.extname(filename).toLowerCase();
        if (allowedExtensions.includes(ext)) {
          const relativeUrl = `/upload/${filename}`;
          const url = `${baseUrl}${relativeUrl}`;
          const existing = await Media.findOne({ $or: [{ url }, { filename }] });

          if (!existing) {
            const filePath = path.join(uploadPath, filename);
            const stats = await fs.promises.stat(filePath).catch(() => null);
            await Media.create({
              url,
              filename,
              alt: "",
              title: "",
              size: stats ? stats.size : 0,
              mimeType: getMimeType(ext),
              createdAt: stats ? stats.birthtime : new Date(),
            });
            console.log(`🖼️ Auto-synced Media record for existing disk file: ${filename}`);
          }
        }
      }
    }

    const list = await Media.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: list,
    });
  } catch (err) {
    next(err);
  }
};

export const uploadMedia = async (req, res, next) => {
  try {
    const uploadedFile = req.file || (req.files && req.files[0]);
    if (!uploadedFile) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const { alt, title } = req.body;
    const relativeUrl = await saveToFrontendUploads(uploadedFile.buffer, uploadedFile.originalname, req, {
      mimetype: uploadedFile.mimetype,
      alt,
      title,
    });

    const filename = path.basename(relativeUrl);
    const media = await createOrGetMediaRecord({
      filename,
      relativeUrl,
      req,
      fileBuffer: uploadedFile.buffer,
      mimetype: uploadedFile.mimetype,
      alt,
      title,
    });

    res.status(201).json({
      success: true,
      data: media,
      url: media.url,
      location: media.url,
    });
  } catch (err) {
    next(err);
  }
};

export const updateMediaSeo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { alt, title } = req.body;

    const media = await Media.findById(id);
    if (!media) {
      return res.status(404).json({
        success: false,
        message: "Media not found",
      });
    }

    if (alt !== undefined) media.alt = alt;
    if (title !== undefined) media.title = title;
    await media.save();

    res.status(200).json({
      success: true,
      data: media,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteMedia = async (req, res, next) => {
  try {
    const { id } = req.params;
    const media = await Media.findById(id);

    if (!media) {
      return res.status(404).json({
        success: false,
        message: "Media not found",
      });
    }

    // Resolve static file path on server
    const filePath = path.resolve(__dirname, "..", "..", "public", "upload", media.filename);

    // Delete from filesystem
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }

    // Delete from database
    await Media.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Media and associated file deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};
