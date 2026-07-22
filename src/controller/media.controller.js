import Media from "../model/media.model.js";
import { saveToFrontendUploads } from "../utils/localUpload.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getMedia = async (req, res, next) => {
  try {
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
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const { alt, title } = req.body;
    const relativeUrl = await saveToFrontendUploads(req.file.buffer, req.file.originalname);
    const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`;
    const url = `${baseUrl}${relativeUrl}`;
    const filename = path.basename(relativeUrl);

    const media = await Media.create({
      url,
      filename,
      alt: alt || "",
      title: title || "",
    });

    res.status(201).json({
      success: true,
      data: media,
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
