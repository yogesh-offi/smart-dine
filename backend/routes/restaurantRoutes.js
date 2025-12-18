import express from "express";
import Restaurant from "../models/Restaurant.js";
import Review from "../models/Review.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const restaurants = await Restaurant.find();

  const result = [];

  for (let r of restaurants) {
    const reviews = await Review.find({ restaurantId: r._id });

    const avgRating = reviews.length
      ? reviews.reduce((sum, rev) => sum + rev.rating, 0) / reviews.length
      : r.rating || 4.0; // fallback

    result.push({
      ...r.toObject(),
      avgRating: Number(avgRating.toFixed(1))
    });
  }

  res.json(result);
});

export default router;
