import { useEffect, useState } from "react";
import "../RestaurantsMenu.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("http://localhost:5000/api/restaurants")
      .then(res => setRestaurants(res.data));
  }, []);

  return (
    <div className="restaurants-container">
      <div className="page-header">
        <h2>Restaurants</h2>
      </div>

      <div className="restaurants-grid">
        {restaurants.map(r => (
          <div
            key={r._id}
            className="restaurant-card"
            onClick={() => navigate(`/menu/${r._id}`)}
          >
            <h3 className="restaurant-name">{r.name}</h3>
            <p className="restaurant-location">📍 {r.location.city}</p>
            <p className="restaurant-rating">⭐ {r.rating}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Restaurants;
