import { createContext, useContext, useState, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sitag_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (username, password) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await authAPI.login(username, password);
      
      if (result.success && result.data) {
        const userData = result.data;
        setUser(userData);
        localStorage.setItem('sitag_user', JSON.stringify(userData));
        setIsLoading(false);
        return { success: true, user: userData };
      } else {
        const errorMsg = result.message || 'Username atau password salah';
        setError(errorMsg);
        setIsLoading(false);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      const errMsg = err.message || 'Terjadi kesalahan saat login';
      setError(errMsg);
      setIsLoading(false);
      return { success: false, error: errMsg };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('sitag_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
