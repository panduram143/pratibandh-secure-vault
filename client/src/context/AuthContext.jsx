import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // check token on mount
  useEffect(() => {
    const verifyToken = async () => {
      const savedToken = localStorage.getItem('token');
      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        setUser(res.data.user || res.data);
        setToken(savedToken);
      } catch (err) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  const idCardLogin = async (matchPayload) => {
    try {
      const res = await api.post('/auth/id-card-login', matchPayload);
      const { token: newToken, user: userData } = res.data;

      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(newToken);
      setUser(userData);
      toast.success(`Identity Verified: Welcome ${userData.name}!`);
      return true;
    } catch (err) {
      const msg = err.response?.data?.msg || err.response?.data?.message || 'ID Card verification failed';
      toast.error(msg);
      return false;
    }
  };

  const login = async (emailOrIdentifier, password) => {
    try {
      const payload = typeof emailOrIdentifier === 'object'
        ? emailOrIdentifier
        : { email: emailOrIdentifier, formNumber: emailOrIdentifier, password };
      if (!payload.password && password) payload.password = password;
      const res = await api.post('/auth/login', payload);
      const { token: newToken, user: userData } = res.data;

      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(newToken);
      setUser(userData);
      toast.success(`Login successful! Welcome ${userData.name}`);
      return true;
    } catch (err) {
      const msg = err.response?.data?.msg || err.response?.data?.message || 'Login failed';
      toast.error(msg);
      return false;
    }
  };

  const register = async (formData) => {
    try {
      const res = await api.post('/auth/register', formData);
      const { token: newToken, user: userData } = res.data;

      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(newToken);
      setUser(userData);
      toast.success('Registration successful');
      return true;
    } catch (err) {
      const msg = err.response?.data?.msg || err.response?.data?.message || 'Registration failed';
      toast.error(msg);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    toast.success('Logged out');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, idCardLogin, register, logout }}>
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

export default AuthContext;
