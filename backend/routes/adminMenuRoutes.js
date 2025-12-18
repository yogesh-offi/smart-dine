import express from "express";
import MenuItem from "../models/MenuItem.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

/*
  Update menu item (nutrition, spice, veg, budget)
*/
router.put("/:menuItemId", adminAuth, async (req, res) => {
  const updatedItem = await MenuItem.findByIdAndUpdate(
    req.params.menuItemId,
    req.body,
    { new: true }
  );

  res.json(updatedItem);
});

export default router;
