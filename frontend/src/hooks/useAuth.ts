import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

interface RegisterData {
  name: string;
  email: string;
  password: string;
  preferences?: {
    lookingFor?: string;
  };
}

interface UseAuthReturn {
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string;
  success: string;
}

export const useAuth = (): UseAuthReturn => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const login = async (email: string, password: string) => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const data = await authAPI.login({ email, password });
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      setSuccess('Login successful! Redirecting...');
      
      // Check if this is the first login by looking at the last_login timestamp
      // or any other indicator of first login
      const isFirstLogin = !data.user?.last_login; // Assuming last_login is set after first login
      
      setTimeout(() => {
        navigate(isFirstLogin ? '/dashboard' : '/swipe');
      }, 1000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Login failed. Please try again.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async ({ name, email, password, preferences = {} }: RegisterData) => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const data = await authAPI.register({ 
        name, 
        email, 
        password, 
        preferences 
      });
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      setSuccess('Account created successfully! Redirecting...');
      
      setTimeout(() => {
        navigate('/complete-profile');
      }, 1000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return { login, register, logout, loading, error, success };
};
