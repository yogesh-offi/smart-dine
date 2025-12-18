import mongoose from "mongoose";
import dotenv from "dotenv";
import csv from "csvtojson";

import Review from "../models/Review.js";
import Restaurant from "../models/Restaurant.js";
import User from "../models/User.js";

dotenv.config();
await mongoose.connect(process.env.MONGO_URI);

async function seedReviews() {
  console.log("🌱 Seeding reviews from CSV...");

  await Review.deleteMany({});

  const reviews = await csv().fromFile("data/raw/reviews_seed.csv");

  for (let r of reviews) {
    const restaurant = await Restaurant.findOne({ name: r.restaurantName });
    if (!restaurant) continue;

    // Find or create demo user
    let user = await User.findOne({ email: r.userEmail });
    if (!user) {
      user = await User.create({
        name: "Demo User",
        email: r.userEmail,
        password: "dummy123"
      });
    }

    await Review.create({
      restaurantId: restaurant._id,
      userId: user._id,
      rating: Number(r.rating),
      reviewText: r.reviewText
    });
  }

  console.log("✅ Reviews seeded successfully");
  process.exit();
}

seedReviews();
