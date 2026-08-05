'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, Clock, AlertTriangle, FileText, Send, Building } from 'lucide-react';

export default function KYCProfile() {
  const router = useRouter();
  const { user, submitKyc, loading } = useAuth();

  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    businessAddress: '',
    gstNumber: '',
    panNumber: ''
  });

  const [notif, setNotif] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }

    if (user) {
      setFormData({
        businessName: user.kycDetails?.businessName || '',
        ownerName: user.kycDetails?.ownerName || '',
        businessAddress: user.kycDetails?.businessAddress || '',
        gstNumber: user.kycDetails?.gstNumber || '',
        panNumber: user.kycDetails?.panNumber || ''
      });
    }
  }, [user, loading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotif(null);
    setSubmitting(true);

    const res = await submitKyc(formData);
    setSubmitting(false);

    if (res.success) {
      setNotif({ type: 'success', text: 'Business details updated successfully. Verification takes 1-2 business days.' });
    } else {
      setNotif({ type: 'error', text: res.message || 'Profile update failed.' });
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-grow max-w-3xl mx-auto px-4 py-12 w-full">
        
        {/* Status card */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Shop Verification</h1>
          <p className="text-xs text-slate-500 mt-1">Upload files to verify business status and unlock bulk wholesale pricing.</p>
        </div>

        {/* Status Panels */}
        {user.kycStatus === 'verified' && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-8 flex items-start gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="font-bold text-emerald-950">Shop Status: Verified</h3>
              <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                Your account is active. You have full access to our catalogs, MOQ price drops, and Cash on Delivery features.
              </p>
            </div>
          </div>
        )}

        {user.kycStatus === 'pending' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8 flex items-start gap-4">
            <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
              <Clock size={24} />
            </div>
            <div>
              <h3 className="font-bold text-amber-950">Shop Status: Verification Pending</h3>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                We have received your business details. The verification process takes 1-2 business days. You can browse products immediately, and place orders once approved.
              </p>
            </div>
          </div>
        )}

        {user.kycStatus === 'rejected' && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 mb-8 flex items-start gap-4">
            <div className="p-3 bg-rose-100 text-rose-700 rounded-xl">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="font-bold text-rose-950">Shop Status: Verification Rejected</h3>
              <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                We were unable to validate your business license. Please review the details below, ensure your shop name matches your physical address, and resubmit.
              </p>
            </div>
          </div>
        )}

        {/* Form panel */}
        {notif && (
          <div className={`mb-6 p-4 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            notif.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-rose-50 text-rose-800 border-rose-100'
          }`}>
            <span>{notif.text}</span>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-6 border-b border-slate-100 pb-3">
            <Building size={18} className="text-indigo-600" />
            Update Business Profile Details
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase">Shop / Business Name</label>
                <input
                  type="text"
                  required
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  placeholder="Vikas General Store"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3.5 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase">Proprietor / Owner Name</label>
                <input
                  type="text"
                  required
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleChange}
                  placeholder="Vikas Kumar"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3.5 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Registered Physical Address</label>
              <textarea
                required
                name="businessAddress"
                rows={2}
                value={formData.businessAddress}
                onChange={handleChange}
                placeholder="Indiranagar, Bengaluru, Karnataka"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3.5 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase">GSTIN / GST Number (Optional)</label>
                <input
                  type="text"
                  name="gstNumber"
                  value={formData.gstNumber}
                  onChange={handleChange}
                  placeholder="e.g. 22AAAAA0000A1Z5"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3.5 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase">PAN Number</label>
                <input
                  type="text"
                  required
                  name="panNumber"
                  value={formData.panNumber}
                  onChange={handleChange}
                  placeholder="e.g. ABCDE1234F"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3.5 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition uppercase"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-2.5 rounded-lg shadow transition flex items-center gap-1.5"
              >
                <Send size={13} /> {submitting ? 'Submitting...' : 'Resubmit Shop Profile'}
              </button>
            </div>
          </form>
        </div>

      </main>

      <Footer />
    </div>
  );
}
