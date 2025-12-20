import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface User {
  id: number;
  email: string;
  name: string;
  has_chat_access: boolean;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<User | null>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  loginWithToken: (token: string) => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        return null;
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        return userData;
      } else {
        // If the token is invalid, clear it
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
        setUser(null);
        return null;
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setUser(null);
      return null;
    } finally {
      if (loading) {
        setLoading(false);
      }
    }
  }, [loading]);

  // Only run once on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      refreshUser().catch(console.error);
    } else {
      setLoading(false);
    }
  }, []);

  const logout = async () => {
    try {
      localStorage.removeItem('token');
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const loginWithToken = useCallback(async (token: string) => {
    try {
      // Store the token
      localStorage.setItem('token', token);
      
      // Fetch user data with the new token
      const userData = await refreshUser();
      return userData;
    } catch (error) {
      console.error('Login with token failed:', error);
      localStorage.removeItem('token');
      throw error;
    }
  }, [refreshUser]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      refreshUser, 
      logout, 
      setUser,
      loginWithToken
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
