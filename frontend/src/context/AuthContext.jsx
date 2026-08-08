import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('transit_token');
    const savedUser  = localStorage.getItem('transit_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (tokenVal, userVal) => {
    setToken(tokenVal);
    setUser(userVal);
    localStorage.setItem('transit_token', tokenVal);
    localStorage.setItem('transit_user', JSON.stringify(userVal));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('transit_token');
    localStorage.removeItem('transit_user');
  };

  const isAdmin      = user?.role === 'admin';
  const isSuperAdmin = user?.is_super_admin === true;

  // Helper: fetch with auth header
  const authFetch = (url, options = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAdmin, isSuperAdmin, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
