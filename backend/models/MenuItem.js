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

  calories: {
    type: Number,
    default: 200
  },
  
  nutrition: {
    protein: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    source: {
      type: String,
      enum: ["FDC_API", "ESTIMATED", "MANUAL"],
      default: "ESTIMATED"
    }
  }


}, { timestamps: true });

export default mongoose.model("MenuItem", menuItemSchema);
