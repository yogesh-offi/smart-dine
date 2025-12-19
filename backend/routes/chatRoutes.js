// import express from "express";
// import { askGroq } from "../utils/geminiClient.js";
// import { getRagContext } from "../utils/ragContext.js";

// import MenuItem from "../models/MenuItem.js";

// const router = express.Router();

// /* ------------------ SAFE LLM PARSER ------------------ */
// async function getDishesFromLLM(prompt, maxRetries = 1) {
//   for (let i = 0; i <= maxRetries; i++) {
//     const raw = await askGroq(prompt);

//     console.log(`🔁 Attempt ${i + 1} RAW RESPONSE:\n`, raw);

//     if (!raw || raw.toLowerCase().includes("no response")) continue;

//     const cleaned = raw.replace(/```json|```/g, "").trim();

//     try {
//       return JSON.parse(cleaned);
//     } catch {
//       console.error("❌ JSON parse failed, retrying...");
//     }
//   }
//   return null;
// }

// /* ------------------ CONSTRAINT EXTRACTION ------------------ */
// function extractConstraints(message) {
//   const msg = message.toLowerCase();

//   return {
//     isVeg: msg.includes("veg") && !msg.includes("non"),
//     isNonVeg:
//       msg.includes("non") ||
//       msg.includes("chicken") ||
//       msg.includes("mutton") ||
//       msg.includes("fish") ||
//       msg.includes("egg"),

//     spicy: msg.includes("spicy"),
//     mild: msg.includes("less spicy") || msg.includes("mild")
//   };
// }

// /* ------------------ CHAT ENDPOINT ------------------ */
// router.post("/", async (req, res) => {
//   try {
//     const { message } = req.body;

//     if (!message) {
//       return res.status(400).json({ error: "Message is required" });
//     }

//     /* 🔐 RAG CONTEXT */
//     let context = "";
//     try {
//       context = await getRagContext(message);
//     } catch (err) {
//       console.error("❌ RAG error:", err.message);
//       return res.status(500).json({ error: "RAG failed" });
//     }

//     /* ------------------ MULTI-DISH PROMPT ------------------ */
//     const prompt = `
// You are Smart Dine, a food recommendation assistant.

// Use ONLY the menu items provided below.

// MENU CONTEXT:
// ${context}

// User query:
// "${message}"

// Return 1 to 3 suitable dish names.

// Respond ONLY in valid JSON:

// {
//   "dishes": ["", ""]
// }
// `;

//     /* ------------------ LLM CALL ------------------ */
//     const llmResult = await getDishesFromLLM(prompt, 1);

//     if (!llmResult || !Array.isArray(llmResult.dishes)) {
//       return res.json({
//         recommendations: [],
//         note: "LLM failed to identify dishes"
//       });
//     }

//     /* ------------------ APPLY CONSTRAINTS ------------------ */
//     const constraints = extractConstraints(message);

//     let allRecommendations = [];

//     for (const dish of llmResult.dishes) {
//       const query = {
//         name: new RegExp(dish, "i")
//       };

//       if (constraints.isVeg) query.isVeg = true;
//       if (constraints.isNonVeg) query.isVeg = false;

//       if (constraints.spicy) query.spicinessLevel = { $gte: 3 };
//       if (constraints.mild) query.spicinessLevel = { $lte: 1 };

//       const items = await MenuItem.find(query).populate("restaurantId");

//       const mapped = items.map(item => ({
//         dish: item.name,
//         restaurant: item.restaurantId.name,
//         city: item.restaurantId.location.city,
//         calories: item.calories || 200,
//         isVeg: item.isVeg,
//         spiceLevel: item.spicinessLevel
//       }));

//       allRecommendations.push(...mapped);
//     }

//     if (allRecommendations.length === 0) {
//       return res.json({
//         recommendations: [],
//         note: "No dishes matched constraints"
//       });
//     }

//     return res.json({
//       recommendations: allRecommendations,
//       totalCalories: allRecommendations.reduce(
//         (sum, r) => sum + r.calories,
//         0
//       )
//     });

//   } catch (err) {
//     console.error("❌ Chat route error:", err);
//     return res.status(500).json({ error: "Chat processing failed" });
//   }
// });

// export default router;


import express from "express";
import { askGroq } from "../utils/geminiClient.js";
import { getRagContext } from "../utils/ragContext.js";
import { getDistanceKm } from "../utils/distance.js";

import MenuItem from "../models/MenuItem.js";

const router = express.Router();

/* ------------------ SAFE LLM PARSER ------------------ */
async function getDishesFromLLM(prompt, maxRetries = 1) {
  for (let i = 0; i <= maxRetries; i++) {
    const raw = await askGroq(prompt);

    console.log(`🔁 Attempt ${i + 1} RAW RESPONSE:\n`, raw);

    if (!raw || raw.toLowerCase().includes("no response")) continue;

    const cleaned = raw.replace(/```json|```/g, "").trim();

    try {
      return JSON.parse(cleaned);
    } catch {
      console.error("❌ JSON parse failed, retrying...");
    }
  }
  return null;
}

/* ------------------ CONSTRAINT EXTRACTION ------------------ */
function extractConstraints(message) {
  const msg = message.toLowerCase();

  return {
    isVeg: msg.includes("veg") && !msg.includes("non"),
    isNonVeg:
      msg.includes("non") ||
      msg.includes("chicken") ||
      msg.includes("mutton") ||
      msg.includes("fish") ||
      msg.includes("egg"),

    spicy: msg.includes("spicy"),
    mild: msg.includes("less spicy") || msg.includes("mild")
  };
}

