import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const themes = {
    light: {
      bg: '#f9fafb',
      cardBg: '#ffffff',
      text: '#333333',
      textSecondary: '#666666',
      primary: '#2d5016',
      primaryHover: '#1a2f0a',
      border: '#e1e5e9',
      shadow: 'rgba(0,0,0,0.1)',
      navbarBg: '#ffffff',
      inputBg: '#ffffff'
    },
    dark: {
      bg: '#1a1a1a',
      cardBg: '#2d2d2d',
      text: '#ffffff',
      textSecondary: '#cccccc',
      primary: '#4a7c59',
      primaryHover: '#5d8f6b',
      border: '#404040',
      shadow: 'rgba(0,0,0,0.3)',
      navbarBg: '#2d2d2d',
      inputBg: '#404040'
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors: themes[theme] }}>
      {children}
    </ThemeContext.Provider>
  );
};