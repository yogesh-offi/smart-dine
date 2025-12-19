import express from "express";
import { execFile } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/User.js";
import CalorieLog from "../models/CalorieLog.js";
import MenuItem from "../models/MenuItem.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.get("/suggestions/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayLogs = await CalorieLog.find({
      userId,
      date: { $gte: today, $lt: tomorrow }
    });

    const consumedCalories = todayLogs.reduce((sum, log) => sum + log.calories, 0);
    const calorieGoal = user.preferences?.calorieGoal || 2000;
    const remainingCalories = calorieGoal - consumedCalories;

    // ML-powered suggestions using hybrid + health-aware recommender
    let suggestions = [];
    
    try {
      const scriptPath = path.join(__dirname, "..", "..", "ml", "dashboard_recommender.py");
      const pythonPath = path.resolve(__dirname, "..", "..", "ml", "venv", "Scripts", "python.exe");
      
      const mlSuggestions = await new Promise((resolve, reject) => {
        execFile(pythonPath, [scriptPath, userId, consumedCalories.toString(), calorieGoal.toString()], 
          (err, stdout, stderr) => {
            if (err) {
              console.error("❌ ML Dashboard error:", stderr);
              return reject(err);
            }
            try {
              resolve(JSON.parse(stdout.trim()));
            } catch (parseErr) {
              console.error("❌ ML JSON parse error:", parseErr);
              resolve([]);
            }
          }
        );
      });
      
      suggestions = mlSuggestions;
      
    } catch (mlError) {
      console.error("❌ ML fallback to simple logic:", mlError);
      
      // Fallback to simple logic if ML fails
      if (remainingCalories > 300) {
        const items = await MenuItem.find({ 
          calories: { $lte: remainingCalories, $gte: 150 } 
        }).populate("restaurantId").limit(3);
        
        suggestions = items.map(item => ({
          dish: item.name,
          calories: item.calories,
          restaurant: item.restaurantId?.name || "Unknown",
          reason: `Fits your remaining ${remainingCalories} calorie budget`
        }));
      }
    }

    // Enhanced ML-based health score
    let healthScore = 50; // Base score
    
    // Calorie adherence (40% weight)
    const calorieAdherence = Math.max(0, 100 - Math.abs(remainingCalories) / calorieGoal * 100);
    healthScore += calorieAdherence * 0.4;
    
    // Meal frequency (30% weight) - encourage regular eating
    const mealCount = todayLogs.length;
    const mealFrequencyScore = Math.min(100, (mealCount / 4) * 100); // Ideal: 4 meals/day
    healthScore += mealFrequencyScore * 0.3;
    
    // Diet compliance (30% weight)
    const dietType = user.preferences?.dietType || "non-veg";
    let dietCompliance = 100;
    
    if (dietType === "veg") {
      const nonVegMeals = todayLogs.filter(log => 
        log.dish.toLowerCase().includes("chicken") || 
        log.dish.toLowerCase().includes("mutton") ||
        log.dish.toLowerCase().includes("fish")
      ).length;
      dietCompliance = Math.max(0, 100 - (nonVegMeals / mealCount) * 100);
    }
    
    healthScore += dietCompliance * 0.3;
    healthScore = Math.min(100, Math.max(0, healthScore));
    
    res.json({
      consumedCalories,
      calorieGoal,
      remainingCalories,
      suggestions,
      healthScore: Math.round(healthScore),
      insights: {
        calorieAdherence: Math.round(calorieAdherence),
        mealFrequency: Math.round(mealFrequencyScore),
        dietCompliance: Math.round(dietCompliance)
      }
    });

  } catch (err) {
    console.error("Dashboard suggestions error:", err);
    res.status(500).json({ error: "Failed to get suggestions" });
  }
});

router.post("/add-suggestion", async (req, res) => {
  try {
    const { userId, dish, calories, restaurant, mealType } = req.body;
    
    if (!userId || !dish || !calories) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    await CalorieLog.create({
      userId,
      dish: `${dish} (${restaurant})`,
      calories: parseInt(calories),
      mealType: mealType || "snack",
      date: new Date()
    });
    
    res.json({ message: "Suggestion added to meals successfully" });
    
  } catch (err) {
    console.error("Add suggestion error:", err);
    res.status(500).json({ error: "Failed to add suggestion" });
  }
});

router.get("/history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 7 } = req.query; // Default to last 7 days
    
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));
    daysAgo.setHours(0, 0, 0, 0);
    
    const logs = await CalorieLog.find({
      userId,
      date: { $gte: daysAgo }
    }).sort({ date: -1 });
    
    // Group by date
    const dailyHistory = {};
    
    logs.forEach(log => {
      const dateKey = log.date.toISOString().split('T')[0];
      
      if (!dailyHistory[dateKey]) {
        dailyHistory[dateKey] = {
          date: dateKey,
          totalCalories: 0,
          meals: {
            breakfast: [],
            lunch: [],
            dinner: [],
            snack: []
          }
        };
      }
      
      dailyHistory[dateKey].totalCalories += log.calories;
      dailyHistory[dateKey].meals[log.mealType].push({
        dish: log.dish,
        calories: log.calories,
        time: log.date
      });
    });
    
    // Convert to array and sort by date (newest first)
    const historyArray = Object.values(dailyHistory)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    res.json({ history: historyArray });
    
  } catch (err) {
    console.error("History fetch error:", err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

export default router;