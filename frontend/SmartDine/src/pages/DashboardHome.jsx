import { Link } from "react-router-dom";

function DashboardHome() {
  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "auto" }}>
      <h1>Welcome to Smart Dine 🍽️</h1>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginTop: "30px" }}>
        <Link to="/dashboard" style={{ textDecoration: "none" }}>
          <div style={{ padding: "20px", border: "1px solid #ddd", borderRadius: "8px", textAlign: "center", backgroundColor: "#f8f9fa" }}>
            <h3>📊 Health Dashboard</h3>
            <p>Track calories, meals & get smart suggestions</p>
          </div>
        </Link>
        
        <Link to="/chat" style={{ textDecoration: "none" }}>
          <div style={{ padding: "20px", border: "1px solid #ddd", borderRadius: "8px", textAlign: "center", backgroundColor: "#f8f9fa" }}>
            <h3>💬 AI Chat</h3>
            <p>Get personalized food recommendations</p>
          </div>
        </Link>
        
        <Link to="/restaurants" style={{ textDecoration: "none" }}>
          <div style={{ padding: "20px", border: "1px solid #ddd", borderRadius: "8px", textAlign: "center", backgroundColor: "#f8f9fa" }}>
            <h3>🏪 Restaurants</h3>
            <p>Browse restaurants and menus</p>
          </div>
        </Link>
        
        <Link to="/profile" style={{ textDecoration: "none" }}>
          <div style={{ padding: "20px", border: "1px solid #ddd", borderRadius: "8px", textAlign: "center", backgroundColor: "#f8f9fa" }}>
            <h3>👤 Profile</h3>
            <p>Manage your preferences & settings</p>
          </div>
        </Link>
        
        <Link to="/history" style={{ textDecoration: "none" }}>
          <div style={{ padding: "20px", border: "1px solid #ddd", borderRadius: "8px", textAlign: "center", backgroundColor: "#f8f9fa" }}>
            <h3>📊 Eating History</h3>
            <p>View your past meals & calorie tracking</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default DashboardHome;