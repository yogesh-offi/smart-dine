import sys
from retrieve_menu import retrieve

def enhance_query(query):
    """Enhance emotional queries with food-related keywords"""
    query_lower = query.lower()
    enhanced_terms = []
    
    # Diet type mappings - PRIORITY
    if 'non veg' in query_lower or 'nonveg' in query_lower:
        enhanced_terms.extend(['chicken', 'mutton', 'fish', 'egg', 'meat'])
    elif any(word in query_lower for word in ['chicken', 'mutton', 'fish', 'egg', 'meat']):
        enhanced_terms.extend(['chicken', 'mutton', 'fish', 'egg'])
    
    # Mood to food mappings
    if any(word in query_lower for word in ['stressed', 'tired', 'comfort', 'cozy']):
        enhanced_terms.extend(['curry', 'rice', 'dal'])
    
    if any(word in query_lower for word in ['spicy', 'hot', 'fiery', 'kick']):
        enhanced_terms.extend(['spicy', 'pepper', 'chili', 'masala'])
        
    if any(word in query_lower for word in ['light', 'fresh', 'healthy', 'clean']):
        enhanced_terms.extend(['salad', 'soup', 'steamed', 'grilled'])
        
    if any(word in query_lower for word in ['rich', 'indulgent', 'heavy', 'satisfying']):
        enhanced_terms.extend(['biryani', 'butter', 'cream', 'ghee'])
        
    if any(word in query_lower for word in ['crispy', 'crunchy', 'fried']):
        enhanced_terms.extend(['fry', 'fried', 'crispy', 'roast'])
    
    # Combine original query with enhanced terms
    if enhanced_terms:
        return f"{query} {' '.join(enhanced_terms)}"
    return query

query = sys.argv[1]
enhanced_query = enhance_query(query)

results = retrieve(enhanced_query, top_k=5)

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

