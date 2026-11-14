import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Shield,
  Menu,
  X,
  User,
  Sun,
  Moon,
  WifiOff,
  PhoneCall,
  Mic,
  ChevronRight,
  LogOut,
  Home,
  BookOpen,
  MapPin,
  FileText,
  Users,
  Bot,
  Bookmark,
  UserCircle,
  Settings,
  KeyRound,
  Store
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { can } from '../services/accessControl';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useNetwork } from '../context/NetworkContext';
import { logDiagnostic } from '../utils/diagnostics';

import LanguageSwitcher from './LanguageSwitcher';
import PlainLanguageToggle from './common/PlainLanguageToggle';
import FocusModeNavToggle from './common/FocusModeNavToggle';
import OfflineCacheStatusModal from './common/OfflineCacheStatusModal';
import EmergencyHelplineModal from './emergency/EmergencyHelplineModal';
import VoiceSearchInput from './common/VoiceSearchInput';
import MultilingualVoiceNavigationModal from './navigation/MultilingualVoiceNavigationModal';

const Navbar = ({ initialOpen = false, defaultOpen } = {}) => {
  const [isOpen, setIsOpen] = useState(
    defaultOpen !== undefined ? defaultOpen : initialOpen
  );

  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);
  const [showVoiceNavModal, setShowVoiceNavModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const drawerRef = useRef(null);
  const menuButtonRef = useRef(null);

  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const { isOnline } = useNetwork();

  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isServiceDetail = /^\/services\/[^/]+/.test(pathname);

  // Normalize paths to avoid trailing-slash inconsistencies.
  const normalizePath = useCallback((path) => {
    if (path.length > 1 && path.endsWith('/')) {
      return path.slice(0, -1);
    }

    return path;
  }, []);

  const normalizedPath = normalizePath(pathname);

  // Active navigation state.
  const isNavActive = useCallback(
    (target) => {
      const normalizedTarget = normalizePath(target);

      if (normalizedTarget === '/services') {
        return (
          normalizedPath === '/services' ||
          isServiceDetail
        );
      }

      if (normalizedTarget === '/nearby') {
        return (
          normalizedPath === '/nearby' ||
          normalizedPath === '/nearby-offices'
        );
      }

      if (normalizedTarget === '/tenders') {
        return (
          normalizedPath === '/tenders' ||
          normalizedPath === '/tender-readiness'
        );
      }

      if (normalizedTarget === '/rental-checklist') {
        return (
          normalizedPath === '/rental-checklist' ||
          normalizedPath === '/rental-transition' ||
          normalizedPath === '/rental-records'
        );
      }

      if (normalizedTarget === '/admin') {
        return (
          normalizedPath === '/admin' ||
          normalizedPath.startsWith('/admin/')
        );
      }

      if (normalizedTarget === '/login') {
        return (
          normalizedPath === '/login' ||
          normalizedPath.startsWith('/login/')
        );
      }

      return normalizedPath === normalizedTarget;
    },
    [normalizedPath, isServiceDetail, normalizePath]
  );

  // Close drawer whenever the route changes.
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close drawer on Escape and lock background scrolling.
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Close the drawer when transitioning to a desktop viewport.
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1440) {
        setIsOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Keep focus inside the drawer while it is open.
  useEffect(() => {
    if (isOpen) {
      const firstFocusable = drawerRef.current?.querySelector(
        'a[href], button:not([disabled]), input:not([disabled])'
      );

      firstFocusable?.focus();
    }
  }, [isOpen]);

  // Safe logout handling.
  const handleLogout = async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);

      await logout();

      setIsOpen(false);
      navigate('/login', { replace: true });
    } catch (error) {
      logDiagnostic('Logout failed', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Navigation link component.
  const renderNavLink = ({
    to,
    label,
    icon: Icon,
    activeTarget,
    className = '',
    style = {},
    admin = false
  }) => {
    const active = isNavActive(activeTarget || to);

    return (
      <Link
        key={to}
        to={to}
        onClick={() => setIsOpen(false)}
        className={`nav-drawer-link ${className} ${
          active ? 'is-active' : ''
        }`}
        aria-current={active ? 'page' : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          fontSize: '1rem',
          fontWeight: active ? '700' : '600',
          color: admin
            ? 'var(--accent-main)'
            : 'var(--text-primary)',
          textDecoration: 'none',
          padding: '0.7rem 0.85rem',
          borderRadius: '0.65rem',
          transition: 'background 0.2s ease, color 0.2s ease',
          ...style
        }}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            minWidth: 0
          }}
        >
          {Icon && (
            <Icon
              size={19}
              strokeWidth={1.8}
              aria-hidden="true"
            />
          )}

          <span>{label}</span>
        </span>

        {active ? (
          <span
            className="nav-drawer-indicator"
            aria-hidden="true"
          />
        ) : (
          <ChevronRight
            size={15}
            color="var(--text-tertiary)"
            aria-hidden="true"
          />
        )}
      </Link>
    );
  };

  return (
    <nav
      id="site-navigation"
      aria-label="Main Navigation"
      tabIndex="-1"
      className="nav-glass animate-fade-in"
    >
      {/* HEADER */}
      <div
        className="container flex-between nav-container"
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}
      >
        {/* BRAND */}
        <Link
          to="/"
          className="nav-brand"
          aria-label="Civic Help Setu Home"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontWeight: '800',
            fontSize: 'clamp(1.1rem, 5vw, 1.5rem)',
            color: 'var(--text-primary)',
            minWidth: 0,
            textDecoration: 'none'
          }}
        >
          <div
            className="nav-brand__logo"
            style={{
              width: '2.5rem',
              height: '2.5rem',
              minWidth: '2.5rem',
              borderRadius: '0.75rem',
              background: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Shield
              size={20}
              color="var(--bg-main)"
              fill="currentColor"
              aria-hidden="true"
            />
          </div>

          <span
            className="nav-brand__text"
            style={{
              letterSpacing: '-0.02em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {t('nav.brand', 'Civic Help Setu')}
          </span>
        </Link>

        {/* HEADER ACTIONS */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexShrink: 0
          }}
        >
          {/* NETWORK STATUS */}
          <button
            type="button"
            onClick={() => setShowOfflineModal(true)}
            aria-label={
              isOnline
                ? 'Online. View offline cache status'
                : 'Offline mode active. View cache status'
            }
            title={
              isOnline
                ? 'Network Online - View Offline Cache'
                : 'Offline Mode Active'
            }
            style={{
              padding: '0.4rem 0.65rem',
              background: isOnline
                ? 'var(--glass-bg)'
                : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${
                isOnline
                  ? 'var(--border-main)'
                  : 'rgba(239, 68, 68, 0.35)'
              }`,
              borderRadius: '99px',
              color: isOnline
                ? 'var(--text-secondary)'
                : '#ef4444',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.75rem',
              fontWeight: '600'
            }}
          >
            {isOnline ? (
              <>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#10b981'
                  }}
                />
                <span>Online</span>
              </>
            ) : (
              <>
                <WifiOff size={13} />
                <span>Offline</span>
              </>
            )}
          </button>

          {/* EMERGENCY SOS */}
          <button
            type="button"
            onClick={() => setShowSosModal(true)}
            aria-label="Open emergency helplines"
            title="Rapid Emergency Helplines"
            style={{
              padding: '0.4rem 0.65rem',
              borderRadius: '999px',
              border: '1px solid #ef4444',
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#ef4444',
              fontSize: '0.78rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <PhoneCall size={14} />
            <span>SOS</span>
          </button>

          {/* VOICE NAVIGATION */}
          <button
            type="button"
            onClick={() => setShowVoiceNavModal(true)}
            className="top-navbar-theme-btn"
            title="Multilingual Voice Navigation"
            aria-label="Open multilingual voice navigation"
            style={{
              padding: '0.45rem',
              background: 'rgba(14, 165, 233, 0.1)',
              borderRadius: '50%',
              color: '#0284c7',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Mic size={18} />
          </button>

          {/* THEME TOGGLE */}
          <button
            type="button"
            onClick={toggleTheme}
            className="top-navbar-theme-btn"
            title={
              theme === 'dark'
                ? 'Switch to Light Mode'
                : 'Switch to Dark Mode'
            }
            aria-label={
              theme === 'dark'
                ? 'Switch to light theme'
                : 'Switch to dark theme'
            }
            style={{
              padding: '0.45rem',
              background: 'var(--glass-bg-hover)',
              borderRadius: '50%',
              color: 'var(--text-primary)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {theme === 'dark' ? (
              <Sun size={18} />
            ) : (
              <Moon size={18} />
            )}
          </button>

          {/* MENU TOGGLE */}
          <button
            ref={menuButtonRef}
            type="button"
            className="hamburger-toggle-btn"
            onClick={() => setIsOpen(prev => !prev)}
            aria-label={
              isOpen
                ? 'Close navigation menu'
                : 'Open navigation menu'
            }
            aria-expanded={isOpen}
            aria-controls="mobile-navigation-drawer"
            style={{
              padding: '0.45rem',
              background: 'var(--glass-bg-hover)',
              borderRadius: '50%',
              color: 'var(--text-primary)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isOpen ? (
              <X size={24} />
            ) : (
              <Menu size={24} />
            )}
          </button>
        </div>
      </div>

      {/* NAVIGATION DRAWER */}
      {isOpen && (
        <>
          {/* BACKDROP */}
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => {
              setIsOpen(false);
              menuButtonRef.current?.focus();
            }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 998,
              background: 'rgba(0, 0, 0, 0.35)',
              border: 'none',
              cursor: 'default'
            }}
          />

          <div
            id="mobile-navigation-drawer"
            ref={drawerRef}
            className="mobile-drawer-dropdown"
            role="region"
            aria-label="Navigation menu"
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              zIndex: 999,
              background: 'var(--bg-secondary)',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              borderTop: '1px solid var(--border-main)',
              borderRadius: '0 0 1rem 1rem',
              boxShadow: '0 15px 40px rgba(0,0,0,0.16