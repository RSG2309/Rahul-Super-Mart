'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { 
  User, 
  MapPin, 
  ShoppingBag, 
  CreditCard, 
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  Phone, 
  Mail, 
  Building,
  ArrowRight,
  ExternalLink,
  KeyRound
} from 'lucide-react';
import Link from 'next/link';

function Profile() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, logout, submitKyc } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'wallet'>('orders');

  useEffect(() => {
    if (searchParams) {
      const tab = searchParams.get('tab');
      if (tab === 'profile' || tab === 'orders' || tab === 'wallet') {
        setActiveTab(tab as any);
      }
    }
  }, [searchParams]);

  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    businessName: '',
    ownerName: '',
    businessAddress: '',
    gstNumber: '',
    panNumber: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add Funds State
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [loadAmount, setLoadAmount] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [isSubmittingFunds, setIsSubmittingFunds] = useState(false);
  const [addFundsSuccess, setAddFundsSuccess] = useState<string | null>(null);
  const [addFundsError, setAddFundsError] = useState<string | null>(null);

  const [showChangePasswordForm, setShowChangePasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePasswordError, setChangePasswordError] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState('');
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePasswordError('');
    setChangePasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setChangePasswordError('New passwords do not match!');
      return;
    }
    if (newPassword.length < 6) {
      setChangePasswordError('New password must be at least 6 characters.');
      return;
    }

    try {
      setIsSubmittingPassword(true);
      const res = await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      if (res.success) {
        setChangePasswordSuccess('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setShowChangePasswordForm(false);
          setChangePasswordSuccess('');
        }, 3000);
      } else {
        setChangePasswordError(res.message || 'Failed to update password.');
      }
    } catch (err: any) {
      setChangePasswordError('Server error updating password.');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const handleAddFundsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddFundsError(null);
    setAddFundsSuccess(null);

    const amt = Number(loadAmount);
    if (isNaN(amt) || amt <= 0) {
      setAddFundsError('Please enter a valid amount.');
      return;
    }

    if (!utrNumber.trim()) {
      setAddFundsError('Please enter the UTR/Reference number for verification.');
      return;
    }

    setIsSubmittingFunds(true);
    try {
      const res = await api.post('/auth/wallet/add-funds', {
        amount: amt,
        utr: utrNumber.trim()
      });

      if (res.success) {
        setAddFundsSuccess(res.message || 'Deposit request submitted successfully! Waiting for Admin approval.');
        setLoadAmount('');
        setUtrNumber('');
        // Refresh statement ledger list
        fetchTransactionHistory();
      } else {
        setAddFundsError(res.message || 'Failed to submit request.');
      }
    } catch (err) {
      setAddFundsError('Server communication error.');
    } finally {
      setIsSubmittingFunds(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await submitKyc(editFormData);
    setSaving(false);
    if (res.success) {
      setIsEditing(false);
    } else {
      setError(res.message || 'Failed to update profile');
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading]);

  useEffect(() => {
    if (user) {
      fetchOrderHistory();
      fetchTransactionHistory();
    }
  }, [user]);

  const fetchOrderHistory = async () => {
    try {
      setOrdersLoading(true);
      const res = await api.get('/orders');
      if (res.success) {
        setOrders(res.orders);
      }
    } catch (e) {
      console.error('Error fetching retailer order history:', e);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchTransactionHistory = async () => {
    try {
      setTransactionsLoading(true);
      const res = await api.get('/transactions');
      if (res.success) {
        setTransactions(res.transactions);
      }
    } catch (e) {
      console.error('Error fetching transactions ledger:', e);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'received':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'dispatched':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100';
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

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-8">
        
        {/* Profile Header */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-sm mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4 text-left">
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
              <Building size={32} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Retailer Account</span>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                {user.kycDetails?.businessName || 'My Shop'}
              </h1>
              <p className="text-xs text-slate-500 font-medium">Owner: {user.kycDetails?.ownerName || 'Retailer'}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <div className="bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl text-left">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Wallet Balance</span>
              <span className="text-sm font-black text-slate-900">₹{user.walletBalance.toLocaleString('en-IN')}</span>
            </div>
            
            <div className="bg-indigo-50/50 border border-indigo-100/50 px-4 py-2.5 rounded-xl text-left">
              <span className="text-[10px] text-indigo-500 block font-bold uppercase">Promo Balance (5%)</span>
              <span className="text-sm font-black text-indigo-700">₹{(user.promoWalletBalance || 0).toLocaleString('en-IN')}</span>
            </div>
            
            <div className="flex items-center">
              {user.kycStatus === 'verified' ? (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold text-xs px-4 py-3 rounded-xl flex items-center gap-1.5 shadow-sm">
                  <ShieldCheck size={16} /> Verified Store
                </div>
              ) : user.kycStatus === 'pending' ? (
                <div className="bg-amber-50 border border-amber-100 text-amber-700 font-bold text-xs px-4 py-3 rounded-xl flex items-center gap-1.5 shadow-sm animate-pulse">
                  <Clock size={16} /> Pending Approval
                </div>
              ) : (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 font-bold text-xs px-4 py-3 rounded-xl flex items-center gap-1.5 shadow-sm">
                  <AlertTriangle size={16} /> KYC Rejected
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-4 pt-2 rounded-t-2xl border-t border-x overflow-x-auto gap-2">
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3.5 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
              activeTab === 'orders' ? 'border-indigo-600 text-indigo-600 font-black' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShoppingBag size={15} /> Order History ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3.5 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
              activeTab === 'profile' ? 'border-indigo-600 text-indigo-600 font-black' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User size={15} /> Shop Profile & Addresses
          </button>
          <button
            onClick={() => setActiveTab('wallet')}
            className={`py-3.5 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
              activeTab === 'wallet' ? 'border-indigo-600 text-indigo-600 font-black' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard size={15} /> Wallet Ledger
          </button>
        </div>

        {/* Tab Body */}
        <div className="bg-white border-x border-b border-slate-200/80 rounded-b-2xl p-6 md:p-8 shadow-sm">
          
          {/* Dynamic KYC Warning Banner */}
          {user && user.kycStatus !== 'verified' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 text-left flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <h4 className="font-extrabold text-amber-900 text-sm flex items-center gap-1.5">
                  <AlertTriangle size={16} className="text-amber-600" /> Complete Your Shop Verification
                </h4>
                <p className="text-xs text-amber-700 max-w-xl leading-normal font-medium">
                  Your shop verification is currently pending or rejected. Please submit your Shop KYC documents to activate bulk pricing MOQ discounts, online wallet payments, and order dispatch features.
                </p>
              </div>
              <Link 
                href="/auth/kyc" 
                className="bg-[#fb641b] hover:bg-[#e1530f] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow transition whitespace-nowrap"
              >
                Submit Shop KYC
              </Link>
            </div>
          )}
          
          {/* TAB 1: ORDER HISTORY */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-855 text-sm text-left">Your Sourcing Orders</h3>
                <button 
                  onClick={fetchOrderHistory}
                  className="text-indigo-600 hover:text-indigo-700 text-xs font-bold"
                >
                  Refresh History
                </button>
              </div>

              {ordersLoading ? (
                <div className="py-12 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="text-xs text-slate-400 mt-2">Fetching your order history...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="py-12 text-center max-w-sm mx-auto space-y-4">
                  <div className="p-4 bg-slate-50 text-slate-400 rounded-full w-fit mx-auto">
                    <ShoppingBag size={28} />
                  </div>
                  <h4 className="font-bold text-slate-700 text-sm">No Orders Placed Yet</h4>
                  <p className="text-xs text-slate-400">You haven't ordered any products. Explore our marketplace categories to buy stock for your shop.</p>
                  <Link 
                    href="/catalog" 
                    className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-2.5 rounded-lg shadow-sm"
                  >
                    Browse Sourcing Catalog <ArrowRight size={13} />
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((order) => (
                    <div 
                      key={order.id} 
                      className="border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 transition"
                    >
                      {/* Order top banner summary */}
                      <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex flex-wrap justify-between items-center gap-4 text-xs">
                        <div className="flex items-center gap-3">
                          <div className="text-left">
                            <span className="text-[10px] text-slate-400 uppercase block font-bold">Order ID</span>
                            <span className="font-mono font-bold text-slate-800">{order.id}</span>
                          </div>
                          <div className="text-left border-l border-slate-200 pl-3">
                            <span className="text-[10px] text-slate-400 uppercase block font-bold">Date Placed</span>
                            <span className="text-slate-700 font-medium">
                              {new Date(order.createdAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(order.orderStatus)}`}>
                            {order.orderStatus?.toUpperCase() || 'RECEIVED'}
                          </span>
                          <span className="font-black text-slate-900 text-sm">
                            ₹{order.amounts.finalTotal.toLocaleString('en-IN')}
                          </span>
                          <a
                            href={`http://localhost:5000/api/orders/${order.id}/invoice?token=${typeof window !== 'undefined' ? localStorage.getItem('b2b_token') : ''}`}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-blue-50 hover:bg-blue-100 text-[#2874f0] border border-blue-200 hover:border-blue-300 font-extrabold px-3 py-1 rounded text-[10px] transition flex items-center gap-1 shadow-sm"
                            title="Download Tax Invoice"
                          >
                            PDF Invoice
                          </a>
                        </div>
                      </div>

                      {/* Items details list */}
                      <div className="p-5 text-left">
                        <div className="divide-y divide-slate-100">
                          {order.items.map((item: any, idx: number) => (
                            <div key={idx} className="py-3 flex justify-between items-center text-xs first:pt-0 last:pb-0">
                              <div>
                                <span className="font-bold text-slate-800 block">{item.name}</span>
                                <span className="text-[10px] text-slate-400">SKU: {item.sku} | Unit Price: ₹{item.price}</span>
                              </div>
                              <div className="text-right">
                                <span className="font-medium text-slate-505 block">Qty: {item.quantity} packs</span>
                                <span className="font-bold text-slate-700">₹{item.subtotal.toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Extra COD information if applicable */}
                        {order.paymentMethod === 'cod' && order.orderStatus !== 'delivered' && order.orderStatus !== 'cancelled' && order.orderStatus !== 'returned' && (
                          <div className="mt-4 bg-amber-50 border border-amber-100 rounded-lg p-3.5 flex items-center justify-between gap-3 text-xs">
                            <div className="text-amber-900 font-medium">
                              <span className="font-bold block text-amber-955">Cash on Delivery Verification PIN</span>
                              Please share this OTP with the delivery agent when they arrive at your shop.
                            </div>
                            <div className="bg-white border border-amber-200 text-amber-905 font-mono font-black text-sm px-3.5 py-1.5 rounded-md flex items-center gap-1">
                              <KeyRound size={14} className="text-amber-605" />
                              {order.otpVerification?.code}
                            </div>
                          </div>
                        )}

                        {/* Order Address & Payment Summary */}
                        <div className="mt-4 pt-4 border-t border-slate-150 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-500">
                          <div>
                            <span className="font-bold text-slate-700 block mb-0.5">Shipping Address</span>
                            <span>{order.deliveryAddress} (PIN: {order.pincode})</span>
                          </div>
                          <div className="md:text-right">
                            <span className="font-bold text-slate-700 block mb-0.5">Payment Method</span>
                            <span className="uppercase font-semibold text-slate-600">
                              {order.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : `Online Wallet Payment`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* TAB 3: WALLET HISTORY LEDGER */}
          {activeTab === 'wallet' && (() => {
            const walletTransactions = transactions.filter((tx: any) => tx.paymentGateway === 'wallet' || !tx.orderId);
            return (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
                  <div className="text-left">
                    <h3 className="font-extrabold text-slate-850 text-sm">B2B Wallet Ledger</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Real-time ledger statements of all adjustments, refunds, and order payments.</p>
                  </div>
                  <div className="flex gap-2.5 w-full sm:w-auto">
                    <button 
                      onClick={fetchTransactionHistory}
                      className="text-indigo-650 hover:text-indigo-700 text-xs font-bold border border-slate-200 bg-white px-3.5 py-2 rounded-xl transition shadow-sm"
                    >
                      Refresh Statements
                    </button>
                    <button
                      onClick={() => {
                        setAddFundsError(null);
                        setAddFundsSuccess(null);
                        setLoadAmount('');
                        setUtrNumber('');
                        setShowAddFundsModal(true);
                      }}
                      className="bg-[#2874f0] hover:bg-[#1b5ec2] text-white font-extrabold text-xs px-4 py-2 rounded-xl transition shadow-sm inline-flex items-center"
                    >
                      Add Wallet Funds
                    </button>
                  </div>
                </div>

                {/* Wallet Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 p-5 rounded-2xl text-white text-left border border-indigo-850 shadow-md">
                    <span className="text-[10px] text-indigo-200/90 font-bold uppercase tracking-wider block">Total Available Balance</span>
                    <div className="text-2xl font-black mt-1">₹{user.walletBalance.toLocaleString('en-IN')}</div>
                    <span className="text-[10px] text-indigo-300 mt-2 block font-medium">Linked to: {user.kycDetails?.businessName || user.email}</span>
                  </div>
                  <div className="bg-gradient-to-br from-purple-800 to-indigo-950 p-5 rounded-2xl text-white text-left border border-purple-850 shadow-md">
                    <span className="text-[10px] text-purple-200/90 font-bold uppercase tracking-wider block">Promo Wallet Balance</span>
                    <div className="text-2xl font-black mt-1">₹{(user.promoWalletBalance || 0).toLocaleString('en-IN')}</div>
                    <span className="text-[10px] text-purple-300 mt-2 block font-medium">Use up to 5% discount per order</span>
                  </div>
                  <div className="bg-white p-5 rounded-2xl text-left border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Wallet Transactions</span>
                      <div className="text-xl font-extrabold text-slate-800 mt-1">{walletTransactions.length} Statement Entries</div>
                    </div>
                    <span className="text-[10px] text-emerald-600 mt-2 block font-semibold">🔒 Secured Ledger System</span>
                  </div>
                  <div className="bg-white p-5 rounded-2xl text-left border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">KYC Verification Status</span>
                      <div className="text-sm font-extrabold text-slate-800 mt-1 flex items-center gap-1.5">
                        {user.kycStatus === 'verified' ? (
                          <span className="text-emerald-600 flex items-center gap-1">Store Verified <ShieldCheck size={14} /></span>
                        ) : (
                          <span className="text-amber-600">Verification Pending</span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-2 block leading-snug">Verify KYC to unlock higher wallet limits.</span>
                  </div>
                </div>

                {/* Ledger Statement Table */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  {transactionsLoading ? (
                    <div className="py-12 text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2874f0] mx-auto"></div>
                      <p className="text-xs text-slate-400 mt-2">Loading transactions history...</p>
                    </div>
                  ) : walletTransactions.length === 0 ? (
                    <div className="py-12 text-center max-w-sm mx-auto space-y-3">
                      <div className="p-4 bg-slate-50 text-slate-400 rounded-full w-fit mx-auto">
                        <CreditCard size={28} />
                      </div>
                      <h4 className="font-bold text-slate-700 text-sm">No Ledger History Found</h4>
                      <p className="text-xs text-slate-400">You haven't made any wallet transactions yet. Funds added or order payouts will appear here.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                            <th className="px-5 py-3.5">Reference ID</th>
                            <th className="px-5 py-3.5">Date & Time</th>
                            <th className="px-5 py-3.5">Method</th>
                            <th className="px-5 py-3.5">Status</th>
                            <th className="px-5 py-3.5 text-right">Ledger Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {walletTransactions.map((tx: any) => {
                            const isCredit = tx.gatewayTransactionId?.startsWith('REFUND_') || 
                                             (!tx.orderId && tx.amount > 0) || 
                                             (tx.gatewayTransactionId?.startsWith('ADJUST_') && tx.amount > 0);
                            const formattedDate = tx.createdAt ? new Date(tx.createdAt).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'N/A';
                            
                            return (
                              <tr key={tx.id} className="hover:bg-slate-50/50 transition duration-150">
                                <td className="px-5 py-4 font-semibold text-slate-700">
                                  <div className="space-y-0.5">
                                    <span className="block font-mono text-[10px] text-slate-500">{tx.gatewayTransactionId || tx.id}</span>
                                    {tx.orderId && (
                                      <span className="block text-[9px] text-[#2874f0]">Order ID: {tx.orderId}</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-5 py-4 text-slate-500 font-medium">{formattedDate}</td>
                                <td className="px-5 py-4">
                                  <span className="capitalize px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-bold text-[10px]">
                                    {tx.paymentGateway}
                                  </span>
                                </td>
                                <td className="px-5 py-4">
                                  <span className={`inline-flex items-center gap-1 font-bold text-[9px] uppercase px-2 py-0.5 rounded-full border ${
                                    tx.status === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                    tx.status === 'failed' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                    'bg-amber-50 text-amber-700 border-amber-100'
                                  }`}>
                                    {tx.status}
                                  </span>
                                </td>
                                <td className={`px-5 py-4 text-right font-black text-sm ${isCredit ? 'text-emerald-600 font-black' : 'text-rose-600'}`}>
                                  {isCredit ? '+' : '-'}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* TAB 2: PROFILE & ADDRESSES */}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Profile Details Block */}
              <div className="lg:col-span-2 space-y-6">
                {isEditing ? (
                  <form onSubmit={handleSaveProfile} className="border border-slate-200 bg-white rounded-2xl p-6 text-left space-y-4">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                      <Building size={16} className="text-[#2874f0]" />
                      Edit Shop Profile & Address
                    </h3>
                    {error && (
                      <div className="bg-rose-50 text-rose-800 text-xs p-3 rounded-lg border border-rose-100">{error}</div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Shop / Business Name</label>
                        <input
                          type="text"
                          required
                          value={editFormData.businessName}
                          onChange={(e) => setEditFormData({...editFormData, businessName: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3.5 py-1.5 mt-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#2874f0] focus:bg-white transition"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Proprietor / Owner Name</label>
                        <input
                          type="text"
                          required
                          value={editFormData.ownerName}
                          onChange={(e) => setEditFormData({...editFormData, ownerName: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3.5 py-1.5 mt-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#2874f0] focus:bg-white transition"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Registered Physical Address / Shipping Destination</label>
                      <textarea
                        required
                        rows={3}
                        value={editFormData.businessAddress}
                        onChange={(e) => setEditFormData({...editFormData, businessAddress: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3.5 py-1.5 mt-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#2874f0] focus:bg-white transition"
                      />
                    </div>
                    
                    <div className="flex gap-2.5 justify-end pt-3 border-t border-slate-100 mt-4">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="text-slate-500 hover:text-slate-700 text-xs font-bold px-4 py-2"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="bg-[#2874f0] hover:bg-[#1b5ec2] text-white font-extrabold text-xs px-5 py-2 rounded-lg shadow-sm transition"
                      >
                        {saving ? 'Saving...' : 'Save & Submit KYC'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="border border-slate-200 rounded-2xl p-6 text-left bg-white">
                      <h3 className="font-bold text-slate-800 text-sm flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                        <span className="flex items-center gap-2">
                          <Building size={16} className="text-[#2874f0]" />
                          Store Registration Profile
                        </span>
                        <button
                          onClick={() => {
                            setEditFormData({
                              businessName: user.kycDetails?.businessName || '',
                              ownerName: user.kycDetails?.ownerName || '',
                              businessAddress: user.kycDetails?.businessAddress || '',
                              gstNumber: user.kycDetails?.gstNumber || '',
                              panNumber: user.kycDetails?.panNumber || ''
                            });
                            setError(null);
                            setIsEditing(true);
                          }}
                          className="text-[#2874f0] hover:underline font-bold text-xs"
                        >
                          Edit Profile
                        </button>
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-500">
                        <div>
                          <span className="font-bold text-slate-400 block uppercase text-[10px]">Shop Name</span>
                          <span className="text-slate-855 font-bold text-sm block mt-0.5">
                            {user.kycDetails?.businessName || 'Not Set'}
                          </span>
                        </div>

                        <div>
                          <span className="font-bold text-slate-400 block uppercase text-[10px]">Proprietor Owner Name</span>
                          <span className="text-slate-855 font-bold text-sm block mt-0.5">
                            {user.kycDetails?.ownerName || 'Not Set'}
                          </span>
                        </div>

                        <div>
                          <span className="font-bold text-slate-400 block uppercase text-[10px]">Registered Contact Number</span>
                          <span className="text-slate-800 font-medium text-sm block mt-0.5 flex items-center gap-1">
                            <Phone size={13} className="text-[#2874f0]" /> {user.mobile}
                          </span>
                        </div>

                        <div>
                          <span className="font-bold text-slate-400 block uppercase text-[10px]">Primary Email Address</span>
                          <span className="text-slate-800 font-medium text-sm block mt-0.5 flex items-center gap-1">
                            <Mail size={13} className="text-[#2874f0]" /> {user.email}
                          </span>
                        </div>

                        {user.kycDetails?.gstNumber && (
                          <div>
                            <span className="font-bold text-slate-400 block uppercase text-[10px]">GSTIN / GST Number</span>
                            <span className="text-slate-800 font-extrabold text-sm block mt-0.5 uppercase tracking-wide">
                              {user.kycDetails.gstNumber}
                            </span>
                          </div>
                        )}

                        {user.kycDetails?.panNumber && (
                          <div>
                            <span className="font-bold text-slate-400 block uppercase text-[10px]">PAN Number</span>
                            <span className="text-slate-800 font-extrabold text-sm block mt-0.5 uppercase tracking-wide">
                              {user.kycDetails.panNumber}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Redirect to update shop details */}
                      <div className="mt-6 pt-5 border-t border-slate-100 flex justify-between items-center gap-3">
                        <button
                          onClick={() => {
                            setEditFormData({
                              businessName: user.kycDetails?.businessName || '',
                              ownerName: user.kycDetails?.ownerName || '',
                              businessAddress: user.kycDetails?.businessAddress || '',
                              gstNumber: user.kycDetails?.gstNumber || '',
                              panNumber: user.kycDetails?.panNumber || ''
                            });
                            setError(null);
                            setIsEditing(true);
                          }}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-750 font-bold text-xs px-4.5 py-2 rounded-lg transition"
                        >
                          Edit Profile Details
                        </button>
                        
                        <Link
                          href="/auth/kyc"
                          className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-[#2874f0] font-bold text-xs px-4.5 py-2 rounded-lg transition"
                        >
                          Submit Shop KYC <ExternalLink size={12} />
                        </Link>
                      </div>
                    </div>

                    {/* Delivery Address Block */}
                    <div className="border border-slate-200 rounded-2xl p-6 text-left bg-white">
                      <h3 className="font-bold text-slate-800 text-sm flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                        <span className="flex items-center gap-2">
                          <MapPin size={16} className="text-[#2874f0]" />
                          Registered Shipping Address
                        </span>
                        <button
                          onClick={() => {
                            setEditFormData({
                              businessName: user.kycDetails?.businessName || '',
                              ownerName: user.kycDetails?.ownerName || '',
                              businessAddress: user.kycDetails?.businessAddress || '',
                              gstNumber: user.kycDetails?.gstNumber || '',
                              panNumber: user.kycDetails?.panNumber || ''
                            });
                            setError(null);
                            setIsEditing(true);
                          }}
                          className="text-[#2874f0] hover:underline font-bold text-xs"
                        >
                          Edit Address
                        </button>
                      </h3>

                      <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl flex items-start gap-3">
                        <MapPin size={16} className="text-[#2874f0] mt-0.5 flex-shrink-0" />
                        <div className="text-xs">
                          <span className="font-bold text-slate-800 block mb-0.5">Primary Delivery Address</span>
                          <p className="text-slate-650 leading-relaxed font-medium">
                            {user.kycDetails?.businessAddress || 'No primary shipping address saved.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Sidebar logout/account control panel */}
              <div className="space-y-4">
                <div className="border border-slate-200 rounded-2xl p-6 text-left space-y-4">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-slate-400">Account Control</h4>
                  
                  {!showChangePasswordForm ? (
                    <button
                      onClick={() => setShowChangePasswordForm(true)}
                      className="w-full text-center bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-750 font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                    >
                      <KeyRound size={13} /> Change Password
                    </button>
                  ) : (
                    <form onSubmit={handleChangePassword} className="space-y-3 pt-1 animate-fadeIn">
                      <div className="space-y-1">
                        <label className="block text-[9px] font-bold text-slate-450 uppercase">Current Password</label>
                        <input
                          type="password"
                          required
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[9px] font-bold text-slate-450 uppercase">New Password</label>
                        <input
                          type="password"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[9px] font-bold text-slate-450 uppercase">Confirm New Password</label>
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      {changePasswordError && (
                        <div className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg p-2 text-center">
                          ⚠️ {changePasswordError}
                        </div>
                      )}

                      {changePasswordSuccess && (
                        <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg p-2 text-center">
                          ✓ {changePasswordSuccess}
                        </div>
                      )}

                      <div className="flex gap-2 pt-1.5">
                        <button
                          type="submit"
                          disabled={isSubmittingPassword}
                          className="flex-grow bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white font-bold py-1.5 rounded-lg text-[10px] transition shadow"
                        >
                          {isSubmittingPassword ? 'Updating...' : 'Update'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowChangePasswordForm(false);
                            setChangePasswordError('');
                          }}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-650 font-bold py-1.5 px-3 rounded-lg text-[10px] transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  <button
                    onClick={logout}
                    className="w-full text-center bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-700 font-bold py-2.5 rounded-xl text-xs transition"
                  >
                    Logout Account
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

      </main>

      {/* ADD WALLET FUNDS MODAL */}
      {showAddFundsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 flex flex-col space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Load B2B Wallet Funds</h3>
              <button 
                onClick={() => setShowAddFundsModal(false)}
                className="text-slate-400 hover:text-slate-650 font-extrabold text-sm p-1"
              >
                ✕
              </button>
            </div>

            {addFundsSuccess ? (
              <div className="py-6 text-center space-y-3">
                <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold border border-emerald-100">
                  ✓
                </div>
                <h4 className="text-xs font-bold text-slate-800 uppercase">Request Submitted</h4>
                <p className="text-xs text-slate-500 leading-normal px-4">{addFundsSuccess}</p>
                <button 
                  onClick={() => setShowAddFundsModal(false)}
                  className="w-full mt-4 bg-slate-900 hover:bg-slate-950 text-white font-bold py-2.5 rounded-xl text-xs transition"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddFundsSubmit} className="space-y-4 text-left">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-center space-y-1">
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Scan the QR code below to pay via GPay, PhonePe, Paytm, or BHIM.
                  </p>
                  <p className="text-xs font-black text-indigo-700 font-mono select-all">
                    UPI ID: 9973454427@okbizaxis
                  </p>
                </div>

                {/* QR Barcode Image */}
                <div className="border border-slate-250 rounded-2xl overflow-hidden bg-white p-2 flex justify-center max-w-[200px] mx-auto shadow-sm">
                  <img 
                    src={loadAmount && Number(loadAmount) >= 1 
                      ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`upi://pay?pa=9973454427@okbizaxis&pn=Rahul%20Telecom%20Shop&am=${loadAmount}&cu=INR`)}`
                      : "/wallet-qr.jpg"
                    }
                    alt="UPI Payment QR Code" 
                    className="w-full h-auto object-contain rounded-xl"
                  />
                </div>

                {addFundsError && (
                  <div className="bg-rose-50 text-rose-700 text-xs font-bold p-3 rounded-xl border border-rose-100/50">
                    ⚠️ {addFundsError}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Payment Amount (INR)</label>
                    <input 
                      type="number" 
                      required
                      placeholder="e.g. 5000"
                      value={loadAmount}
                      onChange={(e) => setLoadAmount(e.target.value)}
                      className="w-full bg-white border border-slate-250 text-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Transaction UTR / Ref No (12 Digits)</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. 620401827493"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                      className="w-full bg-white border border-slate-250 text-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmittingFunds}
                  className="w-full bg-[#2874f0] hover:bg-[#1b5ec2] disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold py-2.5 rounded-xl text-xs transition shadow-md shadow-blue-600/10"
                >
                  {isSubmittingFunds ? 'Submitting Request...' : 'Submit Deposit Proof'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <Profile />
    </Suspense>
  );
}
