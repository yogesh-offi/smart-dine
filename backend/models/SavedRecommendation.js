import mongoose from "mongoose";

const savedRecommendationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dish: String,
    restaurant: String,
    city: String,
    calories: Number,
    isVeg: Boolean,
    spiceLevel: Number,
    healthReason: String,
  },
  { timestamps: true }
);

export default mongoose.model(
  "SavedRecommendation",
  savedRecommendationSchema
);
