import { useEffect, useState } from "react";
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
    <div>
      <h2>Restaurants</h2>

      {restaurants.map(r => (
        <div
          key={r._id}
          onClick={() => navigate(`/menu/${r._id}`)}
          style={{ border: "1px solid #ccc", margin: 10, padding: 10, cursor: "pointer" }}
        >
          <h3>{r.name}</h3>
          <p>{r.location.city}</p>
          <p>⭐ {r.rating}</p>
        </div>
      ))}
    </div>
  );
}

export default Restaurants;
