'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { KeyRound, AlertCircle, ArrowRight } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [emailOrMobile, setEmailOrMobile] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    const res = await login(emailOrMobile, password);
    setLoading(false);

    if (res.success) {
      router.push('/');
    } else {
      setErrorMessage(res.message || 'Login failed. Please verify mobile/email and password.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 glassmorphism p-8 rounded-3xl shadow-xl border border-white">
        
        {/* Title */}
        <div className="text-center">
          <Link href="/" className="text-2xl font-black gradient-text tracking-wide">
            Rahul Super Mart
          </Link>
          <h2 className="mt-4 text-2xl font-extrabold text-slate-900">
            Sign In to your Account
          </h2>
          <p className="mt-1.5 text-xs text-slate-500">
            Access bulk wholesale rates and category offers
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs font-medium flex items-center gap-2">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Simple Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handlePasswordLogin}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Mobile Number or Email</label>
              <input
                type="text"
                required
                value={emailOrMobile}
                onChange={(e) => setEmailOrMobile(e.target.value)}
                placeholder="e.g. 9888888888 or retailer@b2b.com"
                className="w-full bg-white/70 border border-slate-200 text-slate-900 rounded-lg px-3.5 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-white/70 border border-slate-200 text-slate-900 rounded-lg px-3.5 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>
            <div className="flex justify-end">
              <Link href="/auth/forgot-password" className="text-xs font-semibold text-indigo-600 hover:underline">
                Forgot Password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-bold text-sm shadow-md hover:shadow-indigo-500/25 transition flex items-center justify-center gap-1"
          >
            {loading ? 'Signing in...' : 'Sign In'} <ArrowRight size={14} />
          </button>
        </form>

        {/* Footer sign up redirection */}
        <div className="text-center pt-2">
          <p className="text-xs text-slate-500">
            New wholesale buyer?{' '}
            <Link href="/auth/register" className="font-bold text-indigo-600 hover:underline">
              Create an Account
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
