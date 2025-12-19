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

/* ------------------ ENHANCED CONSTRAINT EXTRACTION ------------------ */
function extractConstraints(message) {
  const msg = message.toLowerCase();

  // Mood and emotion-based mappings
  const moodMappings = {
    // Comfort food moods
    comfort: ["comfort", "cozy", "homely", "warm", "soothing", "nostalgic"],
    spicy: ["spicy", "hot", "fiery", "burning", "kick", "heat", "chili", "pepper"],
    mild: ["mild", "gentle", "light", "subtle", "less spicy", "not spicy"],
    rich: ["rich", "creamy", "indulgent", "heavy", "satisfying", "filling"],
    fresh: ["fresh", "light", "healthy", "clean", "refreshing", "crisp"],
    sweet: ["sweet", "dessert", "sugary", "treat", "candy"]
  };

  // Craving-based mappings
  const cravingMappings = {
    protein: ["protein", "meat", "chicken", "mutton", "fish", "egg", "paneer"],
    carbs: ["rice", "bread", "naan", "roti", "biryani", "pasta", "noodles"],
    fried: ["fried", "crispy", "crunchy", "deep fried", "golden"],
    curry: ["curry", "gravy", "sauce", "masala", "kuzhambu"]
  };

  // Emotional state mappings
  const emotionMappings = {
    stressed: ["stressed", "tired", "exhausted", "overwhelmed"],
    happy: ["celebrating", "party", "festive", "joyful", "excited"],
    sad: ["sad", "down", "blue", "comfort me", "cheer up"],
    energetic: ["energetic", "active", "boost", "power", "fuel"]
  };

  // Check for mood indicators
  let spicyScore = 0;
  let mildScore = 0;
  let richScore = 0;
  let freshScore = 0;

  // Analyze mood words
  Object.entries(moodMappings).forEach(([mood, keywords]) => {
    keywords.forEach(keyword => {
      if (msg.includes(keyword)) {
        if (mood === 'spicy') spicyScore++;
        if (mood === 'mild') mildScore++;
        if (mood === 'rich') richScore++;
        if (mood === 'fresh') freshScore++;
      }
    });
  });

  // Analyze emotional context
  emotionMappings.stressed.forEach(word => {
    if (msg.includes(word)) richScore += 2; // Comfort food when stressed
  });
  
  emotionMappings.happy.forEach(word => {
    if (msg.includes(word)) spicyScore += 1; // Celebratory spicy food
  });

  return {
    // Traditional constraints
    isVeg: (msg.includes("veg") && !msg.includes("non")) || msg.includes("vegetarian"),
    isNonVeg: msg.includes("non") || 
               cravingMappings.protein.some(word => msg.includes(word)),

    // Enhanced mood-based constraints
    spicy: spicyScore > mildScore || msg.includes("spicy"),
    mild: mildScore > spicyScore || msg.includes("mild"),
    rich: richScore > 0,
    fresh: freshScore > 0,
    
    // Craving-based constraints
    wantsFried: cravingMappings.fried.some(word => msg.includes(word)),
    wantsCurry: cravingMappings.curry.some(word => msg.includes(word)),
    wantsRice: cravingMappings.carbs.some(word => msg.includes(word))
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

    if (!llmResult || !Array.isArray(llmResult.dishes) || llmResult.dishes.length === 0) {
      console.log("⚠️ LLM returned no dishes, trying constraint-based fallback");
      
      // Fallback: search directly by constraints if LLM fails
      const constraints = extractConstraints(message);
      let fallbackQuery = {};
      
      if (constraints.isVeg) fallbackQuery.isVeg = true;
      if (constraints.isNonVeg) fallbackQuery.isVeg = false;
      if (constraints.spicy) fallbackQuery.spicinessLevel = { $gte: 3 };
      if (constraints.mild) fallbackQuery.spicinessLevel = { $lte: 2 };
      
      const fallbackItems = await MenuItem.find(fallbackQuery).populate("restaurantId").limit(10);
      
      if (fallbackItems.length > 0) {
        console.log(`🔄 Fallback found ${fallbackItems.length} items`);
        
        const mapped = fallbackItems.map(item => ({
          dish: item.name,
          calories: item.calories || 200,
          isVeg: item.isVeg,
          spiceLevel: item.spicinessLevel,
          restaurant: {
            name: item.restaurantId?.name || "Unknown",
            city: item.restaurantId?.location?.city || "Unknown",
            rating: item.restaurantId?.rating || 3.5,
            sentimentScore: item.restaurantId?.sentimentScore || 0,
            latitude: item.restaurantId?.location?.latitude || "0",
            longitude: item.restaurantId?.location?.longitude || "0"
          }
        }));
        
        // Apply location filtering and ranking
        let filtered = mapped;
        if (userLocation?.lat != null && userLocation?.lng != null) {
          filtered = mapped
            .map(r => {
              const lat = parseFloat(r.restaurant.latitude);
              const lng = parseFloat(r.restaurant.longitude);
              if (isNaN(lat) || isNaN(lng)) return null;
              const distanceKm = getDistanceKm(userLocation.lat, userLocation.lng, lat, lng);
              if (isNaN(distanceKm)) return null;
              return { ...r, distanceKm };
            })
            .filter(Boolean)
            .filter(r => r.distanceKm <= 500);
        }
        
        const ranked = rankResults(filtered);
        
        return res.json({
          recommendations: ranked,
          totalCalories: ranked.reduce((sum, r) => sum + r.calories, 0),
          note: "Found using constraint-based search"
        });
      }
      
      return res.json({
        recommendations: [],
        note: "No dishes found matching your preferences"
      });
    }

    /* ------------------ APPLY CONSTRAINTS ------------------ */
    const constraints = extractConstraints(message);
    let allRecommendations = [];

    for (const dish of llmResult.dishes) {
      let query = { name: new RegExp(dish, "i") };

      // Apply diet constraints
      if (constraints.isVeg) query.isVeg = true;
      if (constraints.isNonVeg) query.isVeg = false;
      
      // Apply spice level constraints
      if (constraints.spicy) query.spicinessLevel = { $gte: 3 };
      if (constraints.mild) query.spicinessLevel = { $lte: 2 };

      console.log(`🔍 Searching for dish: "${dish}" with constraints:`, constraints);
      console.log(`📋 MongoDB query:`, JSON.stringify(query));

      const items = await MenuItem.find(query).populate("restaurantId");
      console.log(`📊 Found ${items.length} items for "${dish}"`);
      
      // If no exact matches and we have mood constraints, try broader search
      if (items.length === 0 && (constraints.wantsFried || constraints.wantsCurry)) {
        let broadQuery = {};
        
        // Apply diet constraints to broad search
        if (constraints.isVeg) broadQuery.isVeg = true;
        if (constraints.isNonVeg) broadQuery.isVeg = false;
        if (constraints.spicy) broadQuery.spicinessLevel = { $gte: 3 };
        if (constraints.mild) broadQuery.spicinessLevel = { $lte: 2 };
        
        // Add mood-based name matching
        if (constraints.wantsFried) {
          broadQuery.name = /fry|fried|crispy/i;
        } else if (constraints.wantsCurry) {
          broadQuery.name = /curry|gravy|masala|kuzhambu/i;
        }
        
        console.log(`🔄 Trying broader search:`, JSON.stringify(broadQuery));
        const broadItems = await MenuItem.find(broadQuery).populate("restaurantId").limit(5);
        console.log(`📊 Broad search found ${broadItems.length} items`);
        items.push(...broadItems);
      }

      const mapped = items.map(item => ({
        dish: item.name,
        calories: item.calories || 200,
        isVeg: item.isVeg,
        spiceLevel: item.spicinessLevel,

        /* 🔁 Normalize DB fields here */
        restaurant: {
          name: item.restaurantId?.name || "Unknown",
          city: item.restaurantId?.location?.city || "Unknown",
          rating: item.restaurantId?.rating || 3.5,
          sentimentScore: item.restaurantId?.sentimentScore || 0,
          latitude: item.restaurantId?.location?.latitude || "0",
          longitude: item.restaurantId?.location?.longitude || "0"
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

    /* ------------------ GROUP BY DISH NAME ------------------ */
    const groupedDishes = {};
    
    ranked.forEach(item => {
      const dishKey = item.dish.toLowerCase().trim();
      
      if (!groupedDishes[dishKey]) {
        groupedDishes[dishKey] = {
          dish: item.dish,
          calories: item.calories,
          isVeg: item.isVeg,
          spiceLevel: item.spiceLevel,
          restaurants: [],
          bestScore: item.finalScore
        };
      }
      
      // Add restaurant to the dish
      groupedDishes[dishKey].restaurants.push({
        name: item.restaurant.name,
        city: item.restaurant.city,
        rating: item.restaurant.rating,
        distanceKm: item.distanceKm,
        finalScore: item.finalScore,
        reasoning: item.reasoning
      });
      
      // Update best score if this restaurant is better
      if (item.finalScore > groupedDishes[dishKey].bestScore) {
        groupedDishes[dishKey].bestScore = item.finalScore;
      }
    });
    
    // Sort restaurants within each dish by score
    Object.values(groupedDishes).forEach(dish => {
      dish.restaurants.sort((a, b) => b.finalScore - a.finalScore);
    });
    
    // Convert to array and sort dishes by best restaurant score
    const groupedRecommendations = Object.values(groupedDishes)
      .sort((a, b) => b.bestScore - a.bestScore);

    /* ------------------ FINAL RESPONSE ------------------ */
    return res.json({
      recommendations: groupedRecommendations,
      totalCalories: groupedRecommendations.reduce(
        (sum, r) => sum + r.calories,
        0
      ),
      note: "Grouped by dish with ranked restaurants"
    });

  } catch (err) {
    console.error("❌ Chat route error:", err);
    return res.status(500).json({ error: "Chat processing failed" });
  }

});

export default router;
