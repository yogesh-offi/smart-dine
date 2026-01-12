import { useState } from "react";
import axios from "axios";
import useLocation from "../hooks/useLocation";

function Chat() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [expandedDish, setExpandedDish] = useState(null);
  const { location } = useLocation();

  const userId = localStorage.getItem("userId");

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = message.trim();
    setMessage("");
    setLoading(true);

    // Add user message to chat history
    setChatHistory(prev => [...prev, {
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);

    try {
      const res = await axios.post("http://localhost:5000/api/chat", {
        message: userMessage,
        userLocation: location
      });

      console.log("API Response:", res.data);
      
      // Safely handle response data
      const conversation = res.data?.conversation || "Here are my recommendations for you!";
      const recommendations = Array.isArray(res.data?.recommendations) ? res.data.recommendations : [];
      const totalCalories = res.data?.totalCalories || 0;
      
      // Add AI response to chat history
      setChatHistory(prev => [...prev, {
        type: 'ai',
        content: conversation,
        recommendations: recommendations,
        totalCalories: totalCalories,
        timestamp: new Date()
      }]);
      
    } catch (err) {
      console.error("Chat error:", err);
      
      // Determine error message based on error type
      let errorMessage = "I'm sorry, I'm having trouble connecting right now. Please try again in a moment!";
      
      if (err.response?.status === 500) {
        errorMessage = "I'm experiencing some technical difficulties. Let me try to help you differently - could you describe what type of cuisine you're interested in?";
      } else if (err.code === 'NETWORK_ERROR') {
        errorMessage = "It seems there's a network issue. Please check your connection and try again.";
      }
      
      setChatHistory(prev => [...prev, {
        type: 'ai',
        content: errorMessage,
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
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
    } catch (error) {
      console.error("Tracker error:", error);
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
      console.error("Save error:", err);
      alert("Failed to save recommendation");
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "900px", margin: "auto", minHeight: "80vh" }}>
      <h2>🍽 Smart Dine Chat</h2>
      
      {/* Chat History */}
      <div style={{ 
        height: "500px", 
        overflowY: "auto", 
        border: "1px solid #ddd", 
        borderRadius: "8px", 
        padding: "15px", 
        marginBottom: "20px",
        backgroundColor: "#f9f9f9"
      }}>
        {chatHistory.length === 0 && (
          <div style={{ textAlign: "center", color: "#666", marginTop: "100px" }}>
            <p>👋 Hi! I'm your Smart Dine assistant!</p>
            <p>Tell me what you're craving, your mood, or what kind of food you're in the mood for.</p>
            <p style={{ fontSize: "0.9em", fontStyle: "italic" }}>Try: "I'm stressed and need comfort food" or "Something spicy and exciting!"</p>
          </div>
        )}
        
        {chatHistory.map((chat, index) => (
          <div key={index} style={{ marginBottom: "20px" }}>
            {chat.type === 'user' ? (
              <div style={{ textAlign: "right" }}>
                <div style={{
                  display: "inline-block",
                  backgroundColor: "#2d5016",
                  color: "white",
                  padding: "10px 15px",
                  borderRadius: "18px 18px 4px 18px",
                  maxWidth: "70%",
                  wordWrap: "break-word"
                }}>
                  {chat.content}
                </div>
                <div style={{ fontSize: "0.8em", color: "#666", marginTop: "5px" }}>
                  {chat.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "left" }}>
                <div style={{
                  display: "inline-block",
                  backgroundColor: chat.isError ? "#ffebee" : "white",
                  color: chat.isError ? "#c62828" : "#333",
                  padding: "10px 15px",
                  borderRadius: "18px 18px 18px 4px",
                  maxWidth: "80%",
                  wordWrap: "break-word",
                  border: "1px solid #ddd"
                }}>
                  <strong>🤖 Smart Dine:</strong> {chat.content}
                  
                  {chat.totalCalories > 0 && (
                    <div style={{ marginTop: "8px", fontSize: "0.9em", color: "#666" }}>
                      📊 Total Calories: {chat.totalCalories} kcal
                    </div>
                  )}
                </div>
                
                {/* Recommendations */}
                {chat.recommendations && chat.recommendations.length > 0 && (
                  <div style={{ marginTop: "15px" }}>
                    {chat.recommendations.map((dish, i) => {
                      // Safely handle dish data
                      const dishName = dish?.dish || `Dish ${i + 1}`;
                      const calories = dish?.calories || 0;
                      const spiceLevel = dish?.spiceLevel || 0;
                      const isVeg = dish?.isVeg || false;
                      const restaurants = Array.isArray(dish?.restaurants) ? dish.restaurants : [];
                      
                      return (
                        <div
                          key={i}
                          style={{
                            border: "1px solid #ccc",
                            borderRadius: "8px",
                            padding: "15px",
                            marginBottom: "15px",
                            backgroundColor: expandedDish === `${index}-${i}` ? "#f8f9fa" : "white"
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ flex: 1 }}>
                              <h4>{dishName}</h4>
                              <p>🔥 Calories: {calories} kcal | 🌶 Spice: {spiceLevel}/5 | {isVeg ? "🥗 Veg" : "🍗 Non-Veg"}</p>
                              <p style={{ fontSize: "0.9em", color: "#666" }}>
                                🏪 Available at {restaurants.length} restaurant{restaurants.length > 1 ? 's' : ''}
                              </p>
                            </div>
                            {restaurants.length > 0 && (
                              <button 
                                onClick={() => setExpandedDish(expandedDish === `${index}-${i}` ? null : `${index}-${i}`)}
                                style={{ 
                                  padding: "8px 15px", 
                                  backgroundColor: "#007bff", 
                                  color: "white", 
                                  border: "none", 
                                  borderRadius: "4px",
                                  cursor: "pointer"
                                }}
                              >
                                {expandedDish === `${index}-${i}` ? "▲ Hide" : "▼ Show"} Restaurants
                              </button>
                            )}
                          </div>
                          
                          {expandedDish === `${index}-${i}` && restaurants.length > 0 && (
                            <div style={{ marginTop: "15px", borderTop: "1px solid #ddd", paddingTop: "15px" }}>
                              <h5 style={{ marginBottom: "10px" }}>🏪 Select Restaurant:</h5>
                              {restaurants.map((restaurant, rIdx) => {
                                // Safely handle restaurant data
                                const restaurantName = restaurant?.name || `Restaurant ${rIdx + 1}`;
                                const city = restaurant?.city || "Unknown";
                                const rating = restaurant?.rating || 3.5;
                                const distanceKm = restaurant?.distanceKm;
                                const reasoning = Array.isArray(restaurant?.reasoning) ? restaurant.reasoning : [];
                                
                                return (
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
                                        <strong>{restaurantName}</strong> {rIdx === 0 && <span style={{ color: "#4caf50", fontSize: "0.8em" }}>(⭐ Best Match)</span>}
                                        <p style={{ fontSize: "0.9em", color: "#666", margin: "4px 0" }}>
                                          📍 {city} | ⭐ {rating}/5
                                          {distanceKm && ` | 🚗 ${distanceKm.toFixed(1)} km`}
                                        </p>
                                        {reasoning.length > 0 && (
                                          <p style={{ fontSize: "0.8em", color: "#999", margin: "4px 0" }}>
                                            💡 {reasoning.join(", ")}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                      <button 
                                        onClick={() => addToMeal({ dish: dishName, calories: calories, restaurant: restaurantName }, getSuggestedMealType())}
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
                                            addToMeal({ dish: dishName, calories: calories, restaurant: restaurantName }, e.target.value);
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
                                        onClick={() => addToTracker({ dish: dishName, calories: calories })}
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
                                          dish: dishName,
                                          restaurant: restaurantName,
                                          city: city,
                                          calories: calories,
                                          isVeg: isVeg,
                                          spiceLevel: spiceLevel
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
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                
                <div style={{ fontSize: "0.8em", color: "#666", marginTop: "5px" }}>
                  {chat.timestamp.toLocaleTimeString()}
                </div>
              </div>
            )}
          </div>
        ))}
        
        {loading && (
          <div style={{ textAlign: "left", marginBottom: "20px" }}>
            <div style={{
              display: "inline-block",
              backgroundColor: "white",
              padding: "10px 15px",
              borderRadius: "18px 18px 18px 4px",
              border: "1px solid #ddd"
            }}>
              <strong>🤖 Smart Dine:</strong> <span style={{ color: "#666" }}>Thinking about your request... 🤔</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Tell me what you're craving... (e.g., 'I'm feeling stressed and need comfort food' or 'Something light and healthy')"
          style={{ 
            flex: 1, 
            padding: "12px", 
            borderRadius: "20px",
            border: "2px solid #ddd",
            resize: "none",
            minHeight: "50px",
            maxHeight: "100px",
            fontSize: "16px"
          }}
          rows={2}
        />
        <button 
          onClick={sendMessage}
          disabled={loading || !message.trim()}
          style={{
            padding: "12px 20px",
            backgroundColor: loading || !message.trim() ? "#ccc" : "#2d5016",
            color: "white",
            border: "none",
            borderRadius: "20px",
            cursor: loading || !message.trim() ? "not-allowed" : "pointer",
            fontSize: "16px",
            minWidth: "80px"
          }}
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
      
      {/* Quick Suggestions */}
      {chatHistory.length === 0 && (
        <div style={{ marginTop: "15px" }}>
          <p style={{ fontSize: "0.9em", color: "#666", marginBottom: "10px" }}>💡 Try these:</p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {[
              "I'm stressed and need comfort food",
              "Something spicy and exciting!",
              "Light and healthy options",
              "I'm celebrating, suggest something special",
              "Quick snack under 300 calories"
            ].map((suggestion, i) => (
              <button
                key={i}
                onClick={() => setMessage(suggestion)}
                style={{
                  padding: "8px 12px",
                  backgroundColor: "#f0f0f0",
                  border: "1px solid #ddd",
                  borderRadius: "15px",
                  cursor: "pointer",
                  fontSize: "0.85em"
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Chat;