'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { ShoppingBag, Trash2, ArrowRight, Ticket, AlertCircle } from 'lucide-react';

export default function Cart() {
  const { items, couponCode, couponDiscount, amounts, updateQuantity, removeFromCart, applyCoupon, removeCoupon } = useCart();
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState(false);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    setCouponSuccess(false);

    if (!couponInput.trim()) return;

    const res = await applyCoupon(couponInput);
    if (res.success) {
      setCouponSuccess(true);
    } else {
      setCouponError(res.message || 'Coupon not valid');
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponInput('');
    setCouponSuccess(false);
    setCouponError(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <h1 className="text-2xl font-extrabold text-slate-900 mb-8 tracking-tight">Shopping Cart</h1>

        {items.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 max-w-lg mx-auto">
            <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <ShoppingBag size={24} />
            </div>
            <h3 className="font-bold text-slate-800">Your B2B Cart is empty</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">Browse staples, electrical materials, or logistics containers to start bulk ordering.</p>
            <Link href="/catalog" className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-lg text-xs transition">
              Browse Products <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => {
                const price = item.quantity >= 20 ? item.wholesalePrice : item.retailerPrice;
                const totalItemPrice = price * item.quantity;
                const totalItemGst = totalItemPrice * (item.gstPercentage / 100);

                return (
                  <div key={item.productId} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between text-left">
                    <div className="flex gap-4 items-center">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-contain rounded-lg bg-slate-50 border border-slate-100 p-1"
                      />
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm line-clamp-2">{item.name}</h3>
                        <span className="text-[10px] text-slate-400 block mt-0.5">SKU: {item.sku}</span>
                        <div className="flex items-center gap-2 mt-1.5">
                          {item.quantity >= 20 && (
                            <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded font-bold">
                              Wholesale Slab Active
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col justify-between w-full sm:w-auto items-center sm:items-end gap-4 border-t sm:border-none pt-3 sm:pt-0 mt-3 sm:mt-0">
                      
                      {/* Quantity Selector */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-medium hidden sm:inline">Qty:</span>
                        <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="w-6 h-6 flex items-center justify-center font-bold text-slate-500 hover:bg-white rounded"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="w-6 h-6 flex items-center justify-center font-bold text-slate-500 hover:bg-white rounded"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Pricing Breakdown */}
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-medium">Rate: ₹{price} / {item.unit}</span>
                        <span className="text-xs font-extrabold text-slate-800">
                          Total: ₹{totalItemPrice.toLocaleString('en-IN')}
                        </span>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>

            {/* Checkout Pricing Card */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Coupon Form */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm text-left">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-3">
                  <Ticket size={16} className="text-indigo-600" /> Apply Coupon
                </h3>
                
                {couponCode ? (
                  <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-indigo-900 block">Applied: {couponCode}</span>
                      <span className="text-[10px] text-indigo-700">Flat ₹{couponDiscount} Saved</span>
                    </div>
                    <button onClick={handleRemoveCoupon} className="text-rose-600 font-bold hover:underline text-[10px]">
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="space-y-3">
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
                    
                    {couponError && (
                      <div className="text-[10px] text-rose-600 font-semibold flex items-center gap-1">
                        <AlertCircle size={10} /> {couponError}
                      </div>
                    )}
                    
                    {couponSuccess && (
                      <p className="text-[10px] text-emerald-600 font-bold">✅ Coupon applied successfully!</p>
                    )}
                    
                    <p className="text-[10px] text-slate-400">Try coupon <strong className="text-slate-600">WELCOMEB2B</strong> (₹500 off on order above ₹5,000).</p>
                  </form>
                )}
              </div>

              {/* Totals Summary */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm text-left space-y-4">
                <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3">Price Details</h3>
                
                <div className="space-y-2.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold text-slate-800">₹{amounts.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping Charges</span>
                    <span className="font-semibold text-slate-800">
                      {amounts.shipping > 0 ? `₹${amounts.shipping}` : <span className="text-emerald-600 font-bold">FREE</span>}
                    </span>
                  </div>
                  {amounts.discount > 0 && (
                    <div className="flex justify-between text-indigo-600 font-medium">
                      <span>Coupon Discount</span>
                      <span>-₹{amounts.discount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-800">Final Total (INR)</span>
                  <span className="text-lg font-black text-slate-900">₹{amounts.finalTotal.toLocaleString('en-IN')}</span>
                </div>

                {amounts.subtotal < 15000 && (
                  <p className="text-[10px] text-slate-400 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-normal">
                    💡 Buy products worth <strong className="text-slate-600">₹{Math.max(0, 15000 - amounts.subtotal).toLocaleString('en-IN')}</strong> more to claim <strong className="text-indigo-600">Free Shipping</strong> (Saves ₹500).
                  </p>
                )}

                <Link href="/checkout" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg shadow-md hover:shadow-indigo-500/25 transition flex items-center justify-center gap-1 text-xs">
                  Proceed to Checkout <ArrowRight size={14} />
                </Link>
              </div>

            </div>

          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
