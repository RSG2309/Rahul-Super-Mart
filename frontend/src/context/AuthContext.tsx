'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

export interface IUserProfile {
  id: string;
  email: string;
  mobile: string;
  role: 'retailer' | 'admin' | 'staff';
  kycStatus: 'pending' | 'verified' | 'rejected';
  kycDetails?: {
    gstNumber?: string;
    businessName: string;
    ownerName: string;
    businessAddress: string;
    panNumber?: string;
    documentUrl?: string;
  };
  walletBalance: number;
  savedAddresses?: string[];
  wishlist?: string[];
}

interface AuthContextType {
  user: IUserProfile | null;
  token: string | null;
  loading: boolean;
  login: (emailOrMobile: string, password: string) => Promise<{ success: boolean; message?: string }>;
  sendOtp: (mobile: string) => Promise<{ success: boolean; message?: string; devOtp?: string }>;
  verifyOtp: (mobile: string, otp: string) => Promise<{ success: boolean; message?: string }>;
  register: (details: any) => Promise<{ success: boolean; message?: string }>;
  submitKyc: (details: any) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<IUserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('b2b_token');
      if (storedToken) {
        setToken(storedToken);
        try {
          const res = await api.get('/auth/profile');
          if (res.success) {
            setUser(res.user);
          } else {
            // invalid token
            localStorage.removeItem('b2b_token');
            setToken(null);
          }
        } catch (e) {
          console.error('Failed to load profile', e);
        }
      }
      setLoading(false);
    };
    initializeAuth();
  }, []);

  const refreshProfile = async () => {
    try {
      const res = await api.get('/auth/profile');
      if (res.success) {
        setUser(res.user);
      }
    } catch (e) {
      console.error('Failed to refresh user profile', e);
    }
  };

  const login = async (emailOrMobile: string, password: string) => {
    try {
      const res = await api.post('/auth/login', { emailOrMobile, password });
      if (res.success) {
        localStorage.setItem('b2b_token', res.token);
        setToken(res.token);
        setUser(res.user);
        return { success: true };
      }
      return { success: false, message: res.message || 'Login failed' };
    } catch (err: any) {
      return { success: false, message: 'Server communication error' };
    }
  };

  const sendOtp = async (mobile: string) => {
    try {
      const res = await api.post('/auth/send-otp', { mobile });
      if (res.success) {
        return { success: true, message: res.message, devOtp: res.devOtp };
      }
      return { success: false, message: res.message || 'Failed to send OTP' };
    } catch (err: any) {
      return { success: false, message: 'Server communication error' };
    }
  };

  const verifyOtp = async (mobile: string, otp: string) => {
    try {
      const res = await api.post('/auth/verify-otp', { mobile, otp });
      if (res.success) {
        localStorage.setItem('b2b_token', res.token);
        setToken(res.token);
        setUser(res.user);
        return { success: true };
      }
      return { success: false, message: res.message || 'OTP verification failed' };
    } catch (err: any) {
      return { success: false, message: 'Server communication error' };
    }
  };

  const register = async (details: any) => {
    try {
      const res = await api.post('/auth/register', details);
      if (res.success) {
        return { success: true };
      }
      return { success: false, message: res.message || 'Registration failed' };
    } catch (err: any) {
      return { success: false, message: 'Server communication error' };
    }
  };

  const submitKyc = async (details: any) => {
    try {
      const res = await api.post('/auth/kyc/submit', details);
      if (res.success) {
        await refreshProfile();
        return { success: true };
      }
      return { success: false, message: res.message || 'KYC submission failed' };
    } catch (err: any) {
      return { success: false, message: 'Server communication error' };
    }
  };

  const logout = () => {
    localStorage.removeItem('b2b_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      sendOtp,
      verifyOtp,
      register,
      submitKyc,
      logout,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
