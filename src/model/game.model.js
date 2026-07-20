import mongoose from "mongoose";

const gameSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true }, // already indexed
    icon: String,
    logoUrl: String,
    category: { type: String, index: true },
    rating: { type: Number, default: 0 },
    size: String,
    signupBonus: Number,
    minWithdraw: Number,
    downloadUrl: String,
    description: String,
    longDescription: String,
    tags: [String],
    isNewGame: { type: Boolean, default: false },
    isFree: { type: Boolean, default: true },
    relatedApps: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Game",
      },
    ],
    faqs: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
      },
    ],

    contentSection:{
      title: {
        type: String,
        trim: true
      },
      body: { type: String },
      metaTitle: String,
      metaDescr: String,
      lastUpdate: {
        type: Date,
        default: Date.now
      }
    }
  },
  { timestamps: true }
);

export default mongoose.model("Game", gameSchema);