import { useState, useRef } from 'react';
import axios from 'axios';

const FoodScanner = () => {
  const [image, setImage] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
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

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setImage(e.target.result);
      reader.readAsDataURL(file);
      analyzeImage(file);
    }
  };

  const analyzeImage = async (file) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('userId', userId);

      const response = await axios.post('http://localhost:5000/api/food-scanner/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setAnalysis(response.data);
    } catch (error) {
      console.error('Food analysis error:', error);
      setAnalysis({ error: 'Failed to analyze image. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const addToMeal = async (dish, calories, mealType) => {
    try {
      await axios.post('http://localhost:5000/api/tracker/add', {
        userId,
        dish,
        calories: parseInt(calories),
        mealType
      });
      alert(`${dish} added to ${mealType}!`);
    } catch (error) {
      console.error('Add meal error:', error);
      alert('Failed to add meal');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto' }}>
      <h1>📸 Food Scanner</h1>
      <p>Take a photo of your meal for instant nutritional analysis</p>

      {/* Upload Section */}
      <div style={{ 
        border: '2px dashed #007bff', 
        borderRadius: '12px', 
        padding: '40px', 
        textAlign: 'center',
        marginBottom: '20px',
        cursor: 'pointer',
        backgroundColor: '#f8f9ff'
      }} onClick={() => fileInputRef.current?.click()}>
        {image ? (
          <img src={image} alt="Food" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }} />
        ) : (
          <div>
            <div style={{ fontSize: '3em', marginBottom: '10px' }}>📷</div>
            <p>Click to upload food image</p>
            <p style={{ fontSize: '0.8em', color: '#666' }}>Supports JPG, PNG, WEBP</p>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
      />

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '2em', marginBottom: '10px' }}>🔍</div>
          <p>Analyzing your food...</p>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && !loading && (
        <div style={{ marginTop: '20px' }}>
          {analysis.error ? (
            <div style={{ padding: '15px', backgroundColor: '#ffe6e6', borderRadius: '8px', color: '#d63384' }}>
              {analysis.error}
            </div>
          ) : (
            <div>
              <h3>🍽️ Analysis Results</h3>
              {analysis.dishes?.map((dish, i) => (
                <div key={i} style={{ 
                  padding: '15px', 
                  border: '1px solid #ddd', 
                  borderRadius: '8px', 
                  marginBottom: '15px',
                  backgroundColor: '#fff'
                }}>
                  <h4>{dish.name}</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', marginBottom: '15px' }}>
                    <div>
                      <strong>Calories:</strong> {dish.calories} kcal
                    </div>
                    <div>
                      <strong>Confidence:</strong> {dish.confidence}%
                    </div>
                    <div>
                      <strong>Type:</strong> {dish.isVeg ? '🥗 Veg' : '🍗 Non-Veg'}
                    </div>
                  </div>
                  
                  {dish.nutrition && (
                    <div style={{ marginBottom: '15px', fontSize: '0.9em' }}>
                      <strong>Nutrition:</strong> 
                      Protein: {dish.nutrition.protein}g, 
                      Carbs: {dish.nutrition.carbs}g, 
                      Fat: {dish.nutrition.fat}g
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button 
                      onClick={() => addToMeal(dish.name, dish.calories, 'breakfast')}
                      style={{ padding: '8px 12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      ➕ Add to Breakfast
                    </button>
                    <button 
                      onClick={() => addToMeal(dish.name, dish.calories, 'lunch')}
                      style={{ padding: '8px 12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      ➕ Add to Lunch
                    </button>
                    <button 
                      onClick={() => addToMeal(dish.name, dish.calories, 'dinner')}
                      style={{ padding: '8px 12px', backgroundColor: '#6f42c1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      ➕ Add to Dinner
                    </button>
                    <button 
                      onClick={() => addToMeal(dish.name, dish.calories, 'snack')}
                      style={{ padding: '8px 12px', backgroundColor: '#fd7e14', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      ➕ Add to Snack
                    </button>
                  </div>
                </div>
              ))}

              {analysis.tips && (
                <div style={{ padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px', marginTop: '15px' }}>
                  <h4 style={{ color: '#1976d2' }}>💡 Health Tips</h4>
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {analysis.tips.map((tip, i) => (
                      <li key={i} style={{ marginBottom: '5px' }}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FoodScanner;