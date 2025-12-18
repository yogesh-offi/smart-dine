import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Restaurants from "./pages/Restaurants";
import Menu from "./pages/Menu";




function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/restaurants" element={<Restaurants />} />
      <Route path="/menu/:restaurantId" element={<Menu />} />
    </Routes>
  );
}

export default App;