/* ------------------ RANKING FUNCTION (DAY 24 + DAY 26 FIXED) ------------------ */
function rankResults(items) {
  return items
    .map(item => {
      const rating = item.restaurant.rating || 3.5;
      const sentiment = item.restaurant.sentimentScore || 0;
      const distance = item.distanceKm ?? 30;

      const finalScore =
        rating * 0.5 +
        sentiment * 0.3 +
        ((30 - distance) / 30) * 0.2;

      return {
        ...item,
        finalScore,
        reasoning: [
          rating >= 4 ? "High restaurant rating" : null,
          sentiment >= 0.3 ? "Positive user sentiment" : null,
          distance <= 10 ? "Very close to you" : "Nearby"
        ].filter(Boolean)
      };
    })
    .sort((a, b) => b.finalScore - a.finalScore);
}

/* ------------------ CHAT ENDPOINT ------------------ */
router.post("/", async (req, res) => {
  try {
    const { message, userLocation } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    /* ------------------ RAG CONTEXT ------------------ */
    let context = "";
    try {
      context = await getRagContext(message);
    } catch (err) {
      console.error("❌ RAG error:", err.message);
      return res.status(500).json({ error: "RAG failed" });
    }

    /* ------------------ MULTI-DISH PROMPT ------------------ */
    const prompt = `
You are Smart Dine, a food recommendation assistant.

Use ONLY the menu items provided below.

MENU CONTEXT:
${context}

User query:
"${message}"

Return 1 to 3 suitable dish names.

Respond ONLY in valid JSON:

{
  "dishes": ["", ""]
}
`;

    /* ------------------ LLM CALL ------------------ */
    const llmResult = await getDishesFromLLM(prompt, 1);
    console.log("🤖 LLM Result:", llmResult);

    if (!llmResult || !Array.isArray(llmResult.dishes)) {
      return res.json({
        recommendations: [],
        note: "LLM failed to identify dishes"
      });
    }

    /* ------------------ APPLY CONSTRAINTS ------------------ */
    const constraints = extractConstraints(message);
    let allRecommendations = [];

    for (const dish of llmResult.dishes) {
      const query = { name: new RegExp(dish, "i") };

      if (constraints.isVeg) query.isVeg = true;
      if (constraints.isNonVeg) query.isVeg = false;
      if (constraints.spicy) query.spicinessLevel = { $gte: 3 };
      if (constraints.mild) query.spicinessLevel = { $lte: 1 };

      const items = await MenuItem.find(query).populate("restaurantId");

      const mapped = items.map(item => ({
        dish: item.name,
        calories: item.calories || 200,
        isVeg: item.isVeg,
        spiceLevel: item.spicinessLevel,

        /* 🔁 Normalize DB fields here */
        restaurant: {
          name: item.restaurantId.name,
          city: item.restaurantId.location.city,
          rating: item.restaurantId.rating,
          sentimentScore: item.restaurantId.sentimentScore || 0,
          latitude: item.restaurantId.location.latitude,
          longitude: item.restaurantId.location.longitude
        }
      }));

      allRecommendations.push(...mapped);
    }

    console.log(`📊 Found ${allRecommendations.length} items before location filter`);
    allRecommendations.forEach(r => console.log(`- ${r.dish} at ${r.restaurant.name}`));

    if (!allRecommendations.length) {
      return res.json({
        recommendations: [],
        note: "No dishes matched constraints"
      });
    }

/* ------------------ 📍 DISTANCE FILTER (FIXED) ------------------ */
let filtered = allRecommendations;

if (userLocation?.lat != null && userLocation?.lng != null) {
  console.log(`🎯 User location: ${userLocation.lat}, ${userLocation.lng}`);
  
  filtered = allRecommendations
    .map(r => {
      const lat = parseFloat(r.restaurant.latitude);
      const lng = parseFloat(r.restaurant.longitude);
      
      console.log(`🏪 ${r.restaurant.name}: lat=${r.restaurant.latitude} (${lat}), lng=${r.restaurant.longitude} (${lng})`);
      
      if (isNaN(lat) || isNaN(lng)) {
        console.warn(`⚠️ Invalid coordinates for ${r.restaurant.name}`);
        return null;
      }

      const distanceKm = getDistanceKm(userLocation.lat, userLocation.lng, lat, lng);
      console.log(`📏 Distance to ${r.restaurant.name}: ${distanceKm}km`);
      
      if (isNaN(distanceKm)) {
        console.warn(`⚠️ Invalid distance calculation for ${r.restaurant.name}`);
        return null;
      }

      return { ...r, distanceKm };
    })
    .filter(Boolean)
    .filter(r => {
      const withinRange = r.distanceKm <= 500; // Increased for Tamil Nadu coverage
      console.log(`✅ ${r.restaurant.name}: ${r.distanceKm}km ${withinRange ? 'INCLUDED' : 'EXCLUDED'}`);
      return withinRange;
    });
  
  console.log(`📍 After location filter: ${filtered.length} items`);
}

    /* ------------------ 🔥 RANKING (DAY 24) ------------------ */
    const ranked = rankResults(filtered);

    /* ------------------ FINAL RESPONSE ------------------ */
    return res.json({
      recommendations: ranked,
      totalCalories: ranked.reduce(
        (sum, r) => sum + r.calories,
        0
      ),
      note: "Ranked using distance, rating, and sentiment"
    });

  } catch (err) {
    console.error("❌ Chat route error:", err);
    return res.status(500).json({ error: "Chat processing failed" });
  }

});

export default router;
