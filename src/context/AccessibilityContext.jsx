import { createContext, useContext, useState, useEffect } from 'react';

import {
  A11Y_KEY,
  loadA11yPrefs,
  saveA11yPrefs,
  applyA11yPrefs,
} from '../utils/preferencesStorage';

const AccessibilityContext = createContext();

export const AccessibilityProvider = ({ children }) => {
  const [initialPrefs] = useState(loadA11yPrefs);
  const [fontSizeScale, setFontSizeScale] = useState(initialPrefs.fontSizeScale);
  const [isHighContrast, setIsHighContrast] = useState(initialPrefs.isHighContrast);
  const [isDyslexicFont, setIsDyslexicFont] = useState(initialPrefs.isDyslexicFont);

  const [isSpeaking, setIsSpeaking] = useState(false);

  // Apply attributes to document root and persist
  useEffect(() => {
    const prefs = { fontSizeScale, isHighContrast, isDyslexicFont };
    applyA11yPrefs(prefs);
    saveA11yPrefs(prefs);
  }, [fontSizeScale, isHighContrast, isDyslexicFont]);

  // Keep other open tabs in sync
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== A11Y_KEY && e.key !== null) return;
      const prefs = loadA11yPrefs();
      setFontSizeScale(prefs.fontSizeScale);
      setIsHighContrast(prefs.isHighContrast);
      setIsDyslexicFont(prefs.isDyslexicFont);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Text to Speech
  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const cycleFontSize = () => {
    setFontSizeScale((prev) => {
      if (prev === 'normal') return 'large';
      if (prev === 'large') return 'xlarge';
      return 'normal';
    });
  };

  const toggleHighContrast = () => {
    setIsHighContrast((prev) => !prev);
  };

  const toggleDyslexicFont = () => {
    setIsDyslexicFont((prev) => !prev);
  };

  const resetAccessibility = () => {
    setFontSizeScale('normal');
    setIsHighContrast(false);
    setIsDyslexicFont(false);
    stopSpeaking();
  };

  return (
    <AccessibilityContext.Provider
      value={{
        fontSizeScale,
        setFontSizeScale,
        cycleFontSize,
        isHighContrast,
        toggleHighContrast,
        isDyslexicFont,
        toggleDyslexicFont,
        isSpeaking,
        speakText,
        stopSpeaking,
        resetAccessibility,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
