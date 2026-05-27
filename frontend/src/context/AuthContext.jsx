import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const storedAccounts = localStorage.getItem('accounts');
    const activeEmail = localStorage.getItem('activeEmail');
    
    if (!storedAccounts) {
      const legacyToken = localStorage.getItem('token');
      if (legacyToken) {
        try {
          const profile = await api.get('/auth/me', { headers: { Authorization: `Bearer ${legacyToken}` } });
          const newAccounts = [{ email: profile.email, token: legacyToken, full_name: profile.full_name }];
          setAccounts(newAccounts);
          localStorage.setItem('accounts', JSON.stringify(newAccounts));
          localStorage.setItem('activeEmail', profile.email);
          setUser(profile);
        } catch (err) {
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
      return;
    }

    const parsedAccounts = JSON.parse(storedAccounts);
    setAccounts(parsedAccounts);

    if (!activeEmail || parsedAccounts.length === 0) {
      setLoading(false);
      return;
    }

    const activeAcc = parsedAccounts.find(acc => acc.email === activeEmail);
    if (!activeAcc) {
      setLoading(false);
      return;
    }

    try {
      localStorage.setItem('token', activeAcc.token);
      const profile = await api.get('/auth/me');
      setUser(profile);
      
      if (profile.full_name !== activeAcc.full_name) {
        const updated = parsedAccounts.map(a => a.email === activeEmail ? { ...a, full_name: profile.full_name } : a);
        setAccounts(updated);
        localStorage.setItem('accounts', JSON.stringify(updated));
      }
    } catch (err) {
      console.error('Session verification failed:', err);
      const updated = parsedAccounts.filter(a => a.email !== activeEmail);
      setAccounts(updated);
      localStorage.setItem('accounts', JSON.stringify(updated));
      if (updated.length > 0) {
        localStorage.setItem('activeEmail', updated[0].email);
        localStorage.setItem('token', updated[0].token);
        checkUser();
        return;
      } else {
        localStorage.removeItem('activeEmail');
        localStorage.removeItem('token');
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setError(null);
    setLoading(true);
    try {
      const data = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.access_token);
      
      const userProfile = await api.get('/auth/me');
      
      const storedAccounts = localStorage.getItem('accounts');
      let currentAccounts = storedAccounts ? JSON.parse(storedAccounts) : [];
      
      currentAccounts = currentAccounts.filter(acc => acc.email !== userProfile.email);
      currentAccounts.push({
        email: userProfile.email,
        token: data.access_token,
        full_name: userProfile.full_name
      });
      
      setAccounts(currentAccounts);
      localStorage.setItem('accounts', JSON.stringify(currentAccounts));
      localStorage.setItem('activeEmail', userProfile.email);
      
      setUser(userProfile);
      return userProfile;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, fullName) => {
    setError(null);
    setLoading(true);
    try {
      const newUser = await api.post('/auth/register', { 
        email, 
        password, 
        full_name: fullName
      });
      return newUser;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (email, otp) => {
    setError(null);
    try {
      const res = await api.post('/auth/register/verify-otp', { email, otp });
      return res;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const sendResetOtp = async (email) => {
    setError(null);
    try {
      return await api.post('/auth/password-reset/send-otp', { email });
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const verifyResetOtp = async (email, otp) => {
    setError(null);
    try {
      return await api.post('/auth/password-reset/verify-otp', { email, otp });
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const confirmPasswordReset = async (email, newPassword) => {
    setError(null);
    try {
      return await api.post('/auth/password-reset/confirm', { email, new_password: newPassword });
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const switchAccount = async (email) => {
    setError(null);
    try {
      const activeAcc = accounts.find(acc => acc.email === email);
      if (!activeAcc) throw new Error("Account not found");

      localStorage.setItem('activeEmail', email);
      localStorage.setItem('token', activeAcc.token);
      
      const profile = await api.get('/auth/me');
      setUser(profile);
      return profile;
    } catch (err) {
      setError(err.message);
      logoutAccount(email);
      throw err;
    }
  };

  const logoutAccount = (email) => {
    const updated = accounts.filter(acc => acc.email !== email);
    setAccounts(updated);
    localStorage.setItem('accounts', JSON.stringify(updated));
    
    const activeEmail = localStorage.getItem('activeEmail');
    if (activeEmail === email) {
      if (updated.length > 0) {
        const nextAcc = updated[0];
        localStorage.setItem('activeEmail', nextAcc.email);
        localStorage.setItem('token', nextAcc.token);
        switchAccount(nextAcc.email);
      } else {
        localStorage.removeItem('activeEmail');
        localStorage.removeItem('accounts');
        localStorage.removeItem('token');
        setUser(null);
      }
    }
  };

  const logout = () => {
    const activeEmail = localStorage.getItem('activeEmail');
    if (activeEmail) {
      logoutAccount(activeEmail);
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('accounts');
      localStorage.removeItem('activeEmail');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, accounts, loading, error, login, register, verifyOtp, sendResetOtp, verifyResetOtp, confirmPasswordReset, switchAccount, logoutAccount, logout, setError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
