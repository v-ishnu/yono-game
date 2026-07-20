import mongoose from "mongoose";

const contentSchema = new mongoose.Schema(
  {
    // 🔗 OPTIONAL RELATION (null = general blog)
    gameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Game",
      default: null,
      index: true,
    },

    // 🧠 CONTENT TYPE
    contentType: {
      type: String,
      enum: ["game-article", "blog"],
      required: true,
      index: true,
    },

    // 📝 CORE
    title: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      lowercase: true,
      unique: true, // global unique
    },

    content: {
      type: String, // HTML / Markdown
      required: true,
    },

    excerpt: String,
    featuredImage: String,

    // 📂 SUB TYPE (useful for filtering)
    category: {
      type: String, // guide, review, news, tips
      index: true,
    },

    tags: [String],

    // 📢 STATUS
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "published",
      index: true,
    },

    publishedAt: {
      type: Date,
      default: Date.now,
    },

    author: {
      type: String,
      default: "admin",
    },

    // 🔍 SEO
    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String],
    },

    // 📊 ANALYTICS
    views: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);


// 🚀 INDEXES
contentSchema.index({ contentType: 1, status: 1 });
contentSchema.index({ gameId: 1, contentType: 1 });

export default mongoose.model("Content", contentSchema);