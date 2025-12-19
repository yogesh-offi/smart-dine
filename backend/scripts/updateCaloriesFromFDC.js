import mongoose from "mongoose";
import axios from "axios";
import dotenv from "dotenv";
import MenuItem from "../models/MenuItem.js";

dotenv.config();

const FDC_API_KEY = process.env.FDC_API_KEY;
const FDC_BASE_URL = "https://api.nal.usda.gov/fdc/v1";

async function getFDCCalories(dishName) {
  try {
    const response = await axios.get(`${FDC_BASE_URL}/foods/search`, {
      params: {
        query: dishName,
        api_key: FDC_API_KEY,
        pageSize: 1
      }
    });

    if (response.data.foods && response.data.foods.length > 0) {
      const food = response.data.foods[0];
      const calories = food.foodNutrients?.find(n => n.nutrientId === 1008)?.value;
      return calories ? Math.round(calories) : null;
    }
    return null;
  } catch (err) {
    console.error(`FDC API error for ${dishName}:`, err.message);
    return null;
  }
}

async function updateMenuItemCalories() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const menuItems = await MenuItem.find({ 
      $or: [
        { calories: { $exists: false } },
        { calories: 200 }, // Update default calories
        { calories: { $lt: 50 } } // Update very low calories
      ]
    });

    console.log(`📊 Found ${menuItems.length} items to update`);

    let updated = 0;
    let failed = 0;

    for (const item of menuItems) {
      console.log(`🔍 Fetching calories for: ${item.name}`);
      
      const fdcCalories = await getFDCCalories(item.name);
      
      if (fdcCalories && fdcCalories > 0) {
        await MenuItem.findByIdAndUpdate(item._id, { 
          calories: fdcCalories,
          calorieSource: "FDC_API"
        });
        console.log(`✅ Updated ${item.name}: ${fdcCalories} kcal`);
        updated++;
      } else {
        console.log(`❌ No FDC data for ${item.name}, keeping existing value`);
        failed++;
      }

      // Rate limiting - wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n📈 Update Summary:`);
    console.log(`✅ Successfully updated: ${updated} items`);
    console.log(`❌ Failed to update: ${failed} items`);
    
    process.exit(0);

  } catch (err) {
    console.error("❌ Update failed:", err);
    process.exit(1);
  }
}

updateMenuItemCalories();