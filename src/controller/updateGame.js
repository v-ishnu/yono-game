import Game from "../model/game.model.js";
import slugify from "slugify";
import { saveToFrontendUploads } from "../utils/localUpload.js";

const generateUniqueSlug = async (name, excludeId) => {
    let baseSlug = slugify(name, { lower: true, strict: true });
    let slug = baseSlug;
    let count = 1;

    while (await Game.findOne({ slug, _id: { $ne: excludeId } })) {
        slug = `${baseSlug}-${count}`;
        count++;
    }

    return slug;
};

const updateGame = async (req, res, next) => {
    try {
        const {
            id,
            name,
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
            logoUrl,
        } = req.body;

        // 🔹 Find existing game
        const game = await Game.findById(id);
        if (!game) {
            return res.status(404).json({
                success: false,
                message: "Game not found",
                id
            });
        }

        // 🔹 Prepare update object (only provided fields)
        const updateData = {};

        if (name) updateData.name = name;
        if (icon) updateData.icon = icon;
        if (category) updateData.category = category;
        if (rating !== undefined) updateData.rating = rating;
        if (size) updateData.size = size;
        if (signupBonus !== undefined) updateData.signupBonus = signupBonus;
        if (minWithdraw !== undefined) updateData.minWithdraw = minWithdraw;
        if (downloadUrl) updateData.downloadUrl = downloadUrl;
        if (description) updateData.description = description;
        if (longDescription) updateData.longDescription = longDescription;
        if (isNewGame !== undefined) updateData.isNewGame = isNewGame;
        if (isFree !== undefined) updateData.isFree = isFree;
        if (relatedApps) updateData.relatedApps = relatedApps;
        if (logoAlt !== undefined) updateData.logoAlt = logoAlt;
        if (logoTitle !== undefined) updateData.logoTitle = logoTitle;
        if (seoTitle !== undefined) updateData.seoTitle = seoTitle;
        if (seoDescription !== undefined) updateData.seoDescription = seoDescription;

        // 🔹 Handle tags
        if (tags) {
            if (typeof tags === "string") {
                updateData.tags = tags.split(",").map(t => t.trim());
            } else {
                updateData.tags = tags;
            }
        }

        // 🔹 Handle faqs
        if (faqs) {
            if (typeof faqs === "string") {
                try {
                    updateData.faqs = JSON.parse(faqs);
                } catch (e) {
                    console.error("Error parsing faqs", e);
                }
            } else {
                updateData.faqs = faqs;
            }
        }

        // 🔹 Handle slug update
        if (slug) {
            updateData.slug = slugify(slug, { lower: true, strict: true });
        } else if (name) {
            updateData.slug = await generateUniqueSlug(name, id);
        }

        // 🔹 Handle logo update
        if (req.file) {
            const relativeUrl = await saveToFrontendUploads(req.file.buffer, req.file.originalname, req);
            const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`;
            updateData.logoUrl = `${baseUrl}${relativeUrl}`;
        } else if (logoUrl) {
            updateData.logoUrl = logoUrl;
        }

        // 🔹 Update DB
        const updatedGame = await Game.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: updatedGame,
        });

    } catch (err) {
        console.error("Error updating game:", err);
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

export default updateGame;