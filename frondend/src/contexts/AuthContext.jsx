import { useCallback, useState } from 'react';
import { authAPI } from '../services/api';
import { AuthContext } from './auth-context';

function readStoredUser() {
  try {
    const savedUser = localStorage.getItem('sitag_user');
    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    localStorage.removeItem('sitag_user');
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (username, password) => {
    setIsLoading(true);

    try {
      const result = await authAPI.login(username, password);

      if (result.success && result.data) {
        const userData = result.data;
        setUser(userData);
        localStorage.setItem('sitag_user', JSON.stringify(userData));

        return { success: true, user: userData };
      }

      return {
        success: false,
        error: result.message || 'Username atau password salah',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Terjadi kesalahan saat login',
      };
    } finally {
      setIsLoading(false);
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
