import mongoose from "mongoose";

const gameSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    seoTitle: { type: String },
    seoDescription: { type: String },
    slug: { type: String, required: true, unique: true, lowercase: true }, // already indexed
    icon: String,
    logoUrl: String,
    logoAlt: { type: String, trim: true },
    logoTitle: { type: String, trim: true },
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

    contentSection: {
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
    },
    displayOrder: {
      type: Number,
      unique: true,
      index: true
    },
    indexingStatus: {
      status: {
        type: String,
        enum: ["pending", "success", "failed", "not_indexed"],
        default: "not_indexed",
      },
      lastIndexedAt: { type: Date },
      message: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

gameSchema.pre("save", async function () {
  if (this.isNew && this.displayOrder === undefined) {
    const Game = mongoose.model("Game");
    const maxGame = await Game.findOne({}, {}, { sort: { displayOrder: -1 } });
    this.displayOrder = maxGame && typeof maxGame.displayOrder === 'number' ? maxGame.displayOrder + 1 : 1;
  }
});

export default mongoose.model("Game", gameSchema);