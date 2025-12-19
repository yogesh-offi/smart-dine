import { useState } from "react";
import axios from "axios";
import useLocation from "../hooks/useLocation";

function Chat() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
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

          {response.recommendations.map((r, i) => (
            <div
              key={i}
              style={{
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "15px",
                marginBottom: "15px",
              }}
            >
              <h4>{r.dish}</h4>
              <p>🍴 {r.restaurant?.name || r.restaurant} ({r.restaurant?.city || r.city})</p>
              <p>🔥 Calories: {r.calories} kcal</p>
              <p>🌶 Spice Level: {r.spiceLevel}</p>
              <p>{r.isVeg ? "🥗 Vegetarian" : "🍗 Non-Vegetarian"}</p>
              {r.distanceKm && <p>📍 Distance: {r.distanceKm.toFixed(1)} km</p>}
              {r.reasoning && <p>💡 {r.reasoning.join(", ")}</p>}

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button onClick={() => addToTracker(r)}>
                  ➕ Add to Calorie Tracker
                </button>

                <button onClick={() => saveRecommendation({
                  ...r,
                  restaurant: r.restaurant?.name || r.restaurant,
                  city: r.restaurant?.city || r.city
                })}>
                  💾 Save Recommendation
                </button>
              </div>
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
