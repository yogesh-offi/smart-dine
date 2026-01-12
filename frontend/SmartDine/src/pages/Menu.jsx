import { useEffect, useState } from "react";
import "../RestaurantsMenu.css";
import axios from "axios";
import { useParams } from "react-router-dom";

function Menu() {
  const { restaurantId } = useParams();

  const [menu, setMenu] = useState([]);
  const [restaurant, setRestaurant] = useState(null);

  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/menu/${restaurantId}`)
      .then(res => setMenu(res.data))
      .catch(err => console.error(err));

    axios
      .get("http://localhost:5000/api/restaurants")
      .then(res => {
        const found = res.data.find(r => r._id === restaurantId);
        setRestaurant(found);
      })
      .catch(err => console.error(err));
  }, [restaurantId]);

  return (
    <div className="menu-container">
      {restaurant && (
        <div className="menu-header">
          <h2 className="menu-restaurant-name">{restaurant.name}</h2>
          <p className="menu-restaurant-rating">⭐ Average Rating: {restaurant.avgRating}</p>
        </div>
      )}

      <div className="menu-items-grid">
        {menu.map(item => (
          <div key={item._id} className="menu-item-card">
            <div className="menu-item-header">
              <h3 className="menu-item-name">
                {item.name} <span className="veg-indicator">{item.isVeg ? "🟢" : "🔴"}</span>
              </h3>
              <div className="menu-item-price">₹ {item.price}</div>
            </div>

            <p className="menu-item-description">{item.description}</p>
            
            <div className="menu-item-details">
              <div className="detail-item">
                🔥 <span className="detail-value">{item.nutrition?.calories} cal</span>
              </div>
              <div className="detail-item">
                <span className="spice-level">
                  🌶️ {"🌶️".repeat(item.spicinessLevel || 0)}
                </span>
              </div>
              <div className="detail-item">
                <span className={`budget-category ${item.budgetCategory}`}>
                  {item.budgetCategory}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Menu;
