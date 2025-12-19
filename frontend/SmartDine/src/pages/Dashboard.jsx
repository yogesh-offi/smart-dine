import { useState, useEffect } from "react";
import axios from "axios";

function Dashboard() {
  const [todayData, setTodayData] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newFood, setNewFood] = useState({ dish: "", calories: "", mealType: "breakfast" });
  
  const userId = localStorage.getItem("userId");
  const [userName, setUserName] = useState(localStorage.getItem("userName") || "User");
  
  // Update userName state when localStorage changes
  useEffect(() => {
    const storedName = localStorage.getItem("userName");
    if (storedName && storedName !== userName) {
      setUserName(storedName);
    }
  }, [suggestions]); // Re-check when suggestions update (after API calls)

  useEffect(() => {
    if (userId) {
      fetchDashboardData();
    }
  }, [userId]);

  const fetchDashboardData = async () => {
    try {
      const [todayRes, suggestionsRes, userRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/tracker/today/${userId}`),
        axios.get(`http://localhost:5000/api/dashboard/suggestions/${userId}`),
        axios.get(`http://localhost:5000/api/profile/${userId}`)
      ]);
      
      setTodayData(todayRes.data);
      setSuggestions(suggestionsRes.data);
      
      // Update userName in localStorage for future use
      if (userRes.data.name) {
        localStorage.setItem("userName", userRes.data.name);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const addFood = async () => {
    if (!newFood.dish || !newFood.calories) return;
    
    try {
      await axios.post("http://localhost:5000/api/tracker/add", {
        userId,
        dish: newFood.dish,
        calories: parseInt(newFood.calories),
        mealType: newFood.mealType
      });
      
      setNewFood({ dish: "", calories: "", mealType: "breakfast" });
      fetchDashboardData(); // Refresh data
    } catch (err) {
      console.error("Add food error:", err);
      alert("Failed to add food");
    }
  };
  
  const addSuggestionToMeal = async (suggestion, mealType) => {
    try {
      await axios.post("http://localhost:5000/api/dashboard/add-suggestion", {
        userId,
        dish: suggestion.dish,
        calories: suggestion.calories,
        restaurant: suggestion.restaurant,
        mealType: mealType || suggestion.suggestedMealType || "snack"
      });
      
      alert(`${suggestion.dish} added to ${mealType || suggestion.suggestedMealType || "snack"}!`);
      fetchDashboardData(); // Refresh data
    } catch (err) {
      console.error("Add suggestion error:", err);
      alert("Failed to add suggestion");
    }
  };

  if (loading) return <div style={{ padding: "20px" }}>Loading dashboard...</div>;

  const calorieGoal = suggestions?.calorieGoal || 2000;
  const consumedCalories = suggestions?.consumedCalories || 0;
  const remainingCalories = suggestions?.remainingCalories || calorieGoal;
  const healthScore = suggestions?.healthScore || 0;

  return (
    <div style={{ padding: "20px", maxWidth: "1000px", margin: "auto" }}>
      {/* Header Section */}
      <div style={{ marginBottom: "30px" }}>
        <h1>🍽️ Health Dashboard</h1>
        <p>Welcome back, {userName}!</p>
        
        <div style={{ display: "flex", gap: "20px", marginTop: "15px" }}>
          <div style={{ padding: "15px", border: "1px solid #ddd", borderRadius: "8px", flex: 1 }}>
            <h3>📊 Today's Progress</h3>
            <p><strong>Consumed:</strong> {consumedCalories} kcal</p>
            <p><strong>Goal:</strong> {calorieGoal} kcal</p>
            <p><strong>Remaining:</strong> {remainingCalories} kcal</p>
            <div style={{ 
              width: "100%", 
              height: "10px", 
              backgroundColor: "#f0f0f0", 
              borderRadius: "5px",
              marginTop: "10px"
            }}>
              <div style={{
                width: `${Math.min(100, (consumedCalories / calorieGoal) * 100)}%`,
                height: "100%",
                backgroundColor: consumedCalories > calorieGoal ? "#ff6b6b" : "#51cf66",
                borderRadius: "5px"
              }}></div>
            </div>
          </div>
          
          <div style={{ padding: "15px", border: "1px solid #ddd", borderRadius: "8px", flex: 1 }}>
            <h3>🧠 ML Health Score</h3>
            <div style={{ fontSize: "2em", color: healthScore > 70 ? "#51cf66" : healthScore > 40 ? "#ffd43b" : "#ff6b6b" }}>
              {Math.round(healthScore)}/100
            </div>
            <p style={{ fontSize: "0.9em", color: "#666" }}>
              {healthScore > 70 ? "Excellent health balance!" : healthScore > 40 ? "Good progress" : "Needs improvement"}
            </p>
            {suggestions?.insights && (
              <div style={{ fontSize: "0.8em", marginTop: "10px" }}>
                <div>🎯 Calorie: {suggestions.insights.calorieAdherence}%</div>
                <div>🍽️ Meals: {suggestions.insights.mealFrequency}%</div>
                <div>🥗 Diet: {suggestions.insights.dietCompliance}%</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Food Section */}
      <div style={{ marginBottom: "30px", padding: "20px", border: "1px solid #ddd", borderRadius: "8px" }}>
        <h3>➕ Add Food</h3>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Food name (e.g., 2 idlis with sambar)"
            value={newFood.dish}
            onChange={(e) => setNewFood({...newFood, dish: e.target.value})}
            style={{ padding: "8px", minWidth: "200px", flex: 1 }}
          />
          <input
            type="number"
            placeholder="Calories"
            value={newFood.calories}
            onChange={(e) => setNewFood({...newFood, calories: e.target.value})}
            style={{ padding: "8px", width: "100px" }}
          />
          <select
            value={newFood.mealType}
            onChange={(e) => setNewFood({...newFood, mealType: e.target.value})}
            style={{ padding: "8px" }}
          >
            <option value="breakfast">🍳 Breakfast</option>
            <option value="lunch">🍱 Lunch</option>
            <option value="dinner">🍽️ Dinner</option>
            <option value="snack">🍪 Snack</option>
          </select>
          <button onClick={addFood} style={{ padding: "8px 15px" }}>Add</button>
        </div>
      </div>

      {/* Meal Breakdown */}
      {todayData && (
        <div style={{ marginBottom: "30px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <h3>🍽️ Today's Meals</h3>
            <div style={{ fontSize: "0.9em", color: "#666" }}>
              {todayData && (
                <span>
                  {Object.values(todayData.mealBreakdown).reduce((sum, meals) => sum + meals.length, 0)} items logged
                  {suggestions?.suggestions?.[0]?.suggestedMealType && (
                    <span style={{ marginLeft: "10px", color: "#007bff", fontWeight: "bold" }}>
                      → Next: {suggestions.suggestions[0].suggestedMealType.charAt(0).toUpperCase() + suggestions.suggestions[0].suggestedMealType.slice(1)}
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}>
            {Object.entries(todayData.mealBreakdown).map(([mealType, meals]) => (
              <div key={mealType} style={{ padding: "15px", border: "1px solid #ddd", borderRadius: "8px" }}>
                <h4 style={{ textTransform: "capitalize", marginBottom: "10px" }}>
                  {mealType === "breakfast" ? "🍳" : mealType === "lunch" ? "🍱" : mealType === "dinner" ? "🍽️" : "🍪"} {mealType}
                </h4>
                {meals.length > 0 ? (
                  meals.map((meal, i) => (
                    <div key={i} style={{ marginBottom: "5px", fontSize: "0.9em" }}>
                      <div>{meal.dish}</div>
                      <div style={{ color: "#666" }}>{meal.calories} kcal</div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: "#999", fontSize: "0.9em" }}>No items logged</p>
                )}
                <div style={{ marginTop: "10px", fontWeight: "bold", fontSize: "0.9em" }}>
                  Total: {meals.reduce((sum, meal) => sum + meal.calories, 0)} kcal
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Smart Suggestions */}
      {suggestions && suggestions.suggestions && suggestions.suggestions.length > 0 && (
        <div style={{ marginBottom: "30px" }}>
          <h3>🤖 Smart Meal Suggestions</h3>
          <p style={{ fontSize: "0.9em", color: "#666", marginBottom: "15px" }}>
            {suggestions?.suggestions?.[0]?.suggestedMealType ? 
              `Recommended for your next ${suggestions.suggestions[0].suggestedMealType} • ML-Powered` :
              "Personalized recommendations • ML-Powered"
            }
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "15px" }}>
            {suggestions.suggestions.map((suggestion, i) => (
              <div key={i} style={{ padding: "15px", border: "1px solid #ddd", borderRadius: "8px" }}>
                <h4>{suggestion.dish}</h4>
                <p>🍴 {suggestion.restaurant}</p>
                <p>🔥 {suggestion.calories} kcal</p>
                <p style={{ fontSize: "0.9em", color: "#666" }}>💡 {suggestion.reason}</p>
                <p style={{ fontSize: "0.8em", color: "#999" }}>🥗 {suggestion.isVeg ? "Vegetarian" : "Non-Vegetarian"} | 🌶️ Spice: {suggestion.spice}/5</p>
                
                {suggestion.suggestedMealType && (
                  <p style={{ fontSize: "0.8em", color: "#007bff", fontWeight: "bold" }}>
                    🍽️ Suggested for: {suggestion.suggestedMealType.charAt(0).toUpperCase() + suggestion.suggestedMealType.slice(1)}
                  </p>
                )}
                
                <div style={{ display: "flex", gap: "5px", marginTop: "10px", flexWrap: "wrap" }}>
                  <button 
                    onClick={() => addSuggestionToMeal(suggestion, suggestion.suggestedMealType || "snack")}
                    style={{ 
                      padding: "5px 10px", 
                      fontSize: "0.8em", 
                      backgroundColor: "#007bff", 
                      color: "white", 
                      border: "none", 
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                  >
                    ➕ Add to {(suggestion.suggestedMealType || "snack").charAt(0).toUpperCase() + (suggestion.suggestedMealType || "snack").slice(1)}
                  </button>
                  
                  <select 
                    onChange={(e) => {
                      if (e.target.value) {
                        addSuggestionToMeal(suggestion, e.target.value);
                        e.target.value = ""; // Reset selection
                      }
                    }}
                    style={{ padding: "5px", fontSize: "0.8em", borderRadius: "4px" }}
                  >
                    <option value="">Add to other meal...</option>
                    <option value="breakfast">🍳 Breakfast</option>
                    <option value="lunch">🍱 Lunch</option>
                    <option value="dinner">🍽️ Dinner</option>
                    <option value="snack">🍪 Snack</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights Panel */}
      <div style={{ padding: "20px", border: "1px solid #ddd", borderRadius: "8px", backgroundColor: "#f8f9fa" }}>
        <h3>🧠 ML-Powered Health Insights</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}>
          <div>
            <strong>Calorie Analysis:</strong>
            <p style={{ margin: "5px 0", fontSize: "0.9em" }}>
              {remainingCalories > 200 ? "Perfect calorie balance - room for more" :
               remainingCalories > 0 ? "Approaching daily goal optimally" :
               "Exceeded goal - consider lighter options tomorrow"}
            </p>
            {suggestions?.insights && (
              <p style={{ fontSize: "0.8em", color: "#666" }}>Adherence Score: {suggestions.insights.calorieAdherence}%</p>
            )}
          </div>
          <div>
            <strong>Meal Pattern:</strong>
            <p style={{ margin: "5px 0", fontSize: "0.9em" }}>
              {todayData ? `${Object.values(todayData.mealBreakdown).reduce((sum, meals) => sum + meals.length, 0)} meals logged today` : "Start logging meals for better insights"}
            </p>
            {suggestions?.insights && (
              <p style={{ fontSize: "0.8em", color: "#666" }}>Frequency Score: {suggestions.insights.mealFrequency}%</p>
            )}
          </div>
          <div>
            <strong>Diet Compliance:</strong>
            <p style={{ margin: "5px 0", fontSize: "0.9em" }}>
              {suggestions?.insights?.dietCompliance > 80 ? "Excellent diet adherence" :
               suggestions?.insights?.dietCompliance > 60 ? "Good diet compliance" :
               "Consider aligning meals with your diet preferences"}
            </p>
            {suggestions?.insights && (
              <p style={{ fontSize: "0.8em", color: "#666" }}>Compliance Score: {suggestions.insights.dietCompliance}%</p>
            )}
          </div>
        </div>
        <div style={{ marginTop: "15px", padding: "10px", backgroundColor: "#e3f2fd", borderRadius: "5px" }}>
          <strong>🧠 ML Pipeline Active:</strong>
          <span style={{ fontSize: "0.9em", marginLeft: "10px" }}>Hybrid Recommender + Health-Aware Filtering + Content-Based Similarity</span>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;