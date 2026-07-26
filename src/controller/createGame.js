import Game from "../model/game.model.js";
import slugify from "slugify";
import { saveToFrontendUploads } from "../utils/localUpload.js";

const generateUniqueSlug = async (name) => {
  let baseSlug = slugify(name, { lower: true, strict: true });
  let slug = baseSlug;
  let count = 1;

  while (await Game.findOne({ slug })) {
    slug = `${baseSlug}-${count}`;
    count++;
  }

  return slug;
};

const createGame = async (req, res, next) => {
  try {
    const {
      name,
      seoTitle,
      seoDescription,
      slug,
      icon,
      category,
      rating,
      size,
      signupBonus,
      minWithdraw,
      downloadUrl,
      description,
      longDescription,
      tags,
      isNewGame,
      isFree,
      relatedApps,
      faqs,
      logoAlt,
      logoTitle,
    } = req.body;

    // 🔹 Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    // 🔹 Generate slug
    const finalSlug = slug
      ? slugify(slug, { lower: true, strict: true })
      : await generateUniqueSlug(name);

    // 🔹 Handle file upload (also accept logoUrl from body for seeding)
    let logoUrl = req.body.logoUrl || "";
    if (req.file) {
      const relativeUrl = await saveToFrontendUploads(req.file.buffer, req.file.originalname, req);
      const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`;
      logoUrl = `${baseUrl}${relativeUrl}`;
    }

    let parsedTags = tags;
    if (typeof tags === "string") {
      parsedTags = tags.split(",").map(t => t.trim());
    }

    // 🔹 Parse faqs
    let parsedFaqs = [];
    if (faqs) {
      if (typeof faqs === "string") {
        try {
          parsedFaqs = JSON.parse(faqs);
        } catch (e) {
          console.error("Error parsing faqs", e);
        }
      } else {
        parsedFaqs = faqs;
      }
    }

    // 🔹 Create object explicitly
    const gameData = {
      name,
      seoTitle,
      seoDescription,
      slug: finalSlug,
      icon,
      logoUrl,
      logoAlt,
      logoTitle,
      category,
      rating,
      size,
      signupBonus,
      minWithdraw,
      downloadUrl,
      description,
      longDescription,
      tags: parsedTags,
      isNewGame,
      isFree,
      relatedApps,
      faqs: parsedFaqs,
    };

    const game = await Game.create(gameData);

    res.status(201).json({
      success: true,
      data: game,
    });

  } catch (err) {
    console.error("Error creating game:", err);
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue || {}).join(", ") || "slug";
      return res.status(400).json({
        success: false,
        message: `Game with this ${field} already exists`,
      });
    }

    next(err);
  }
};

export default createGame;