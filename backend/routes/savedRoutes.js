import express from "express";
import SavedRecommendation from "../models/SavedRecommendation.js";

const router = express.Router();

router.post("/save", async (req, res) => {
  await SavedRecommendation.create(req.body);
  res.json({ message: "Recommendation saved" });
});

export default router;
