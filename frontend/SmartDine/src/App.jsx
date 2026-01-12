import { Routes, Route } from "react-router-dom";
import FoodScanner from './pages/FoodScanner';
import { ThemeProvider } from "./contexts/ThemeContext";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Restaurants from "./pages/Restaurants";
import Menu from "./pages/Menu";
import Chat from "./pages/Chat";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";

function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/restaurants" element={<Restaurants />} />
        <Route path="/menu/:restaurantId" element={<Menu />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/history" element={<History />} />
        <Route path="/scanner" element={<FoodScanner />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
