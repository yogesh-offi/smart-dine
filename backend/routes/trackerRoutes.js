import express from "express";
import CalorieLog from "../models/CalorieLog.js";

const router = express.Router();

router.post("/add", async (req, res) => {
  const { userId, dish, calories } = req.body;

  await CalorieLog.create({
    userId,
    dish,
    calories,
    date: new Date()
  });

  res.json({ message: "Calories added" });
});

export default router;
