import { useState, useEffect } from 'react';
import axios from 'axios';

function History() {
  const [historyData, setHistoryData] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState('');
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  
  const getUserId = () => {
    try {
      const user = localStorage.getItem('user');
      if (user && user !== 'undefined') {
        return JSON.parse(user)?._id;
      }
      return localStorage.getItem('userId');
    } catch (error) {
      return localStorage.getItem('userId');
    }
  };
  
  const userId = getUserId();

  useEffect(() => {
    if (userId) {
      fetchHistory();
    } else {
      console.error('No userId found');
      setLoading(false);
    }
  }, [userId, days]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const [historyRes, suggestionsRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/dashboard/history/${userId}?days=${days}`),
        axios.get(`http://localhost:5000/api/dashboard/ai-insights/${userId}?days=${days}`)
      ]);
      
      setHistoryData(historyRes.data.history);
      setAiSuggestions(suggestionsRes.data.insights);
    } catch (err) {
      console.error('History fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading history...</div>;

  // Calculate stats for visualizations
  const totalDays = historyData.length;
  const avgCalories = totalDays > 0 ? Math.round(historyData.reduce((sum, day) => sum + day.totalCalories, 0) / totalDays) : 0;
  const calorieGoal = 2000; // Should come from user profile
  const daysOverGoal = historyData.filter(day => day.totalCalories > calorieGoal).length;
  const adherenceRate = totalDays > 0 ? Math.round(((totalDays - daysOverGoal) / totalDays) * 100) : 0;

  // Meal frequency analysis
  const mealFrequency = {
    breakfast: historyData.reduce((sum, day) => sum + day.meals.breakfast.length, 0),
    lunch: historyData.reduce((sum, day) => sum + day.meals.lunch.length, 0),
    dinner: historyData.reduce((sum, day) => sum + day.meals.dinner.length, 0),
    snack: historyData.reduce((sum, day) => sum + day.meals.snack.length, 0)
  };

  const maxCalories = Math.max(...historyData.map(day => day.totalCalories), calorieGoal);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: 'auto' }}>
      <h1>📊 Eating History & Insights</h1>
      
      {/* Time Period Selector */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ marginRight: '10px' }}>View last:</label>
        <select value={days} onChange={(e) => setDays(parseInt(e.target.value))} style={{ padding: '5px' }}>
          <option value={7}>7 days</option>
          <option value={14}>14 days</option>
          <option value={30}>30 days</option>
        </select>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
        <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px', textAlign: 'center' }}>
          <h3>📈 Avg Daily Calories</h3>
          <div style={{ fontSize: '2em', color: avgCalories > calorieGoal ? '#ff6b6b' : '#51cf66' }}>
            {avgCalories}
          </div>
          <p style={{ fontSize: '0.9em', color: '#666' }}>Goal: {calorieGoal} kcal</p>
        </div>
        
        <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px', textAlign: 'center' }}>
          <h3>🎯 Goal Adherence</h3>
          <div style={{ fontSize: '2em', color: adherenceRate > 70 ? '#51cf66' : adherenceRate > 40 ? '#ffd43b' : '#ff6b6b' }}>
            {adherenceRate}%
          </div>
          <p style={{ fontSize: '0.9em', color: '#666' }}>{totalDays - daysOverGoal}/{totalDays} days on track</p>
        </div>
        
        <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px', textAlign: 'center' }}>
          <h3>🍽️ Most Frequent Meal</h3>
          <div style={{ fontSize: '1.5em', color: '#007bff' }}>
            {Object.entries(mealFrequency).reduce((a, b) => mealFrequency[a[0]] > mealFrequency[b[0]] ? a : b)[0]}
          </div>
          <p style={{ fontSize: '0.9em', color: '#666' }}>
            {Math.max(...Object.values(mealFrequency))} times logged
          </p>
        </div>
      </div>

      {/* Daily Calorie Chart */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>📊 Daily Calorie Intake</h3>
        <div style={{ display: 'flex', alignItems: 'end', gap: '5px', height: '200px', marginTop: '15px' }}>
          {historyData.slice(-14).map((day, i) => {
            const height = (day.totalCalories / maxCalories) * 180;
            const isOverGoal = day.totalCalories > calorieGoal;
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <div style={{ fontSize: '0.7em', marginBottom: '5px', color: '#666' }}>
                  {day.totalCalories}
                </div>
                <div 
                  style={{ 
                    width: '100%', 
                    backgroundColor: isOverGoal ? '#ff6b6b' : '#51cf66',
                    height: `${height}px`,
                    borderRadius: '4px 4px 0 0',
                    minHeight: '10px'
                  }}
                  title={`${day.date}: ${day.totalCalories} kcal`}
                />
                <div style={{ fontSize: '0.6em', marginTop: '5px', color: '#666', transform: 'rotate(-45deg)' }}>
                  {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '15px', gap: '20px', fontSize: '0.8em' }}>
          <span><span style={{ color: '#51cf66' }}>■</span> Within Goal</span>
          <span><span style={{ color: '#ff6b6b' }}>■</span> Over Goal</span>
          <span style={{ color: '#666' }}>Goal: {calorieGoal} kcal</span>
        </div>
      </div>

      {/* Meal Pattern Analysis */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>🍽️ Meal Pattern Analysis</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginTop: '15px' }}>
          {Object.entries(mealFrequency).map(([meal, count]) => {
            const percentage = totalDays > 0 ? Math.round((count / totalDays) * 100) : 0;
            const emoji = meal === 'breakfast' ? '🍳' : meal === 'lunch' ? '🍱' : meal === 'dinner' ? '🍽️' : '🍪';
            return (
              <div key={meal} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2em' }}>{emoji}</div>
                <div style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>{meal}</div>
                <div style={{ fontSize: '1.2em', color: '#007bff' }}>{percentage}%</div>
                <div style={{ fontSize: '0.8em', color: '#666' }}>{count} times</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Insights & Suggestions */}
      {aiSuggestions && (
        <div style={{ padding: '20px', border: '2px solid #007bff', borderRadius: '8px', backgroundColor: '#f8f9ff' }}>
          <h3 style={{ color: '#007bff' }}>🤖 AI-Powered Eating Insights</h3>
          <div style={{ whiteSpace: 'pre-line', lineHeight: '1.6', fontSize: '0.95em' }}>
            {aiSuggestions}
          </div>
        </div>
      )}

      {/* Recent History */}
      <div style={{ marginTop: '30px' }}>
        <h3>📅 Recent Daily Breakdown</h3>
        <div style={{ display: 'grid', gap: '15px', marginTop: '15px' }}>
          {historyData.slice(0, 5).map((day, i) => (
            <div key={i} style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4>{new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</h4>
                <div style={{ 
                  padding: '4px 8px', 
                  borderRadius: '4px', 
                  fontSize: '0.8em',
                  backgroundColor: day.totalCalories > calorieGoal ? '#ffe6e6' : '#e6ffe6',
                  color: day.totalCalories > calorieGoal ? '#d63384' : '#198754'
                }}>
                  {day.totalCalories} kcal
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                {Object.entries(day.meals).map(([mealType, meals]) => (
                  <div key={mealType}>
                    <div style={{ fontWeight: 'bold', textTransform: 'capitalize', fontSize: '0.9em', marginBottom: '5px' }}>
                      {mealType === 'breakfast' ? '🍳' : mealType === 'lunch' ? '🍱' : mealType === 'dinner' ? '🍽️' : '🍪'} {mealType}
                    </div>
                    {meals.length > 0 ? (
                      meals.map((meal, j) => (
                        <div key={j} style={{ fontSize: '0.8em', color: '#666', marginBottom: '2px' }}>
                          {meal.dish} ({meal.calories} kcal)
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: '0.8em', color: '#999', fontStyle: 'italic' }}>No items</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default History;