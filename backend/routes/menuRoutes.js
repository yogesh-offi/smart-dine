import express from "express";
import MenuItem from "../models/MenuItem.js";

const router = express.Router();

// Get menu items for a restaurant
router.get("/:restaurantId", async (req, res) => {
  const items = await MenuItem.find({
    restaurantId: req.params.restaurantId
  });

  res.json(items);
});

export default router;
