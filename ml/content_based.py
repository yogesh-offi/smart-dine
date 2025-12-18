import os
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from pymongo import MongoClient
from dotenv import load_dotenv

# 🔴 EXPLICITLY LOAD BACKEND ENV FILE
ENV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend/.env"))
load_dotenv(ENV_PATH)

# 🔎 DEBUG PRINT (TEMPORARY)
# print("Loaded MONGO_URI:", os.getenv("MONGO_URI"))

# ❌ STOP IF ENV NOT LOADED
if not os.getenv("MONGO_URI"):
    raise Exception("MONGO_URI not loaded. Check .env path.")

# ✅ CONNECT TO ATLAS (NOT LOCALHOST)
client = MongoClient(os.getenv("MONGO_URI"))

# ⚠️ EXPLICIT DB NAME
db = client["test"]

# Load menu items
items = list(db.menuitems.find())
# print("Total menu items fetched:", len(items))

# Build dataframe
data = []

for item in items:
    name = item.get("name", "")
    desc = item.get("description", "")
    cuisine = item.get("cuisine", "")
    is_veg = "veg" if item.get("isVeg", False) else "non-veg"
    spice = "spicy " * int(item.get("spicinessLevel", 1))

    text = f"{name} {desc} {cuisine} {is_veg} {spice}".strip()

    data.append({
        "id": str(item["_id"]),
        "text": text
    })


df = pd.DataFrame(data)

# print("DataFrame columns:", df.columns)
# print("Total rows in DataFrame:", len(df))

if df.empty:
    raise Exception("No data available for TF-IDF. Check menu items.")


# TF-IDF
vectorizer = TfidfVectorizer(stop_words="english")
tfidf_matrix = vectorizer.fit_transform(df["text"])

# Similarity matrix
similarity = cosine_similarity(tfidf_matrix)

print("✅ Content-based similarity matrix built")

# Example: recommend similar to first item
idx = 0
scores = list(enumerate(similarity[idx]))
scores = sorted(scores, key=lambda x: x[1], reverse=True)[1:6]

print("🔍 Recommendations for:", df.iloc[idx]["text"])
for i, score in scores:
    print("-", df.iloc[i]["text"], "(score:", round(score, 2), ")")
