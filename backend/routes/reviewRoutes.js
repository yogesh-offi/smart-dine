import express from "express";
import Review from "../models/Review.js";

const router = express.Router();

// Add review
router.post("/", async (req, res) => {
  let sentiment = "neutral";

  if (req.body.rating >= 4) sentiment = "positive";
  else if (req.body.rating <= 2) sentiment = "negative";

  const review = await Review.create({
    ...req.body,
    sentiment
  });

  res.json(review);
});


// Get reviews by restaurant
router.get("/:restaurantId", async (req, res) => {
  const reviews = await Review.find({
    restaurantId: req.params.restaurantId
  });
  res.json(reviews);
});

export default router;
