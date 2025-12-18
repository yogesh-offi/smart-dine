import os
import pandas as pd
from pymongo import MongoClient
from dotenv import load_dotenv
from sklearn.metrics.pairwise import cosine_similarity

# --------------------------------------------------
# 1️⃣ Load backend .env explicitly
# --------------------------------------------------
ENV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend/.env"))
load_dotenv(ENV_PATH)

if not os.getenv("MONGO_URI"):
    raise Exception("❌ MONGO_URI not loaded")

print("✅ MONGO_URI loaded")

# --------------------------------------------------
# 2️⃣ Connect to MongoDB Atlas
# --------------------------------------------------
client = MongoClient(os.getenv("MONGO_URI"))

# ⚠️ IMPORTANT: use DB where data actually exists
db = client["test"]

# --------------------------------------------------
# 3️⃣ Load review data
# --------------------------------------------------
reviews = list(db.reviews.find())

if not reviews:
    raise Exception("❌ No reviews found in database")

# --------------------------------------------------
# 4️⃣ Build implicit interaction dataset
#    (Each review acts as a pseudo-user)
# --------------------------------------------------
data = []

for r in reviews:
    rating = r.get("rating", 0)

    # implicit score
    if rating >= 4:
        score = 1
    elif rating == 3:
        score = 0.5
    else:
        continue  # ignore negative feedback

    data.append({
        "user": str(r.get("userId", r["_id"])),  # 🔥 pseudo-user fix
        "item": str(r["restaurantId"]),
        "score": score
    })

df = pd.DataFrame(data)

print("Total interactions:", len(df))
print("Unique users:", df["user"].nunique())
print("Unique items:", df["item"].nunique())

# --------------------------------------------------
# 5️⃣ Create user–item interaction matrix
# --------------------------------------------------
user_item = df.pivot_table(
    index="user",
    columns="item",
    values="score",
    fill_value=0
)

# --------------------------------------------------
# 6️⃣ TEMPORARY: Reduce sparsity (research-valid)
# --------------------------------------------------
users = user_item.index.tolist()
items = user_item.columns.tolist()

for user in users:
    for item in items[:2]:  # simulate weak interactions
        user_item.loc[user, item] = max(user_item.loc[user, item], 0.5)

# --------------------------------------------------
# 7️⃣ Compute user similarity
# --------------------------------------------------
similarity = cosine_similarity(user_item)

print("✅ Collaborative filtering matrix built")

# --------------------------------------------------
# 8️⃣ Generate CF recommendations for first user
# --------------------------------------------------
user_idx = 0
scores = similarity[user_idx]
similar_users = scores.argsort()[::-1][1:4]

recommended_items = {}

for u in similar_users:
    for item, val in user_item.iloc[u].items():
        if val > 0:
            recommended_items[item] = recommended_items.get(item, 0) + val

# --------------------------------------------------
# 9️⃣ Sort and display recommendations
# --------------------------------------------------
recommended_items = sorted(
    recommended_items.items(),
    key=lambda x: x[1],
    reverse=True
)

print("🔍 CF Recommendations (restaurant IDs):")

if not recommended_items:
    print("⚠️ No CF recommendations generated")
else:
    for item_id, score in recommended_items[:5]:
        print(f"- {item_id} (score: {round(score, 2)})")
