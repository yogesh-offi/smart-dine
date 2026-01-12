import { Link, useNavigate } from "react-router-dom";
import image1 from "../assets/image 1.jpg";
import image2 from "../assets/image 2.png";
import image3 from "../assets/image 3.svg";
import image4 from "../assets/image 4.webp";

function Home() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const handleCTAClick = () => {
    if (token) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "white" }}>
      {/* Navbar */}
      <nav style={{
        position: "sticky",
        top: 0,
        backgroundColor: "white",
        borderBottom: "1px solid #e0e0e0",
        padding: "15px 0",
        zIndex: 1000
      }}>
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 20px"
        }}>
          <div style={{ fontSize: "1.5em", fontWeight: "bold", color: "#2e7d32" }}>
            🍽️ Smart Dine
          </div>
          <div style={{ display: "flex", gap: "30px", alignItems: "center" }}>
            <a href="#features" style={{ textDecoration: "none", color: "#333" }}>Features</a>
            <a href="#how-it-works" style={{ textDecoration: "none", color: "#333" }}>How It Works</a>
            {token ? (
              <Link to="/profile" style={{
                padding: "8px 16px",
                backgroundColor: "#2e7d32",
                color: "white",
                textDecoration: "none",
                borderRadius: "6px"
              }}>
                Profile
              </Link>
            ) : (
              <Link to="/login" style={{
                padding: "8px 16px",
                backgroundColor: "#2e7d32",
                color: "white",
                textDecoration: "none",
                borderRadius: "6px"
              }}>
                Login
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "80px 20px",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "60px",
        alignItems: "center"
      }}>
        {/* Left Side - Text */}
        <div>
          <h1 style={{
            fontSize: "3.2em",
            fontWeight: "bold",
            color: "#1a1a1a",
            lineHeight: "1.2",
            marginBottom: "20px"
          }}>
            Smart food recommendations tailored to your health & location
          </h1>
          <p style={{
            fontSize: "1.2em",
            color: "#666",
            lineHeight: "1.6",
            marginBottom: "40px"
          }}>
            AI-powered food suggestions based on your preferences, nutrition goals, and nearby restaurants.
          </p>
          <button
            onClick={handleCTAClick}
            style={{
              padding: "16px 32px",
              fontSize: "1.1em",
              fontWeight: "600",
              backgroundColor: "#2e7d32",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: "0 4px 12px rgba(46, 125, 50, 0.3)"
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = "#1b5e20";
              e.target.style.transform = "translateY(-2px)";
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = "#2e7d32";
              e.target.style.transform = "translateY(0)";
            }}
          >
            {token ? "Checkout Smart Dine" : "Login to Continue"}
          </button>
        </div>

        {/* Right Side - Image */}
        <div style={{ textAlign: "center" }}>
          <img
            src={image1}
            alt="Smart Dine App"
            style={{
              width: "100%",
              maxWidth: "500px",
              borderRadius: "16px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
            }}
          />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{
        backgroundColor: "#f8f9fa",
        padding: "80px 20px"
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{
            fontSize: "2.5em",
            fontWeight: "bold",
            color: "#1a1a1a",
            marginBottom: "60px"
          }}>
            Why Choose Smart Dine?
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "40px"
          }}>
            <div style={{
              padding: "40px 30px",
              backgroundColor: "white",
              borderRadius: "12px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.1)"
            }}>
              <div style={{ fontSize: "3em", marginBottom: "20px" }}>🍎</div>
              <h3 style={{ fontSize: "1.4em", fontWeight: "600", marginBottom: "15px", color: "#2e7d32" }}>
                Health Aware
              </h3>
              <p style={{ color: "#666", lineHeight: "1.6" }}>
                Tracks calories & nutrition in real time
              </p>
            </div>

            <div style={{
              padding: "40px 30px",
              backgroundColor: "white",
              borderRadius: "12px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.1)"
            }}>
              <div style={{ fontSize: "3em", marginBottom: "20px" }}>📍</div>
              <h3 style={{ fontSize: "1.4em", fontWeight: "600", marginBottom: "15px", color: "#2e7d32" }}>
                Location Aware
              </h3>
              <p style={{ color: "#666", lineHeight: "1.6" }}>
                Finds the best restaurants near you
              </p>
            </div>

            <div style={{
              padding: "40px 30px",
              backgroundColor: "white",
              borderRadius: "12px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.1)"
            }}>
              <div style={{ fontSize: "3em", marginBottom: "20px" }}>🧠</div>
              <h3 style={{ fontSize: "1.4em", fontWeight: "600", marginBottom: "15px", color: "#2e7d32" }}>
                Explainable AI
              </h3>
              <p style={{ color: "#666", lineHeight: "1.6" }}>
                Understand why each food is recommended
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" style={{
        padding: "80px 20px",
        backgroundColor: "white"
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{
            fontSize: "2.5em",
            fontWeight: "bold",
            color: "#1a1a1a",
            marginBottom: "60px"
          }}>
            How It Works
          </h2>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "40px",
            flexWrap: "wrap"
          }}>
            <div style={{ flex: 1, minWidth: "250px" }}>
              <div style={{
                width: "80px",
                height: "80px",
                backgroundColor: "#e8f5e9",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                fontSize: "2em"
              }}>
                💬
              </div>
              <h3 style={{ fontSize: "1.3em", fontWeight: "600", marginBottom: "15px", color: "#2e7d32" }}>
                Tell us what you want
              </h3>
              <p style={{ color: "#666", lineHeight: "1.6" }}>
                Describe your cravings, mood, or dietary preferences
              </p>
            </div>

            <div style={{ fontSize: "2em", color: "#2e7d32" }}>→</div>

            <div style={{ flex: 1, minWidth: "250px" }}>
              <div style={{
                width: "80px",
                height: "80px",
                backgroundColor: "#e8f5e9",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                fontSize: "2em"
              }}>
                🤖
              </div>
              <h3 style={{ fontSize: "1.3em", fontWeight: "600", marginBottom: "15px", color: "#2e7d32" }}>
                AI analyzes everything
              </h3>
              <p style={{ color: "#666", lineHeight: "1.6" }}>
                Our ML considers your health, location & preferences
              </p>
            </div>

            <div style={{ fontSize: "2em", color: "#2e7d32" }}>→</div>

            <div style={{ flex: 1, minWidth: "250px" }}>
              <div style={{
                width: "80px",
                height: "80px",
                backgroundColor: "#e8f5e9",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                fontSize: "2em"
              }}>
                🍽️
              </div>
              <h3 style={{ fontSize: "1.3em", fontWeight: "600", marginBottom: "15px", color: "#2e7d32" }}>
                Get smart suggestions
              </h3>
              <p style={{ color: "#666", lineHeight: "1.6" }}>
                Receive personalized food recommendations with explanations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        backgroundColor: "#1a1a1a",
        color: "white",
        textAlign: "center",
        padding: "30px 20px"
      }}>
        <p style={{ margin: 0, fontSize: "0.9em" }}>
          © 2024 Smart Dine | Final Year Project
        </p>
      </footer>
    </div>
  );
}

export default Home;