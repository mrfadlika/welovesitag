import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

// Dummy users for demo
const DUMMY_USERS = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123',
    name: 'Ahmad Rizki',
    role: 'admin',
    avatar: null,
    email: 'admin@sitag.co.id',
  },
  {
    id: 2,
    username: 'staffpos',
    password: 'staff123',
    name: 'Budi Santoso',
    role: 'staff_pos',
    avatar: null,
    email: 'budi@sitag.co.id',
    posName: 'Pos Utama A',
  },
  {
    id: 3,
    username: 'checker',
    password: 'checker123',
    name: 'Dedi Kurniawan',
    role: 'checker',
    avatar: null,
    email: 'dedi@sitag.co.id',
    pitArea: 'Pit 3 - Blok B',
  },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sitag_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (username, password) => {
    setIsLoading(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const found = DUMMY_USERS.find(
      u => u.username === username && u.password === password
    );
    
    setIsLoading(false);
    
    if (found) {
      const { password: _, ...userData } = found;
      setUser(userData);
      localStorage.setItem('sitag_user', JSON.stringify(userData));
      return { success: true, user: userData };
    }
    
    return { success: false, error: 'Username atau password salah' };
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
