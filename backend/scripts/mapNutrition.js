import mongoose from "mongoose";
import dotenv from "dotenv";
import axios from "axios";

import MenuItem from "../models/MenuItem.js";

dotenv.config();

mongoose.connect(process.env.MONGO_URI);

const FDC_API = "https://api.nal.usda.gov/fdc/v1/foods/search";

/* -------- Helper: Search Food -------- */
async function fetchNutrition(query) {
  try {
    const res = await axios.get(FDC_API, {
      params: {
        api_key: process.env.FDC_API_KEY,
        query,
        pageSize: 1
      }
    });

    const food = res.data.foods?.[0];
    if (!food) return null;

    const nutrients = {};
    for (let n of food.foodNutrients) {
      if (n.nutrientName === "Energy") nutrients.calories = n.value;
      if (n.nutrientName === "Protein") nutrients.protein = n.value;
      if (n.nutrientName === "Total lipid (fat)") nutrients.fat = n.value;
      if (n.nutrientName === "Carbohydrate, by difference") nutrients.carbs = n.value;
    }

    return nutrients;
  } catch {
    return null;
  }
}

/* -------- MAIN SCRIPT -------- */
async function mapNutrition() {
  const items = await MenuItem.find({ "nutrition.calories": { $exists: false } });

  console.log(`🍽️ Mapping nutrition for ${items.length} items`);

  for (let item of items) {
    const nutrition = await fetchNutrition(item.name);

    if (nutrition && nutrition.calories) {
      item.nutrition = { ...nutrition, source: "FDC" };
    } else {
      // fallback estimate
      item.nutrition = {
        calories: item.isVeg ? 250 : 450,
        protein: item.isVeg ? 8 : 25,
        fat: item.isVeg ? 6 : 18,
        carbs: item.isVeg ? 35 : 40,
        source: "ESTIMATED"
      };
    }

    await item.save();
    console.log(`✅ ${item.name} mapped`);
  }

  console.log("🎉 Nutrition mapping completed");
  process.exit();
}

mapNutrition();
