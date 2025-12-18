import os
import pickle
from sklearn.metrics.pairwise import cosine_similarity

# 🔥 Always resolve paths relative to this file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
VECTOR_PATH = os.path.join(BASE_DIR, "menu_vectors.pkl")

def retrieve(query, top_k=5):
    with open(VECTOR_PATH, "rb") as f:
        vectorizer, X, meta = pickle.load(f)

    q_vec = vectorizer.transform([query])
    scores = cosine_similarity(q_vec, X)[0]

    top_idx = scores.argsort()[::-1][:top_k]
    return [meta[i] for i in top_idx]
