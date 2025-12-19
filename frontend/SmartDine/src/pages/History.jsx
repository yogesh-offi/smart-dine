import { useState, useEffect } from "react";
import axios from "axios";

function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState(7);
  
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (userId) {
      fetchHistory();
    }
  }, [userId, selectedDays]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/dashboard/history/${userId}?days=${selectedDays}`);
      setHistory(response.data.history);
    } catch (err) {
      console.error("History fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getMealIcon = (mealType) => {
    const icons = {
      breakfast: "🍳",
      lunch: "🍱", 
      dinner: "🍽️",
      snack: "🍪"
    };
    return icons[mealType] || "🍴";
  };

  if (loading) return <div style={{ padding: "20px" }}>Loading history...</div>;

  return (
    <div style={{ padding: "20px", maxWidth: "900px", margin: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1>📊 Eating History</h1>
        <select 
          value={selectedDays} 
          onChange={(e) => setSelectedDays(parseInt(e.target.value))}
          style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>

      {history.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
          <h3>No eating history found</h3>
          <p>Start logging your meals to see your eating patterns!</p>
        </div>
      ) : (
        <div>
          {history.map((day, dayIndex) => (
            <div 
              key={day.date} 
              style={{ 
                marginBottom: "25px", 
                border: "1px solid #ddd", 
                borderRadius: "8px", 
                overflow: "hidden",
                backgroundColor: dayIndex === 0 ? "#f8f9fa" : "white"
              }}
            >
              <div style={{ 
                padding: "15px", 
                backgroundColor: dayIndex === 0 ? "#e3f2fd" : "#f5f5f5", 
                borderBottom: "1px solid #ddd" 
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: 0 }}>{formatDate(day.date)}</h3>
                  <div style={{ fontSize: "1.1em", fontWeight: "bold", color: "#007bff" }}>
                    🔥 {day.totalCalories} kcal
                  </div>
                </div>
              </div>

              <div style={{ padding: "15px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}>
                  {Object.entries(day.meals).map(([mealType, meals]) => (
                    <div key={mealType} style={{ 
                      padding: "12px", 
                      border: "1px solid #e0e0e0", 
                      borderRadius: "6px",
                      backgroundColor: meals.length > 0 ? "#fafafa" : "#f9f9f9"
                    }}>
                      <h4 style={{ 
                        margin: "0 0 8px 0", 
                        textTransform: "capitalize",
                        color: meals.length > 0 ? "#333" : "#999"
                      }}>
                        {getMealIcon(mealType)} {mealType}
                      </h4>
                      
                      {meals.length > 0 ? (
                        <div>
                          {meals.map((meal, mealIndex) => (
                            <div key={mealIndex} style={{ 
                              marginBottom: "6px", 
                              fontSize: "0.9em",
                              padding: "4px 0",
                              borderBottom: mealIndex < meals.length - 1 ? "1px solid #eee" : "none"
                            }}>
                              <div style={{ fontWeight: "500" }}>{meal.dish}</div>
                              <div style={{ color: "#666", fontSize: "0.8em" }}>
                                {meal.calories} kcal • {new Date(meal.time).toLocaleTimeString('en-US', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            </div>
                          ))}
                          <div style={{ 
                            marginTop: "8px", 
                            paddingTop: "8px", 
                            borderTop: "1px solid #ddd",
                            fontWeight: "bold", 
                            fontSize: "0.9em",
                            color: "#007bff"
                          }}>
                            Total: {meals.reduce((sum, meal) => sum + meal.calories, 0)} kcal
                          </div>
                        </div>
                      ) : (
                        <div style={{ color: "#999", fontSize: "0.9em", fontStyle: "italic" }}>
                          No {mealType} logged
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default History;