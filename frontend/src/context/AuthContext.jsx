import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

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

  const [currentPath, setCurrentPath] = useState(window.location.pathname || '/');

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
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
    window.history.pushState({}, '', path);
    setCurrentPath(path);
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
