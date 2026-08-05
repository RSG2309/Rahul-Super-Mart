'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { api, getImageUrl } from '@/services/api';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { ShoppingCart, ArrowLeft, ShieldCheck, Check, AlertCircle, Sparkles } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetails({ params }: PageProps) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;
  
  const router = useRouter();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [notif, setNotif] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [related, setRelated] = useState<any[]>([]);

  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/products/${productId}`);
        if (res.success) {
          setProduct(res.product);
          setQuantity(res.product.moq);
          
          // Fetch related products of the same category
          const relRes = await api.get(`/products?category=${res.product.category}`);
          if (relRes.success) {
            setRelated(relRes.products.filter((p: any) => p.id !== productId).slice(0, 4));
          }
        } else {
          router.push('/catalog');
        }
      } catch (e) {
        console.error(e);
        router.push('/catalog');
      } finally {
        setLoading(false);
      }
    };
    fetchProductDetails();
  }, [productId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-650"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) return null;

  // Calculate pricing slab details
  const isKycVerified = user?.kycStatus === 'verified';
  const isBulkSlab = quantity >= 20 && isKycVerified;
  const currentPrice = isBulkSlab ? product.wholesalePrice : product.retailerPrice;
  const totalAmount = currentPrice * quantity;
  
  // Calculate potential savings if not in bulk slab yet
  const qtyToBulk = 20 - quantity;
  const potentialSavings = (qtyToBulk > 0 && isKycVerified) ? (product.retailerPrice - product.wholesalePrice) * 20 : 0;

  const handleQtyChange = (val: number) => {
    if (val < product.moq) val = product.moq;
    if (val > product.stock) val = product.stock;
    setQuantity(val);
  };

  const handleAddToCart = () => {
    const res = addToCart(product, quantity);
    if (res.success) {
      setNotif({ type: 'success', text: `Added ${quantity} units of ${product.name} to cart!` });
    } else {
      setNotif({ type: 'error', text: res.message || 'Failed to add item' });
    }
    setTimeout(() => setNotif(null), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      {/* Floating Notification */}
      {notif && (
        <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm border font-medium transition duration-300 ${
          notif.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <AlertCircle size={16} />
          <span>{notif.text}</span>
        </div>
      )}

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Back Link */}
        <div className="mb-6">
          <Link href="/catalog" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-650 transition">
            <ArrowLeft size={14} /> Back to Sourcing Catalog
          </Link>
        </div>

        {/* Dynamic Card Container */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-2 gap-12 text-left">
          
          {/* Left: Product Images & Gallery */}
          <div className="space-y-6">
            <div className="relative aspect-square w-full rounded-2xl border border-slate-100 bg-slate-50/50 p-6 flex items-center justify-center overflow-hidden group">
              <img
                src={getImageUrl(product.images?.[0])}
                alt={product.name}
                className="max-h-[350px] w-auto object-contain transition-transform duration-500 group-hover:scale-105"
              />
              <span className="absolute top-4 left-4 bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2.5 py-1 rounded border border-indigo-100 uppercase">
                {product.unit} Unit Pack
              </span>
            </div>
          </div>

          {/* Right: Product Details & Buying Control */}
          <div className="space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">{product.brand}</span>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">{product.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-slate-400 font-mono">SKU Code: {product.sku}</span>
                  <span className="text-slate-300">•</span>
                  {product.stock <= 0 ? (
                    <span className="bg-rose-50 text-rose-700 text-[9px] font-bold px-2.5 py-0.5 rounded border border-rose-100 uppercase tracking-wide">
                      Out of Stock
                    </span>
                  ) : (
                    <span className="bg-emerald-50 text-emerald-700 text-[9px] font-bold px-2.5 py-0.5 rounded border border-emerald-100 uppercase tracking-wide">
                      In Stock ({product.stock} available)
                    </span>
                  )}
                </div>
              </div>

              {/* MRP & Discount Row */}
              <div className="flex items-center gap-6 py-2 px-3 bg-slate-50 border border-slate-200/60 rounded-xl w-fit text-left">
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-black block">MRP (Maximum Retail Price)</span>
                  <span className="text-sm font-bold text-slate-400 line-through">₹{product.mrp}</span>
                </div>
                {(() => {
                  const mrp = Number(product.mrp || 0);
                  if (mrp <= 0) return null;
                  
                  const isVerifiedRetailer = user && user.kycStatus === 'verified';
                  const targetPrice = isVerifiedRetailer 
                    ? Number(product.wholesalePrice || 0) 
                    : Number(product.retailerPrice || 0);
                    
                  if (targetPrice <= 0 || targetPrice >= mrp) return null;
                  
                  const calculatedDiscount = Math.round(((mrp - targetPrice) / mrp) * 100);
                  if (calculatedDiscount <= 0) return null;
                  
                  return (
                    <div>
                      <span className="text-[9px] text-rose-500 uppercase font-black block">Your Discount</span>
                      <span className="bg-rose-500 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-md shadow-sm uppercase tracking-wider animate-pulse inline-block">
                        {calculatedDiscount}% OFF
                      </span>
                    </div>
                  );
                })()}
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                {product.description || 'Premium retail store supplies directly sourced from manufacturing units.'}
              </p>

              {/* Pricing slabs panel */}
              <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200/80 space-y-3.5">
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    onClick={() => handleQtyChange(product.moq)}
                    className={`p-3 rounded-xl border text-center transition cursor-pointer hover:border-[#2874f0]/40 ${
                      !isBulkSlab 
                        ? 'bg-blue-50/90 text-[#2874f0] border-[#2874f0]/80 shadow-sm ring-2 ring-[#2874f0]/10 font-bold' 
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`block text-[9px] font-bold uppercase ${!isBulkSlab ? 'text-[#2874f0]' : 'text-slate-400'}`}>Retailer Rate</span>
                    <span className="text-lg font-extrabold block mt-0.5">₹{product.retailerPrice}</span>
                    <span className={`block text-[9px] mt-0.5 ${!isBulkSlab ? 'text-[#2874f0]/80' : 'text-slate-400'}`}>Quantity &lt; 20</span>
                  </div>
                  
                  <div 
                    onClick={() => {
                      if (!user) {
                        router.push('/auth/login');
                      } else if (!isKycVerified) {
                        router.push('/profile');
                      } else {
                        handleQtyChange(20);
                      }
                    }}
                    className={`p-3 rounded-xl border text-center transition cursor-pointer hover:border-indigo-350/40 ${
                      isBulkSlab
                        ? 'bg-indigo-50/90 text-indigo-700 border-indigo-500 shadow-sm ring-2 ring-indigo-500/10 font-bold' 
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`block text-[9px] font-bold uppercase ${isBulkSlab ? 'text-indigo-650' : 'text-indigo-500'}`}>
                      Bulk Rate
                    </span>
                    {user ? (
                      isKycVerified ? (
                        <>
                          <span className="text-lg font-black block mt-0.5">₹{product.wholesalePrice}</span>
                          <span className={`block text-[9px] mt-0.5 ${isBulkSlab ? 'text-indigo-550' : 'text-slate-400'}`}>
                            Save ₹{product.retailerPrice - product.wholesalePrice}/unit
                          </span>
                        </>
                      ) : (
                        <div className="py-2.5">
                          <Link href="/profile" className="text-[10px] font-bold text-amber-600 hover:underline block leading-tight">
                            🔒 KYC Approval Required
                          </Link>
                        </div>
                      )
                    ) : (
                      <div className="py-2.5">
                        <Link href="/auth/login" className="text-xs font-bold text-[#fb641b] hover:underline block">
                          🔒 Login to see
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                {/* Savings helper notification */}
                {!user ? (
                  <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 flex items-start gap-2 text-[10px] text-slate-650 leading-normal text-left">
                    <AlertCircle size={14} className="text-[#fb641b] flex-shrink-0 mt-0.5" />
                    <div>
                      Please <Link href="/auth/login" className="text-[#fb641b] font-bold hover:underline">login to your account</Link> to unlock wholesale rates and view discount calculations.
                    </div>
                  </div>
                ) : !isKycVerified ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-[10px] text-amber-800 leading-normal text-left">
                    <AlertCircle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      Your business profile is pending KYC verification. Please <Link href="/profile" className="text-amber-700 font-bold hover:underline">complete your profile</Link> to unlock bulk rates.
                    </div>
                  </div>
                ) : qtyToBulk > 0 ? (
                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 flex items-start gap-2 text-[10px] text-indigo-800 leading-normal">
                    <Sparkles size={14} className="text-indigo-600 flex-shrink-0 mt-0.5" />
                    <div>
                      Add <strong className="text-indigo-900 font-black">{qtyToBulk} more units</strong> to unlock the bulk rate! 
                      You will save an extra <strong className="text-indigo-900">₹{potentialSavings.toLocaleString('en-IN')}</strong> on the entire pack.
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-start gap-2 text-[10px] text-emerald-800 leading-normal">
                    <Check size={14} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Tier-2 Bulk Pricing slab unlocked!</strong> You are saving ₹{(product.retailerPrice - product.wholesalePrice) * quantity} on this order.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quantity Selector & Add to Cart */}
            <div className="pt-6 border-t border-slate-150 space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-bold">Select Quantity:</span>
                <div className="flex items-center border border-slate-200 rounded-xl p-1 bg-slate-50">
                  <button
                    disabled={product.stock <= 0}
                    onClick={() => handleQtyChange(quantity - 1)}
                    className={`w-8 h-8 flex items-center justify-center font-bold text-slate-500 rounded-lg transition ${product.stock <= 0 ? 'cursor-not-allowed opacity-50' : 'hover:bg-white'}`}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    disabled={product.stock <= 0}
                    value={product.stock <= 0 ? 0 : quantity}
                    onChange={(e) => handleQtyChange(parseInt(e.target.value) || product.moq)}
                    className="w-12 text-center bg-transparent border-none text-xs font-bold focus:outline-none disabled:opacity-50"
                  />
                  <button
                    disabled={product.stock <= 0}
                    onClick={() => handleQtyChange(quantity + 1)}
                    className={`w-8 h-8 flex items-center justify-center font-bold text-slate-500 rounded-lg transition ${product.stock <= 0 ? 'cursor-not-allowed opacity-50' : 'hover:bg-white'}`}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Minimum Order Quantity (MOQ): {product.moq} units</span>
                <span className="text-slate-950 font-extrabold text-sm">Total: ₹{product.stock <= 0 ? 0 : totalAmount.toLocaleString('en-IN')}</span>
              </div>

              {product.stock <= 0 ? (
                <button
                  disabled
                  className="w-full bg-slate-100 border border-slate-350 text-slate-400 font-extrabold text-xs py-3 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed"
                >
                  ⚠️ Out of Stock
                </button>
              ) : (
                <button
                  onClick={handleAddToCart}
                  className="w-full bg-slate-950 hover:bg-indigo-650 text-white font-extrabold text-xs py-3 rounded-xl shadow-lg hover:shadow-indigo-500/20 transition flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={15} /> Add to Cart
                </button>
              )}
            </div>

            {/* Specifications table */}
            <div className="pt-6 border-t border-slate-150 space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Specifications</h3>
              <div className="border border-slate-150 rounded-xl overflow-hidden text-xs">
                <table className="min-w-full divide-y divide-slate-150 text-left">
                  <tbody className="divide-y divide-slate-150 bg-white">
                    {product.specifications?.map((spec: any, idx: number) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 bg-slate-50 text-slate-500 font-medium w-1/3 border-r border-slate-150">{spec.key}</td>
                        <td className="px-4 py-2 text-slate-800 font-semibold">{spec.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>

        {/* Related Sourcing Products Grid */}
        {related.length > 0 && (
          <div className="mt-16 space-y-6">
            <h3 className="text-lg font-bold text-slate-900 text-left">Related Sourcing Products</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((p) => (
                <div key={p.id} className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition">
                  <div className="p-4 relative">
                    <Link href={`/products/${p.id}`} className="block">
                      <img
                        src={p.images?.[0] || 'https://via.placeholder.com/150'}
                        alt={p.name}
                        className="w-full h-32 object-contain rounded-lg bg-slate-50 cursor-pointer hover:opacity-90 transition"
                      />
                    </Link>
                  </div>
                  <div className="px-4 pb-4 flex-grow flex flex-col justify-between">
                    <div className="text-left">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">{p.brand}</span>
                      <Link href={`/products/${p.id}`} className="font-bold text-slate-800 text-xs mt-0.5 line-clamp-1 hover:underline">
                        {p.name}
                      </Link>
                      <p className="text-slate-500 text-[10px] mt-0.5">MOQ: {p.moq} {p.unit}s</p>
                    </div>
                    <Link
                      href={`/products/${p.id}`}
                      className="w-full mt-3 bg-indigo-50 text-indigo-700 hover:bg-indigo-650 hover:text-white py-1.5 rounded-lg font-bold text-[10px] text-center block transition"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
