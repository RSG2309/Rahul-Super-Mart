'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { api, getImageUrl } from '@/services/api';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { ShoppingCart, AlertCircle, ArrowRight, ChevronLeft, ChevronRight, ShoppingBag, Sparkles, Smartphone, Grid, Layers, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const [notifMessage, setNotifMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Auto-scrolling slides list (only images and redirection links)
  const slides = [
    {
      image: '/demo1.jpeg',
      title: 'Grocery Supplies',
      link: '/catalog?category=grocery'
    },
    {
      image: '/demo2.jpeg',
      title: 'Cosmetics Care',
      link: '/products/t3n16sg2p'
    },
    {
      image: '/banner1.jpg',
      title: 'Electronics',
      link: '/catalog?category=electronics'
    },
    {
      image: '/banner2.jpg',
      title: 'Wholesale Warehousing',
      link: '/catalog'
    },
    {
      image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1000&h=450&q=65&fm=webp',
      title: 'Store Staples & Grains',
      link: '/catalog?category=grocery'
    }
  ];

  const [activeSlide, setActiveSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSeenNotice = sessionStorage.getItem('hasSeenDemoNotice');
      if (!hasSeenNotice) {
        setShowNoticeModal(true);
      }
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const prodRes = await api.get('/products');
        if (prodRes.success) setProducts(prodRes.products.slice(0, 4));
        
        const catRes = await api.get('/categories');
        if (catRes.success) setCategories(catRes.categories);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Autoplay slideshow effect
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isHovered) {
        setActiveSlide((prev) => (prev + 1) % slides.length);
      }
    }, 4500);
    return () => clearInterval(timer);
  }, [isHovered]);

  const handleNextSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveSlide((prev) => (prev + 1) % slides.length);
  };

  const handlePrevSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleQuickAdd = (product: any) => {
    const result = addToCart(product, product.moq);
    if (result.success) {
      setNotifMessage({ type: 'success', text: `Added MOQ of ${product.moq} ${product.unit}s for ${product.name} to cart!` });
    } else {
      setNotifMessage({ type: 'error', text: result.message || 'Failed to add item' });
    }
    setTimeout(() => setNotifMessage(null), 3000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-100">
      <Navbar />

      {/* Floating Notification */}
      {notifMessage && (
        <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm border font-medium transition-all duration-300 ${
          notifMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <AlertCircle size={16} />
          <span>{notifMessage.text}</span>
        </div>
      )}

      {/* 1. Hero Section - Flipkart-Style Banners (Image Only, Clickable Links) */}
      <section 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative overflow-hidden w-full group cursor-pointer"
      >
        <Link href={slides[activeSlide].link}>
          <div className="relative h-[210px] sm:h-[400px] lg:h-[530px] w-full bg-slate-200 overflow-hidden">
            <AnimatePresence>
              <motion.div
                key={activeSlide}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 w-full h-full"
              >

                
                <img
                  src={slides[activeSlide].image}
                  alt={slides[activeSlide].title}
                  className="w-full h-full object-cover object-top"
                />
              </motion.div>
            </AnimatePresence>

            {/* Hover Navigation Arrows (Flipkart Style) */}
            <button 
              onClick={handlePrevSlide}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30 bg-white/95 hover:bg-white hover:scale-105 text-slate-800 p-1.5 sm:p-2.5 rounded-full shadow-lg transition opacity-0 group-hover:opacity-100 border border-slate-200"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={handleNextSlide}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-30 bg-white/95 hover:bg-white hover:scale-105 text-slate-800 p-1.5 sm:p-2.5 rounded-full shadow-lg transition opacity-0 group-hover:opacity-100 border border-slate-200"
            >
              <ChevronRight size={16} />
            </button>

            {/* Slide Navigation Dots */}
            <div className="absolute bottom-4 sm:bottom-12 lg:bottom-16 left-1/2 transform -translate-x-1/2 z-30 flex gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveSlide(i); }}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    activeSlide === i ? 'bg-white w-7 scale-110' : 'bg-white/40 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          </div>
        </Link>
      </section>

      {/* 2. Category List (Floating overlapping style like Amazon/Flipkart product grids) */}
      <section className="relative z-20 mt-4 sm:-mt-8 lg:-mt-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full mb-10">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-md">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-650 mb-6 text-left flex items-center gap-2">
            <Layers size={16} className="text-indigo-650" /> Browse Sourcing Categories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {categories.map((cat: any) => {
              // Define professional icon based on slug
              let CatIcon = Grid;
              if (cat.slug === 'grocery') {
                CatIcon = ShoppingBag;
              } else if (cat.slug === 'cosmetic') {
                CatIcon = Sparkles;
              } else if (cat.slug === 'electronics') {
                CatIcon = Smartphone;
              }

              // Color themes matching the vertical
              let theme = {
                bg: 'bg-gradient-to-br from-slate-50 to-slate-100/50 hover:from-slate-100 hover:to-slate-200/50 border-slate-200/60 hover:border-slate-350 hover:shadow-md',
                iconBg: 'bg-slate-150 text-slate-700',
                btnBg: 'bg-white text-slate-500 group-hover:bg-slate-900 group-hover:text-white',
                textColor: 'text-slate-900'
              };

              if (cat.slug === 'grocery') {
                theme = {
                  bg: 'bg-gradient-to-br from-emerald-50/50 to-teal-50/10 hover:from-emerald-50 hover:to-teal-50 border-emerald-100/70 hover:border-emerald-250 hover:shadow-emerald-100/30 hover:shadow-lg',
                  iconBg: 'bg-emerald-500 text-white shadow-sm shadow-emerald-550/20',
                  btnBg: 'bg-white text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white group-hover:scale-105 shadow-sm border border-emerald-100',
                  textColor: 'text-emerald-950'
                };
              } else if (cat.slug === 'cosmetic') {
                theme = {
                  bg: 'bg-gradient-to-br from-rose-50/50 to-pink-50/10 hover:from-rose-50 hover:to-pink-50 border-rose-100/70 hover:border-rose-250 hover:shadow-rose-100/30 hover:shadow-lg',
                  iconBg: 'bg-rose-500 text-white shadow-sm shadow-rose-550/20',
                  btnBg: 'bg-white text-rose-600 group-hover:bg-rose-500 group-hover:text-white group-hover:scale-105 shadow-sm border border-rose-100',
                  textColor: 'text-rose-950'
                };
              } else if (cat.slug === 'electronics') {
                theme = {
                  bg: 'bg-gradient-to-br from-blue-50/50 to-indigo-50/10 hover:from-blue-50 hover:to-indigo-50 border-blue-100/70 hover:border-blue-250 hover:shadow-blue-100/30 hover:shadow-lg',
                  iconBg: 'bg-blue-500 text-white shadow-sm shadow-blue-550/20',
                  btnBg: 'bg-white text-blue-600 group-hover:bg-blue-500 group-hover:text-white group-hover:scale-105 shadow-sm border border-blue-100',
                  textColor: 'text-blue-950'
                };
              }

              return (
                <Link
                  key={cat.id}
                  href={`/catalog?category=${cat.slug}`}
                  className={`group p-6 rounded-2xl border transition-all duration-300 text-left flex items-center justify-between ${theme.bg}`}
                >
                  <div className="flex items-center gap-4">
                    {/* Visual icon badge */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold transition duration-300 ${theme.iconBg}`}>
                      <CatIcon size={20} />
                    </div>
                    <div>
                      <h4 className={`font-extrabold text-sm capitalize transition duration-300 ${theme.textColor}`}>
                        {cat.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-normal max-w-[200px]">
                        {cat.description || 'Premium retail catalogue Slabs'}
                      </p>
                    </div>
                  </div>
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center transition duration-300 font-bold ${theme.btnBg}`}>
                    →
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 2.5 Demo Alert Ticker Marquee */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full mb-2">
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-2.5 overflow-hidden flex items-center">
          <span className="bg-amber-600 text-white font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-lg shadow-sm flex-shrink-0 mr-3 animate-pulse">
            Notice
          </span>
          <marquee behavior="scroll" direction="left" className="text-amber-800 font-bold text-xs tracking-wide cursor-default">
            ⚠️ Rahul Super Mart की वेबसाइट वर्तमान में केवल Demo (Preview) Version में उपलब्ध है। अभी इस वेबसाइट के माध्यम से कोई ऑर्डर स्वीकार नहीं किया जा रहा है। ❌ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ⚠️ Notice: Rahul Super Mart website is currently in Demo (Preview) Version only. No orders are being accepted through the platform at this moment. ❌
          </marquee>
        </div>
      </section>

      {/* 3. Featured Deals */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex justify-between items-end mb-8 text-left">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Featured Bulk Slabs</h2>
              <p className="text-xs text-slate-500 mt-1">Place bulk orders to trigger auto bulk discount rates.</p>
            </div>
            <Link href="/catalog" className="text-sm font-bold text-[#2874f0] hover:text-[#1b5ec2] inline-flex items-center gap-1 transition">
              View Catalog <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 animate-pulse h-80"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <div key={product.id} className="group bg-white rounded-3xl border border-slate-200/85 hover:border-blue-200 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between text-left">
                  <Link href={`/products/${product.id}`} className="block">
                    <div className="p-4 relative bg-slate-50/50">
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
                          <span className="absolute top-4 left-4 z-10 bg-rose-500 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm animate-pulse">
                            {calculatedDiscount}% OFF
                          </span>
                        );
                      })()}
                      {product.stock <= 0 && (
                        <span className="absolute top-4 right-4 z-10 bg-rose-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                          Out of Stock
                        </span>
                      )}
                      <div className="overflow-hidden rounded-2xl bg-white p-3 border border-slate-100 flex items-center justify-center h-40">
                        <img
                          src={getImageUrl(product.images?.[0])}
                          alt={product.name}
                          className="max-h-full max-w-full object-contain transform group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                    </div>
                  </Link>
                  
                  <div className="p-5 flex-grow flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-[#2874f0] font-extrabold uppercase tracking-widest block">{product.brand}</span>
                      <Link href={`/products/${product.id}`} className="font-extrabold text-slate-805 text-sm mt-1 line-clamp-2 h-10 hover:text-[#2874f0] transition-colors block">
                        {product.name}
                      </Link>
                      <p className="text-slate-400 text-[10px] mt-1 font-semibold">MOQ: {product.moq} {product.unit}s</p>
                      
                      <div className="mt-4 bg-slate-50 border border-slate-100 p-3 rounded-2xl flex items-center justify-between text-[11px] gap-2 flex-wrap">
                        <div className="text-left">
                          <span className="text-[8px] text-slate-400 uppercase font-bold block">MRP</span>
                          <span className="text-slate-400 line-through font-semibold">₹{product.mrp}</span>
                        </div>
                        <div className="text-left">
                          <span className="text-[8px] text-slate-400 uppercase font-bold block">Retail</span>
                          <span className="font-bold text-slate-700">₹{product.retailerPrice}</span>
                        </div>
                        <div className="text-right bg-blue-50/50 px-3 py-1.5 rounded-xl border border-blue-100/50">
                          <span className="text-[9px] text-[#2874f0] uppercase font-black block">Bulk Rate</span>
                          {user ? (
                            user.kycStatus === 'verified' ? (
                              <span className="font-black text-[#2874f0] text-sm">₹{product.wholesalePrice}</span>
                            ) : (
                              <Link href="/profile" className="text-[9px] font-bold text-amber-600 hover:underline block mt-0.5 whitespace-nowrap leading-none">
                                🔒 KYC Pending
                              </Link>
                            )
                          ) : (
                            <Link href="/auth/login" className="text-[10px] font-bold text-[#fb641b] hover:underline block mt-0.5 whitespace-nowrap">
                              🔒 Login to see
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>

                    {product.stock <= 0 ? (
                      <button
                        disabled
                        className="w-full mt-5 bg-slate-100 border border-slate-300 text-slate-400 font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-not-allowed"
                      >
                        ⚠️ Out of Stock
                      </button>
                    ) : (
                      <button
                        onClick={() => handleQuickAdd(product)}
                        className="w-full mt-5 bg-[#2874f0] hover:bg-[#1b5ec2] text-white font-extrabold py-2.5 rounded-xl text-xs transition shadow-md shadow-blue-600/10 hover:shadow-blue-600/20 flex items-center justify-center gap-1.5"
                      >
                        <ShoppingCart size={13} /> Add Product
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. Why Choose Us */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm text-left">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Structured Shop Sourcing</h2>
            <p className="text-xs text-slate-500 mt-2">Engineered strictly for retail merchants, shop owners, and bulk store buyers.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-xl border border-slate-100 bg-slate-50/50">
              <h4 className="font-bold text-slate-800">Priority Delivery</h4>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-semibold">Get quick delivery of your bulk groceries, cosmetics, and shop essentials across Sikta Bazar.</p>
            </div>
            <div className="p-6 rounded-xl border border-slate-100 bg-slate-50/50">
              <h4 className="font-bold text-slate-800">Moq Pricing Slab</h4>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">Trigger bulk pricing discounts automatically inside the cart when order quantity exceeds 20 units.</p>
            </div>
            <div className="p-6 rounded-xl border border-slate-100 bg-slate-50/50">
              <h4 className="font-bold text-slate-800">Digital Wallet Ledger</h4>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">Instantly fund order returns back into your wallet, enabling frictionless reordering capabilities.</p>
            </div>
            <div className="p-6 rounded-xl border border-slate-100 bg-slate-50/50">
              <h4 className="font-bold text-slate-800">Simulated Gateways</h4>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">Execute online transactions via simulated UPI QR codes with quick sandbox verification.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Demo Welcome Notice Modal Overlay */}
      {showNoticeModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl border border-slate-100 flex flex-col items-center p-6 space-y-4 animate-scaleUp relative">
            
            {/* Top close button */}
            <button
              onClick={() => {
                setShowNoticeModal(false);
                sessionStorage.setItem('hasSeenDemoNotice', 'true');
              }}
              className="absolute top-3 right-3 text-slate-500 hover:text-slate-800 bg-slate-100/80 hover:bg-slate-155 p-2 rounded-full transition z-20 shadow-sm hover:scale-105"
              aria-label="Close Notice"
            >
              <X size={20} className="stroke-[2.5]" />
            </button>
            
            {/* Aspect box containing notice image */}
            <div className="relative w-full aspect-square overflow-hidden rounded-2xl border border-slate-100/80 bg-slate-50 flex items-center justify-center">
              <img 
                src="/demo-notice.jpg" 
                alt="Demo Notice" 
                className="w-full h-full object-contain hover:scale-101 transition duration-300" 
              />
            </div>

            {/* Action button */}
            <button
              onClick={() => {
                setShowNoticeModal(false);
                sessionStorage.setItem('hasSeenDemoNotice', 'true');
              }}
              className="w-full bg-[#2874f0] hover:bg-[#1b5ec2] text-white font-extrabold py-3.5 rounded-xl text-xs transition tracking-wider uppercase shadow-md shadow-blue-500/10 hover:scale-[1.01]"
            >
              I Understand / समझ गया (Proceed)
            </button>

          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
