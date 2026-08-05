'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Building2, AlertCircle, ArrowRight } from 'lucide-react';

export default function Register() {
  const router = useRouter();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    mobile: '',
    email: '',
    password: '',
    businessName: '',
    ownerName: '',
    businessAddress: ''
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    const res = await register(formData);
    setLoading(false);

    if (res.success) {
      router.push('/auth/login?registered=true');
    } else {
      setErrorMessage(res.message || 'Registration failed. Check details.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full space-y-8 glassmorphism p-8 rounded-3xl shadow-xl border border-white">
        
        {/* Title */}
        <div className="text-center">
          <Link href="/" className="text-2xl font-black gradient-text tracking-wide">
            Rahul Super Mart
          </Link>
          <h2 className="mt-4 text-2xl font-extrabold text-slate-900">
            Create your B2B Shop Account
          </h2>
          <p className="mt-1.5 text-xs text-slate-500">
            Submit business details for catalog access
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs font-medium flex items-center gap-2">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          
          {/* Section 1: Contact details */}
          <div className="border-b border-slate-200 pb-5">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-4">
              <span className="w-5 h-5 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold">1</span>
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase">Mobile Number</label>
                <input
                  type="tel"
                  required
                  name="mobile"
                  pattern="[0-9]{10}"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="9888888888"
                  className="w-full bg-white/70 border border-slate-200 text-slate-900 rounded-lg px-3.5 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase">Email Address</label>
                <input
                  type="email"
                  required
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="owner@store.com"
                  className="w-full bg-white/70 border border-slate-200 text-slate-900 rounded-lg px-3.5 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-700 uppercase">Password</label>
              <input
                type="password"
                required
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Choose a password"
                className="w-full bg-white/70 border border-slate-200 text-slate-900 rounded-lg px-3.5 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>
          </div>

          {/* Section 2: Business Profile */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-4">
              <span className="w-5 h-5 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold">2</span>
              Shop Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase">Shop Name</label>
                <input
                  type="text"
                  required
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  placeholder="Vikas General Store"
                  className="w-full bg-white/70 border border-slate-200 text-slate-900 rounded-lg px-3.5 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase">Owner Name</label>
                <input
                  type="text"
                  required
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleChange}
                  placeholder="Vikas Kumar"
                  className="w-full bg-white/70 border border-slate-200 text-slate-900 rounded-lg px-3.5 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-700 uppercase">Physical Address</label>
              <textarea
                required
                name="businessAddress"
                rows={2}
                value={formData.businessAddress}
                onChange={handleChange}
                placeholder="5th Cross, Indiranagar, Bengaluru, Karnataka"
                className="w-full bg-white/70 border border-slate-200 text-slate-900 rounded-lg px-3.5 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold text-sm shadow-md hover:shadow-indigo-500/25 transition flex items-center justify-center gap-1"
          >
            {loading ? 'Creating Account...' : 'Complete Registration'} <ArrowRight size={14} />
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-500">
            Already registered?{' '}
            <Link href="/auth/login" className="font-bold text-indigo-600 hover:underline">
              Log In
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
