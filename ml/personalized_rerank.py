import os
import numpy as np
import pandas as pd
from pymongo import MongoClient
from dotenv import load_dotenv
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# --------------------------------------------------
# 1️⃣ Load env & DB
# --------------------------------------------------
ENV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend/.env"))
load_dotenv(ENV_PATH)

client = MongoClient(os.getenv("MONGO_URI"))
db = client["test"]

# --------------------------------------------------
# 2️⃣ Load menu items
# --------------------------------------------------
menu_items = list(db.menuitems.find())

menu_ids = []
menu_texts = []

for m in menu_items:
    menu_ids.append(str(m["_id"]))
    menu_texts.append(
        f"{m['name']} {m.get('description', '')} {m.get('cuisine', '')}"
    )

df_menu = pd.DataFrame({
    "item_id": menu_ids,
    "text": menu_texts
})

# --------------------------------------------------
# 3️⃣ TF-IDF item embeddings
# --------------------------------------------------
vectorizer = TfidfVectorizer(stop_words="english")
item_matrix = vectorizer.fit_transform(df_menu["text"])

# --------------------------------------------------
# 4️⃣ Build USER embedding (reuse Day 18 logic)
# --------------------------------------------------
reviews = list(db.reviews.find())
reviewed_restaurants = set(str(r["restaurantId"]) for r in reviews)

item_restaurant_map = {
    str(m["_id"]): str(m["restaurantId"]) for m in menu_items
}

user_item_indices = [
    idx for idx, item_id in enumerate(menu_ids)
    if item_restaurant_map[item_id] in reviewed_restaurants
]

if not user_item_indices:
    raise Exception("No user interactions found")

user_vector = np.mean(
    item_matrix[user_item_indices].toarray(),
    axis=0
).reshape(1, -1)

# --------------------------------------------------
# 5️⃣ Compute user–item similarity
# --------------------------------------------------
user_similarity = cosine_similarity(user_vector, item_matrix)[0]

# --------------------------------------------------
# 6️⃣ Load hybrid scores (simulate or recompute)
# --------------------------------------------------
# For now, reuse content similarity as hybrid proxy
hybrid_scores = cosine_similarity(item_matrix, item_matrix)[0]

# --------------------------------------------------
# 7️⃣ Personalized re-ranking
# --------------------------------------------------
results = []

for idx, item_id in enumerate(menu_ids):
    final_score = (
        0.6 * hybrid_scores[idx] +
        0.4 * user_similarity[idx]
    )

    results.append({
        "item_id": item_id,
        "final_score": round(final_score, 3),
        "user_similarity": round(user_similarity[idx], 3)
    })

df = pd.DataFrame(results)
df = df.sort_values("final_score", ascending=False)

print("🎯 PERSONALIZED RECOMMENDATIONS")
print(df.head(5))
