import os
import pandas as pd
from pymongo import MongoClient
from dotenv import load_dotenv
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# --------------------------------------------------
# 1️⃣ Load backend .env
# --------------------------------------------------
ENV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend/.env"))
load_dotenv(ENV_PATH)

client = MongoClient(os.getenv("MONGO_URI"))
db = client["test"]  # confirmed DB

# --------------------------------------------------
# 2️⃣ Load menu items
# --------------------------------------------------
menu_items = list(db.menuitems.find())

menu_df = []
for item in menu_items:
    text = f"{item.get('name','')} {item.get('description','')} "
    text += "veg " if item.get("isVeg") else "non-veg "
    text += "spicy " * int(item.get("spicinessLevel", 1))

    menu_df.append({
        "item_id": str(item["_id"]),
        "text": text
    })

menu_df = pd.DataFrame(menu_df)

# --------------------------------------------------
# 3️⃣ Content-based similarity
# --------------------------------------------------
vectorizer = TfidfVectorizer(stop_words="english")
tfidf = vectorizer.fit_transform(menu_df["text"])
content_sim = cosine_similarity(tfidf)

# --------------------------------------------------
# 4️⃣ Collaborative Filtering scores (reuse logic)
# --------------------------------------------------
reviews = list(db.reviews.find())
cf_data = []

for r in reviews:
    rating = r.get("rating", 0)
    if rating >= 4:
        score = 1
    elif rating == 3:
        score = 0.5
    else:
        continue

    cf_data.append({
        "user": str(r.get("userId", r["_id"])),
        "item": str(r["restaurantId"]),
        "score": score
    })

cf_df = pd.DataFrame(cf_data)

user_item = cf_df.pivot_table(
    index="user",
    columns="item",
    values="score",
    fill_value=0
)

# simulate sparsity reduction
for u in user_item.index:
    for i in user_item.columns[:2]:
        user_item.loc[u, i] = max(user_item.loc[u, i], 0.5)

cf_sim = cosine_similarity(user_item)

# --------------------------------------------------
# 5️⃣ Popularity score (average rating)
# --------------------------------------------------
popularity = {}

for r in reviews:
    rid = str(r["restaurantId"])
    popularity.setdefault(rid, []).append(r["rating"])

popularity_score = {
    k: sum(v) / len(v) for k, v in popularity.items()
}

# --------------------------------------------------
# 6️⃣ HYBRID RANKING
# --------------------------------------------------
TARGET_ITEM_INDEX = 0  # example seed item

final_scores = []

for idx, row in menu_df.iterrows():
    item_id = row["item_id"]

    content_score = content_sim[TARGET_ITEM_INDEX][idx]

    cf_score = user_item.iloc[0].get(item_id, 0)

    pop_score = popularity_score.get(item_id, 3) / 5  # normalize

    final = (
        0.5 * content_score +
        0.3 * cf_score +
        0.2 * pop_score
    )

    final_scores.append({
        "item_id": item_id,
        "final_score": round(final, 3),
        "content": round(content_score, 3),
        "cf": round(cf_score, 3),
        "popularity": round(pop_score, 3)
    })

# --------------------------------------------------
# 7️⃣ Show top recommendations
# --------------------------------------------------
final_df = pd.DataFrame(final_scores)
final_df = final_df.sort_values("final_score", ascending=False)

print("🔥 HYBRID RECOMMENDATIONS")
print(final_df.head(5))
