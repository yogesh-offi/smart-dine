import sys
from retrieve_menu import retrieve

query = sys.argv[1]

results = retrieve(query, top_k=5)

context = ""
for r in results:
    context += (
        f"- Dish: {r['dish']}, "
        f"Restaurant: {r['restaurant']} ({r['city']}), "
        f"Veg: {r['isVeg']}, "
        f"Price: {r['price']}, "
        f"Spice: {r['spice']}\n"
    )

print(context)

