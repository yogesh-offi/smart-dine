import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: {
  type: Boolean,
  default: false
  },

  preferences: {
    dietType: {
      type: String,
      enum: ["veg", "non-veg", "vegan", "keto"],
      default: "non-veg"
    },
    calorieGoal: { type: Number, default: 2000 },
    allergies: [String],
    preferredCuisines: [String]
  },

  health: {
    height: Number,   // cm
    weight: Number,   // kg
    age: Number,
    conditions: [String] // e.g., diabetes, BP
  }

}, { timestamps: true });

export default mongoose.model("User", userSchema);
