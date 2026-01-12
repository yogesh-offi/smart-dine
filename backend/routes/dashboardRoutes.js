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
        }).populate("restaurantId").limit(6);
        
        suggestions = items.map(item => ({
          dish: item.name,
          calories: item.calories,
          restaurant: item.restaurantId?.name || "Unknown",
          reason: `Fits your remaining ${remainingCalories} calorie budget`
        }));
      }
    }

    // Enhanced ML-based health score
    let healthScore = 0; // Start from 0 instead of 50
    
    // Calorie adherence (40% weight) - penalize exceeding goal heavily
    let calorieAdherence;
    if (remainingCalories >= 0) {
      // Under or at goal - reward staying within limits
      calorieAdherence = Math.min(100, 100 - (Math.abs(remainingCalories) / calorieGoal * 50));
    } else {
      // Over goal - heavy penalty for exceeding
      const excessPercentage = Math.abs(remainingCalories) / calorieGoal * 100;
      calorieAdherence = Math.max(0, 100 - excessPercentage * 2); // Double penalty for excess
    }
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
    
    console.log(`Health Score Debug: Base=0, CalorieAdherence=${Math.round(calorieAdherence)}, MealFreq=${Math.round(mealFrequencyScore)}, DietComp=${Math.round(dietCompliance)}, Final=${Math.round(healthScore)}`);
    console.log(`Calorie Details: Consumed=${consumedCalories}, Goal=${calorieGoal}, Remaining=${remainingCalories}`);
    
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

router.get("/ai-insights/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 7 } = req.query;
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));
    daysAgo.setHours(0, 0, 0, 0);
    
    const logs = await CalorieLog.find({
      userId,
      date: { $gte: daysAgo }
    }).sort({ date: -1 });
    
    const calorieGoal = user.preferences?.calorieGoal || 2000;
    const healthGoal = user.preferences?.healthGoal || "maintain";
    const dietType = user.preferences?.dietType || "non-veg";
    
    // Analyze patterns
    const dailyCalories = {};
    const mealPatterns = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 };
    let totalCalories = 0;
    
    logs.forEach(log => {
      const dateKey = log.date.toISOString().split('T')[0];
      dailyCalories[dateKey] = (dailyCalories[dateKey] || 0) + log.calories;
      mealPatterns[log.mealType]++;
      totalCalories += log.calories;
    });
    
    const avgDaily = Object.keys(dailyCalories).length > 0 ? totalCalories / Object.keys(dailyCalories).length : 0;
    const daysOverGoal = Object.values(dailyCalories).filter(cal => cal > calorieGoal).length;
    const adherenceRate = Object.keys(dailyCalories).length > 0 ? ((Object.keys(dailyCalories).length - daysOverGoal) / Object.keys(dailyCalories).length) * 100 : 0;
    
    // Generate AI insights
    let insights = `Based on your ${days}-day eating history:\n\n`;
    
    // Calorie analysis
    if (avgDaily > calorieGoal * 1.1) {
      insights += `🔴 CALORIE CONCERN: You're averaging ${Math.round(avgDaily)} kcal/day, which is ${Math.round(avgDaily - calorieGoal)} kcal over your ${calorieGoal} kcal goal.\n`;
      insights += `💡 SUGGESTION: Try reducing portion sizes by 20% and replace high-calorie snacks with fruits or nuts.\n\n`;
    } else if (avgDaily < calorieGoal * 0.8) {
      insights += `🟡 CALORIE NOTICE: You're averaging ${Math.round(avgDaily)} kcal/day, which is below your ${calorieGoal} kcal goal.\n`;
      insights += `💡 SUGGESTION: Add healthy snacks like nuts, yogurt, or protein smoothies between meals.\n\n`;
    } else {
      insights += `🟢 CALORIE BALANCE: Great job! Your average ${Math.round(avgDaily)} kcal/day is well-aligned with your ${calorieGoal} kcal goal.\n\n`;
    }
    
    // Meal pattern analysis
    const totalMeals = Object.values(mealPatterns).reduce((a, b) => a + b, 0);
    const avgMealsPerDay = totalMeals / parseInt(days);
    
    if (avgMealsPerDay < 3) {
      insights += `🔴 MEAL FREQUENCY: You're averaging ${avgMealsPerDay.toFixed(1)} meals/day. This can slow metabolism.\n`;
      insights += `💡 SUGGESTION: Aim for 3 main meals + 1-2 healthy snacks. Set meal reminders on your phone.\n\n`;
    } else if (mealPatterns.breakfast < parseInt(days) * 0.7) {
      insights += `🟡 BREAKFAST PATTERN: You're skipping breakfast ${Math.round((1 - mealPatterns.breakfast/parseInt(days)) * 100)}% of the time.\n`;
      insights += `💡 SUGGESTION: Start with simple options like overnight oats, boiled eggs, or fruit smoothies.\n\n`;
    }
    
    // Goal-specific advice
    if (healthGoal === "Lose Weight" && adherenceRate < 70) {
      insights += `🎯 WEIGHT LOSS FOCUS: With ${Math.round(adherenceRate)}% goal adherence, consider:\n`;
      insights += `• Meal prep on weekends to avoid impulsive food choices\n`;
      insights += `• Use smaller plates to control portions naturally\n`;
      insights += `• Drink water before meals to increase satiety\n\n`;
    } else if (healthGoal === "Gain" && avgDaily < calorieGoal) {
      insights += `🎯 WEIGHT GAIN FOCUS: To reach your goals:\n`;
      insights += `• Add healthy fats like avocado, nuts, and olive oil\n`;
      insights += `• Include protein-rich snacks between meals\n`;
      insights += `• Try liquid calories like smoothies or milk-based drinks\n\n`;
    }
    
    // Diet compliance
    if (dietType === "veg") {
      const nonVegMeals = logs.filter(log => 
        log.dish.toLowerCase().includes("chicken") || 
        log.dish.toLowerCase().includes("mutton") ||
        log.dish.toLowerCase().includes("fish")
      ).length;
      
      if (nonVegMeals > 0) {
        insights += `🥗 DIET COMPLIANCE: Found ${nonVegMeals} non-vegetarian meals. Consider plant-based protein alternatives like paneer, dal, or tofu.\n\n`;
      }
    }
    
    // Positive reinforcement
    if (adherenceRate > 80) {
      insights += `🌟 EXCELLENT PROGRESS: You're maintaining great consistency! Keep up the momentum.\n`;
    } else if (adherenceRate > 60) {
      insights += `👍 GOOD PROGRESS: You're on the right track. Small improvements will yield big results.\n`;
    }
    
    insights += `\n🤖 This analysis is powered by your eating patterns and ML algorithms. Update your goals anytime in settings.`;
    
    res.json({ insights });
    
  } catch (err) {
    console.error("AI insights error:", err);
    res.status(500).json({ error: "Failed to generate insights" });
  }
});

export default router;