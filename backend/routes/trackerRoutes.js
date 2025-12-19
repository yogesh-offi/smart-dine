import express from "express";
import CalorieLog from "../models/CalorieLog.js";

const router = express.Router();

router.post("/add", async (req, res) => {
  const { userId, dish, calories, mealType } = req.body;

  await CalorieLog.create({
    userId,
    dish,
    calories,
    mealType: mealType || "snack",
    date: new Date()
  });

  res.json({ message: "Calories added" });
});

router.get("/today/:userId", async (req, res) => {
  const { userId } = req.params;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const logs = await CalorieLog.find({
    userId,
    date: { $gte: today, $lt: tomorrow }
  }).sort({ date: -1 });

  const totalCalories = logs.reduce((sum, log) => sum + log.calories, 0);
  
  const mealBreakdown = {
    breakfast: logs.filter(l => l.mealType === "breakfast"),
    lunch: logs.filter(l => l.mealType === "lunch"),
    dinner: logs.filter(l => l.mealType === "dinner"),
    snack: logs.filter(l => l.mealType === "snack")
  };

  res.json({ logs, totalCalories, mealBreakdown });
});

router.get("/summary/:userId", async (req, res) => {
  const { userId } = req.params;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayLogs = await CalorieLog.find({
    userId,
    date: { $gte: today, $lt: tomorrow }
  });

  const totalCalories = todayLogs.reduce((sum, log) => sum + log.calories, 0);
  
  res.json({
    totalCalories,
    mealsLogged: todayLogs.length,
    lastMeal: todayLogs[0]?.dish || "None"
  });
});

export default router;
