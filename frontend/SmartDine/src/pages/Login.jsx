import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import image5 from '../assets/image 5.jpg';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Minimal Navbar */}
      <nav className="navbar-minimal">
        <Link to="/" className="logo">Smart Dine</Link>
      </nav>

      {/* Auth Container */}
      <div className="auth-container">
        {/* Left Image Section */}
        <div className="auth-image">
          <img src={image5} alt="Smart Dine" />
          <div className="image-overlay-text">
            Eat Smart. Live Healthy.
          </div>
        </div>

        {/* Right Form Section */}
        <div className="auth-form">
          <h2>Welcome Back</h2>
          <p>Login to continue your smart food journey</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button 
              type="submit" 
              className="auth-button"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="auth-footer">
            Don't have an account? <Link to="/signup">Sign up</Link>
          </div>
        </div>
      </div>

      <style>{`
        .auth-page {
          min-height: 100vh;
          background: #f8f9fa;
        }

        .navbar-minimal {
          padding: 1rem 2rem;
          background: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .logo {
          font-size: 1.5rem;
          font-weight: bold;
          color: #2d5016;
          text-decoration: none;
        }

        .auth-container {
          display: flex;
          min-height: calc(100vh - 80px);
          max-width: 1200px;
          margin: 0 auto;
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          margin-top: 2rem;
          margin-bottom: 2rem;
        }

        .auth-image {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .auth-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .image-overlay-text {
          position: absolute;
          bottom: 2rem;
          left: 2rem;
          color: white;
          font-size: 1.5rem;
          font-weight: 600;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }

        .auth-form {
          flex: 1;
          padding: 3rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .auth-form h2 {
          font-size: 2rem;
          margin-bottom: 0.5rem;
          color: #2d5016;
        }

        .auth-form p {
          color: #666;
          margin-bottom: 2rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group input {
          width: 100%;
          padding: 1rem;
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.3s;
        }

        .form-group input:focus {
          outline: none;
          border-color: #2d5016;
        }

        .error-message {
          color: #dc3545;
          margin-bottom: 1rem;
          padding: 0.5rem;
          background: #f8d7da;
          border-radius: 4px;
        }

        .auth-button {
          width: 100%;
          padding: 1rem;
          background: #2d5016;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.3s;
          margin-bottom: 1.5rem;
        }

        .auth-button:hover:not(:disabled) {
          background: #1a2f0a;
        }

        .auth-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .auth-footer {
          text-align: center;
          color: #666;
        }

        .auth-footer a {
          color: #2d5016;
          text-decoration: none;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .auth-container {
            flex-direction: column;
            margin: 1rem;
          }

          .auth-image {
            height: 200px;
          }

          .auth-form {
            padding: 2rem;
          }

          .image-overlay-text {
            font-size: 1.2rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;