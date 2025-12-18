import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

function Menu() {
  const { restaurantId } = useParams();

  const [menu, setMenu] = useState([]);
  const [restaurant, setRestaurant] = useState(null); // ✅ MISSING STATE (FIX)

  useEffect(() => {
    // Fetch menu items
    axios
      .get(`http://localhost:5000/api/menu/${restaurantId}`)
      .then(res => setMenu(res.data))
      .catch(err => console.error(err));

    // Fetch restaurant details (for rating)
    axios
      .get("http://localhost:5000/api/restaurants")
      .then(res => {
        const found = res.data.find(r => r._id === restaurantId);
        setRestaurant(found);
      })
      .catch(err => console.error(err));
  }, [restaurantId]);

  return (
    <div>
      <h2>Menu</h2>

      {/* ✅ SAFE CHECK */}
      {restaurant && (
        <p>⭐ Average Rating: {restaurant.avgRating}</p>
      )}

      {menu.map(item => (
        <div
          key={item._id}
          style={{ border: "1px solid #ddd", margin: 10, padding: 10 }}
        >
          <h3>
            {item.name} {item.isVeg ? "🟢" : "🔴"}
          </h3>

          <p>{item.description}</p>
          <p>₹ {item.price}</p>
          <p>🔥 Calories: {item.nutrition?.calories}</p>
          <p>🌶️ {"🌶️".repeat(item.spicinessLevel || 0)}</p>
          <p>Budget: {item.budgetCategory}</p>
        </div>
      ))}
    </div>
  );
}

export default Menu;
