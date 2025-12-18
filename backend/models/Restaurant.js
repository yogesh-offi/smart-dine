import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema({
  yelpId: String,
  name: String,
  cuisines: [String],
  location: {
    address: String,
    city: String,
    latitude: Number,
    longitude: Number
  },
  rating: Number,
  priceRange: String, // $, $$, $$$
  isOpen: Boolean
}, { timestamps: true });

export default mongoose.model("Restaurant", restaurantSchema);
