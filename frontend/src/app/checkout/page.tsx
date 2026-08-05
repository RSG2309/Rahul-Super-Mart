'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { api } from '@/services/api';
import { MapPin, CreditCard, ShoppingBag, ShieldAlert, CheckCircle2, AlertTriangle, FileText, ArrowRight } from 'lucide-react';

export default function Checkout() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const { items, amounts, pincode, setPincode, paymentMethod, setPaymentMethod, shippingAddress, setShippingAddress, placeOrder, couponCode } = useCart();

  const promoWalletBalance = user?.promoWalletBalance || 0;
  const maxPromoDiscount = amounts.finalTotal * 0.05;
  const promoDiscount = Math.min(promoWalletBalance, maxPromoDiscount);
  const netPayableTotal = amounts.finalTotal - promoDiscount;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Payment Gateway Loader State
  const [processingPayment, setProcessingPayment] = useState(false);

  // Order Confirmation State
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<any | null>(null);
  const [deliveryOtp, setDeliveryOtp] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (items.length === 0 && !orderConfirmed) {
      router.push('/cart');
      return;
    }
    // Pre-populate address
    if (user.kycDetails?.businessAddress && !shippingAddress) {
      setShippingAddress(user.kycDetails.businessAddress);
    }
  }, [user, items, orderConfirmed]);

  const validateAddressStep = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!shippingAddress.trim() || !pincode.trim()) {
      setErrorMessage('Please provide shipping address and delivery pincode.');
      return;
    }
    if (pincode.length !== 6 || isNaN(Number(pincode))) {
      setErrorMessage('Please enter a valid 6-digit pin code.');
      return;
    }
    setStep(2);
  };

  const handleSelectPaymentMethod = (method: 'online' | 'cod') => {
    setPaymentMethod(method);
  };

  const executeOrderPlacement = async () => {
    setErrorMessage(null);
    setProcessingPayment(true);
    
    // Call CartContext placeOrder
    const res = await placeOrder();
    
    setProcessingPayment(false);
    if (res.success) {
      setConfirmedOrder(res.order);
      setDeliveryOtp(res.deliveryOtp || null);
      setOrderConfirmed(true);
      await refreshProfile(); // Refresh wallet if needed
    } else {
      setErrorMessage(res.message || 'Failed to process order.');
    }
  };

  const handleCheckoutSubmit = () => {
    setErrorMessage(null);
    
    // Check KYC status
    if (user?.kycStatus !== 'verified') {
      setErrorMessage('KYC Verification Required. You must have a verified profile to place bulk orders.');
      return;
    }

    executeOrderPlacement();
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        
        {/* Checkout Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Checkout</h1>
          <p className="text-xs text-slate-500 mt-1">Complete your bulk wholesale transaction.</p>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 max-w-3xl">
            <AlertTriangle size={18} className="flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 4. SUCCESS ORDER CONFIRMATION PANEL */}
        {orderConfirmed && confirmedOrder ? (
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6 text-center">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
              <CheckCircle2 size={32} />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-950">Order Placed Successfully!</h2>
              <p className="text-xs text-slate-500">Order ID: <strong className="text-slate-700">{confirmedOrder.id}</strong> • Transaction reference generated.</p>
            </div>

            {/* OTP alert for Cash On Collect Order */}
            {deliveryOtp && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left space-y-1">
                <span className="font-bold text-amber-900 block text-xs">⚠️ Secure Delivery OTP Verification</span>
                <p className="text-[11px] text-slate-600 leading-normal">
                  Your order is Cash On Collect Order. To confirm receipt upon arrival, you must share the 6-digit OTP code <strong className="text-amber-800 text-sm font-mono">{deliveryOtp}</strong> with the delivery executive.
                </p>
              </div>
            )}

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-left space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-200 pb-2.5 font-bold text-slate-800">
                <span>Final Total:</span>
                <span>₹{confirmedOrder.amounts.finalTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Items Ordered:</span>
                <span className="font-semibold">{confirmedOrder.items.length} wholesale packs</span>
              </div>
              <div className="flex justify-between">
                <span>Registered Address:</span>
                <span className="font-semibold text-slate-600 text-right max-w-xs">{confirmedOrder.deliveryAddress}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping Pincode:</span>
                <span className="font-semibold">{confirmedOrder.pincode}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Mode:</span>
                <span className="font-bold uppercase text-[#2874f0]">{confirmedOrder.paymentMethod}</span>
              </div>
            </div>

            {/* Invoicing Link */}
            <div className="flex flex-wrap gap-4 justify-center pt-2">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 bg-[#fb641b] hover:bg-[#e1530f] text-white px-8 py-3 rounded-xl font-bold transition text-xs shadow-md"
              >
                Return to Marketplace <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        ) : processingPayment ? (
          <div className="max-w-md mx-auto py-24 text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2874f0] mx-auto"></div>
            <h3 className="font-bold text-slate-800">Processing Online Transaction...</h3>
            <p className="text-xs text-slate-400">Verifying secure token signature and credit logs.</p>
          </div>
        ) : (
          /* Multi-step Flow Content */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Step form input details */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Step 1 Card: Address */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm text-left">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4 border-b border-slate-100 pb-2.5">
                  <MapPin size={18} className="text-[#2874f0]" />
                  Step 1: Physical Shipping Address
                </h3>
                
                {step === 1 ? (
                  <form onSubmit={validateAddressStep} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase">Shop physical delivery address</label>
                      <textarea
                        required
                        rows={3}
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        placeholder="Enter full street, shop number, area details"
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2 mt-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#2874f0] focus:bg-white transition"
                      />
                    </div>
                    <button type="submit" className="bg-[#fb641b] hover:bg-[#e1530f] text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow transition">
                      Continue to Payment
                    </button>
                  </form>
                ) : (
                  <div className="flex justify-between items-center text-xs text-slate-600">
                    <div>
                      <p className="font-bold text-slate-800">Address selected:</p>
                      <p>{shippingAddress}</p>
                    </div>
                    <button onClick={() => setStep(1)} className="text-[#2874f0] font-bold hover:underline">
                      Edit
                    </button>
                  </div>
                )}
              </div>

              {/* Step 2 Card: Payment mode */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm text-left">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4 border-b border-slate-100 pb-2.5">
                  <CreditCard size={18} className="text-[#2874f0]" />
                  Step 2: Choose Payment Method
                </h3>

                {step === 2 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      {/* Mode 1: Online Payments */}
                      <button
                        onClick={() => handleSelectPaymentMethod('online')}
                        className={`p-4 rounded-xl border text-left transition flex flex-col justify-between h-28 ${
                          paymentMethod === 'online'
                            ? 'border-[#2874f0] bg-blue-50/10 ring-2 ring-blue-500/10'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span className="font-bold text-slate-800 text-xs">Simulated Online Gateways</span>
                        <span className="text-[10px] text-slate-500 leading-tight">Pay via simulated Credit Card, UPI QR, or Netbanking.</span>
                        <span className="text-[10px] text-[#2874f0] font-extrabold uppercase mt-1">Instant Activation</span>
                      </button>

                      {/* Mode 2: Cash On Collect Order */}
                      <button
                        onClick={() => handleSelectPaymentMethod('cod')}
                        className={`p-4 rounded-xl border text-left transition flex flex-col justify-between h-28 ${
                          paymentMethod === 'cod'
                            ? 'border-[#2874f0] bg-blue-50/10 ring-2 ring-blue-500/10'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span className="font-bold text-slate-800 text-xs">Cash On Collect Order</span>
                        <span className="text-[10px] text-slate-500 leading-tight">Verify delivery with OTP code. Pay cash to agent upon arrival.</span>
                        <span className="text-[10px] text-[#2874f0] font-extrabold uppercase mt-1">Product Pick By V.Store</span>
                      </button>

                      {/* Mode 3: Wallet Ledger */}
                      <button
                        disabled={user.walletBalance < netPayableTotal}
                        onClick={() => handleSelectPaymentMethod('wallet')}
                        className={`p-4 rounded-xl border text-left transition flex flex-col justify-between h-28 ${
                          paymentMethod === 'wallet'
                            ? 'border-[#2874f0] bg-blue-50/10 ring-2 ring-blue-500/10'
                            : 'border-slate-200 hover:bg-slate-50'
                        } ${user.walletBalance < netPayableTotal ? 'opacity-40 cursor-not-allowed' : ''}`}
                      >
                        <span className="font-bold text-slate-800 text-xs">Pay via B2B Wallet</span>
                        <span className="text-[10px] text-slate-500 leading-tight">
                          Balance: ₹{user.walletBalance.toLocaleString('en-IN')}
                          {user.walletBalance < netPayableTotal && ' (Insufficient funds)'}
                        </span>
                        <span className="text-[10px] text-[#2874f0] font-extrabold uppercase mt-1">Instant Ledger Debit</span>
                      </button>

                    </div>

                    <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
                      <button onClick={() => setStep(1)} className="text-xs text-slate-500 font-semibold px-4 py-2 hover:bg-slate-50 rounded-lg">
                        Back
                      </button>
                      <button onClick={handleCheckoutSubmit} className="bg-[#fb641b] hover:bg-[#e1530f] text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow transition">
                        Confirm Order
                      </button>
                    </div>
                  </div>
                )}

                {step !== 2 && (
                  <p className="text-xs text-slate-500">
                    {step === 1 ? 'Please select shipping details first.' : `Selected: ${paymentMethod.toUpperCase()}`}
                  </p>
                )}
              </div>

            </div>

            {/* Right side checkout items overview */}
            <div className="lg:col-span-1 space-y-6">
              
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm text-left space-y-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                  <ShoppingBag size={16} className="text-indigo-600" /> Order Review
                </h3>
                
                <div className="max-h-48 overflow-y-auto space-y-2.5 pr-2 custom-scrollbar">
                  {items.map((item) => (
                    <div key={item.productId} className="flex justify-between items-center text-xs">
                      <div className="max-w-[70%]">
                        <span className="font-semibold text-slate-800 line-clamp-1">{item.name}</span>
                        <span className="text-[10px] text-slate-400">Qty: {item.quantity} {item.unit}s</span>
                      </div>
                      <span className="font-bold text-slate-700">₹{(item.quantity * (item.quantity >= 20 ? item.wholesalePrice : item.retailerPrice)).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-2.5 text-xs text-slate-500">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold text-slate-700">₹{amounts.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{amounts.shipping > 0 ? `₹${amounts.shipping}` : 'FREE'}</span>
                  </div>
                  {paymentMethod === 'cod' && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Handling Fee</span>
                      <span>FREE</span>
                    </div>
                  )}
                  {amounts.discount > 0 && (
                    <div className="flex justify-between text-indigo-600 font-semibold">
                      <span>Coupon Saved ({couponCode})</span>
                      <span>-₹{amounts.discount}</span>
                    </div>
                  )}
                  {promoDiscount > 0 && (
                    <div className="flex justify-between text-indigo-700 font-bold bg-indigo-50/50 p-2 rounded-xl border border-indigo-100/50">
                      <span>Promo Wallet (5% Discount Applied)</span>
                      <span>-₹{promoDiscount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-150 pt-2.5 text-slate-900 font-extrabold text-sm">
                    <span>Grand Total:</span>
                    <span>₹{netPayableTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
