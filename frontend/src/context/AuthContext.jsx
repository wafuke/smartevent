import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

const BASE_PREFIX = window.location.pathname.startsWith('/smartevent') ? '/smartevent' : '';

function stripBase(pathname) {
  if (!pathname) return '/';
  const stripped = BASE_PREFIX && pathname.startsWith(BASE_PREFIX)
    ? pathname.slice(BASE_PREFIX.length)
    : pathname;
  return stripped.startsWith('/') ? stripped : `/${stripped || ''}`;
}

function withBase(path) {
  const clean = path && path.startsWith('/') ? path : `/${path || ''}`;
  return `${BASE_PREFIX}${clean}`;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('smartevent_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('smartevent_token') || null;
  });

  const [currentPath, setCurrentPath] = useState(() => stripBase(window.location.pathname));

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(stripBase(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Handle Google OAuth 2.0 implicit redirect callback (#access_token=...)
  useEffect(() => {
    const hash = window.location.hash || '';
    if (!hash.includes('access_token=')) return;
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const accessToken = params.get('access_token');
    const stateRole = params.get('state') || 'student';
    if (!accessToken) return;

    // Clean the URL immediately
    window.history.replaceState({}, '', window.location.pathname || '/');

    authApi
      .googleLogin({ accessToken, role: stateRole })
      .then((res) => {
        if (res && res.user && res.token) {
          setUser(res.user);
          setToken(res.token);
          localStorage.setItem('smartevent_user', JSON.stringify(res.user));
          localStorage.setItem('smartevent_token', res.token);
          if (res.user.role === 'admin') {
            navigate('/admin/dashboard');
          } else if (res.user.role === 'organizer') {
            navigate('/organizer/dashboard');
          } else {
            navigate('/student/dashboard');
          }
        }
      })
      .catch((err) => {
        window.dispatchEvent(
          new CustomEvent('smartevent:toast', {
            detail: { type: 'error', message: err.message || 'Google sign-in failed.' }
          })
        );
      });
  }, []);

  // Verify stored JWT token against backend on initial mount
  useEffect(() => {
    if (token) {
      authApi
        .me()
        .then((res) => {
          if (res?.user) {
            setUser(res.user);
            localStorage.setItem('smartevent_user', JSON.stringify(res.user));
          }
        })
        .catch(() => {
          // Clear invalid or forged token and return to public home screen
          setUser(null);
          setToken(null);
          localStorage.removeItem('smartevent_user');
          localStorage.removeItem('smartevent_token');
          if (window.location.pathname !== '/') {
            window.history.pushState({}, '', '/');
            setCurrentPath('/');
          }
        });
    }
  }, []);

  const navigate = (path) => {
    const normalized = stripBase(path);
    window.history.pushState({}, '', withBase(normalized));
    setCurrentPath(normalized);
    window.scrollTo(0, 0);
  };

  // Any API call that comes back 401 while logged in means the session expired
  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null);
      setToken(null);
      localStorage.removeItem('smartevent_user');
      localStorage.removeItem('smartevent_token');
      window.history.pushState({}, '', '/');
      setCurrentPath('/');
      window.dispatchEvent(new CustomEvent('smartevent:toast', { detail: { type: 'info', message: 'Your session expired. Please sign in again.' } }));
    };
    window.addEventListener('smartevent:unauthorized', onUnauthorized);
    return () => window.removeEventListener('smartevent:unauthorized', onUnauthorized);
  }, []);

  const login = (authenticatedUser, authToken) => {
    setUser(authenticatedUser);
    setToken(authToken);
    localStorage.setItem('smartevent_user', JSON.stringify(authenticatedUser));
    localStorage.setItem('smartevent_token', authToken);

    // Redirect to respective role dashboard after login/signup
    if (authenticatedUser.role === 'admin') {
      navigate('/admin/dashboard');
    } else if (authenticatedUser.role === 'organizer') {
      navigate('/organizer/dashboard');
    } else {
      navigate('/student/dashboard');
    }
  };

  const updateCurrentUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('smartevent_user', JSON.stringify(updatedUser));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('smartevent_user');
    localStorage.removeItem('smartevent_token');
    navigate('/');
  };

  const getRoleDashboardPath = () => {
    if (!user) return '/';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'organizer') return '/organizer/dashboard';
    return '/student/dashboard';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        currentPath,
        navigate,
        login,
        updateCurrentUser,
        logout,
        getRoleDashboardPath,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
