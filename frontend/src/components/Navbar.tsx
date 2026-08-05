'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { ShoppingCart, LogOut, Wallet, Plus, X, CheckCircle, Trash2, ArrowRight, User, ArrowLeft, Home, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { items, isCartOpen, setCartOpen, updateQuantity, removeFromCart, amounts, shippingAddress, couponCode, applyCoupon, removeCoupon } = useCart();
  const router = useRouter();
  const [couponInput, setCouponInput] = useState('');
  const [drawerCouponError, setDrawerCouponError] = useState<string | null>(null);
  const [drawerCouponSuccess, setDrawerCouponSuccess] = useState(false);

  const handleDrawerApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setDrawerCouponError(null);
    setDrawerCouponSuccess(false);
    if (!couponInput.trim()) return;

    const res = await applyCoupon(couponInput.trim());
    if (res.success) {
      setDrawerCouponSuccess(true);
      setCouponInput('');
    } else {
      setDrawerCouponError(res.message || 'Invalid coupon');
    }
  };
  const [searchQuery, setSearchQuery] = useState('');
  
  // Wallet modal states
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletAmount, setWalletAmount] = useState('');
  const [walletUtr, setWalletUtr] = useState('');
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [walletSuccess, setWalletSuccess] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleLoadWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setWalletError(null);

    if (!walletUtr.trim()) {
      setWalletError('Please enter the UTR/Reference number for verification.');
      return;
    }

    setLoadingWallet(true);

    try {
      const token = localStorage.getItem('b2b_token');
      const response = await fetch('http://localhost:5000/api/auth/wallet/add-funds', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: walletAmount, utr: walletUtr.trim() })
      });
      const data = await response.json();
      setLoadingWallet(false);

      if (data.success) {
        setWalletSuccess(true);
      } else {
        setWalletError(data.message || 'Payment failed.');
      }
    } catch (err) {
      setLoadingWallet(false);
      setWalletError('Failed to complete transaction.');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#2874f0] text-white shadow-md border-b border-blue-600/50 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img 
              src="/logo.png" 
              alt="Rahul Super Mart Logo" 
              className="h-10 md:h-11 w-auto object-contain bg-white px-3 py-1.5 rounded-lg shadow-sm hover:scale-102 transition duration-200" 
            />
          </Link>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search grocery staples, cosmetics, electronics..."
                className="w-full pl-4 pr-10 py-2 border-0 rounded bg-white text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-[#fb641b] transition shadow-sm"
              />
              <button type="submit" className="absolute right-3 top-2.5 text-slate-400 hover:text-[#2874f0] transition">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>

          {/* Center/Right Nav links */}
          <nav className="flex items-center gap-5">
            <Link href="/catalog" className="text-sm font-semibold text-white/90 hover:text-white transition hover:underline">
              Catalog
            </Link>

            {user && (user.role === 'admin' || user.role === 'staff') && (
              <Link href="/admin" className="text-sm font-extrabold text-yellow-300 hover:text-yellow-400 transition hover:underline">
                Admin Panel
              </Link>
            )}

            {/* Wallet for Retailer */}
            {user && user.role === 'retailer' && (
              <div className="flex items-center gap-1.5 bg-blue-700/60 text-white px-3 py-1 rounded border border-blue-500/40 shadow-inner text-xs font-bold">
                <Wallet size={13} className="text-blue-200" />
                <span>₹{user.walletBalance.toLocaleString('en-IN')}</span>
                <button
                  onClick={() => setShowWalletModal(true)}
                  className="ml-1.5 bg-[#fb641b] hover:bg-[#e1530f] text-white rounded p-0.5 shadow-sm transition flex items-center justify-center"
                  title="Add Funds via UPI"
                >
                  <Plus size={10} />
                </button>
              </div>
            )}

            {/* Shopping Cart Trigger */}
            <button 
              onClick={() => setCartOpen(true)}
              className="relative p-2 text-white hover:text-white/80 transition focus:outline-none"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#fb641b] text-white rounded-full text-[9px] w-5 h-5 flex items-center justify-center font-black border border-white">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Amazon-style Profile/Account Dropdown */}
            {user ? (
              <div className="relative group/profile flex items-center ml-2 border-l border-blue-400/50 pl-4">
                <div className="cursor-pointer flex items-center gap-1.5 py-2 text-white hover:opacity-90 transition">
                  <div className="w-8 h-8 bg-blue-700/60 rounded-full flex items-center justify-center text-white border border-blue-500/30 shadow-sm">
                    <User size={15} />
                  </div>
                  <div className="hidden sm:flex flex-col text-left leading-none">
                    <span className="text-[9px] text-blue-100 font-bold block tracking-wider uppercase">Hello, {user.kycDetails?.ownerName?.split(' ')[0] || 'Partner'}</span>
                    <span className="text-xs font-black text-white flex items-center gap-0.5 transition mt-0.5">
                      Account & Lists
                      <svg className="w-2.5 h-2.5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </div>
                </div>

                {/* Amazon-style Flyout Dropdown Panel */}
                <div className="absolute right-0 top-full pt-1.5 w-64 opacity-0 invisible group-hover/profile:opacity-100 group-hover/profile:visible transition-all duration-200 z-50">
                  <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xl p-4 text-left text-slate-800 relative before:content-[''] before:absolute before:top-[-6px] before:right-6 before:w-3 before:h-3 before:bg-white before:rotate-45 before:border-l before:border-t before:border-slate-200 flex flex-col gap-3.5">
                    
                    {/* User Info Header */}
                    <div className="border-b border-slate-100 pb-3 flex flex-col text-left">
                      <span className="text-xs font-black text-slate-900 leading-normal block">
                        {user.kycDetails?.businessName || 'My Store'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                        Role: <span className="font-bold text-slate-700 capitalize">{user.role}</span>
                      </span>
                      {user.role === 'retailer' && (
                        <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold mt-1.5 px-2 py-0.5 rounded border self-start ${
                          user.kycStatus === 'verified' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                            : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          KYC: {user.kycStatus === 'verified' ? 'Verified Partner' : 'Pending Verification'}
                        </span>
                      )}
                    </div>

                    {/* Features Links */}
                    <div className="flex flex-col gap-1">
                      <Link 
                        href="/profile?tab=orders" 
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-[#2874f0] font-semibold text-xs transition"
                      >
                        📋 Order History
                      </Link>

                      <Link 
                        href="/profile?tab=profile" 
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-[#2874f0] font-semibold text-xs transition"
                      >
                        📍 Saved Addresses
                      </Link>

                      <Link 
                        href="/profile?tab=wallet" 
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-[#2874f0] font-semibold text-xs transition"
                      >
                        💳 Wallet Ledger
                      </Link>
                      
                      {user.role === 'retailer' && (
                        <div className="bg-slate-50 border border-slate-200/60 p-2.5 rounded-xl flex flex-col gap-2 mt-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-450 font-bold text-[9px] uppercase tracking-wider block">Wallet Balance</span>
                            <span className="font-black text-slate-800">₹{user.walletBalance.toLocaleString('en-IN')}</span>
                          </div>
                          <button 
                            onClick={() => setShowWalletModal(true)}
                            className="w-full bg-[#fb641b] hover:bg-[#e1530f] text-white font-extrabold text-[10px] py-1.5 rounded shadow-sm transition uppercase tracking-wider block text-center"
                          >
                            + Add Funds via UPI
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Sign Out Action */}
                    <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                      <Link 
                        href="/profile" 
                        className="text-[10px] text-[#2874f0] hover:underline font-extrabold uppercase tracking-wide transition"
                      >
                        My Account
                      </Link>
                      <button
                        onClick={logout}
                        className="text-[10px] text-rose-600 hover:text-rose-800 font-extrabold uppercase tracking-wide transition flex items-center gap-1.5 px-2.5 py-1 hover:bg-rose-50 rounded-lg"
                      >
                        Sign Out
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 ml-2 border-l border-blue-400/50 pl-4">
                <Link href="/auth/login" className="bg-blue-50 text-[#2874f0] hover:bg-blue-100 px-4 py-1.5 rounded font-extrabold text-xs shadow transition">
                  Login
                </Link>
                <Link href="/auth/register" className="text-xs font-bold text-white hover:underline transition">
                  Join Free
                </Link>
              </div>
            )}
          </nav>
        </div>
        
        {/* Mobile Search Bar (Only visible on screens smaller than md) */}
        <div className="pb-3 block md:hidden">
          <form onSubmit={handleSearch} className="w-full">
            <div className="relative w-full">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search grocery staples, cosmetics, electronics..."
                className="w-full pl-4 pr-10 py-2 border-0 rounded-lg bg-white text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-[#fb641b] transition shadow-sm"
              />
              <button type="submit" className="absolute right-3 top-2 text-slate-450 hover:text-[#2874f0] transition">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </header>

      {/* Wallet Funding Modal (UPI Simulation) */}
      {showWalletModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-200/80 shadow-2xl relative text-left">
            <button 
              onClick={() => {
                setShowWalletModal(false);
                setWalletAmount('');
                setWalletUtr('');
                setWalletSuccess(false);
                setWalletError(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition"
            >
              <X size={18} />
            </button>

            <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2 mb-2">
              <Wallet className="text-indigo-655" />
              Load Wallet Ledger
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-normal">
              Enter the amount below to generate a secure simulated UPI QR code. Scan and confirm to load funds instantly.
            </p>

            {walletSuccess ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 bg-amber-50 text-amber-655 rounded-full flex items-center justify-center mx-auto border border-amber-100">
                  <CheckCircle size={24} />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Request Submitted!</h4>
                <p className="text-xs text-slate-500">Your request to deposit ₹{Number(walletAmount).toLocaleString('en-IN')} has been sent to Rahul Super Mart admin for approval.</p>
                <button
                  onClick={() => {
                    setShowWalletModal(false);
                    setWalletAmount('');
                    setWalletUtr('');
                    setWalletSuccess(false);
                  }}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-lg transition mt-4 shadow"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleLoadWallet} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Amount (INR)</label>
                  <input
                    type="number"
                    min="1"
                    max="100000"
                    required
                    value={walletAmount}
                    onChange={(e) => setWalletAmount(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3.5 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  />
                  <div className="flex gap-2 mt-2">
                    {['1000', '5000', '10000'].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setWalletAmount(val)}
                        className="bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded border border-slate-200/60 transition"
                      >
                        +₹{Number(val).toLocaleString('en-IN')}
                      </button>
                    ))}
                  </div>
                </div>

                {walletAmount && Number(walletAmount) >= 1 && (
                  <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/60 text-center space-y-3">
                    <span className="block text-[10px] text-indigo-500 font-bold uppercase tracking-wider">UPI Payment Simulator</span>
                    <div className="w-28 h-28 bg-white border border-indigo-100 rounded-xl overflow-hidden flex items-center justify-center mx-auto shadow-inner p-2">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`upi://pay?pa=9973454427@okbizaxis&pn=Rahul%20Telecom%20Shop&am=${walletAmount}&cu=INR`)}`} 
                        alt="UPI Payment QR Code" 
                        className="w-full h-auto object-contain rounded-lg"
                      />
                    </div>
                    <span className="block text-[10px] text-slate-500 font-mono">Scan VPA: <strong className="text-slate-700 font-black">9973454427@okbizaxis</strong></span>
                  </div>
                )}

                {walletAmount && Number(walletAmount) >= 1 && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Transaction UTR / Ref No (12 Digits)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 620401827493"
                      value={walletUtr}
                      onChange={(e) => setWalletUtr(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition font-mono"
                    />
                  </div>
                )}

                {walletError && (
                  <p className="text-[10px] text-rose-600 font-bold">{walletError}</p>
                )}

                <button
                  type="submit"
                  disabled={loadingWallet}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-lg shadow-md hover:shadow-emerald-500/25 transition"
                >
                  {loadingWallet ? 'Processing UPI Payment...' : 'I Have Scanned & Paid'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Slide-Over Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setCartOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />

            {/* Sliding Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '105%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full sm:max-w-md bg-[#f8fafc] shadow-2xl flex flex-col h-full border-l border-slate-200"
            >
              {/* Website Dark Header */}
              <div className="p-4 flex items-center justify-between bg-slate-900 text-white shadow-sm">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={18} className="text-indigo-400" />
                  <h3 className="font-bold text-sm tracking-wide">My Cart ({items.length})</h3>
                </div>
                <button
                  onClick={() => setCartOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
                  title="Close Cart"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Delivery Address Bar */}
              <div className="bg-white border-b border-slate-200/80 px-4 py-3 flex justify-between items-center text-xs shadow-sm">
                <span className="text-slate-655 flex items-start gap-1 text-left max-w-[80%]">
                  <span className="text-indigo-600 font-bold mt-0.5">📍</span> 
                  <span>
                    Deliver to: <strong className="text-slate-800 leading-normal block md:inline">{shippingAddress || user?.kycDetails?.businessAddress || 'Please set your shipping address'}</strong>
                  </span>
                </span>
                <button 
                  onClick={() => { setCartOpen(false); router.push('/checkout'); }} 
                  className="text-indigo-600 font-extrabold border border-slate-200/60 px-3 py-1 rounded shadow-sm hover:bg-slate-50 transition uppercase text-[10px] flex-shrink-0"
                >
                  Change
                </button>
              </div>

              {/* Items List */}
              <div className="flex-grow overflow-y-auto bg-[#f8fafc]">
                <div className="max-w-3xl mx-auto w-full p-4 space-y-4">
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center space-y-4 py-20 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                      <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center border border-slate-100">
                        <ShoppingCart size={28} className="text-slate-300" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">Your cart is empty!</h4>
                        <p className="text-xs text-slate-450 mt-1 max-w-xs leading-relaxed">Add bulk products to start shopping.</p>
                      </div>
                      <button
                        onClick={() => {
                          setCartOpen(false);
                          router.push('/catalog');
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition"
                      >
                        Browse Products
                      </button>
                    </div>
                  ) : (
                    items.map(item => {
                      const price = item.quantity >= 20 ? item.wholesalePrice : item.retailerPrice;
                      const mrpSimulated = item.mrp || Math.round(price * 1.35);
                      const discountPct = Math.round(((mrpSimulated - price) / mrpSimulated) * 100);

                      return (
                        <div key={item.productId} className="bg-white border border-slate-200/60 p-4 rounded-2xl shadow-sm flex flex-col gap-4 text-left">
                          <div className="flex gap-4">
                            {/* Thumbnail */}
                            <Link
                              href={`/products/${item.productId}`}
                              onClick={() => setCartOpen(false)}
                              className="w-20 h-20 bg-white border border-slate-100 rounded-lg p-1.5 flex items-center justify-center flex-shrink-0 hover:opacity-85 transition duration-150"
                            >
                              <img
                                src={item.image}
                                alt={item.name}
                                className="max-h-full max-w-full object-contain"
                              />
                            </Link>

                            {/* Details */}
                            <div className="flex-grow space-y-1">
                              <Link
                                href={`/products/${item.productId}`}
                                onClick={() => setCartOpen(false)}
                                className="hover:text-indigo-600 transition duration-150"
                              >
                                <h4 className="font-semibold text-slate-800 text-xs line-clamp-2 leading-relaxed hover:underline">{item.name}</h4>
                              </Link>
                              <span className="text-[9px] text-slate-400 font-mono block">SKU: {item.sku}</span>
                              
                              <div className="flex items-baseline gap-2 pt-1">
                                <span className="font-black text-slate-800 text-sm">₹{price.toLocaleString('en-IN')}</span>
                                <span className="line-through text-slate-400 text-[10px]">₹{mrpSimulated.toLocaleString('en-IN')}</span>
                                <span className="text-emerald-600 font-extrabold text-[10px]">{discountPct}% Off</span>
                              </div>
                              
                              {/* Slabs Tag */}
                              {item.quantity >= 20 ? (
                                <span className="inline-block text-[8px] bg-emerald-50 text-emerald-700 font-extrabold px-1.5 py-0.5 rounded border border-emerald-100 uppercase tracking-wider">
                                  Bulk Rate Applied
                                </span>
                              ) : (
                                <span className="inline-block text-[8px] bg-indigo-50 text-indigo-700 font-extrabold px-1.5 py-0.5 rounded border border-indigo-105 uppercase tracking-wider">
                                  Buy 20+ for Bulk Discount
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions & Quantity Controls (Flipkart Row Style) */}
                          <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                            {/* Quantity Controls */}
                            <div className="flex items-center border border-slate-200 rounded p-0.5 bg-slate-50">
                              <button
                                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                className="w-6 h-6 flex items-center justify-center text-xs font-bold text-slate-505 hover:bg-white rounded transition border-r border-slate-100"
                              >
                                -
                              </button>
                              <span className="w-8 text-center text-xs font-black text-slate-800">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                className="w-6 h-6 flex items-center justify-center text-xs font-bold text-slate-550 hover:bg-white rounded transition border-l border-slate-100"
                              >
                                +
                              </button>
                            </div>

                            <button
                              onClick={() => removeFromCart(item.productId)}
                              className="text-slate-500 hover:text-rose-600 font-extrabold transition uppercase text-[10px] tracking-wider pr-1"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Coupon Code Panel */}
              {items.length > 0 && (
                <div className="bg-white border-t border-b border-slate-200/80 p-4 text-left">
                  <div className="max-w-3xl mx-auto w-full">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2.5">
                      🎟️ Apply Promo Coupon
                    </h4>
                    {couponCode ? (
                      <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-indigo-900 block">Applied: {couponCode}</span>
                          <span className="text-[10px] text-indigo-750 font-semibold">Flat ₹{amounts.discount.toLocaleString('en-IN')} Saved</span>
                        </div>
                        <button onClick={removeCoupon} className="text-rose-600 font-bold hover:underline text-[10px] uppercase tracking-wider">
                          Remove
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleDrawerApplyCoupon} className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value)}
                            placeholder="WELCOMEB2B"
                            className="flex-grow bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 uppercase transition"
                          />
                          <button type="submit" className="bg-slate-900 text-white hover:bg-slate-800 px-4 py-1.5 rounded-lg text-xs font-bold transition">
                            Apply
                          </button>
                        </div>
                        {drawerCouponError && (
                          <p className="text-[10px] text-rose-650 font-semibold">❌ {drawerCouponError}</p>
                        )}
                        {drawerCouponSuccess && (
                          <p className="text-[10px] text-emerald-600 font-bold">✅ Coupon applied successfully!</p>
                        )}
                      </form>
                    )}
                  </div>
                </div>
              )}

              {/* Indigo Checkout Footer */}
              {items.length > 0 && (
                <div className="bg-white border-t border-slate-200 p-4 flex items-center justify-between shadow-2xl">
                  <div className="text-left">
                    <span className="font-black text-slate-805 text-lg block">₹{amounts.finalTotal.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-slate-400 hover:underline cursor-pointer block font-semibold">View Price Details</span>
                  </div>

                  <button
                    onClick={() => {
                      setCartOpen(false);
                      router.push('/checkout');
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold uppercase text-xs py-3 px-8 rounded-xl shadow-md hover:shadow-indigo-500/25 transition tracking-wider"
                  >
                    Place Order
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Sticky Bottom Navigation (App-like feel) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] px-6 py-2.5 flex justify-between items-center md:hidden z-40">
        <Link href="/" className="flex flex-col items-center gap-1 text-slate-500 hover:text-[#2874f0] transition">
          <Home size={20} />
          <span className="text-[10px] font-bold">Home</span>
        </Link>
        <Link href="/catalog" className="flex flex-col items-center gap-1 text-slate-500 hover:text-[#2874f0] transition">
          <ShoppingBag size={20} />
          <span className="text-[10px] font-bold">Catalog</span>
        </Link>
        <button 
          onClick={() => setCartOpen(true)}
          className="flex flex-col items-center gap-1 text-slate-500 hover:text-[#2874f0] transition relative"
        >
          <ShoppingCart size={20} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-[#fb641b] text-white rounded-full text-[8px] w-4 h-4 flex items-center justify-center font-black border border-white">
              {cartCount}
            </span>
          )}
          <span className="text-[10px] font-bold">Cart</span>
        </button>
        <Link href="/profile" className="flex flex-col items-center gap-1 text-slate-500 hover:text-[#2874f0] transition">
          <User size={20} />
          <span className="text-[10px] font-bold">Account</span>
        </Link>
      </div>
    </>
  );
}
