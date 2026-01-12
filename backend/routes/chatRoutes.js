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

/* ------------------ SAFE LLM PARSER WITH CONVERSATION ------------------ */
async function getChatResponseFromLLM(prompt, maxRetries = 2) {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const raw = await askGroq(prompt);
      console.log(`🔁 Attempt ${i + 1} RAW RESPONSE:\n`, raw);

      if (!raw || raw.toLowerCase().includes("no response")) continue;

      // Clean HTML entities first
      const cleanedRaw = raw.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
      
      // Try multiple JSON extraction strategies
      let jsonStr = null;
      let conversationText = cleanedRaw;
      
      // Strategy 1: Look for complete JSON block
      const completeJsonMatch = cleanedRaw.match(/\{[\s\S]*?"dishes"[\s\S]*?\]/s);
      if (completeJsonMatch) {
        jsonStr = completeJsonMatch[0] + '}';
        conversationText = cleanedRaw.replace(completeJsonMatch[0], '').replace(/```json|```/g, '').trim();
      }
      
      // Strategy 2: Look for partial JSON and try to complete it
      if (!jsonStr) {
        const partialMatch = cleanedRaw.match(/\{[\s\S]*?"dishes"[\s\S]*?\[([^\]]*)/s);
        if (partialMatch) {
          const dishesContent = partialMatch[1];
          // Extract dish names from partial content
          const dishMatches = dishesContent.match(/"([^"]+)"/g);
          if (dishMatches) {
            const dishes = dishMatches.map(d => d.replace(/"/g, ''));
            jsonStr = `{"dishes": [${dishes.map(d => `"${d}"`).join(', ')}]}`;
            conversationText = cleanedRaw.substring(0, partialMatch.index).trim();
          }
        }
      }
      
      // Strategy 3: Extract any quoted food items as fallback
      if (!jsonStr) {
        const quotedItems = cleanedRaw.match(/"([A-Za-z\s]+(?:Curry|Rice|Biryani|Masala|Fry|Kuzhambu|Sambar|Rasam|Dosa|Idli|Vada|Parotta))"/gi);
        if (quotedItems && quotedItems.length > 0) {
          const dishes = quotedItems.slice(0, 3).map(item => item.replace(/"/g, ''));
          jsonStr = `{"dishes": [${dishes.map(d => `"${d}"`).join(', ')}]}`;
        }
      }
      
      if (jsonStr) {
        try {
          const parsed = JSON.parse(jsonStr);
          console.log('✅ Successfully parsed JSON:', parsed);
          
          return {
            dishes: Array.isArray(parsed.dishes) ? parsed.dishes : [],
            conversation: conversationText || "Here are some great options for you!",
            rawResponse: raw
          };
        } catch (parseError) {
          console.warn('⚠️ JSON parse failed for:', jsonStr, parseError.message);
        }
      }
      
      // If all JSON strategies fail, return conversation only
      return {
        dishes: [],
        conversation: conversationText || "Let me find some great options for you!",
        rawResponse: raw
      };
      
    } catch (error) {
      console.error(`❌ Attempt ${i + 1} failed:`, error.message);
      if (i === maxRetries) {
        return {
          dishes: [],
          conversation: "I'm having trouble understanding your request right now. Let me suggest some popular dishes instead!",
          rawResponse: null
        };
      }
    }
  }
  
  return {
    dishes: [],
    conversation: "I'm experiencing some technical difficulties. Let me try a different approach!",
    rawResponse: null
  };
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

    /* ------------------ CONVERSATIONAL PROMPT ------------------ */
    const prompt = `
You are Smart Dine, a friendly and helpful food recommendation assistant. You understand food cravings, moods, and preferences.

User says: "${message}"

Based on the menu items below, provide a warm, conversational response followed by dish recommendations.

MENU CONTEXT:
${context}

Respond in this format:
1. First, give a friendly, understanding response about their request (2-3 sentences)
2. Then provide JSON with dish recommendations

Example:
"I totally understand that craving for something spicy and comforting! Based on your mood, I think these dishes would be perfect for you right now.

{
  "dishes": ["Chicken Curry", "Mutton Biryani"]
}"

Be empathetic, supportive, and make food suggestions that match their emotional state or preferences.`;

    /* ------------------ LLM CALL ------------------ */
    const llmResult = await getChatResponseFromLLM(prompt, 2);
    console.log("🤖 LLM Result:", llmResult);

    // Store conversation for response
    const aiConversation = llmResult.conversation || "Let me find some great options for you!";
    
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
        
        // Group fallback items by dish name and add location filtering
        const dishGroups = {};
        
        fallbackItems.forEach(item => {
          const dishKey = item.name.toLowerCase().trim();
          
          if (!dishGroups[dishKey]) {
            dishGroups[dishKey] = {
              dish: item.name,
              calories: item.calories || 200,
              isVeg: item.isVeg,
              spiceLevel: item.spicinessLevel,
              restaurants: []
            };
          }
          
          // Add restaurant info
          dishGroups[dishKey].restaurants.push({
            name: item.restaurantId?.name || "Unknown",
            city: item.restaurantId?.location?.city || "Unknown",
            rating: item.restaurantId?.rating || 3.5,
            sentimentScore: item.restaurantId?.sentimentScore || 0,
            latitude: item.restaurantId?.location?.latitude || "0",
            longitude: item.restaurantId?.location?.longitude || "0"
          });
        });
        
        // Convert to array format
        let groupedFallback = Object.values(dishGroups);
        
        // Apply location filtering to each restaurant within dishes
        if (userLocation?.lat != null && userLocation?.lng != null) {
          groupedFallback = groupedFallback.map(dish => {
            const filteredRestaurants = dish.restaurants
              .map(r => {
                const lat = parseFloat(r.latitude);
                const lng = parseFloat(r.longitude);
                if (isNaN(lat) || isNaN(lng)) return null;
                const distanceKm = getDistanceKm(userLocation.lat, userLocation.lng, lat, lng);
                if (isNaN(distanceKm) || distanceKm > 500) return null;
                return { ...r, distanceKm };
              })
              .filter(Boolean)
              .sort((a, b) => {
                const scoreA = a.rating * 0.5 + (a.sentimentScore || 0) * 0.3 + ((30 - a.distanceKm) / 30) * 0.2;
                const scoreB = b.rating * 0.5 + (b.sentimentScore || 0) * 0.3 + ((30 - b.distanceKm) / 30) * 0.2;
                return scoreB - scoreA;
              });
            
            return filteredRestaurants.length > 0 ? { ...dish, restaurants: filteredRestaurants } : null;
          })
          .filter(Boolean);
        }
        
        return res.json({
          recommendations: groupedFallback,
          totalCalories: groupedFallback.reduce((sum, r) => sum + r.calories, 0),
          conversation: "I found some great options that match what you're looking for! Here are my recommendations based on your preferences:",
          note: "Found using constraint-based search"
        });
      }
      
      return res.json({
        recommendations: [],
        conversation: "I'm sorry, I couldn't find any dishes that match your specific preferences right now. Could you try describing what you're in the mood for differently? Maybe mention a cuisine type or specific ingredient?",
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
        conversation: "Hmm, I couldn't find exact matches for what you mentioned. Let me suggest some popular dishes that might interest you instead! What type of cuisine are you in the mood for?",
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

    /* ------------------ FINAL RESPONSE WITH CONVERSATION ------------------ */
    const totalCalories = groupedRecommendations.reduce((sum, r) => sum + r.calories, 0);
    
    // Generate supportive message based on results
    let supportiveMessage = aiConversation;
    if (groupedRecommendations.length > 0) {
      const calorieAdvice = totalCalories > 800 ? 
        " These are quite hearty options - perfect if you're really hungry!" :
        totalCalories < 400 ?
        " These are lighter options that won't weigh you down." :
        " These should satisfy your craving perfectly!";
      
      supportiveMessage += calorieAdvice;
      
      if (groupedRecommendations.some(d => d.spiceLevel >= 4)) {
        supportiveMessage += " I noticed you might enjoy some heat - these spicy options should hit the spot!";
      }
    }
    
    return res.json({
      recommendations: groupedRecommendations,
      totalCalories,
      conversation: supportiveMessage,
      note: "Grouped by dish with ranked restaurants"
    });

  } catch (err) {
    console.error("❌ Chat route error:", err);
    return res.status(500).json({ error: "Chat processing failed" });
  }

});

export default router;
