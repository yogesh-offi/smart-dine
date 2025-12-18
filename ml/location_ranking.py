import os
import math
import pandas as pd
from pymongo import MongoClient
from dotenv import load_dotenv

# --------------------------------------------------
# 1️⃣ Load env & DB
# --------------------------------------------------
ENV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend/.env"))
load_dotenv(ENV_PATH)

client = MongoClient(os.getenv("MONGO_URI"))
db = client["test"]

# --------------------------------------------------
# 2️⃣ User location (example: Coimbatore)
# --------------------------------------------------
user_location = {
    "lat": 11.0168,
    "lon": 76.9558
}

# --------------------------------------------------
# 3️⃣ Haversine distance function
# --------------------------------------------------
def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    a = (
        math.sin(dlat / 2) ** 2 +
        math.cos(math.radians(lat1)) *
        math.cos(math.radians(lat2)) *
        math.sin(dlon / 2) ** 2
    )

    return 2 * R * math.asin(math.sqrt(a))

# --------------------------------------------------
# 4️⃣ Load restaurants
# --------------------------------------------------
restaurants = list(db.restaurants.find())

rows = []

for r in restaurants:
    loc = r.get("location", {})
    lat = loc.get("latitude")
    lon = loc.get("longitude")

    # ❌ Skip if no coordinates
    if lat is None or lon is None:
        continue

    distance = haversine(
        user_location["lat"],
        user_location["lon"],
        lat,
        lon
    )

    sentiment = r.get("sentimentScore", 0)
    rating = r.get("rating", 3)

    # Normalize values
    distance_score = max(0, 1 - (distance / 10))   # within 10 km
    quality_score = (rating / 5) + sentiment

    final_score = round(
        0.6 * quality_score + 0.4 * distance_score,
        3
    )

    rows.append({
        "restaurant": r.get("name"),
        "city": loc.get("city"),
        "distance_km": round(distance, 2),
        "final_score": final_score
    })

df = pd.DataFrame(rows)

# --------------------------------------------------
# 5️⃣ Filter & Rank
# --------------------------------------------------
df = df.sort_values("final_score", ascending=False)

print("📍 NEARBY RESTAURANT RECOMMENDATIONS")
print(df.head(5))
