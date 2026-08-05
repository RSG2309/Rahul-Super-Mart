'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { BarChart3, Package, ShoppingCart, ShieldCheck, FileText, Download, Upload, AlertCircle, RefreshCw, Eye, Users } from 'lucide-react';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // State
  const [activeTab, setActiveTab] = useState<'overview' | 'retailers' | 'kyc' | 'wallet' | 'inventory' | 'orders' | 'logs' | 'coupons'>('overview');
  const [coupons, setCoupons] = useState<any[]>([]);
  const [showAddCouponForm, setShowAddCouponForm] = useState(false);
  const [newCouponData, setNewCouponData] = useState({
    code: '',
    discountType: 'flat',
    discountValue: '',
    minOrderAmount: '',
    expiresAt: '',
    restrictedPaymentMethod: 'all',
    restrictedCategory: '',
    restrictedProductId: ''
  });
  const [stats, setStats] = useState<any | null>(null);
  const [charts, setCharts] = useState<any | null>(null);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [kycRequests, setKycRequests] = useState<any[]>([]);
  const [walletRequests, setWalletRequests] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [orderFilter, setOrderFilter] = useState<'active' | 'all'>('active');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [notifLogs, setNotifLogs] = useState<any[]>([]);
  const [retailers, setRetailers] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [imageUploading, setImageUploading] = useState(false);

  // Edit stock modal state
  const [editProduct, setEditProduct] = useState<any | null>(null);
  const [newStockVal, setNewStockVal] = useState(0);
  const [editProductData, setEditProductData] = useState({
    id: '',
    name: '',
    sku: '',
    brand: '',
    category: '',
    description: '',
    mrp: '',
    wholesalePrice: '',
    retailerPrice: '',
    stock: '',
    moq: '',
    weight: '',
    unit: 'Piece',
    gstPercentage: '',
    sortOrder: '1000',
    expiryDate: ''
  });

  // Verify Delivery OTP state
  const [verifyOrderId, setVerifyOrderId] = useState<string | null>(null);
  const [deliveryOtpInput, setDeliveryOtpInput] = useState('');

  // Bulk Upload Form
  const [bulkJsonString, setBulkJsonString] = useState('');

  // Add Single Product Form state
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [newProductData, setNewProductData] = useState({
    name: '',
    brand: '',
    sku: '',
    category: 'grocery',
    mrp: '',
    wholesalePrice: '',
    retailerPrice: '',
    moq: '',
    stock: '',
    unit: 'Box',
    imageUrl: '',
    gstPercentage: '18',
    weight: '1',
    sortOrder: '1000',
    expiryDate: ''
  });

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMessage(null);
    try {
      const res = await api.post('/coupons', {
        code: newCouponData.code.trim().toUpperCase(),
        discountType: newCouponData.discountType,
        discountValue: Number(newCouponData.discountValue),
        minOrderAmount: Number(newCouponData.minOrderAmount) || 0,
        expiresAt: newCouponData.expiresAt,
        restrictedPaymentMethod: newCouponData.restrictedPaymentMethod,
        restrictedCategory: newCouponData.restrictedCategory.trim() || undefined,
        restrictedProductId: newCouponData.restrictedProductId.trim() || undefined
      });
      if (res.success) {
        setActionMessage({ type: 'success', text: 'Coupon created successfully!' });
        setNewCouponData({ 
          code: '', 
          discountType: 'flat', 
          discountValue: '', 
          minOrderAmount: '', 
          expiresAt: '', 
          restrictedPaymentMethod: 'all',
          restrictedCategory: '',
          restrictedProductId: ''
        });
        setShowAddCouponForm(false);
        const couponRes = await api.get('/admin/coupons');
        if (couponRes.success) setCoupons(couponRes.coupons);
      } else {
        setActionMessage({ type: 'error', text: res.message || 'Failed to create coupon.' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: 'Server communication error.' });
    }
  };

  const handleToggleCoupon = async (id: string) => {
    setActionMessage(null);
    try {
      const res = await api.put(`/admin/coupons/${id}/toggle`, {});
      if (res.success) {
        setActionMessage({ type: 'success', text: 'Coupon status toggled successfully!' });
        const couponRes = await api.get('/admin/coupons');
        if (couponRes.success) setCoupons(couponRes.coupons);
      } else {
        setActionMessage({ type: 'error', text: res.message || 'Failed to toggle coupon.' });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Server communication error.' });
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    setActionMessage(null);
    try {
      const res = await api.delete(`/admin/coupons/${id}`);
      if (res.success) {
        setActionMessage({ type: 'success', text: 'Coupon deleted successfully!' });
        const couponRes = await api.get('/admin/coupons');
        if (couponRes.success) setCoupons(couponRes.coupons);
      } else {
        setActionMessage({ type: 'error', text: res.message || 'Failed to delete coupon.' });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Server communication error.' });
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const statsRes = await api.get('/admin/stats');
      if (statsRes.success) {
        setStats(statsRes.stats);
        setCharts(statsRes.charts);
        setLowStock(statsRes.lowStockProducts);
      }

      const kycRes = await api.get('/admin/kyc-queue');
      if (kycRes.success) setKycRequests(kycRes.queue);

      const walletRes = await api.get('/admin/wallet-requests');
      if (walletRes.success) setWalletRequests(walletRes.requests);

      const prodRes = await api.get('/products?includeInactive=true');
      if (prodRes.success) setProducts(prodRes.products);

      const orderRes = await api.get('/orders');
      if (orderRes.success) setOrders(orderRes.orders);

      const auditRes = await api.get('/admin/audit-logs');
      if (auditRes.success) setAuditLogs(auditRes.logs);

      const notifRes = await api.get('/admin/notif-logs');
      if (notifRes.success) setNotifLogs(notifRes.logs);

      const couponRes = await api.get('/admin/coupons');
      if (couponRes.success) setCoupons(couponRes.coupons);

      const retailersRes = await api.get('/admin/retailers');
      if (retailersRes.success) setRetailers(retailersRes.retailers);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
        router.push('/auth/login');
        return;
      }
      loadData();
    }
  }, [user, authLoading]);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 3000);
  };

  // KYC Approvals operations
  const handleApproveKyc = async (userId: string) => {
    try {
      const res = await api.post('/admin/kyc-approve', { userId, status: 'verified' });
      if (res.success) {
        showFeedback('success', 'Retailer KYC has been verified successfully!');
        loadData();
      } else {
        showFeedback('error', res.message || 'Approval failed.');
      }
    } catch (e) {
      showFeedback('error', 'Server error during KYC approval.');
    }
  };

  const handleRejectKyc = async (userId: string) => {
    try {
      const res = await api.post('/admin/kyc-approve', { userId, status: 'rejected' });
      if (res.success) {
        showFeedback('success', 'Retailer KYC verification rejected.');
        loadData();
      } else {
        showFeedback('error', res.message || 'Rejection failed.');
      }
    } catch (e) {
      showFeedback('error', 'Server error during KYC rejection.');
    }
  };

  const handleDeleteRetailer = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this retailer? All their details will be deleted permanently.")) return;
    try {
      const res = await api.delete(`/admin/retailers/${id}`);
      if (res.success) {
        showFeedback('success', 'Retailer deleted successfully!');
        setRetailers(retailers.filter(r => r.id !== id));
      } else {
        showFeedback('error', res.message || 'Failed to delete retailer.');
      }
    } catch (e) {
      showFeedback('error', 'Server error during delete.');
    }
  };

  const handleToggleBlock = async (id: string, currentlyBlocked: boolean) => {
    const actionText = currentlyBlocked ? 'unblock' : 'block';
    if (!window.confirm(`Are you sure you want to ${actionText} this retailer?`)) return;
    try {
      const res = await api.put(`/admin/retailers/${id}/block`, { isBlocked: !currentlyBlocked });
      if (res.success) {
        showFeedback('success', `Retailer ${currentlyBlocked ? 'unblocked' : 'blocked'} successfully!`);
        setRetailers(retailers.map(r => r.id === id ? { ...r, isBlocked: !currentlyBlocked } : r));
      } else {
        showFeedback('error', res.message || `Failed to ${actionText} retailer.`);
      }
    } catch (e) {
      showFeedback('error', `Server error during ${actionText} action.`);
    }
  };

  const handleAdjustWallet = async (retailerId: string, currentBalance: number, businessName: string) => {
    const input = window.prompt(
      `Adjust wallet balance for "${businessName}"\n\nCurrent Balance: ₹${currentBalance.toLocaleString('en-IN')}\n\nTo DEDUCT (withdraw/pull) balance, enter a negative number (e.g., -500).\nTo ADD (deposit) balance, enter a positive number (e.g., 1000).`
    );

    if (input === null || input.trim() === '') return;

    const adjustment = Number(input);
    if (isNaN(adjustment)) {
      alert('Please enter a valid numeric amount.');
      return;
    }

    if (currentBalance + adjustment < 0) {
      alert('Deduction amount exceeds the current wallet balance. Balance cannot become negative.');
      return;
    }

    const reason = window.prompt('Enter reason for this wallet balance adjustment:');
    if (reason === null) return; // cancelled

    try {
      const res = await api.put(`/admin/retailers/${retailerId}/wallet`, {
        adjustment,
        reason: reason.trim() || 'Admin adjustment'
      });

      if (res.success) {
        showFeedback('success', `Successfully adjusted wallet by ₹${adjustment.toLocaleString('en-IN')}. New balance: ₹${res.newBalance.toLocaleString('en-IN')}`);
        // Refresh retailers list
        const retRes = await api.get('/admin/retailers');
        if (retRes.success) setRetailers(retRes.retailers);
      } else {
        showFeedback('error', res.message || 'Failed to adjust wallet balance.');
      }
    } catch (error) {
      showFeedback('error', 'Server error adjusting wallet balance.');
    }
  };

  const handleAdjustPromoWallet = async (retailerId: string, currentBalance: number = 0, businessName: string) => {
    const input = window.prompt(
      `Adjust PROMO wallet balance for "${businessName}"\n\nCurrent Promo Balance: ₹${currentBalance.toLocaleString('en-IN')}\n\nTo DEDUCT, enter a negative number (e.g., -200).\nTo ADD, enter a positive number (e.g., 500).`
    );

    if (input === null || input.trim() === '') return;

    const promoAdjustment = Number(input);
    if (isNaN(promoAdjustment)) {
      alert('Please enter a valid numeric amount.');
      return;
    }

    if (currentBalance + promoAdjustment < 0) {
      alert('Deduction amount exceeds the current promo balance. Balance cannot become negative.');
      return;
    }

    const reason = window.prompt('Enter reason for this promo wallet adjustment:');
    if (reason === null) return; // cancelled

    try {
      const res = await api.put(`/admin/retailers/${retailerId}/wallet`, {
        promoAdjustment,
        reason: reason.trim() || 'Admin promo adjustment'
      });

      if (res.success) {
        showFeedback('success', `Successfully adjusted promo wallet by ₹${promoAdjustment.toLocaleString('en-IN')}. New balance: ₹${res.newPromoBalance.toLocaleString('en-IN')}`);
        // Refresh retailers list
        const retRes = await api.get('/admin/retailers');
        if (retRes.success) setRetailers(retRes.retailers);
      } else {
        showFeedback('error', res.message || 'Failed to adjust promo wallet balance.');
      }
    } catch (error) {
      showFeedback('error', 'Server error adjusting promo wallet balance.');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        try {
          const res = await api.post('/admin/upload', {
            image: base64Data,
            fileName: file.name
          });
          if (res.success && res.imageUrl) {
            setNewProductData((prev) => ({ ...prev, imageUrl: res.imageUrl }));
            showFeedback('success', 'Image uploaded successfully!');
          } else {
            showFeedback('error', res.message || 'Upload failed.');
          }
        } catch (err) {
          showFeedback('error', 'Server error uploading image.');
        } finally {
          setImageUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      showFeedback('error', 'Failed to read file.');
      setImageUploading(false);
    }
  };

  // Wallet Approvals operations
  const handleApproveWallet = async (requestId: string) => {
    try {
      const res = await api.post(`/admin/wallet-requests/${requestId}/approve`);
      if (res.success) {
        showFeedback('success', 'Wallet deposit approved successfully!');
        loadData();
      } else {
        showFeedback('error', res.message || 'Approval failed.');
      }
    } catch (e) {
      showFeedback('error', 'Server error during wallet approval.');
    }
  };

  const handleRejectWallet = async (requestId: string) => {
    try {
      const res = await api.post(`/admin/wallet-requests/${requestId}/reject`);
      if (res.success) {
        showFeedback('success', 'Wallet deposit request rejected.');
        loadData();
      } else {
        showFeedback('error', res.message || 'Rejection failed.');
      }
    } catch (e) {
      showFeedback('error', 'Server error during wallet rejection.');
    }
  };

  // Inventory: Edit stock level
  // Inventory: Edit product details
  const handleSaveStock = async () => {
    if (!editProduct) return;
    try {
      const res = await api.put(`/products/${editProduct.id}`, {
        name: editProductData.name,
        sku: editProductData.sku,
        brand: editProductData.brand,
        category: editProductData.category,
        description: editProductData.description,
        mrp: Number(editProductData.mrp),
        wholesalePrice: Number(editProductData.wholesalePrice),
        retailerPrice: Number(editProductData.retailerPrice),
        stock: Number(editProductData.stock),
        moq: Number(editProductData.moq),
        weight: Number(editProductData.weight),
        unit: editProductData.unit,
        gstPercentage: Number(editProductData.gstPercentage),
        sortOrder: Number(editProductData.sortOrder || 1000),
        specifications: editProductData.expiryDate 
          ? [{ key: 'Expiry Date', value: editProductData.expiryDate }] 
          : []
      });
      if (res.success) {
        showFeedback('success', `Product ${editProductData.name} updated successfully!`);
        setEditProduct(null);
        loadData();
      } else {
        showFeedback('error', res.message || 'Failed to update product.');
      }
    } catch (e) {
      showFeedback('error', 'Server error during product update.');
    }
  };

  // Inventory: Add Single Product
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: newProductData.name,
        brand: newProductData.brand,
        sku: newProductData.sku,
        category: newProductData.category,
        unit: newProductData.unit,
        description: `${newProductData.brand} ${newProductData.name} - Premium bulk retail supply.`,
        mrp: Number(newProductData.mrp),
        wholesalePrice: Number(newProductData.wholesalePrice),
        retailerPrice: Number(newProductData.retailerPrice),
        moq: Number(newProductData.moq),
        stock: Number(newProductData.stock),
        gstPercentage: Number(newProductData.gstPercentage),
        weight: Number(newProductData.weight),
        images: newProductData.imageUrl 
          ? [newProductData.imageUrl] 
          : ['https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80'],
        sortOrder: Number(newProductData.sortOrder || 1000),
        specifications: newProductData.expiryDate 
          ? [{ key: 'Expiry Date', value: newProductData.expiryDate }] 
          : []
      };

      const res = await api.post('/products', payload);
      if (res.success) {
        showFeedback('success', 'New Product added successfully to catalog!');
        setNewProductData({
          name: '',
          brand: '',
          sku: '',
          category: 'grocery',
          mrp: '',
          wholesalePrice: '',
          retailerPrice: '',
          moq: '',
          stock: '',
          unit: 'Box',
          imageUrl: '',
          gstPercentage: '18',
          weight: '1',
          sortOrder: '1000',
          expiryDate: ''
        });
        setShowAddProductForm(false);
        loadData();
      } else {
        showFeedback('error', res.message || 'Failed to create product.');
      }
    } catch (e) {
      showFeedback('error', 'Server error adding product.');
    }
  };

  // Inventory: Delete Product
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product from database?')) return;
    try {
      const res = await api.delete(`/products/${id}`);
      if (res.success) {
        showFeedback('success', 'Product deleted successfully!');
        loadData();
      } else {
        showFeedback('error', res.message || 'Deletion failed.');
      }
    } catch (e) {
      showFeedback('error', 'Server error deleting product.');
    }
  };

  // Inventory: Toggle Visibility (Hide/Show)
  const handleToggleVisibility = async (product: any) => {
    const nextState = product.isActive === false ? true : false;
    try {
      const res = await api.put(`/products/${product.id}`, {
        isActive: nextState
      });
      if (res.success) {
        showFeedback('success', `Product visibility updated to ${nextState ? 'VISIBLE' : 'HIDDEN'}!`);
        // Refresh products list
        const prodRes = await api.get('/products?includeInactive=true');
        if (prodRes.success) setProducts(prodRes.products);
      } else {
        showFeedback('error', res.message || 'Failed to toggle visibility.');
      }
    } catch (e) {
      showFeedback('error', 'Server error toggling visibility.');
    }
  };

  // Inventory: Bulk upload JSON
  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(bulkJsonString);
      const res = await api.post('/products/bulk-upload', parsed);
      if (res.success) {
        showFeedback('success', 'Bulk catalog catalog processed successfully!');
        setBulkJsonString('');
        loadData();
      } else {
        showFeedback('error', res.message || 'Bulk upload failed.');
      }
    } catch (err: any) {
      showFeedback('error', `Invalid JSON structure: ${err.message}`);
    }
  };

  // Orders: Update order status
  const handleOrderStatusUpdate = async (orderId: string, status: string) => {
    try {
      const res = await api.put(`/orders/${orderId}/status`, { orderStatus: status });
      if (res.success) {
        showFeedback('success', `Order status updated to ${status.toUpperCase()}!`);
        loadData();
      } else {
        showFeedback('error', res.message || 'Failed to update status.');
      }
    } catch (e) {
      showFeedback('error', 'Server error updating status.');
    }
  };

  // Orders: Verify OTP for COD
  const handleVerifyDeliveryOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyOrderId) return;

    try {
      const res = await api.post(`/orders/${verifyOrderId}/verify-delivery`, { otp: deliveryOtpInput });
      if (res.success) {
        showFeedback('success', 'COD Order delivery OTP verified successfully. Order marked as DELIVERED!');
        setVerifyOrderId(null);
        setDeliveryOtpInput('');
        loadData();
      } else {
        showFeedback('error', res.message || 'OTP verification failed.');
      }
    } catch (e) {
      showFeedback('error', 'Server error during verification.');
    }
  };

  // Orders: Trigger Refund
  const handleTriggerRefund = async (orderId: string) => {
    if (!window.confirm("Are you sure you want to trigger a refund for this order? This will instantly credit the refund amount back to the retailer's wallet ledger.")) return;
    try {
      const res = await api.post(`/orders/${orderId}/refund`);
      if (res.success) {
        showFeedback('success', 'Order amount successfully refunded to retailer wallet ledger!');
        loadData();
      } else {
        showFeedback('error', res.message || 'Refund failed.');
      }
    } catch (e) {
      showFeedback('error', 'Server error triggering refund.');
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-650"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 text-left">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Rahul Super Mart Admin Console</h1>
            <p className="text-xs text-slate-500 mt-1">Control catalogs, view ledger logs, and approve wallet requests.</p>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-200 px-4 py-2 rounded-lg text-xs transition"
          >
            <RefreshCw size={13} /> Refresh Console
          </button>
        </div>

        {/* Action feedback */}
        {actionMessage && (
          <div className={`mb-6 p-4 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            actionMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}>
            <span>{actionMessage.text}</span>
          </div>
        )}

        {/* TABS BUTTONS HEADER */}
        <div className="flex border-b border-slate-200 bg-white px-4 pt-2 rounded-t-2xl border-t border-x overflow-x-auto gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'overview' ? 'border-indigo-600 text-indigo-600 font-black' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 size={15} /> Overview & Analytics
          </button>
          <button
            onClick={() => setActiveTab('retailers')}
            className={`py-3 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'retailers' ? 'border-indigo-600 text-indigo-600 font-black' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users size={15} /> Retailers Directory ({retailers.length})
          </button>
          <button
            onClick={() => setActiveTab('kyc')}
            className={`py-3 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'kyc' ? 'border-indigo-600 text-indigo-600 font-black' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck size={15} /> KYC Approvals ({kycRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('wallet')}
            className={`py-3 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'wallet' ? 'border-indigo-600 text-indigo-600 font-black' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck size={15} /> Wallet Approvals ({walletRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-3 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'inventory' ? 'border-indigo-600 text-indigo-600 font-black' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Package size={15} /> Inventory
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'orders' ? 'border-indigo-600 text-indigo-600 font-black' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShoppingCart size={15} /> Sourcing Orders ({orders.filter(o => ['received', 'accepted', 'dispatched'].includes(o.orderStatus)).length})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`py-3 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'logs' ? 'border-indigo-600 text-indigo-600 font-black' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText size={15} /> Audits & Logs
          </button>
          <button
            onClick={() => setActiveTab('coupons')}
            className={`py-3 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'coupons' ? 'border-indigo-600 text-indigo-600 font-black' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText size={15} /> Coupon Management
          </button>
        </div>

        {/* LOADING SHIMMER */}
        {loading ? (
          <div className="bg-white p-12 rounded-b-xl border border-slate-200 h-96 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-b-xl border-x border-b border-slate-200">
            
            {/* ========================================== */}
            {/* TAB 1: OVERVIEW & ANALYTICS                */}
            {/* ========================================== */}
            {activeTab === 'overview' && stats && (
              <div className="space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Today Orders</span>
                    <span className="text-xl font-extrabold text-slate-900 mt-1 block">{stats.todayOrders}</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Today Sales</span>
                    <span className="text-xl font-extrabold text-slate-950 mt-1 block">₹{stats.todaySales.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Pending Orders</span>
                    <span className="text-xl font-extrabold text-slate-900 mt-1 block">{stats.pendingOrders}</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Revenue</span>
                    <span className="text-xl font-extrabold text-indigo-650 mt-1 block">₹{stats.revenue.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Retailers</span>
                    <span className="text-xl font-extrabold text-slate-900 mt-1 block">{stats.newRetailers}</span>
                  </div>
                </div>

                {/* Sales Chart Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">Daily Sales Performance</h3>
                    <div className="h-64">
                      {charts?.dailySales && (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={charts.dailySales}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
                            <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} activeDot={{ r: 8 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">Best Selling Wholesale Products</h3>
                    <div className="h-64">
                      {charts?.bestSellers && (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={charts.bestSellers}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip formatter={(value, name) => [value, name === 'quantity' ? 'Units Sold' : 'Revenue']} />
                            <Bar dataKey="quantity" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================== */}
            {/* TAB: RETAILERS DIRECTORY                   */}
            {/* ========================================== */}
            {activeTab === 'retailers' && (
              <div className="space-y-6 text-left">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm">Registered Retailers Directory</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">List of all registered businesses, owners, and active KYC status on the platform.</p>
                  </div>
                  <button 
                    onClick={loadData}
                    className="text-[#2874f0] hover:underline text-xs font-bold"
                  >
                    Refresh Directory
                  </button>
                </div>

                {retailers.length === 0 ? (
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl py-12 text-center text-slate-400 text-xs">
                    No registered retailers found on the platform database.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm bg-white">
                    <table className="w-full text-xs text-slate-600">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-450 uppercase tracking-wider text-left">
                        <tr>
                          <th className="px-5 py-3">Shop / Business</th>
                          <th className="px-5 py-3">Owner Details</th>
                          <th className="px-5 py-3">KYC Status</th>
                          <th className="px-5 py-3 text-right">Wallet Balance</th>
                          <th className="px-5 py-3 text-right text-indigo-650">Promo Balance</th>
                          <th className="px-5 py-3">Registered Shipping Address</th>
                          <th className="px-5 py-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {retailers.map((ret: any) => (
                          <tr key={ret.id} className="hover:bg-slate-50 transition">
                            <td className="px-5 py-4">
                              <span className="font-black text-slate-800 block text-xs">{ret.kycDetails?.businessName || 'Unnamed Business'}</span>
                              <span className="text-[10px] text-slate-400 font-mono block mt-0.5">ID: {ret.id}</span>
                            </td>
                            <td className="px-5 py-4">
                              <span className="font-bold text-slate-800 block">{ret.kycDetails?.ownerName || 'No Name'}</span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">📞 {ret.mobile}</span>
                              <span className="text-[10px] text-slate-400 block">✉️ {ret.email}</span>
                              {ret.isBlocked && (
                                <span className="inline-flex items-center gap-1 text-[8px] font-black bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 mt-1.5 rounded uppercase tracking-wider animate-pulse">
                                  🛑 Blocked Account
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              {ret.kycStatus === 'verified' ? (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full">
                                  ✓ Verified Partner
                                </span>
                              ) : ret.kycStatus === 'pending' ? (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full">
                                  ⏰ Pending Approval
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded-full">
                                  ✗ KYC Rejected
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-right font-black text-slate-800 text-xs">
                              ₹{ret.walletBalance.toLocaleString('en-IN')}
                            </td>
                            <td className="px-5 py-4 text-right font-black text-indigo-650 text-xs bg-indigo-50/20">
                              ₹{(ret.promoWalletBalance || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="px-5 py-4 max-w-xs text-slate-500 leading-normal">
                              {ret.kycDetails?.businessAddress || 'No shipping address saved.'}
                            </td>
                            <td className="px-5 py-4 text-center whitespace-nowrap">
                              <button
                                onClick={() => handleAdjustWallet(ret.id, ret.walletBalance, ret.kycDetails?.businessName || ret.email)}
                                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold px-2 py-1 rounded border border-indigo-100 hover:border-indigo-200 text-[10px] transition mr-2"
                              >
                                Adjust Wallet
                              </button>
                              <button
                                onClick={() => handleAdjustPromoWallet(ret.id, ret.promoWalletBalance || 0, ret.kycDetails?.businessName || ret.email)}
                                className="bg-indigo-900 hover:bg-indigo-950 text-white font-extrabold px-2 py-1 rounded text-[10px] transition mr-2 shadow-sm"
                              >
                                Promo Wallet
                              </button>
                              <button
                                onClick={() => handleToggleBlock(ret.id, !!ret.isBlocked)}
                                className={`${
                                  ret.isBlocked 
                                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 hover:border-emerald-250' 
                                    : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 hover:border-rose-250'
                                } font-bold px-2 py-1 rounded text-[10px] transition mr-2`}
                              >
                                {ret.isBlocked ? 'Unblock' : 'Block'}
                              </button>
                              <button
                                onClick={() => handleDeleteRetailer(ret.id)}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold px-2 py-1 rounded border border-rose-100 hover:border-rose-200 text-[10px] transition"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

             {/* ========================================== */}
            {/* TAB: KYC APPROVALS QUEUE                   */}
            {/* ========================================== */}
            {activeTab === 'kyc' && (
              <div className="space-y-6">
                <h3 className="font-bold text-slate-800 text-sm text-left">Retailer KYC verification queue</h3>
                
                {kycRequests.length === 0 ? (
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl py-12 text-center text-slate-400 text-xs">
                    No pending KYC profile validation requests.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {kycRequests.map(item => (
                      <div key={item.id} className="border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="space-y-2 text-left">
                          <span className="text-[10px] bg-amber-50 border border-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded">Pending KYC verification</span>
                          <h4 className="font-extrabold text-slate-900 text-sm">Shop Name: {item.kycDetails?.businessName || 'Business Store'}</h4>
                          <div className="text-[11px] text-slate-500 space-y-1">
                            <p>Mobile Number: <strong className="text-slate-850 font-bold">{item.mobile}</strong></p>
                            <p>Email Address: <span className="text-slate-700 font-mono">{item.email}</span></p>
                            <p>Registered Address: <span className="font-medium text-slate-700">{item.kycDetails?.businessAddress || 'No Address'}</span></p>
                            <p>Owner Name: <span className="font-semibold text-slate-700">{item.kycDetails?.ownerName || 'N/A'}</span></p>
                            {item.kycDetails?.gstNumber && <p>GSTIN: <span className="font-bold text-indigo-600 uppercase">{item.kycDetails.gstNumber}</span></p>}
                            {item.kycDetails?.panNumber && <p>PAN Number: <span className="font-bold text-indigo-600 uppercase">{item.kycDetails.panNumber}</span></p>}
                          </div>
                        </div>

                        <div className="flex gap-2.5">
                          <button
                            onClick={() => handleRejectKyc(item.id)}
                            className="bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-bold px-4 py-2 rounded-lg text-xs transition"
                          >
                            Reject KYC
                          </button>
                          <button
                            onClick={() => handleApproveKyc(item.id)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition shadow-sm animate-pulse-subtle"
                          >
                            Approve KYC
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ========================================== */}
            {/* TAB 2: WALLET DEPOSIT APPROVAL QUEUE       */}
            {/* ========================================== */}
            {activeTab === 'wallet' && (
              <div className="space-y-6">
                <h3 className="font-bold text-slate-800 text-sm">Retailer Wallet Load Requests</h3>
                
                {walletRequests.length === 0 ? (
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl py-12 text-center text-slate-400 text-xs">
                    No pending wallet load requests in the approval pipeline.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {walletRequests.map(item => (
                      <div key={item.id} className="border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="space-y-2 text-left">
                          <span className="text-[10px] bg-amber-50 border border-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded">Pending Admin Approval</span>
                          <h4 className="font-extrabold text-slate-900 text-sm">Retailer: {item.businessName || 'Business Shop'}</h4>
                          <div className="text-[11px] text-slate-500 space-y-0.5">
                            <p>Requested Amount: <strong className="text-slate-800 text-sm">₹{item.amount.toLocaleString('en-IN')}</strong></p>
                            <p>Payment Gateway VPA: <span className="font-semibold text-slate-700">vishalstore@upi</span></p>
                            <p>Request Date: <span className="italic">{new Date(item.createdAt || Date.now()).toLocaleString()}</span></p>
                          </div>
                        </div>

                        <div className="flex gap-2.5">
                          <button
                            onClick={() => handleRejectWallet(item.id)}
                            className="bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-bold px-4 py-2 rounded-lg text-xs transition"
                          >
                            Reject & Decline
                          </button>
                          <button
                            onClick={() => handleApproveWallet(item.id)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition shadow-sm"
                          >
                            Approve & Credit Wallet
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ========================================== */}
            {/* TAB 3: INVENTORY                           */}
            {/* ========================================== */}
            {activeTab === 'inventory' && (
              <div className="space-y-6">
                <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-100 pb-4">
                  <div className="text-left">
                    <h3 className="font-bold text-slate-800 text-sm">Product Catalogue & Sourcing Stocks</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Directly create, delete, or edit stock levels.</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAddProductForm(!showAddProductForm)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-lg text-xs transition shadow-sm"
                    >
                      {showAddProductForm ? 'Close Product Form' : '+ Add Single Product'}
                    </button>
                    <a
                      href="http://localhost:5000/api/products/bulk-export"
                      className="inline-flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold px-4 py-2.5 rounded-lg text-xs transition"
                    >
                      <Download size={13} /> Export Products CSV
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-slate-50/50">
                      <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-bold">
                          <tr>
                            <th className="px-4 py-3">Product details</th>
                            <th className="px-4 py-3">Category</th>
                            <th className="px-4 py-3 text-right">MRP</th>
                            <th className="px-4 py-3 text-right">Retail Rate</th>
                            <th className="px-4 py-3 text-right">Bulk Rate</th>
                            <th className="px-4 py-3 text-right">Stock</th>
                            <th className="px-4 py-3 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {products.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-800">{p.name}</span>
                                  {p.isActive === false && (
                                    <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-200 uppercase">
                                      Hidden
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                  SKU: {p.sku} | MOQ: {p.moq} | {p.weight || 1}kg | {p.gstPercentage || 18}% GST
                                </span>
                              </td>
                              <td className="px-4 py-3 uppercase font-semibold text-[10px] text-slate-500">{p.category}</td>
                              <td className="px-4 py-3 text-right text-slate-400 line-through">₹{p.mrp}</td>
                              <td className="px-4 py-3 text-right font-medium text-slate-600">₹{p.retailerPrice}</td>
                              <td className="px-4 py-3 text-right font-bold text-indigo-600">₹{p.wholesalePrice}</td>
                              <td className="px-4 py-3 text-right">
                                <span className={`font-bold ${p.stock <= p.moq ? 'text-rose-600 font-black' : 'text-slate-800'}`}>
                                  {p.stock}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center flex items-center justify-center gap-2.5">
                                <button
                                  onClick={() => handleToggleVisibility(p)}
                                  className={`font-bold text-xs hover:underline ${p.isActive === false ? 'text-emerald-600' : 'text-slate-500'}`}
                                >
                                  {p.isActive === false ? 'Show' : 'Hide'}
                                </button>
                                <button
                                  onClick={() => { 
                                    setEditProduct(p); 
                                    setEditProductData({
                                      id: p.id,
                                      name: p.name,
                                      sku: p.sku || '',
                                      brand: p.brand || '',
                                      category: p.category || '',
                                      description: p.description || '',
                                      mrp: String(p.mrp),
                                      wholesalePrice: String(p.wholesalePrice),
                                      retailerPrice: String(p.retailerPrice),
                                      stock: String(p.stock),
                                      moq: String(p.moq || 1),
                                      weight: String(p.weight || 0),
                                      unit: p.unit || 'Piece',
                                      gstPercentage: String(p.gstPercentage || 18),
                                      sortOrder: String(p.sortOrder !== undefined ? p.sortOrder : 1000),
                                      expiryDate: p.specifications?.find((s: any) => s.key === 'Expiry Date')?.value || ''
                                    });
                                  }}
                                  className="text-indigo-650 hover:underline font-bold text-xs"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(p.id)}
                                  className="text-rose-600 hover:underline font-bold text-xs"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="lg:col-span-1 space-y-6">
                    {/* Add Product Form */}
                    {showAddProductForm && (
                      <div className="bg-white border border-slate-200 p-6 rounded-2xl text-left space-y-4 shadow-sm animate-scale-up">
                        <h4 className="font-extrabold text-slate-800 text-sm">Add New Product</h4>
                        <form onSubmit={handleAddProduct} className="space-y-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Product Name</label>
                            <input
                              type="text"
                              required
                              value={newProductData.name}
                              onChange={(e) => setNewProductData({...newProductData, name: e.target.value})}
                              placeholder="e.g. Premium Mustard Seeds"
                              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">
                              Product Image {imageUploading ? '(Uploading...)' : ''}
                            </label>
                            <div className="space-y-1.5 mt-1">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[9px] file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={newProductData.imageUrl}
                                onChange={(e) => setNewProductData({...newProductData, imageUrl: e.target.value})}
                                placeholder="Or paste image URL here"
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase">SKU</label>
                              <input
                                type="text"
                                required
                                value={newProductData.sku}
                                onChange={(e) => setNewProductData({...newProductData, sku: e.target.value})}
                                placeholder="MUST-SEED-01"
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase">Brand</label>
                              <input
                                type="text"
                                required
                                value={newProductData.brand}
                                onChange={(e) => setNewProductData({...newProductData, brand: e.target.value})}
                                placeholder="Fortune / Mi India"
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase">Category</label>
                              <select
                                value={newProductData.category}
                                onChange={(e) => setNewProductData({...newProductData, category: e.target.value})}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                              >
                                <option value="grocery">Grocery</option>
                                <option value="cosmetic">Cosmetic</option>
                                <option value="electronics">Electronics</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase">Unit Pack</label>
                              <input
                                type="text"
                                required
                                value={newProductData.unit}
                                onChange={(e) => setNewProductData({...newProductData, unit: e.target.value})}
                                placeholder="Bag / Tin / Box"
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-2.5 py-1.5 text-xs"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase">GST Slab (%)</label>
                              <select
                                value={newProductData.gstPercentage}
                                onChange={(e) => setNewProductData({...newProductData, gstPercentage: e.target.value})}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                              >
                                <option value="0">0%</option>
                                <option value="5">5%</option>
                                <option value="12">12%</option>
                                <option value="18">18%</option>
                                <option value="28">28%</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase">Weight (Kg)</label>
                              <input
                                type="number"
                                required
                                min="0.1"
                                step="0.1"
                                value={newProductData.weight}
                                onChange={(e) => setNewProductData({...newProductData, weight: e.target.value})}
                                placeholder="1"
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-1.5">
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 uppercase">MRP (₹)</label>
                              <input
                                type="number"
                                required
                                value={newProductData.mrp}
                                onChange={(e) => setNewProductData({...newProductData, mrp: e.target.value})}
                                placeholder="1000"
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 uppercase">Wholesale (₹)</label>
                              <input
                                type="number"
                                required
                                value={newProductData.wholesalePrice}
                                onChange={(e) => setNewProductData({...newProductData, wholesalePrice: e.target.value})}
                                placeholder="700"
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 uppercase">Retailer (₹)</label>
                              <input
                                type="number"
                                required
                                value={newProductData.retailerPrice}
                                onChange={(e) => setNewProductData({...newProductData, retailerPrice: e.target.value})}
                                placeholder="800"
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase">MOQ Slabs</label>
                              <input
                                type="number"
                                required
                                value={newProductData.moq}
                                onChange={(e) => setNewProductData({...newProductData, moq: e.target.value})}
                                placeholder="5"
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase">Initial Stock</label>
                              <input
                                type="number"
                                required
                                value={newProductData.stock}
                                onChange={(e) => setNewProductData({...newProductData, stock: e.target.value})}
                                placeholder="50"
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase">Sort Order (Priority)</label>
                              <input
                                type="number"
                                required
                                value={newProductData.sortOrder}
                                onChange={(e) => setNewProductData({...newProductData, sortOrder: e.target.value})}
                                placeholder="1000"
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Expiry Date</label>
                            <input
                              type="text"
                              value={newProductData.expiryDate}
                              onChange={(e) => setNewProductData({...newProductData, expiryDate: e.target.value})}
                              placeholder="e.g. Dec 2026, 31/12/2026, or Best Before 12 Months"
                              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                            />
                          </div>

                          <div className="flex gap-2 justify-end pt-2">
                            <button
                              type="button"
                              onClick={() => setShowAddProductForm(false)}
                              className="text-slate-500 hover:text-slate-800 text-xs font-semibold px-3 py-1.5"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={imageUploading}
                              className={`font-bold text-xs px-4 py-1.5 rounded-lg shadow-sm text-white transition ${
                                imageUploading 
                                  ? 'bg-indigo-400 cursor-not-allowed' 
                                  : 'bg-indigo-600 hover:bg-indigo-700'
                              }`}
                            >
                              {imageUploading ? 'Uploading Image...' : 'Add Product'}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {editProduct && (
                      <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl text-left space-y-4">
                        <div>
                          <h4 className="font-extrabold text-slate-800 text-sm">Update Product Details</h4>
                          <span className="text-[10px] text-slate-400 block">Editing SKU: {editProduct.sku}</span>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Product Name</label>
                            <input
                              type="text"
                              required
                              value={editProductData.name}
                              onChange={(e) => setEditProductData({...editProductData, name: e.target.value})}
                              className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-1.5">
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 uppercase">SKU Code</label>
                              <input
                                type="text"
                                required
                                value={editProductData.sku}
                                onChange={(e) => setEditProductData({...editProductData, sku: e.target.value})}
                                className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 uppercase">Brand</label>
                              <input
                                type="text"
                                required
                                value={editProductData.brand}
                                onChange={(e) => setEditProductData({...editProductData, brand: e.target.value})}
                                className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 uppercase">Category</label>
                              <select
                                value={editProductData.category}
                                onChange={(e) => setEditProductData({...editProductData, category: e.target.value})}
                                className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg px-2 py-1.5 text-xs focus:outline-none capitalize"
                              >
                                <option value="grocery">Grocery</option>
                                <option value="cosmetic">Cosmetic</option>
                                <option value="electronics">Electronics</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Description</label>
                            <textarea
                              value={editProductData.description}
                              onChange={(e) => setEditProductData({...editProductData, description: e.target.value})}
                              className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 h-16 resize-none"
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-1.5">
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 uppercase">MRP (₹)</label>
                              <input
                                type="number"
                                required
                                value={editProductData.mrp}
                                onChange={(e) => setEditProductData({...editProductData, mrp: e.target.value})}
                                className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 uppercase">Wholesale (₹)</label>
                              <input
                                type="number"
                                required
                                value={editProductData.wholesalePrice}
                                onChange={(e) => setEditProductData({...editProductData, wholesalePrice: e.target.value})}
                                className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 uppercase">Retailer (₹)</label>
                              <input
                                type="number"
                                required
                                value={editProductData.retailerPrice}
                                onChange={(e) => setEditProductData({...editProductData, retailerPrice: e.target.value})}
                                className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-1.5">
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 uppercase">MOQ</label>
                              <input
                                type="number"
                                required
                                value={editProductData.moq}
                                onChange={(e) => setEditProductData({...editProductData, moq: e.target.value})}
                                className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 uppercase">Weight (kg)</label>
                              <input
                                type="number"
                                required
                                value={editProductData.weight}
                                onChange={(e) => setEditProductData({...editProductData, weight: e.target.value})}
                                className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 uppercase">Unit Pack</label>
                              <select
                                value={editProductData.unit}
                                onChange={(e) => setEditProductData({...editProductData, unit: e.target.value})}
                                className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                              >
                                <option value="Piece">Piece</option>
                                <option value="Box">Box</option>
                                <option value="Carton">Carton</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-1.5">
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 uppercase">Available Stock</label>
                              <input
                                type="number"
                                required
                                value={editProductData.stock}
                                onChange={(e) => setEditProductData({...editProductData, stock: e.target.value})}
                                className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 uppercase">GST Rate (%)</label>
                              <input
                                type="number"
                                required
                                value={editProductData.gstPercentage}
                                onChange={(e) => setEditProductData({...editProductData, gstPercentage: e.target.value})}
                                className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 uppercase">Priority Order</label>
                              <input
                                type="number"
                                required
                                value={editProductData.sortOrder}
                                onChange={(e) => setEditProductData({...editProductData, sortOrder: e.target.value})}
                                className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase">Expiry Date</label>
                            <input
                              type="text"
                              value={editProductData.expiryDate}
                              onChange={(e) => setEditProductData({...editProductData, expiryDate: e.target.value})}
                              placeholder="e.g. Dec 2026, 31/12/2026, or Best Before 12 Months"
                              className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-2">
                          <button onClick={() => setEditProduct(null)} className="text-slate-500 hover:text-slate-800 text-xs font-bold px-3 py-2">
                            Cancel
                          </button>
                          <button onClick={handleSaveStock} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow">
                            Save Changes
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl text-left">
                      <h4 className="font-extrabold text-slate-800 text-sm mb-3">Bulk Catalog Upload (JSON)</h4>
                      <form onSubmit={handleBulkUpload} className="space-y-4">
                        <textarea
                          required
                          rows={6}
                          value={bulkJsonString}
                          onChange={(e) => setBulkJsonString(e.target.value)}
                          placeholder='[{"name": "New Product", "sku": "NP-001", "mrp": 100, "wholesalePrice": 70, "retailerPrice": 80, "moq": 10, "stock": 50, "unit": "Box", "category": "grocery"}]'
                          className="w-full bg-white border border-slate-200 text-slate-900 font-mono text-[10px] p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 rounded-lg transition flex items-center justify-center gap-1">
                          <Upload size={12} /> Process JSON Upload
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
            )}

            {/* ========================================== */}
            {/* TAB 4: ORDERS CONTROLLER                   */}
            {/* ========================================== */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                  <div className="text-left">
                    <h3 className="font-bold text-slate-800 text-sm">
                      {orderFilter === 'active' ? 'Active Sourcing Orders' : 'All Sourcing Orders'}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Manage new orders, acceptance flows, dispatch validation, and refunds.</p>
                  </div>
                  <div className="bg-slate-100 p-1 rounded-xl flex gap-1 border border-slate-200/50 self-start sm:self-auto">
                    <button
                      onClick={() => setOrderFilter('active')}
                      className={`text-[10px] font-bold px-3.5 py-1.5 rounded-lg transition ${
                        orderFilter === 'active' ? 'bg-white text-indigo-650 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Active ({orders.filter(o => ['received', 'accepted', 'dispatched'].includes(o.orderStatus)).length})
                    </button>
                    <button
                      onClick={() => setOrderFilter('all')}
                      className={`text-[10px] font-bold px-3.5 py-1.5 rounded-lg transition ${
                        orderFilter === 'all' ? 'bg-white text-indigo-650 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      All History ({orders.length})
                    </button>
                  </div>
                </div>

                {(() => {
                  const filteredOrders = orders.filter(order => {
                    if (orderFilter === 'active') {
                      return ['received', 'accepted', 'dispatched'].includes(order.orderStatus);
                    }
                    return true;
                  });

                  if (filteredOrders.length === 0) {
                    return (
                      <div className="bg-slate-50 border border-slate-200 py-12 rounded-2xl text-center text-slate-400 text-xs">
                        {orderFilter === 'active' ? 'No active sourcing orders found.' : 'No sourcing orders placed yet.'}
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {filteredOrders.map(order => (
                        <div key={order.id} className="border border-slate-200 bg-slate-50/20 rounded-2xl p-6 text-left space-y-4">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 pb-4 gap-4">
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold block">ORDER ID</span>
                              <span className="font-black text-slate-900 text-sm">{order.id.toUpperCase()}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold block">RETAILER</span>
                              <span className="font-semibold text-slate-800 text-xs">{order.businessName}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold block">GRAND TOTAL</span>
                              <span className="font-extrabold text-slate-900 text-xs">₹{order.amounts.finalTotal.toLocaleString('en-IN')}</span>
                            </div>
                            <div>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                order.orderStatus === 'delivered' ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'
                              }`}>
                                {order.orderStatus}
                              </span>
                            </div>
                          </div>

                          {/* Items list */}
                          <div className="space-y-2">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Items Purchased</span>
                            {order.items.map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center text-xs text-slate-600">
                                <span>{item.name} (x{item.quantity})</span>
                                <span className="font-semibold text-slate-800">₹{item.subtotal}</span>
                              </div>
                            ))}
                          </div>

                          {/* Shipping details */}
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-xs space-y-1">
                            <p><strong className="text-slate-700">Delivery Address:</strong> {order.deliveryAddress} - {order.pincode}</p>
                            <p><strong className="text-slate-700">Payment Status:</strong> <span className="uppercase font-semibold">{order.paymentStatus}</span> ({order.paymentMethod.toUpperCase()})</p>
                          </div>

                          {/* Admin Action Bar */}
                          <div className="flex flex-wrap justify-between items-center gap-4 pt-3 border-t border-slate-100">
                            
                            {/* OTP verification widget */}
                            {order.orderStatus === 'dispatched' && order.paymentMethod === 'cod' ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setVerifyOrderId(order.id)}
                                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-3 py-1.5 rounded-lg text-[10px] border border-indigo-150 transition"
                                >
                                  Verify Delivery OTP
                                </button>
                              </div>
                            ) : (
                              <div />
                            )}

                            <div className="flex gap-2">
                              {order.orderStatus === 'received' && (
                                <button
                                  onClick={() => handleOrderStatusUpdate(order.id, 'accepted')}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] shadow"
                                >
                                  Confirm Order
                                </button>
                              )}
                              {order.orderStatus === 'accepted' && (
                                <button
                                  onClick={() => handleOrderStatusUpdate(order.id, 'dispatched')}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] shadow"
                                >
                                  Dispatch Cargo
                                </button>
                              )}
                              {order.orderStatus === 'dispatched' && (
                                <button
                                  onClick={() => handleOrderStatusUpdate(order.id, 'delivered')}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] shadow"
                                >
                                  Confirm Delivery
                                </button>
                              )}
                              {order.orderStatus !== 'cancelled' && order.orderStatus !== 'returned' && order.orderStatus !== 'delivered' && (
                                <button
                                  onClick={() => handleOrderStatusUpdate(order.id, 'cancelled')}
                                  className="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold px-3 py-1.5 rounded-lg text-[10px]"
                                >
                                  Cancel Order
                                </button>
                              )}
                              {(order.orderStatus === 'cancelled' || order.orderStatus === 'returned') && order.paymentStatus !== 'refunded' && (
                                <button
                                  onClick={() => handleTriggerRefund(order.id)}
                                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg text-[10px]"
                                >
                                  Refund to Wallet
                                </button>
                              )}
                              <a
                                href={`http://localhost:5000/api/orders/${order.id}/invoice?token=${typeof window !== 'undefined' ? localStorage.getItem('b2b_token') : ''}`}
                                target="_blank"
                                rel="noreferrer"
                                className="bg-blue-50 hover:bg-blue-100 text-[#2874f0] border border-blue-200 font-extrabold px-3 py-1.5 rounded-lg text-[10px] inline-flex items-center gap-1 shadow-sm transition hover:scale-102"
                              >
                                <Eye size={10} /> Download Invoice PDF
                              </a>
                            </div>
                          </div>

                          {/* OTP Verification Modal */}
                          {verifyOrderId === order.id && (
                            <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl mt-3 flex flex-col md:flex-row justify-between items-center gap-4 animate-scale-up">
                              <div className="text-left">
                                <span className="font-bold text-indigo-900 text-xs block">Simulated Delivery OTP Required</span>
                                <p className="text-[10px] text-indigo-700 mt-0.5">Please ask the retailer for the 6-digit OTP sent to their mobile logger console.</p>
                              </div>
                              <form onSubmit={handleVerifyDeliveryOtp} className="flex gap-2">
                                <input
                                  type="text"
                                  maxLength={6}
                                  required
                                  value={deliveryOtpInput}
                                  onChange={(e) => setDeliveryOtpInput(e.target.value)}
                                  placeholder="123456"
                                  className="w-24 bg-white border border-slate-200 text-slate-950 font-bold rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none"
                                />
                                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-sm">
                                  Verify
                                </button>
                                <button onClick={() => setVerifyOrderId(null)} className="text-slate-500 hover:underline text-xs px-2">
                                  Cancel
                                </button>
                              </form>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ========================================== */}
            {/* TAB 4.5: COUPON MANAGEMENT                 */}
            {/* ========================================== */}
            {activeTab === 'coupons' && (
              <div className="space-y-6">
                <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-100 pb-4">
                  <div className="text-left">
                    <h3 className="font-bold text-slate-800 text-sm">Promo Coupons & B2B Discounts</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Manage promo codes, discount slabs, and campaign validations.</p>
                  </div>
                  <button
                    onClick={() => setShowAddCouponForm(!showAddCouponForm)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow transition"
                  >
                    {showAddCouponForm ? 'Close Form' : 'Add New Coupon'}
                  </button>
                </div>

                {showAddCouponForm && (
                  <form onSubmit={handleCreateCoupon} className="bg-slate-50 border border-slate-200/80 p-6 rounded-2xl max-w-xl text-left space-y-4">
                    <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide">Create Promo Coupon</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Coupon Code</label>
                        <input
                          type="text"
                          required
                          value={newCouponData.code}
                          onChange={(e) => setNewCouponData({...newCouponData, code: e.target.value})}
                          placeholder="FESTIVALB2B"
                          className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 uppercase"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Discount Type</label>
                        <select
                          value={newCouponData.discountType}
                          onChange={(e) => setNewCouponData({...newCouponData, discountType: e.target.value})}
                          className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="flat">Flat Cash Discount (INR)</option>
                          <option value="percentage">Percentage Discount (%)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Discount Value</label>
                        <input
                          type="number"
                          required
                          value={newCouponData.discountValue}
                          onChange={(e) => setNewCouponData({...newCouponData, discountValue: e.target.value})}
                          placeholder="500"
                          className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Min Purchase Value (INR)</label>
                        <input
                          type="number"
                          value={newCouponData.minOrderAmount}
                          onChange={(e) => setNewCouponData({...newCouponData, minOrderAmount: e.target.value})}
                          placeholder="5000"
                          className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Expires At (YYYY-MM-DD)</label>
                        <input
                          type="date"
                          required
                          value={newCouponData.expiresAt}
                          onChange={(e) => setNewCouponData({...newCouponData, expiresAt: e.target.value})}
                          className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                       <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Payment Mode Restriction</label>
                        <select
                          value={newCouponData.restrictedPaymentMethod}
                          onChange={(e) => setNewCouponData({...newCouponData, restrictedPaymentMethod: e.target.value})}
                          className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="all">All Payment Modes</option>
                          <option value="cod">Cash on Delivery (COD) Only</option>
                          <option value="online">Online / QR Payments Only</option>
                          <option value="wallet">Wallet Balance Ledger Only</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Category Restriction</label>
                        <select
                          value={newCouponData.restrictedCategory}
                          onChange={(e) => setNewCouponData({...newCouponData, restrictedCategory: e.target.value})}
                          className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="">No Category Restriction (Valid for All)</option>
                          <option value="grocery">Grocery Only</option>
                          <option value="cosmetic">Cosmetic Only</option>
                          <option value="electronics">Electronics Only</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Product Restriction</label>
                        <select
                          value={newCouponData.restrictedProductId}
                          onChange={(e) => setNewCouponData({...newCouponData, restrictedProductId: e.target.value})}
                          className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="">No Product Restriction (Valid for All)</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-2.5 rounded-lg shadow-sm transition">
                      Publish Coupon
                    </button>
                  </form>
                )}

                {/* Active/Inactive coupon listing */}
                {coupons.length === 0 ? (
                  <div className="bg-slate-50 border border-slate-200/80 py-12 rounded-2xl text-center text-slate-400 text-xs">
                    No discount coupons found in database.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                    {coupons.map((coupon) => (
                      <div key={coupon.id} className={`border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between bg-white relative overflow-hidden ${
                        !coupon.isActive ? 'opacity-65' : ''
                      }`}>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="font-mono font-black text-sm bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg border border-indigo-100 tracking-wider">
                              {coupon.code}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              coupon.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-105 text-slate-500 border border-slate-200'
                            }`}>
                              {coupon.isActive ? 'Active' : 'Disabled'}
                            </span>
                          </div>

                          <div className="text-xs text-slate-600 space-y-1">
                            <p>
                              Discount: <strong className="text-slate-800 font-bold">
                                {coupon.discountType === 'flat' ? `₹${coupon.discountValue} Flat` : `${coupon.discountValue}% Off`}
                              </strong>
                            </p>
                            <p>Min Purchase Required: <span className="font-semibold text-slate-805 font-mono">₹{coupon.minOrderAmount}</span></p>
                            <p>Expiry Date: <span className="italic font-medium text-slate-700">{coupon.expiresAt}</span></p>
                            <p>
                              Payment Mode: <strong className="text-slate-800 font-bold uppercase text-[9px]">
                                {coupon.restrictedPaymentMethod === 'all' || !coupon.restrictedPaymentMethod
                                  ? 'All Payment Modes'
                                  : coupon.restrictedPaymentMethod === 'cod'
                                  ? 'COD Only'
                                  : coupon.restrictedPaymentMethod === 'online'
                                  ? 'Online / QR Only'
                                  : 'Wallet Only'}
                              </strong>
                            </p>
                            {coupon.restrictedCategory && (
                              <p>
                                Category Restriction: <strong className="text-indigo-650 font-black uppercase text-[9px] bg-indigo-50 px-1.5 py-0.5 rounded">
                                  {coupon.restrictedCategory} Only
                                </strong>
                              </p>
                            )}
                            {coupon.restrictedProductId && (
                              <p>
                                Product Restriction: <strong className="text-emerald-700 font-black uppercase text-[9px] bg-emerald-50 px-1.5 py-0.5 rounded">
                                  {products.find(p => p.id === coupon.restrictedProductId)?.name || coupon.restrictedProductId} Only
                                </strong>
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2.5 mt-5 pt-3 border-t border-slate-100">
                          <button
                            onClick={() => handleToggleCoupon(coupon.id)}
                            className={`flex-grow font-bold px-3 py-1.5 rounded-lg text-[10px] border transition ${
                              coupon.isActive 
                                ? 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200' 
                                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-150'
                            }`}
                          >
                            {coupon.isActive ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => handleDeleteCoupon(coupon.id)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-705 border border-rose-100 font-bold px-3 py-1.5 rounded-lg text-[10px] transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ========================================== */}
            {/* TAB 5: AUDITS & SYSTEM MONITOR             */}
            {/* ========================================== */}
            {activeTab === 'logs' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
                  
                  {/* System Audit Logs */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-800 text-sm">Security & Audit Logs</h3>
                    <div className="border border-slate-250 rounded-2xl p-4 bg-slate-950 text-slate-300 font-mono text-[10px] h-96 overflow-y-auto space-y-3 custom-scrollbar">
                      {auditLogs.map((log) => (
                        <div key={log.id} className="border-b border-slate-900 pb-2">
                          <span className="text-slate-500 block">[{new Date(log.createdAt).toLocaleString()}]</span>
                          <span className="text-indigo-400 font-bold">{log.action}</span> - <span>{log.details}</span>
                          <span className="text-slate-500 block mt-0.5">By: {log.userEmail} ({log.userRole})</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SMS / Email notifications logger */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-800 text-sm">Outbound Notifications Logger</h3>
                    <div className="border border-slate-250 rounded-2xl p-4 bg-slate-950 text-emerald-400 font-mono text-[10px] h-96 overflow-y-auto space-y-2 custom-scrollbar">
                      {notifLogs.map((log, idx) => (
                        <div key={idx} className="border-b border-slate-900 pb-2 leading-relaxed">
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
