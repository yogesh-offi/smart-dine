import os
import pandas as pd
from pymongo import MongoClient
from dotenv import load_dotenv
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# --------------------------------------------------
# 1️⃣ Load env & connect DB
# --------------------------------------------------
ENV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend/.env"))
load_dotenv(ENV_PATH)

client = MongoClient(os.getenv("MONGO_URI"))
db = client["test"]

# --------------------------------------------------
# 2️⃣ Load ONE sample user with health profile
# --------------------------------------------------
user = db.users.find_one()

health = user.get("health", {})
prefs = user.get("preferences", {})

diet_type = prefs.get("dietType", "non-veg")
calorie_goal = prefs.get("calorieGoal", 2000)
conditions = [c.lower() for c in health.get("conditions", [])]

# --------------------------------------------------
# 3️⃣ Load menu items
# --------------------------------------------------
menu_items = list(db.menuitems.find())

rows = []
for item in menu_items:
    rows.append({
        "item_id": str(item["_id"]),
        "name": item.get("name"),
        "isVeg": item.get("isVeg", False),
        "calories": item.get("nutrition", {}).get("calories", 300),
        "spice": item.get("spicinessLevel", 2),
        "text": f"{item.get('name','')} {item.get('description','')}"
    })

df = pd.DataFrame(rows)

# --------------------------------------------------
# 4️⃣ HARD CONSTRAINTS (FILTER)
# --------------------------------------------------
if diet_type == "veg":
    df = df[df["isVeg"] == True]

# --------------------------------------------------
# 5️⃣ Content similarity
# --------------------------------------------------
vectorizer = TfidfVectorizer(stop_words="english")
tfidf = vectorizer.fit_transform(df["text"])
content_sim = cosine_similarity(tfidf)

# --------------------------------------------------
# 6️⃣ Health-aware scoring
# --------------------------------------------------
final_scores = []

for idx, row in df.iterrows():
    score = content_sim[0][idx]  # base similarity
    explanation = []

    # 🔹 Soft: calorie penalty
    if row["calories"] > calorie_goal:
        score -= 0.15
        explanation.append("High calories")

    # 🔹 Soft: diabetes rule
    if "diabetes" in conditions and row["calories"] > 400:
        score -= 0.2
        explanation.append("Not ideal for diabetes")

    # 🔹 Soft: BP & spice
    if "bp" in conditions and row["spice"] >= 4:
        score -= 0.15
        explanation.append("Too spicy for BP")

    final_scores.append({
        "item": row["name"],
        "final_score": round(score, 3),
        "calories": row["calories"],
        "spice": row["spice"],
        "reason": ", ".join(explanation) if explanation else "Health-compatible"
    })

# --------------------------------------------------
# 7️⃣ Show final recommendations
# --------------------------------------------------
result = pd.DataFrame(final_scores)
result = result.sort_values("final_score", ascending=False)

print("🥗 HEALTH-AWARE RECOMMENDATIONS")
print(result.head(5))
