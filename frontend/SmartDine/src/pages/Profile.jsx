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

  // ✅ THIS FUNCTION WAS MISSING
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
    <form onSubmit={handleSubmit}>
      <h2>Health Profile</h2>

      <select name="dietType" onChange={handleChange}>
        <option value="">Diet Type</option>
        <option value="veg">Veg</option>
        <option value="non-veg">Non-Veg</option>
        <option value="vegan">Vegan</option>
        <option value="keto">Keto</option>
      </select>

      <input name="calorieGoal" placeholder="Daily Calorie Goal" onChange={handleChange} />
      <input name="allergies" placeholder="Allergies (comma separated)" onChange={handleChange} />
      <input name="preferredCuisines" placeholder="Preferred Cuisines" onChange={handleChange} />

      <input name="height" placeholder="Height (cm)" onChange={handleChange} />
      <input name="weight" placeholder="Weight (kg)" onChange={handleChange} />
      <input name="age" placeholder="Age" onChange={handleChange} />
      <input name="conditions" placeholder="Health Conditions" onChange={handleChange} />

      <button type="submit">Save Profile</button>
    </form>
  );
}

export default Profile;
