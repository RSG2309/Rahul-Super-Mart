'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { api, getImageUrl } from '@/services/api';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { ShoppingCart, Search, Filter, AlertCircle, CheckCircle2, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react';

export default function Catalog() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addToCart } = useCart();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState<'default' | 'priceAsc' | 'priceDesc' | 'discount' | 'alphabetical'>('default');
  
  // Pincode check
  const [pincodeCheck, setPincodeCheck] = useState('');
  const [pincodeStatus, setPincodeStatus] = useState<{ status: 'serviceable' | 'not-serviceable'; cod: boolean; message: string } | null>(null);
  
  // Bulk quote form modal
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteFormData, setQuoteFormData] = useState({ name: '', mobile: '', productSku: '', qtyNeeded: '' });
  const [quoteSuccess, setQuoteSuccess] = useState(false);

  // Quantities for items being added to cart
  const [qtys, setQtys] = useState<Record<string, number>>({});
  const [notif, setNotif] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const loadCatalog = async () => {
      setLoading(true);
      try {
        const catRes = await api.get('/categories');
        if (catRes.success) setCategories(catRes.categories);

        // Fetch products with query parameters
        let endpoint = '/products?';
        if (selectedCategory) endpoint += `category=${selectedCategory}&`;
        if (searchQuery) endpoint += `search=${searchQuery}&`;

        const prodRes = await api.get(endpoint);
        if (prodRes.success) {
          setProducts(prodRes.products);
          
          // Pre-populate quantity inputs with MOQ values
          const initialQtys: Record<string, number> = {};
          prodRes.products.forEach((p: any) => {
            initialQtys[p.id] = p.moq;
          });
          setQtys(initialQtys);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadCatalog();
  }, [selectedCategory, searchQuery, searchParams]);

  const handleQtyChange = (productId: string, val: number, min: number, max: number) => {
    if (val < min) val = min;
    if (val > max) val = max;
    setQtys({ ...qtys, [productId]: val });
  };

  const handleAddToCart = (product: any) => {
    const qty = qtys[product.id] || product.moq;
    const res = addToCart(product, qty);
    if (res.success) {
      setNotif({ type: 'success', text: `Added ${qty} ${product.unit}s of ${product.name} to cart!` });
    } else {
      setNotif({ type: 'error', text: res.message || 'Failed to add item' });
    }
    setTimeout(() => setNotif(null), 3000);
  };

  // COD Serviceable Pincodes list matching backend
  const COD_PINS = ['560001', '560002', '560003', '560034', '560102', '560103', '110001', '110002', '400001', '400002'];
  const ONLINE_PINS = ['560004', '560005', '560006', '560010', '110003', '400003'];

  const checkPincode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincodeCheck.trim()) return;

    if (COD_PINS.includes(pincodeCheck)) {
      setPincodeStatus({
        status: 'serviceable',
        cod: true,
        message: 'Fast dispatch available! Cash on Delivery (COD) eligible (₹150 cod handling fee apply).'
      });
    } else if (ONLINE_PINS.includes(pincodeCheck)) {
      setPincodeStatus({
        status: 'serviceable',
        cod: false,
        message: 'Serviceable for online payments (Card, UPI) only. COD not available.'
      });
    } else {
      setPincodeStatus({
        status: 'not-serviceable',
        cod: false,
        message: 'Pincode not serviceable for bulk transport delivery. Check Indiranagar/HSR zones.'
      });
    }
  };

  const handleQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuoteSuccess(true);
    setTimeout(() => {
      setShowQuoteModal(false);
      setQuoteSuccess(false);
      setQuoteFormData({ name: '', mobile: '', productSku: '', qtyNeeded: '' });
    }, 2500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      {/* Dynamic Notif popup */}
      {notif && (
        <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm border font-medium transition duration-300 ${
          notif.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <AlertCircle size={16} />
          <span>{notif.text}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-grow">
        
        {/* Banner */}
        <div className="mb-8 p-6 bg-gradient-to-r from-indigo-900 to-violet-950 rounded-3xl text-white relative overflow-hidden shadow-md flex justify-between items-center">
          <div className="relative z-10 space-y-2">
            <span className="text-[10px] uppercase tracking-wider font-extrabold bg-indigo-500/30 border border-indigo-400/30 px-2 py-0.5 rounded">Volume slabs active</span>
            <h2 className="text-2xl font-black">Merchandise Sourcing catalog</h2>
            <p className="text-xs text-indigo-200 max-w-md">Check MOQ requirements on each item. Order quantities above 20 automatically unlock Tier-2 Bulk discount pricing.</p>
          </div>
          <button 
            onClick={() => setShowQuoteModal(true)} 
            className="hidden md:flex items-center gap-1.5 bg-indigo-50 text-indigo-950 hover:bg-indigo-100 font-bold px-4 py-2.5 rounded-xl shadow text-xs transition"
          >
            <Sparkles size={13} /> Request Bulk Quote
          </button>
        </div>

        {/* Sidebar & Catalog Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left panel: Filters, Pincode check */}
          <div className="space-y-6 lg:col-span-1">
            
            {/* Category selection */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                <Filter size={15} className="text-indigo-600" /> Filter Categories
              </h3>
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => { setSelectedCategory(''); router.push('/catalog'); }}
                  className={`text-left px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    !selectedCategory ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  All Categories
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCategory(cat.slug); router.push(`/catalog?category=${cat.slug}`); }}
                    className={`text-left px-3 py-2 rounded-lg text-xs font-semibold capitalize transition ${
                      selectedCategory === cat.slug ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>



          </div>

          {/* Right panel: Product listings */}
          <div className="lg:col-span-3">
            
            {/* Search filter bar */}
            <div className="mb-6 flex gap-4 bg-white p-3 rounded-xl border border-slate-200/80 items-center justify-between flex-wrap sm:flex-nowrap">
              <div className="relative flex-1 min-w-[200px]">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search item SKU, brand name or packaging unit..."
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                />
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase whitespace-nowrap">Sort By:</span>
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-[11px] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition font-bold"
                >
                  <option value="default">Relevance (Default)</option>
                  <option value="priceAsc">Price: Low to High (सस्ता पहले)</option>
                  <option value="priceDesc">Price: High to Low (महंगा पहले)</option>
                  <option value="discount">Highest Discount (छूट %)</option>
                  <option value="alphabetical">Name: A to Z (नाम क्रम)</option>
                </select>
              </div>

              <button 
                onClick={() => { setSelectedCategory(''); setSearchQuery(''); setSortBy('default'); router.push('/catalog'); }}
                className="text-[11px] text-slate-500 hover:text-indigo-600 font-bold transition flex-shrink-0"
              >
                Clear Filters
              </button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse h-80"></div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
                <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto"><Search size={24} /></div>
                <h3 className="font-bold text-slate-800">No items found</h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">We couldn\'t find any listings matching your search parameters. Try choosing staples or packaging.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...products]
                  .sort((a, b) => {
                    if (sortBy === 'priceAsc') return a.retailerPrice - b.retailerPrice;
                    if (sortBy === 'priceDesc') return b.retailerPrice - a.retailerPrice;
                    if (sortBy === 'discount') return (b.discount || 0) - (a.discount || 0);
                    if (sortBy === 'alphabetical') return a.name.localeCompare(b.name);
                    return 0;
                  })
                  .map((product) => {
                  const qty = qtys[product.id] || product.moq;
                  const pricePerUnit = (qty >= 20 && user?.kycStatus === 'verified') ? product.wholesalePrice : product.retailerPrice;
                  const isLowStock = product.stock <= product.moq + 5;

                  return (
                    <div key={product.id} className="group bg-white rounded-3xl border border-slate-200/85 hover:border-indigo-200 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between text-left">
                      <div className="p-4 relative bg-slate-50/50">
                        {product.stock <= 0 ? (
                          <span className="absolute top-4 left-4 z-10 bg-rose-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm animate-pulse">
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="absolute top-4 left-4 z-10 bg-amber-500 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                            Low Stock
                          </span>
                        ) : (() => {
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
                        <span className="absolute top-4 right-4 z-10 bg-[#2874f0] text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                          {product.unit} Unit
                        </span>
                        <Link href={`/products/${product.id}`} className="block overflow-hidden rounded-2xl bg-white p-3 border border-slate-100 flex items-center justify-center h-40">
                          <img
                            src={getImageUrl(product.images?.[0])}
                            alt={product.name}
                            className="max-h-full max-w-full object-contain transform group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        </Link>
                      </div>
                      
                      <div className="p-5 flex-grow flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] text-[#2874f0] font-extrabold uppercase tracking-widest block">{product.brand}</span>
                          <Link href={`/products/${product.id}`} className="font-extrabold text-slate-800 text-sm mt-1 line-clamp-2 h-10 hover:text-[#2874f0] transition-colors block">
                            {product.name}
                          </Link>
                          <span className="text-[9px] text-slate-400 block font-mono mt-1">SKU: {product.sku}</span>
                          
                          <div className="mt-4 bg-slate-50 border border-slate-100 p-3 rounded-2xl space-y-1.5 text-xs">
                            <div className="flex justify-between items-center text-slate-400">
                              <span>MRP (inc. GST)</span>
                              <span className="line-through font-medium">₹{product.mrp}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-600">
                              <span>Retailer Rate</span>
                              <span className="font-bold text-slate-800">₹{product.retailerPrice}</span>
                            </div>
                            <div className="flex justify-between items-center bg-blue-50/50 px-2 py-1 rounded-lg border border-blue-100/50">
                              <span className="text-[#2874f0] font-extrabold text-[10px] uppercase">Bulk Rate</span>
                              {user ? (
                                user.kycStatus === 'verified' ? (
                                  <span className="font-black text-[#2874f0] text-sm">₹{product.wholesalePrice}</span>
                                ) : (
                                  <Link href="/profile" className="text-[9px] font-bold text-amber-600 hover:underline whitespace-nowrap leading-none">
                                    🔒 KYC Pending
                                  </Link>
                                )
                              ) : (
                                <Link href="/auth/login" className="text-[10px] font-bold text-[#fb641b] hover:underline whitespace-nowrap">
                                  🔒 Login to see
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Add to Cart Controls */}
                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500 font-bold">Quantity Slabs:</span>
                            <div className="flex items-center border border-slate-200 rounded-xl p-0.5 bg-slate-50 shadow-inner">
                              <button
                                disabled={product.stock <= 0}
                                onClick={() => handleQtyChange(product.id, qty - 1, product.moq, product.stock)}
                                className={`w-6 h-6 flex items-center justify-center font-bold text-slate-500 rounded-lg transition ${product.stock <= 0 ? 'cursor-not-allowed opacity-50' : 'hover:bg-white hover:shadow-sm'}`}
                              >
                                -
                              </button>
                              <input
                                type="number"
                                disabled={product.stock <= 0}
                                value={product.stock <= 0 ? 0 : qty}
                                onChange={(e) => handleQtyChange(product.id, parseInt(e.target.value) || product.moq, product.moq, product.stock)}
                                className="w-9 text-center bg-transparent border-none text-xs font-black text-slate-850 focus:outline-none disabled:opacity-50"
                              />
                              <button
                                disabled={product.stock <= 0}
                                onClick={() => handleQtyChange(product.id, qty + 1, product.moq, product.stock)}
                                className={`w-6 h-6 flex items-center justify-center font-bold text-slate-500 rounded-lg transition ${product.stock <= 0 ? 'cursor-not-allowed opacity-50' : 'hover:bg-white hover:shadow-sm'}`}
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-[10px] text-slate-405 font-semibold px-0.5">
                            <span>MOQ: {product.moq} Units</span>
                            <span className="text-[#2874f0] font-bold">Total: ₹{(pricePerUnit * qty).toLocaleString('en-IN')}</span>
                          </div>

                          {product.stock <= 0 ? (
                            <button
                              disabled
                              className="w-full bg-slate-100 border border-slate-350 text-slate-400 font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-not-allowed"
                            >
                              ⚠️ Out of Stock
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAddToCart(product)}
                              className="w-full bg-[#2874f0] hover:bg-[#1b5ec2] text-white font-extrabold py-2.5 rounded-xl text-xs transition shadow-md shadow-blue-600/10 hover:shadow-blue-600/20 flex items-center justify-center gap-1.5"
                            >
                              <ShoppingCart size={13} /> Add to Cart
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Bulk Quote Modal */}
      {showQuoteModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border shadow-2xl relative text-left">
            <button 
              onClick={() => setShowQuoteModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-sm font-bold"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles size={18} className="text-indigo-600" /> Request Custom Bulk Quote
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">Need container-load transport or quantities above 500 units? Submit this form. Our sales representative will call you back within 3 hours.</p>
            
            {quoteSuccess ? (
              <div className="py-6 text-center text-emerald-800 bg-emerald-50 rounded-2xl border border-emerald-100 font-semibold text-xs space-y-1">
                <p>✅ Quote Request Received!</p>
                <p className="text-[10px] font-normal text-slate-600">Sales Executive has been assigned. Request Ref: B2B-{Math.floor(100000 + Math.random()*900000)}</p>
              </div>
            ) : (
              <form onSubmit={handleQuoteSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Contact Name</label>
                  <input
                    type="text"
                    required
                    value={quoteFormData.name}
                    onChange={(e) => setQuoteFormData({ ...quoteFormData, name: e.target.value })}
                    placeholder="Enter owner name"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2 mt-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Mobile Number</label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    value={quoteFormData.mobile}
                    onChange={(e) => setQuoteFormData({ ...quoteFormData, mobile: e.target.value })}
                    placeholder="9888888888"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2 mt-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase">Item SKU</label>
                    <input
                      type="text"
                      required
                      value={quoteFormData.productSku}
                      onChange={(e) => setQuoteFormData({ ...quoteFormData, productSku: e.target.value })}
                      placeholder="RICE-BAS-001"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2 mt-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase">Est. Quantity</label>
                    <input
                      type="number"
                      required
                      value={quoteFormData.qtyNeeded}
                      onChange={(e) => setQuoteFormData({ ...quoteFormData, qtyNeeded: e.target.value })}
                      placeholder="500"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2 mt-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-lg shadow-md transition"
                >
                  Submit Sourcing Request
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
