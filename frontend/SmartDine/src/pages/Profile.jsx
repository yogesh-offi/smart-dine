import { useState } from "react";
import axios from "axios";

function Profile() {
  const [profile, setProfile] = useState({
    dietType: "",
    calorieGoal: "",
    allergies: "",
    preferredCuisines: "",
    height: "",
    weight: "",
    age: "",
    conditions: ""
  });

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const userId = localStorage.getItem("userId");
    if (!userId) {
      alert("User not logged in");
      return;
    }

    const payload = {
      preferences: {
        dietType: profile.dietType,
        calorieGoal: Number(profile.calorieGoal),
        allergies: profile.allergies.split(","),
        preferredCuisines: profile.preferredCuisines.split(",")
      },
      health: {
        height: Number(profile.height),
        weight: Number(profile.weight),
        age: Number(profile.age),
        conditions: profile.conditions.split(",")
      }
    };

    try {
      await axios.put(
        `http://localhost:5000/api/profile/${userId}`,
        payload
      );
      alert("Profile saved successfully ✅");
    } catch (err) {
      alert("Failed to save profile ❌");
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px", backgroundColor: "#ffffff" }}>
      <form onSubmit={handleSubmit} style={{ background: "white", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", border: "1px solid #e0e0e0" }}>
        <h2 style={{ fontSize: "2em", fontWeight: "bold", color: "#1a1a1a", marginBottom: "30px", textAlign: "center" }}>Health Profile</h2>

        <select 
          name="dietType" 
          onChange={handleChange}
          style={{ width: "100%", padding: "12px 16px", marginBottom: "20px", border: "1px solid #e0e0e0", borderRadius: "8px", fontSize: "1em", backgroundColor: "white", color: "#1a1a1a" }}
        >
          <option value="">Diet Type</option>
          <option value="veg">Veg</option>
          <option value="non-veg">Non-Veg</option>
          <option value="vegan">Vegan</option>
          <option value="keto">Keto</option>
        </select>

        <input 
          name="calorieGoal" 
          placeholder="Daily Calorie Goal" 
          onChange={handleChange}
          style={{ width: "100%", padding: "12px 16px", marginBottom: "20px", border: "1px solid #e0e0e0", borderRadius: "8px", fontSize: "1em", backgroundColor: "white", color: "#1a1a1a" }}
        />
        <input 
          name="allergies" 
          placeholder="Allergies (comma separated)" 
          onChange={handleChange}
          style={{ width: "100%", padding: "12px 16px", marginBottom: "20px", border: "1px solid #e0e0e0", borderRadius: "8px", fontSize: "1em", backgroundColor: "white", color: "#1a1a1a" }}
        />
        <input 
          name="preferredCuisines" 
          placeholder="Preferred Cuisines" 
          onChange={handleChange}
          style={{ width: "100%", padding: "12px 16px", marginBottom: "20px", border: "1px solid #e0e0e0", borderRadius: "8px", fontSize: "1em", backgroundColor: "white", color: "#1a1a1a" }}
        />

        <input 
          name="height" 
          placeholder="Height (cm)" 
          onChange={handleChange}
          style={{ width: "100%", padding: "12px 16px", marginBottom: "20px", border: "1px solid #e0e0e0", borderRadius: "8px", fontSize: "1em", backgroundColor: "white", color: "#1a1a1a" }}
        />
        <input 
          name="weight" 
          placeholder="Weight (kg)" 
          onChange={handleChange}
          style={{ width: "100%", padding: "12px 16px", marginBottom: "20px", border: "1px solid #e0e0e0", borderRadius: "8px", fontSize: "1em", backgroundColor: "white", color: "#1a1a1a" }}
        />
        <input 
          name="age" 
          placeholder="Age" 
          onChange={handleChange}
          style={{ width: "100%", padding: "12px 16px", marginBottom: "20px", border: "1px solid #e0e0e0", borderRadius: "8px", fontSize: "1em", backgroundColor: "white", color: "#1a1a1a" }}
        />
        <input 
          name="conditions" 
          placeholder="Health Conditions" 
          onChange={handleChange}
          style={{ width: "100%", padding: "12px 16px", marginBottom: "30px", border: "1px solid #e0e0e0", borderRadius: "8px", fontSize: "1em", backgroundColor: "white", color: "#1a1a1a" }}
        />

        <button 
          type="submit"
          style={{ width: "100%", padding: "16px", fontSize: "1.1em", fontWeight: "600", backgroundColor: "#2e7d32", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", transition: "all 0.3s ease", boxShadow: "0 4px 12px rgba(46, 125, 50, 0.3)" }}
        >
          Save Profile
        </button>
      </form>
    </div>
  );
}

export default Profile;
