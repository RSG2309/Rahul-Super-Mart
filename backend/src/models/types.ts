export interface IUser {
  id: string;
  mobile: string;
  email: string;
  password?: string;
  role: 'retailer' | 'admin' | 'staff';
  kycStatus: 'pending' | 'verified' | 'rejected';
  kycDetails?: {
    gstNumber?: string;
    businessName: string;
    ownerName: string;
    businessAddress: string;
    panNumber?: string;
    documentUrl?: string;
  };
  walletBalance: number;
  promoWalletBalance?: number;
  isBlocked?: boolean;
  savedAddresses?: string[];
  wishlist?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ICategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IProduct {
  id: string;
  name: string;
  sku: string;
  brand: string;
  category: string; // category slug or name
  description: string;
  images: string[];
  mrp: number;
  wholesalePrice: number;
  retailerPrice: number;
  discount: number; // e.g. percentage or absolute
  gstPercentage: number;
  moq: number;
  stock: number;
  weight: number;
  unit: 'Piece' | 'Box' | 'Carton';
  specifications: Array<{ key: string; value: string }>;
  isActive?: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface IOrderItem {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  price: number; // price at the time of purchase
  gstPercentage: number;
  gstAmount: number;
  subtotal: number;
}

export interface IOrder {
  id: string;
  retailerId: string;
  businessName: string;
  items: IOrderItem[];
  deliveryAddress: string;
  paymentMethod: 'online' | 'cod';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderStatus: 'received' | 'accepted' | 'dispatched' | 'delivered' | 'cancelled' | 'returned';
  amounts: {
    subtotal: number;
    gstTotal: number;
    shipping: number;
    codCharge: number;
    discount: number;
    finalTotal: number;
    promoDeduction?: number;
  };
  couponCode?: string;
  otpVerification?: {
    code: string;
    isVerified: boolean;
  };
  transactionId?: string;
  pincode: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ICoupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  isActive: boolean;
  expiresAt: string;
  restrictedPaymentMethod?: 'all' | 'cod' | 'online' | 'wallet';
  restrictedCategory?: string;
  restrictedProductId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ITransaction {
  id: string;
  orderId?: string;
  retailerId: string;
  businessName?: string;
  amount: number;
  paymentGateway: 'razorpay' | 'phonepe' | 'cod' | 'wallet' | 'upi';
  gatewayTransactionId?: string;
  status: 'success' | 'failed' | 'pending';
  createdAt?: string;
  updatedAt?: string;
}

export interface IAuditLog {
  id: string;
  userId: string;
  userEmail: string;
  userRole: string;
  action: string;
  details: string;
  ipAddress?: string;
  createdAt?: string;
}

export interface IBlockedIp {
  id: string;
  ipAddress: string;
  reason?: string;
  createdAt?: string;
  updatedAt?: string;
}
