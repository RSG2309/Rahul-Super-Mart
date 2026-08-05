'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

export interface ICartItem {
  productId: string;
  name: string;
  sku: string;
  image: string;
  quantity: number;
  mrp: number;
  wholesalePrice: number;
  retailerPrice: number;
  gstPercentage: number;
  moq: number;
  stock: number;
}

interface CartContextType {
  items: ICartItem[];
  couponCode: string;
  couponDiscount: number;
  pincode: string;
  paymentMethod: 'online' | 'cod';
  shippingAddress: string;
  amounts: {
    subtotal: number;
    gstTotal: number;
    shipping: number;
    codCharge: number;
    discount: number;
    finalTotal: number;
  };
  addToCart: (product: any, quantity: number) => { success: boolean; message?: string };
  updateQuantity: (productId: string, quantity: number) => { success: boolean; message?: string };
  removeFromCart: (productId: string) => void;
  applyCoupon: (code: string) => Promise<{ success: boolean; message?: string }>;
  removeCoupon: () => void;
  setPincode: (pin: string) => void;
  setPaymentMethod: (method: 'online' | 'cod') => void;
  setShippingAddress: (address: string) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  placeOrder: () => Promise<{ success: boolean; message?: string; order?: any; deliveryOtp?: string }>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<ICartItem[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [pincode, setPincodeState] = useState('845307');
  const [paymentMethod, setPaymentMethodState] = useState<'online' | 'cod'>('online');
  const [shippingAddress, setShippingAddress] = useState('');
  const [isCartOpen, setCartOpen] = useState(false);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('b2b_cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Save cart to localStorage
  const saveCart = (newItems: ICartItem[]) => {
    setItems(newItems);
    localStorage.setItem('b2b_cart', JSON.stringify(newItems));
  };

  // Re-calculate totals whenever items, paymentMethod, or couponCode changes
  const calculateTotals = () => {
    let subtotal = 0;
    let gstTotal = 0;

    const isKycVerified = user?.kycStatus === 'verified';
    items.forEach(item => {
      // Tier pricing slab: quantity >= 20 gets wholesalePrice if KYC verified, else retailerPrice
      const price = (item.quantity >= 20 && isKycVerified) ? item.wholesalePrice : item.retailerPrice;
      const itemGst = 0;
      
      subtotal += price * item.quantity;
      gstTotal += itemGst;
    });

    const shipping = 0;
    const codCharge = 0;
    
    // Recalculate discount based on new subtotal
    let finalDiscount = couponDiscount;
    if (couponCode && subtotal < 5000) {
      // Auto revoke welcome coupon if order drops below threshold
      finalDiscount = 0;
    }

    const finalTotal = Math.max(0, subtotal + gstTotal + shipping + codCharge - finalDiscount);

    return {
      subtotal,
      gstTotal,
      shipping,
      codCharge,
      discount: finalDiscount,
      finalTotal
    };
  };

  const addToCart = (product: any, quantity: number) => {
    if (quantity < product.moq) {
      return { success: false, message: `Minimum order quantity (MOQ) for this product is ${product.moq} units.` };
    }

    const existingIdx = items.findIndex(item => item.productId === product.id);
    const newItems = [...items];

    if (existingIdx > -1) {
      const newQty = newItems[existingIdx].quantity + quantity;
      if (newQty > product.stock) {
        return { success: false, message: `Only ${product.stock} units available in stock.` };
      }
      newItems[existingIdx].quantity = newQty;
    } else {
      if (quantity > product.stock) {
        return { success: false, message: `Only ${product.stock} units available in stock.` };
      }
      newItems.push({
        productId: product.id,
        name: product.name,
        sku: product.sku,
        image: product.images?.[0] || 'https://via.placeholder.com/150',
        quantity,
        mrp: product.mrp,
        wholesalePrice: product.wholesalePrice,
        retailerPrice: product.retailerPrice,
        gstPercentage: product.gstPercentage,
        moq: product.moq,
        stock: product.stock
      });
    }

    saveCart(newItems);
    setCartOpen(true);
    return { success: true };
  };

  const updateQuantity = (productId: string, quantity: number) => {
    const idx = items.findIndex(item => item.productId === productId);
    if (idx === -1) return { success: false, message: 'Item not in cart' };

    const item = items[idx];
    if (quantity < item.moq) {
      return { success: false, message: `Cannot reduce below MOQ of ${item.moq} units.` };
    }

    if (quantity > item.stock) {
      return { success: false, message: `Only ${item.stock} units available in stock.` };
    }

    const newItems = [...items];
    newItems[idx].quantity = quantity;
    saveCart(newItems);
    return { success: true };
  };

  const removeFromCart = (productId: string) => {
    const newItems = items.filter(item => item.productId !== productId);
    saveCart(newItems);
    if (newItems.length === 0) {
      removeCoupon();
    }
  };

  const applyCoupon = async (code: string) => {
    const { subtotal } = calculateTotals();
    try {
      const res = await api.post('/coupons/validate', { code, subtotal, paymentMethod, items });
      if (res.success) {
        setCouponCode(res.coupon.code);
        let disc = 0;
        if (res.discountAmount !== undefined) {
          disc = res.discountAmount;
        } else {
          if (res.coupon.discountType === 'flat') {
            disc = res.coupon.discountValue;
          } else {
            disc = subtotal * (res.coupon.discountValue / 100);
            if (res.coupon.maxDiscountAmount && disc > res.coupon.maxDiscountAmount) {
              disc = res.coupon.maxDiscountAmount;
            }
          }
        }
        setCouponDiscount(disc);
        return { success: true };
      }
      return { success: false, message: res.message || 'Coupon not valid' };
    } catch (e) {
      return { success: false, message: 'Error applying coupon' };
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setCouponDiscount(0);
  };

  const setPincode = (pin: string) => {
    setPincodeState(pin);
  };

  const setPaymentMethod = async (method: 'online' | 'cod') => {
    setPaymentMethodState(method);
    if (couponCode) {
      const { subtotal } = calculateTotals();
      try {
        const res = await api.post('/coupons/validate', { code: couponCode, subtotal, paymentMethod: method, items });
        if (!res.success) {
          removeCoupon();
          alert(`Coupon Removed: ${res.message || 'Not valid for this payment method.'}`);
        } else {
          let disc = 0;
          if (res.discountAmount !== undefined) {
            disc = res.discountAmount;
          } else {
            if (res.coupon.discountType === 'flat') {
              disc = res.coupon.discountValue;
            } else {
              disc = subtotal * (res.coupon.discountValue / 100);
              if (res.coupon.maxDiscountAmount && disc > res.coupon.maxDiscountAmount) {
                disc = res.coupon.maxDiscountAmount;
              }
            }
          }
          setCouponDiscount(disc);
        }
      } catch (e) {
        console.error('Error re-validating coupon:', e);
      }
    }
  };

  const clearCart = () => {
    saveCart([]);
    removeCoupon();
    setPincodeState('845307');
    setPaymentMethodState('online');
  };

  const placeOrder = async () => {
    if (items.length === 0) return { success: false, message: 'Cart is empty' };
    if (!shippingAddress) return { success: false, message: 'Shipping address is required' };
    if (!pincode) return { success: false, message: 'Delivery pincode is required' };

    const payload = {
      items: items.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      })),
      deliveryAddress: shippingAddress,
      pincode,
      paymentMethod,
      couponCode: couponCode || undefined
    };

    try {
      const res = await api.post('/orders', payload);
      if (res.success) {
        clearCart();
        return {
          success: true,
          order: res.order,
          deliveryOtp: res.deliveryOtp
        };
      }
      return { success: false, message: res.message || 'Failed to place order' };
    } catch (e) {
      return { success: false, message: 'Server communication error' };
    }
  };

  const amounts = calculateTotals();

  return (
    <CartContext.Provider value={{
      items,
      couponCode,
      couponDiscount,
      pincode,
      paymentMethod,
      shippingAddress,
      amounts,
      addToCart,
      updateQuantity,
      removeFromCart,
      applyCoupon,
      removeCoupon,
      setPincode,
      setPaymentMethod,
      setShippingAddress,
      clearCart,
      isCartOpen,
      setCartOpen,
      placeOrder
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
