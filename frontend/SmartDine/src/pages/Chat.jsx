import { useState } from "react";
import axios from "axios";
import useLocation from "../hooks/useLocation";

function Chat() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [expandedDish, setExpandedDish] = useState(null);
  const { location } = useLocation();


  const userId = localStorage.getItem("userId");

  const sendMessage = async () => {
    if (!message.trim()) return;

    setLoading(true);
    setResponse(null);

    try {
      const res = await axios.post("http://localhost:5000/api/chat", {
        message,
        userLocation: location
      });

      console.log("API Response:", res.data); // Debug log
      setResponse(res.data);
    } catch (err) {
      console.error(err);
      alert("Error fetching recommendations");
    } finally {
      setLoading(false);
    }
  };

  const addToTracker = async (item) => {
    try {
      await axios.post("http://localhost:5000/api/tracker/add", {
        userId,
        dish: item.dish,
        calories: item.calories
      });
      alert("Calories added");
    } catch {
      alert("Failed to add calories");
    }
  };
  
  const addToMeal = async (item, mealType) => {
    try {
      await axios.post("http://localhost:5000/api/dashboard/add-suggestion", {
        userId,
        dish: item.dish,
        calories: item.calories,
        restaurant: item.restaurant?.name || item.restaurant,
        mealType: mealType
      });
      alert(`${item.dish} added to ${mealType}!`);
    } catch (err) {
      console.error("Add to meal error:", err);
      alert("Failed to add to meal");
    }
  };
  
  const getSuggestedMealType = () => {
    const hour = new Date().getHours();
    if (hour < 10) return "breakfast";
    if (hour < 15) return "lunch";
    if (hour >= 18) return "dinner";
    return "snack";
  };

  const saveRecommendation = async (item) => {
    try {
      await axios.post("http://localhost:5000/api/saved/save", {
        userId,
        dish: item.dish,
        restaurant: item.restaurant,
        city: item.city,
        calories: item.calories,
        isVeg: item.isVeg,
        spiceLevel: item.spiceLevel
      });
      alert("Recommendation saved");
    } catch (err) {
      console.error(err);
      alert("Failed to save recommendation");
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "900px", margin: "auto" }}>
      <h2>🍽 Smart Dine Chat</h2>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask for food recommendations..."
          style={{ flex: 1, padding: "10px" }}
        />
        <button onClick={sendMessage}>Send</button>
      </div>

      {loading && <p>🔄 Fetching recommendations...</p>}

      {response && (
        <div>
          {response.recommendations && response.recommendations.length > 0 ? (
            <div>
              <h3>✅ Recommended Dishes ({response.recommendations.length} found)</h3>
              <p><strong>Total Calories:</strong> {response.totalCalories} kcal</p>

          {response.recommendations.map((dish, i) => (
            <div
              key={i}
              style={{
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "15px",
                marginBottom: "15px",
                backgroundColor: expandedDish === i ? "#f8f9fa" : "white"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <h4>{dish.dish}</h4>
                  <p>🔥 Calories: {dish.calories} kcal | 🌶 Spice: {dish.spiceLevel}/5 | {dish.isVeg ? "🥗 Veg" : "🍗 Non-Veg"}</p>
                  <p style={{ fontSize: "0.9em", color: "#666" }}>
                    🏪 Available at {dish.restaurants.length} restaurant{dish.restaurants.length > 1 ? 's' : ''}
                  </p>
                </div>
                <button 
                  onClick={() => setExpandedDish(expandedDish === i ? null : i)}
                  style={{ 
                    padding: "8px 15px", 
                    backgroundColor: "#007bff", 
                    color: "white", 
                    border: "none", 
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  {expandedDish === i ? "▲ Hide" : "▼ Show"} Restaurants
                </button>
              </div>
              
              {expandedDish === i && (
                <div style={{ marginTop: "15px", borderTop: "1px solid #ddd", paddingTop: "15px" }}>
                  <h5 style={{ marginBottom: "10px" }}>🏪 Select Restaurant:</h5>
                  {dish.restaurants.map((restaurant, rIdx) => (
                    <div 
                      key={rIdx}
                      style={{
                        padding: "12px",
                        marginBottom: "10px",
                        border: "1px solid #e0e0e0",
                        borderRadius: "6px",
                        backgroundColor: rIdx === 0 ? "#e8f5e9" : "white"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <div>
                          <strong>{restaurant.name}</strong> {rIdx === 0 && <span style={{ color: "#4caf50", fontSize: "0.8em" }}>(⭐ Best Match)</span>}
                          <p style={{ fontSize: "0.9em", color: "#666", margin: "4px 0" }}>
                            📍 {restaurant.city} | ⭐ {restaurant.rating}/5
                            {restaurant.distanceKm && ` | 🚗 ${restaurant.distanceKm.toFixed(1)} km`}
                          </p>
                          {restaurant.reasoning && (
                            <p style={{ fontSize: "0.8em", color: "#999", margin: "4px 0" }}>
                              💡 {restaurant.reasoning.join(", ")}
                            </p>
                          )}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        <button 
                          onClick={() => addToMeal({ dish: dish.dish, calories: dish.calories, restaurant: restaurant.name }, getSuggestedMealType())}
                          style={{ 
                            padding: "6px 10px", 
                            backgroundColor: "#007bff", 
                            color: "white", 
                            border: "none", 
                            borderRadius: "4px",
                            fontSize: "0.85em",
                            cursor: "pointer"
                          }}
                        >
                          🍽️ Add to {getSuggestedMealType().charAt(0).toUpperCase() + getSuggestedMealType().slice(1)}
                        </button>
                        
                        <select 
                          onChange={(e) => {
                            if (e.target.value) {
                              addToMeal({ dish: dish.dish, calories: dish.calories, restaurant: restaurant.name }, e.target.value);
                              e.target.value = "";
                            }
                          }}
                          style={{ padding: "6px", fontSize: "0.85em", borderRadius: "4px", border: "1px solid #ddd" }}
                        >
                          <option value="">Other meal...</option>
                          <option value="breakfast">🍳 Breakfast</option>
                          <option value="lunch">🍱 Lunch</option>
                          <option value="dinner">🍽️ Dinner</option>
                          <option value="snack">🍪 Snack</option>
                        </select>

                        <button 
                          onClick={() => addToTracker({ dish: dish.dish, calories: dish.calories })}
                          style={{ 
                            padding: "6px 10px", 
                            backgroundColor: "#28a745", 
                            color: "white", 
                            border: "none", 
                            borderRadius: "4px",
                            fontSize: "0.85em",
                            cursor: "pointer"
                          }}
                        >
                          📊 Track
                        </button>

                        <button 
                          onClick={() => saveRecommendation({
                            dish: dish.dish,
                            restaurant: restaurant.name,
                            city: restaurant.city,
                            calories: dish.calories,
                            isVeg: dish.isVeg,
                            spiceLevel: dish.spiceLevel
                          })}
                          style={{ 
                            padding: "6px 10px", 
                            backgroundColor: "#6c757d", 
                            color: "white", 
                            border: "none", 
                            borderRadius: "4px",
                            fontSize: "0.85em",
                            cursor: "pointer"
                          }}
                        >
                          💾 Save
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
            </div>
          ) : (
            <div>
              <h3>⚠️ No Recommendations Found</h3>
              <p>Try a different search or check your location settings.</p>
            </div>
          )}
        </div>
      )}

      {response && response.note && (
        <p style={{ color: "gray" }}>{response.note}</p>
      )}
    </div>
  );
}

export default Chat;
