import os
import pickle
import pandas as pd
from pymongo import MongoClient
from dotenv import load_dotenv
from sklearn.feature_extraction.text import TfidfVectorizer

ENV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend/.env"))
load_dotenv(ENV_PATH)

client = MongoClient(os.getenv("MONGO_URI"))
db = client["test"]

menu_items = list(db.menuitems.find())

texts = []
meta = []

for m in menu_items:
    text = f"{m['name']} {m.get('description','')} {m.get('cuisine','')}"
    texts.append(text)
    restaurant = db.restaurants.find_one({ "_id": m["restaurantId"] })

    meta.append({
        "item_id": str(m["_id"]),
        "dish": m["name"],
        "restaurant": restaurant["name"] if restaurant else "Unknown",
        "city": restaurant["location"]["city"] if restaurant else "",
        "price": m.get("price"),
        "isVeg": m.get("isVeg"),
        "spice": m.get("spicinessLevel")
    })

vectorizer = TfidfVectorizer(stop_words="english")
X = vectorizer.fit_transform(texts)

with open("ml/menu_vectors.pkl", "wb") as f:
    pickle.dump((vectorizer, X, meta), f)

print("✅ Menu embeddings built and saved")
