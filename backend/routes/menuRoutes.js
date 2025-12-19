import express from "express";
import mongoose from "mongoose";
import MenuItem from "../models/MenuItem.js";

const router = express.Router();

router.get("/:restaurantId", async (req, res) => {
  const { restaurantId } = req.params;

  // 🛑 SAFETY CHECK
  if (!restaurantId || !mongoose.Types.ObjectId.isValid(restaurantId)) {
    return res.status(400).json({
      error: "Invalid or missing restaurantId"
    });
  }

  try {
    const items = await MenuItem.find({ restaurantId });
    res.json(items);
  } catch (err) {
    console.error("❌ Menu fetch error:", err.message);
    res.status(500).json({ error: "Failed to fetch menu items" });
  }
});

export default router;
