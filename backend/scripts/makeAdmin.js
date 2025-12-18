import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();
mongoose.connect(process.env.MONGO_URI);

async function makeAdmin() {
  const user = await User.findOne({ email: "yogesh182900@gmail.com" });

  if (!user) {
    console.log("❌ User not found");
    process.exit();
  }

  user.isAdmin = true;
  await user.save();

  console.log("✅ User promoted to admin");
  process.exit();
}

makeAdmin();
