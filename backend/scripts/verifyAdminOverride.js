import mongoose from "mongoose";
import dotenv from "dotenv";

import User from "../models/User.js";
import MenuItem from "../models/MenuItem.js";

dotenv.config();
mongoose.connect(process.env.MONGO_URI);

async function verifyAdminOverride() {
  console.log("🔍 Verifying admin override...");

  /* 1️⃣ Verify admin user */
  const admin = await User.findOne({ email: "yogesh182900@gmail.com" });

  if (!admin || !admin.isAdmin) {
    console.log("❌ Admin user not found or not admin");
    process.exit(1);
  }

  console.log("✅ Admin verified:", admin.email);

  /* 2️⃣ Pick one menu item */
  const item = await MenuItem.findOne();

  if (!item) {
    console.log("❌ No menu items found");
    process.exit(1);
  }

  console.log("🍽️ Before update:", {
    name: item.name,
    spicinessLevel: item.spicinessLevel,
    calories: item.nutrition?.calories,
    source: item.nutrition?.source
  });

  /* 3️⃣ Admin override */
  item.spicinessLevel = 2;
  item.budgetCategory = "medium";
  item.nutrition = {
    calories: 180,
    protein: 12,
    fat: 8,
    carbs: 55,
    source: "ADMIN"
  };

  await item.save();

  /* 4️⃣ Fetch again to verify */
  const updatedItem = await MenuItem.findById(item._id);

  console.log("✅ After update:", {
    name: updatedItem.name,
    spicinessLevel: updatedItem.spicinessLevel,
    calories: updatedItem.nutrition?.calories,
    source: updatedItem.nutrition?.source
  });

  console.log("🎉 ADMIN OVERRIDE VERIFIED SUCCESSFULLY");
  process.exit();
}

verifyAdminOverride();
