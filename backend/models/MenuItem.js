import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant"
  },

  name: String,
  description: String,
  cuisine: String,

  price: Number,
  budgetCategory: {
    type: String,
    enum: ["low", "medium", "high"]
  },

  isVeg: Boolean,

  spicinessLevel: {
    type: Number, // 0 to 4
    min: 0,
    max: 4
  },

  nutrition: {
  calories: Number,
  protein: Number,
  fat: Number,
  carbs: Number,
  source: {
    type: String, // "FDC" | "SEED" | "ESTIMATED"
    default: "ESTIMATED"
  }
}


}, { timestamps: true });

export default mongoose.model("MenuItem", menuItemSchema);
