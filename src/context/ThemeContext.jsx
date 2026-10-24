import React, { createContext, useState, useEffect, useContext } from 'react';
import { THEME_KEY, loadTheme, saveTheme, applyTheme } from '../utils/preferencesStorage';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(loadTheme);

  useEffect(() => {
    saveTheme(theme);
    applyTheme(theme);
  }, [theme]);

  // Keep other open tabs in sync
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === THEME_KEY || e.key === null) setTheme(loadTheme());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
