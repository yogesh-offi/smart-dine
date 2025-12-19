import mongoose from "mongoose";
import csv from "csvtojson";
import dotenv from "dotenv";

import Restaurant from "../models/Restaurant.js";
import MenuItem from "../models/MenuItem.js";

dotenv.config();

/* ------------------ DB CONNECT ------------------ */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ DB connection error:", err));

/* ------------------ HELPERS ------------------ */
const getBudgetCategory = (price) => {
  if (price <= 100) return "low";
  if (price <= 200) return "medium";
  return "high";
};

/* ------------------ INGEST SCRIPT ------------------ */
async function ingest() {
  try {
    console.log("🚀 Starting ingestion...");

    /* 🔁 CLEAN OLD DATA (OPTIONAL BUT RECOMMENDED) */
    await Restaurant.deleteMany({});
    await MenuItem.deleteMany({});
    console.log("🧹 Old data cleared");

    /* ------------------ LOAD RESTAURANTS ------------------ */
    const restaurantsCSV = await csv().fromFile("data/raw/restaurants.csv");

    // Map to store restaurantId -> Mongo _id
    const restaurantMap = {};

    for (let r of restaurantsCSV) {
      const restaurant = await Restaurant.create({
        name: r.name,
        cuisines: r.cuisine.split(",").map(c => c.trim()),
        rating: Number(r.rating),
        priceRange: r.price,
        isOpen: r.isOpen === "true",
        location: {
          city: r.city,
          latitude: r.latitude, // Keep as string to match your existing data structure
          longitude: r.longitude
        }

      });

      restaurantMap[r.restaurantId] = restaurant._id;
    }

    console.log(`✅ ${restaurantsCSV.length} restaurants loaded`);

    /* ------------------ LOAD MENU ITEMS ------------------ */
    const menuCSV = await csv().fromFile("data/raw/menu_items.csv");

    for (let m of menuCSV) {
      const price = Number(m.price);

      await MenuItem.create({
        restaurantId: restaurantMap[m.restaurantId], // 🔗 LINK
        name: m.itemName,
        description: m.description,
        cuisine: m.cuisine,
        price,
        budgetCategory: m.budgetCategory || getBudgetCategory(price),
        isVeg: m.isVeg === "true",
        spicinessLevel: Number(m.spicinessLevel)
      });
    }

    console.log(`✅ ${menuCSV.length} menu items loaded`);

    console.log("🎉 Data ingestion completed successfully");
    process.exit();

  } catch (err) {
    console.error("❌ Ingestion failed:", err);
    process.exit(1);
  }
}

ingest();
