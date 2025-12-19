import express from "express";
import axios from "axios";

const router = express.Router();

const FDC_API_KEY = process.env.FDC_API_KEY;
const FDC_BASE_URL = "https://api.nal.usda.gov/fdc/v1";

router.post("/search", async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    const response = await axios.get(`${FDC_BASE_URL}/foods/search`, {
      params: {
        query: query,
        api_key: FDC_API_KEY,
        pageSize: 5
      }
    });

    const foods = response.data.foods.map(food => ({
      fdcId: food.fdcId,
      description: food.description,
      calories: food.foodNutrients?.find(n => n.nutrientId === 1008)?.value || 200,
      protein: food.foodNutrients?.find(n => n.nutrientId === 1003)?.value || 0,
      carbs: food.foodNutrients?.find(n => n.nutrientId === 1005)?.value || 0,
      fat: food.foodNutrients?.find(n => n.nutrientId === 1004)?.value || 0
    }));

    res.json({ foods });

  } catch (err) {
    console.error("FDC API error:", err.message);
    res.status(500).json({ error: "Failed to fetch nutrition data" });
  }
});

export default router;