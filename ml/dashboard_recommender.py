import sys
import json
import os
import pandas as pd
from pymongo import MongoClient
from dotenv import load_dotenv
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Load environment
ENV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend/.env"))
load_dotenv(ENV_PATH)

def get_dashboard_recommendations(user_id, consumed_calories, calorie_goal):
    try:
        client = MongoClient(os.getenv("MONGO_URI"))
        db = client["test"]
        
        # Get user profile and today's meals
        user = db.users.find_one({"_id": user_id}) if user_id else None
        if not user:
            user = {"preferences": {"dietType": "non-veg"}, "health": {"conditions": []}}
        
        health = user.get("health", {})
        prefs = user.get("preferences", {})
        diet_type = prefs.get("dietType", "non-veg")
        conditions = [c.lower() for c in health.get("conditions", [])]
        
        remaining_calories = calorie_goal - consumed_calories
        
        # Get today's meal breakdown to suggest next meal
        from datetime import datetime, timedelta
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        tomorrow = today + timedelta(days=1)
        
        today_meals = list(db.calorielogs.find({
            "userId": user_id,
            "date": {"$gte": today, "$lt": tomorrow}
        }))
        
        # Determine next meal type based on time and existing meals
        current_hour = datetime.now().hour
        meal_types_logged = [meal.get("mealType", "snack") for meal in today_meals]
        
        # Smart meal progression logic
        suggested_meal_type = "snack"  # default
        
        if "breakfast" not in meal_types_logged and current_hour < 11:
            suggested_meal_type = "breakfast"
        elif "lunch" not in meal_types_logged and current_hour >= 11 and current_hour < 17:
            suggested_meal_type = "lunch"
        elif "dinner" not in meal_types_logged and current_hour >= 17:
            suggested_meal_type = "dinner"
        elif len(meal_types_logged) >= 3:  # All main meals done, suggest snack
            suggested_meal_type = "snack"
        else:
            # Enhanced time-based fallback
            if current_hour < 11 and "breakfast" not in meal_types_logged:
                suggested_meal_type = "breakfast"
            elif current_hour >= 11 and current_hour < 17 and "lunch" not in meal_types_logged:
                suggested_meal_type = "lunch"
            elif current_hour >= 17 and "dinner" not in meal_types_logged:
                suggested_meal_type = "dinner"
            else:
                suggested_meal_type = "snack"
        
        # Load menu items with meal-type filtering
        meal_type_foods = {
            "breakfast": ["idli", "dosa", "pongal", "upma", "uttapam", "vada", "poori"],
            "lunch": ["meals", "biryani", "curry", "rice", "sambar", "rasam"],
            "dinner": ["curry", "rice", "biryani", "chapati", "naan", "dal"],
            "snack": ["fry", "tikka", "chaat", "samosa", "pakora"]
        }
        
        # Create regex pattern for suggested meal type
        meal_keywords = meal_type_foods.get(suggested_meal_type, [])
        meal_pattern = "|".join(meal_keywords) if meal_keywords else ".*"
        
        menu_items = list(db.menuitems.find({
            "name": {"$regex": meal_pattern, "$options": "i"}
        }))
        
        # If no meal-specific items found, get all items
        if len(menu_items) < 5:
            menu_items = list(db.menuitems.find())
        
        rows = []
        for item in menu_items:
            restaurant = db.restaurants.find_one({"_id": item["restaurantId"]})
            if not restaurant:
                continue
                
            rows.append({
                "item_id": str(item["_id"]),
                "name": item.get("name"),
                "restaurant": restaurant.get("name", "Unknown"),
                "isVeg": item.get("isVeg", False),
                "calories": item.get("calories", 200),
                "spice": item.get("spicinessLevel", 2),
                "rating": restaurant.get("rating", 3.5),
                "text": f"{item.get('name','')} {item.get('description','')}"
            })
        
        df = pd.DataFrame(rows)
        
        # Force include some non-veg items if none exist in current selection
        if len(df[df['isVeg'] == False]) == 0:
            # Get some non-veg items without meal-type restriction
            non_veg_items = list(db.menuitems.find({
                "isVeg": False,
                "calories": {"$lte": remaining_calories + 200}
            }).limit(10))
            
            for item in non_veg_items:
                restaurant = db.restaurants.find_one({"_id": item["restaurantId"]})
                if restaurant:
                    rows.append({
                        "item_id": str(item["_id"]),
                        "name": item.get("name"),
                        "restaurant": restaurant.get("name", "Unknown"),
                        "isVeg": item.get("isVeg", False),
                        "calories": item.get("calories", 200),
                        "spice": item.get("spicinessLevel", 2),
                        "rating": restaurant.get("rating", 3.5),
                        "text": f"{item.get('name','')} {item.get('description','')}"
                    })
            
            # Recreate dataframe with additional items
            df = pd.DataFrame(rows)
        
        # Filter by remaining calories (with some buffer)
        df = df[df["calories"] <= remaining_calories + 100]
        
        if df.empty:
            return []
        
        # Content-based similarity
        vectorizer = TfidfVectorizer(stop_words="english")
        tfidf = vectorizer.fit_transform(df["text"])
        content_sim = cosine_similarity(tfidf)
        
        # Health-aware scoring
        final_scores = []
        
        for idx, row in df.iterrows():
            # Base score from content similarity + rating
            score = content_sim[0][idx] * 0.6 + (row["rating"] / 5.0) * 0.4
            explanation = []
            
            # Calorie fitness
            if row["calories"] <= remaining_calories:
                score += 0.2
                explanation.append("Fits calorie budget")
            
            # Health condition penalties
            if "diabetes" in conditions and row["calories"] > 300:
                score -= 0.15
                explanation.append("High calories for diabetes")
            
            if "bp" in conditions and row["spice"] >= 4:
                score -= 0.1
                explanation.append("High spice for BP")
            
            # Prefer balanced meals
            if 150 <= row["calories"] <= 400:
                score += 0.1
                explanation.append("Balanced portion")
            
            final_scores.append({
                "dish": row["name"],
                "restaurant": row["restaurant"],
                "calories": int(row["calories"]),
                "spice": int(row["spice"]),
                "isVeg": bool(row["isVeg"]),
                "final_score": round(score, 3),
                "reason": "; ".join(explanation) if explanation else "Good match",
                "suggestedMealType": suggested_meal_type
            })
        
        # Sort by score first
        result = sorted(final_scores, key=lambda x: x["final_score"], reverse=True)
        
        # Ensure dish diversity - avoid same dish from multiple restaurants
        diverse_result = []
        seen_dishes = set()
        veg_items = [item for item in result if item["isVeg"]]
        non_veg_items = [item for item in result if not item["isVeg"]]
        
        # Force alternating selection to ensure variety
        max_items = 6
        veg_added = 0
        non_veg_added = 0
        
        # Add items alternating between veg and non-veg
        for i in range(max_items):
            if i % 2 == 0:  # Even positions: try veg first
                if veg_added < len(veg_items) and veg_added < 3:  # Max 3 veg
                    for item in veg_items[veg_added:]:
                        dish_base = item["dish"].lower().split()[0]  # Use first word only
                        if dish_base not in seen_dishes:
                            diverse_result.append(item)
                            seen_dishes.add(dish_base)
                            veg_added = veg_items.index(item) + 1
                            break
                # If no unique veg available, try non-veg
                if len(diverse_result) == i:  # No veg was added
                    for item in non_veg_items[non_veg_added:]:
                        dish_base = item["dish"].lower().split()[0]
                        if dish_base not in seen_dishes:
                            diverse_result.append(item)
                            seen_dishes.add(dish_base)
                            non_veg_added = non_veg_items.index(item) + 1
                            break
            else:  # Odd positions: try non-veg first
                if non_veg_added < len(non_veg_items) and non_veg_added < 3:  # Max 3 non-veg
                    for item in non_veg_items[non_veg_added:]:
                        dish_base = item["dish"].lower().split()[0]
                        if dish_base not in seen_dishes:
                            diverse_result.append(item)
                            seen_dishes.add(dish_base)
                            non_veg_added = non_veg_items.index(item) + 1
                            break
                # If no unique non-veg available, try veg
                if len(diverse_result) == i:  # No non-veg was added
                    for item in veg_items[veg_added:]:
                        dish_base = item["dish"].lower().split()[0]
                        if dish_base not in seen_dishes:
                            diverse_result.append(item)
                            seen_dishes.add(dish_base)
                            veg_added = veg_items.index(item) + 1
                            break
        
        return diverse_result[:6]
        
    except Exception as e:
        print(f"Error in dashboard recommender: {e}", file=sys.stderr)
        return []

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python dashboard_recommender.py <user_id> <consumed_calories> <calorie_goal>")
        sys.exit(1)
    
    user_id = sys.argv[1] if sys.argv[1] != "null" else None
    consumed_calories = int(sys.argv[2])
    calorie_goal = int(sys.argv[3])
    
    recommendations = get_dashboard_recommendations(user_id, consumed_calories, calorie_goal)
    print(json.dumps(recommendations))