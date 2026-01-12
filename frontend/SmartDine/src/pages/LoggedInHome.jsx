import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const LoggedInHome = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const { theme, toggleTheme, colors } = useTheme();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData && userData !== 'undefined') {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const actionCards = [
    {
      id: 'chat',
      icon: '💬',
      title: 'AI Chat',
      description: 'Get personalized food recommendations',
      route: '/chat',
      isPrimary: true
    },
    {
      id: 'scanner',
      icon: '📸',
      title: 'Food Scanner',
      description: 'Scan food images for instant nutrition analysis',
      route: '/scanner',
      isPrimary: true
    },
    {
      id: 'dashboard',
      icon: '📊',
      title: 'Health Dashboard',
      description: 'Track calories, meals & get smart suggestions',
      route: '/dashboard'
    },
    {
      id: 'restaurants',
      icon: '🏪',
      title: 'Restaurants',
      description: 'Browse restaurants and menus',
      route: '/restaurants'
    },
    {
      id: 'history',
      icon: '📈',
      title: 'Eating History',
      description: 'View your past meals & calorie tracking',
      route: '/history'
    },
    {
      id: 'profile',
      icon: '👤',
      title: 'Profile',
      description: 'Manage your preferences & settings',
      route: '/profile'
    }
  ];

  return (
    <div className="home-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">Smart Dine</div>
        <div className="nav-right">
          <button onClick={toggleTheme} className="theme-btn">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <span className="user-name">
            {user?.name ? `Hi, ${user.name.split(' ')[0]}! 👋` : 'Welcome!'}
          </span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </nav>

      {/* Page Container */}
      <div className="page-container">
        {/* Welcome Section */}
        <div className="welcome-section">
          <h1>Welcome to Smart Dine 🍽️</h1>
          <p>Track your meals, monitor health, and get smart food recommendations</p>
        </div>

        {/* Action Grid */}
        <div className="action-grid">
          {actionCards.map((card) => (
            <div
              key={card.id}
              className={`action-card ${card.isPrimary ? 'primary' : ''}`}
              onClick={() => navigate(card.route)}
            >
              <div className="icon">{card.icon}</div>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .home-page {
          min-height: 100vh;
          background: ${colors.bg};
          color: ${colors.text};
        }

        .navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          background: ${colors.navbarBg};
          box-shadow: 0 2px 8px ${colors.shadow};
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .logo {
          font-size: 1.5rem;
          font-weight: bold;
          color: ${colors.primary};
        }

        .nav-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .theme-btn {
          padding: 0.5rem;
          background: ${colors.cardBg};
          border: 1px solid ${colors.border};
          border-radius: 6px;
          cursor: pointer;
          font-size: 1.2rem;
          transition: all 0.3s;
        }

        .theme-btn:hover {
          background: ${colors.primary};
          color: white;
        }

        .user-name {
          color: ${colors.textSecondary};
          font-weight: 500;
        }

        .logout-btn {
          padding: 0.5rem 1rem;
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: background 0.3s;
        }

        .logout-btn:hover {
          background: #c82333;
        }

        .page-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .welcome-section {
          text-align: center;
          margin-bottom: 3rem;
        }

        .welcome-section h1 {
          font-size: 2.5rem;
          color: ${colors.primary};
          margin-bottom: 0.5rem;
          font-weight: 700;
        }

        .welcome-section p {
          font-size: 1.1rem;
          color: ${colors.textSecondary};
          max-width: 600px;
          margin: 0 auto;
        }

        .action-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          max-width: 900px;
          margin: 0 auto;
        }

        .action-card {
          background: ${colors.cardBg};
          padding: 2rem;
          border-radius: 16px;
          box-shadow: 0 4px 12px ${colors.shadow};
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 2px solid transparent;
        }

        .action-card:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 8px 25px ${colors.shadow};
        }

        .action-card.primary {
          border-color: ${colors.primary};
          background: ${theme === 'light' ? 'linear-gradient(135deg, #f8fff8 0%, #ffffff 100%)' : `linear-gradient(135deg, ${colors.cardBg} 0%, #3a3a3a 100%)`};
        }

        .action-card.primary:hover {
          border-color: ${colors.primaryHover};
        }

        .icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          display: block;
        }

        .action-card h3 {
          font-size: 1.3rem;
          color: ${colors.primary};
          margin-bottom: 0.5rem;
          font-weight: 600;
        }

        .action-card p {
          color: ${colors.textSecondary};
          font-size: 0.95rem;
          line-height: 1.4;
          margin: 0;
        }

        @media (max-width: 768px) {
          .navbar {
            padding: 1rem;
          }

          .nav-right {
            flex-direction: column;
            gap: 0.5rem;
            align-items: flex-end;
          }

          .user-name {
            font-size: 0.9rem;
          }

          .page-container {
            padding: 1.5rem 1rem;
          }

          .welcome-section h1 {
            font-size: 2rem;
          }

          .welcome-section p {
            font-size: 1rem;
          }

          .action-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .action-card {
            padding: 1.5rem;
          }

          .icon {
            font-size: 2.5rem;
          }
        }

        @media (max-width: 480px) {
          .welcome-section h1 {
            font-size: 1.8rem;
          }

          .action-card {
            padding: 1.2rem;
          }
        }
      `}</style>
    </div>
  );
};

export default LoggedInHome;