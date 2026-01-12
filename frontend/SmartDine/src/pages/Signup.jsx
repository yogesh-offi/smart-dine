import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext';
import image6 from '../assets/image 6.webp';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    dietPreference: '',
    healthGoal: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { colors } = useTheme();

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

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        dietPreference: formData.dietPreference,
        healthGoal: formData.healthGoal
      });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.name && formData.email && formData.password && 
                     formData.confirmPassword && formData.dietPreference && formData.healthGoal;

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
          <img src={image6} alt="Smart Dine" />
          <div className="image-overlay-text">
            Eat Smart. Live Healthy.
          </div>
        </div>

        {/* Right Form Section */}
        <div className="auth-form">
          <h2>Create Your Smart Dine Account</h2>
          <p>Personalized food recommendations start here</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

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

            <div className="form-group">
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <select
                name="dietPreference"
                value={formData.dietPreference}
                onChange={handleChange}
                required
              >
                <option value="">Select Diet Preference</option>
                <option value="Veg">Veg</option>
                <option value="Non-Veg">Non-Veg</option>
              </select>
            </div>

            <div className="form-group">
              <select
                name="healthGoal"
                value={formData.healthGoal}
                onChange={handleChange}
                required
              >
                <option value="">Select Health Goal</option>
                <option value="Lose Weight">Lose Weight</option>
                <option value="Maintain">Maintain</option>
                <option value="Gain">Gain</option>
              </select>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button 
              type="submit" 
              className="auth-button"
              disabled={loading || !isFormValid}
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account? <Link to="/login">Login</Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .auth-page {
          min-height: 100vh;
          background: ${colors.bg};
          display: flex;
          flex-direction: column;
        }

        .navbar-minimal {
          padding: 0.75rem 2rem;
          background: ${colors.navbarBg};
          box-shadow: 0 2px 4px ${colors.shadow};
        }

        .logo {
          font-size: 1.5rem;
          font-weight: bold;
          color: ${colors.primary};
          text-decoration: none;
        }

        .auth-container {
          display: flex;
          max-width: 1100px;
          max-height: 90vh;
          margin: 1rem auto;
          background: ${colors.cardBg};
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 32px ${colors.shadow};
        }

        .auth-image {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
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
          font-size: 1.3rem;
          font-weight: 600;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }

        .auth-form {
          flex: 1;
          padding: 2rem 2.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          overflow-y: auto;
        }

        .auth-form h2 {
          font-size: 1.6rem;
          margin-bottom: 0.3rem;
          color: ${colors.primary};
        }

        .auth-form p {
          color: ${colors.textSecondary};
          margin-bottom: 1.2rem;
          font-size: 0.9rem;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid ${colors.border};
          border-radius: 8px;
          font-size: 0.95rem;
          transition: border-color 0.3s;
          background: ${colors.inputBg};
          color: ${colors.text};
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: ${colors.primary};
        }

        .form-group select {
          cursor: pointer;
        }

        .error-message {
          color: #dc3545;
          margin-bottom: 0.8rem;
          padding: 0.5rem;
          background: #f8d7da;
          border-radius: 4px;
          font-size: 0.85rem;
        }

        .auth-button {
          width: 100%;
          padding: 0.85rem;
          background: ${colors.primary};
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.3s;
          margin-bottom: 1rem;
        }

        .auth-button:hover:not(:disabled) {
          background: ${colors.primaryHover};
        }

        .auth-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .auth-footer {
          text-align: center;
          color: ${colors.textSecondary};
          font-size: 0.9rem;
        }

        .auth-footer a {
          color: ${colors.primary};
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

export default Signup;