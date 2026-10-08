import React, { createContext, useContext, useState, useEffect } from 'react';

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

  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo(0, 0);
  };

  const login = (authenticatedUser, authToken) => {
    setUser(authenticatedUser);
    setToken(authToken);
    localStorage.setItem('smartevent_user', JSON.stringify(authenticatedUser));
    localStorage.setItem('smartevent_token', authToken);

    // Redirect to role dashboard
    if (authenticatedUser.role === 'admin') {
      navigate('/admin/dashboard');
    } else if (authenticatedUser.role === 'organizer') {
      navigate('/organizer/dashboard');
    } else {
      navigate('/student/dashboard');
    }
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
