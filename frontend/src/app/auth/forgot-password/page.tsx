'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { KeyRound, AlertCircle, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';

export default function ForgotPassword() {
  const router = useRouter();
  
  const [mobile, setMobile] = useState('');
  const [step, setStep] = useState(1); // 1: Request code, 2: Reset password
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile })
      });
      const data = await response.json();
      setLoading(false);

      if (data.success) {
        setDevCode(data.devCode);
        setStep(2);
        setSuccessMsg('Reset code generated successfully! Enter the code below.');
      } else {
        setErrorMsg(data.message || 'Mobile number is not registered.');
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg('Failed to connect to backend server.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, code, newPassword })
      });
      const data = await response.json();
      setLoading(false);

      if (data.success) {
        setSuccessMsg('Password changed successfully! Redirecting to login...');
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      } else {
        setErrorMsg(data.message || 'Incorrect recovery code.');
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg('Failed to connect to backend.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 glassmorphism p-8 rounded-3xl shadow-xl border border-white relative overflow-hidden">
        
        {/* Title */}
        <div className="text-center">
          <Link href="/" className="text-2xl font-black gradient-text tracking-wide">
            Rahul Super Mart
          </Link>
          <h2 className="mt-4 text-2xl font-extrabold text-slate-900">
            Recover Password
          </h2>
          <p className="mt-1.5 text-xs text-slate-500">
            Reset password using your registered mobile number
          </p>
        </div>

        {/* Message Banner */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs font-medium flex items-center gap-2">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-medium flex items-center gap-2">
            <CheckCircle2 size={16} className="flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Simulated SMS Logger Overlay (Developer Sandbox) */}
        {devCode && (
          <div className="bg-slate-950 text-emerald-400 p-4 rounded-2xl border border-emerald-500/20 text-left font-mono text-[10px] space-y-1">
            <div className="flex justify-between items-center text-slate-500 border-b border-slate-900 pb-1 mb-1 font-sans">
              <span>💬 SIMULATED SMS NOTIFICATION</span>
              <span className="bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded text-[8px]">DELIVERED</span>
            </div>
            <p className="text-slate-200">From: Rahul Super Mart SMS Gateway</p>
            <p className="text-white mt-1">Your password recovery reset code is: <strong className="text-amber-400 text-xs">{devCode}</strong>. Valid for 10 minutes.</p>
          </div>
        )}

        {/* Step 1 Form: Mobile request */}
        {step === 1 && (
          <form className="mt-6 space-y-6" onSubmit={handleRequestCode}>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Registered Mobile Number</label>
              <input
                type="tel"
                required
                pattern="[0-9]{10}"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="e.g. 9888888888"
                className="w-full bg-white/70 border border-slate-200 text-slate-900 rounded-lg px-3.5 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-bold text-sm shadow-md hover:shadow-indigo-500/25 transition flex items-center justify-center gap-1"
            >
              {loading ? 'Sending Code...' : 'Request Reset Code'} <ArrowRight size={14} />
            </button>
          </form>
        )}

        {/* Step 2 Form: Reset password details */}
        {step === 2 && (
          <form className="mt-6 space-y-6" onSubmit={handleResetPassword}>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase">Verification Recovery Code</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="w-full bg-white/70 border border-slate-200 text-slate-900 rounded-lg px-3.5 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full bg-white/70 border border-slate-200 text-slate-900 rounded-lg px-3.5 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-bold text-sm shadow-md hover:shadow-emerald-500/25 transition flex items-center justify-center gap-1"
            >
              {loading ? 'Resetting Password...' : 'Save & Change Password'} <ShieldCheck size={14} />
            </button>
          </form>
        )}

        <div className="text-center pt-2">
          <p className="text-xs text-slate-500">
            Remembered password?{' '}
            <Link href="/auth/login" className="font-bold text-indigo-600 hover:underline">
              Back to Login
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
