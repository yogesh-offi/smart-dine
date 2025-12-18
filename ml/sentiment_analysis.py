import os
import pandas as pd
from pymongo import MongoClient
from dotenv import load_dotenv
from nltk.sentiment.vader import SentimentIntensityAnalyzer

# --------------------------------------------------
# 1️⃣ Load env & connect DB
# --------------------------------------------------
ENV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend/.env"))
load_dotenv(ENV_PATH)

client = MongoClient(os.getenv("MONGO_URI"))
db = client["test"]

# --------------------------------------------------
# 2️⃣ Load reviews
# --------------------------------------------------
reviews = list(db.reviews.find())

if not reviews:
    raise Exception("No reviews found")

# --------------------------------------------------
# 3️⃣ Initialize VADER
# --------------------------------------------------
sid = SentimentIntensityAnalyzer()

sentiment_rows = []

for r in reviews:
    text = r.get("reviewText", "")

    if not text.strip():
        continue

    score = sid.polarity_scores(text)["compound"]

    sentiment_rows.append({
        "restaurantId": str(r["restaurantId"]),
        "sentiment": score
    })

df = pd.DataFrame(sentiment_rows)

print("Total sentiment-scored reviews:", len(df))

# --------------------------------------------------
# 4️⃣ Aggregate sentiment per restaurant
# --------------------------------------------------
restaurant_sentiment = (
    df.groupby("restaurantId")["sentiment"]
    .mean()
    .reset_index()
)

restaurant_sentiment["sentiment_label"] = restaurant_sentiment["sentiment"].apply(
    lambda x: "Positive" if x > 0.2 else "Negative" if x < -0.2 else "Neutral"
)

print("📊 Restaurant Sentiment Scores")
print(restaurant_sentiment.head())

# --------------------------------------------------
# 5️⃣ OPTIONAL: Store sentiment back to DB
# --------------------------------------------------
for _, row in restaurant_sentiment.iterrows():
    db.restaurants.update_one(
        {"_id": row["restaurantId"]},
        {"$set": {"sentimentScore": round(row["sentiment"], 3)}}
    )

print("✅ Sentiment scores updated in restaurants collection")
