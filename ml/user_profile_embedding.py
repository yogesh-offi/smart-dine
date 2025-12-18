import os
import numpy as np
import pandas as pd
from pymongo import MongoClient
from dotenv import load_dotenv
from sklearn.feature_extraction.text import TfidfVectorizer

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

menu_texts = []
menu_ids = []
menu_restaurant_map = {}  # menu_item_id -> restaurant_id (string)

for m in menu_items:
    menu_id = str(m["_id"])
    restaurant_id = str(m["restaurantId"])  # ✅ normalize here

    text = f"{m['name']} {m.get('description', '')} {m.get('cuisine', '')}"

    menu_texts.append(text)
    menu_ids.append(menu_id)
    menu_restaurant_map[menu_id] = restaurant_id

df_menu = pd.DataFrame({
    "item_id": menu_ids,
    "text": menu_texts
})

# --------------------------------------------------
# 3️⃣ TF-IDF embeddings
# --------------------------------------------------
vectorizer = TfidfVectorizer(stop_words="english")
tfidf_matrix = vectorizer.fit_transform(df_menu["text"])

# --------------------------------------------------
# 4️⃣ Load reviews (restaurant-level)
# --------------------------------------------------
reviews = list(db.reviews.find())

# Normalize reviewed restaurant IDs
reviewed_restaurants = set(str(r["restaurantId"]) for r in reviews)

print("🔍 Reviewed restaurant IDs:", reviewed_restaurants)

# --------------------------------------------------
# 5️⃣ Collect menu items from reviewed restaurants
# --------------------------------------------------
item_indices = []

for idx, item_id in enumerate(menu_ids):
    if menu_restaurant_map[item_id] in reviewed_restaurants:
        item_indices.append(idx)

print("🔍 Matched menu items:", len(item_indices))

if not item_indices:
    raise Exception("No menu items matched reviewed restaurants")

# --------------------------------------------------
# 6️⃣ Build user embedding
# --------------------------------------------------
user_vector = np.mean(tfidf_matrix[item_indices].toarray(), axis=0)

print("👤 User Profile Embedding Generated")
print("- User: demo_user")
print("- Vector size:", len(user_vector))
print("- Based on menu items:", len(item_indices))
