import mongoose, { Schema } from 'mongoose';
import { useJsonDb } from '../config/db';
import { JsonDb } from '../utils/jsonDb';
import { IUser, ICategory, IProduct, IOrder, ICoupon, ITransaction, IAuditLog, IBlockedIp } from './types';

// ==========================================
// 1. MONGOOSE SCHEMA DEFINITIONS
// ==========================================

const UserSchema = new Schema<IUser>({
  mobile: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['retailer', 'admin', 'staff'], default: 'retailer' },
  kycStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  kycDetails: {
    gstNumber: String,
    businessName: { type: String, required: true },
    ownerName: { type: String, required: true },
    businessAddress: { type: String, required: true },
    panNumber: String,
    documentUrl: String
  },
  walletBalance: { type: Number, default: 0 },
  promoWalletBalance: { type: Number, default: 0 },
  isBlocked: { type: Boolean, default: false },
  savedAddresses: [String],
  wishlist: [String]
}, { timestamps: true });

const CategorySchema = new Schema<ICategory>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: String,
  image: String
}, { timestamps: true });

const ProductSchema = new Schema<IProduct>({
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  brand: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  images: [String],
  mrp: { type: Number, required: true },
  wholesalePrice: { type: Number, required: true },
  retailerPrice: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  gstPercentage: { type: Number, required: true },
  moq: { type: Number, default: 1 },
  stock: { type: Number, default: 0 },
  weight: { type: Number, required: true },
  unit: { type: String, enum: ['Piece', 'Box', 'Carton'], default: 'Piece' },
  specifications: [{ key: String, value: String }],
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 1000 }
}, { timestamps: true });

const OrderSchema = new Schema<IOrder>({
  retailerId: { type: String, required: true },
  businessName: { type: String, required: true },
  items: [{
    productId: { type: String, required: true },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    gstPercentage: { type: Number, required: true },
    gstAmount: { type: Number, required: true },
    subtotal: { type: Number, required: true }
  }],
  deliveryAddress: { type: String, required: true },
  paymentMethod: { type: String, enum: ['online', 'cod'], required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  orderStatus: { type: String, enum: ['received', 'accepted', 'dispatched', 'delivered', 'cancelled', 'returned'], default: 'received' },
  amounts: {
    subtotal: Number,
    gstTotal: Number,
    shipping: Number,
    codCharge: Number,
    discount: Number,
    finalTotal: Number
  },
  couponCode: String,
  otpVerification: {
    code: String,
    isVerified: { type: Boolean, default: false }
  },
  transactionId: String,
  pincode: { type: String, required: true }
}, { timestamps: true });

const CouponSchema = new Schema<ICoupon>({
  code: { type: String, required: true, unique: true },
  discountType: { type: String, enum: ['percentage', 'flat'], required: true },
  discountValue: { type: Number, required: true },
  minOrderAmount: { type: Number, default: 0 },
  maxDiscountAmount: Number,
  isActive: { type: Boolean, default: true },
  expiresAt: { type: String, required: true },
  restrictedPaymentMethod: { type: String, enum: ['all', 'cod', 'online', 'wallet'], default: 'all' },
  restrictedCategory: String,
  restrictedProductId: String
}, { timestamps: true });

const TransactionSchema = new Schema<ITransaction>({
  orderId: { type: String, required: false },
  retailerId: { type: String, required: true },
  businessName: { type: String, required: false },
  amount: { type: Number, required: true },
  paymentGateway: { type: String, enum: ['razorpay', 'phonepe', 'cod', 'wallet', 'upi'], required: true },
  gatewayTransactionId: String,
  status: { type: String, enum: ['success', 'failed', 'pending'], default: 'pending' }
}, { timestamps: true });

const AuditLogSchema = new Schema<IAuditLog>({
  userId: { type: String, required: true },
  userEmail: { type: String, required: true },
  userRole: { type: String, required: true },
  action: { type: String, required: true },
  details: { type: String, required: true },
  ipAddress: String
}, { timestamps: { createdAt: true, updatedAt: false } });

const BlockedIpSchema = new Schema<IBlockedIp>({
  ipAddress: { type: String, required: true, unique: true },
  reason: String
}, { timestamps: true });

// Create models internally
const MongooseUser = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
const MongooseCategory = mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
const MongooseProduct = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
const MongooseOrder = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
const MongooseCoupon = mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema);
const MongooseTransaction = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
const MongooseAuditLog = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
const MongooseBlockedIp = mongoose.models.BlockedIp || mongoose.model<IBlockedIp>('BlockedIp', BlockedIpSchema);

// ==========================================
// 2. LOCAL JSON DATABASES
// ==========================================

const localUsers = new JsonDb<IUser>('users');
const localCategories = new JsonDb<ICategory>('categories');
const localProducts = new JsonDb<IProduct>('products');
const localOrders = new JsonDb<IOrder>('orders');
const localCoupons = new JsonDb<ICoupon>('coupons');
const localTransactions = new JsonDb<ITransaction>('transactions');
const localAuditLogs = new JsonDb<IAuditLog>('audit_logs');
const localBlockedIps = new JsonDb<IBlockedIp>('blocked_ips');

// Seed Categories & Products if they are empty
const seedLocalData = () => {
  if (localCategories.getAll().length === 0) {
    localCategories.insert({ name: 'Grocery', slug: 'grocery', description: 'Daily essential staples and grocery supplies' });
    localCategories.insert({ name: 'Cosmetic', slug: 'cosmetic', description: 'Bulk personal care, beauty, and cosmetic supplies' });
    localCategories.insert({ name: 'Electronics', slug: 'electronics', description: 'Wholesale smart devices, appliances, and accessories' });
  }

  if (localProducts.getAll().length === 0) {
    localProducts.insert({
      name: 'Premium Basmati Rice (10kg)',
      sku: 'RICE-BAS-001',
      brand: 'Fortune India',
      category: 'grocery',
      description: 'Long grain premium Basmati Rice ideal for Biryani and daily catering. Pure wholesale bags.',
      images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80'],
      mrp: 1200,
      wholesalePrice: 850,
      retailerPrice: 950,
      discount: 20,
      gstPercentage: 0,
      moq: 5,
      stock: 120,
      weight: 10,
      unit: 'Box',
      specifications: [{ key: 'Shelf Life', value: '12 Months' }, { key: 'Grain Length', value: '8.3mm' }]
    });

    localProducts.insert({
      name: 'Organic Kachi Ghani Mustard Oil (5L)',
      sku: 'OIL-MUST-002',
      brand: 'Fortune India',
      category: 'grocery',
      description: 'Pure cold-pressed mustard oil in bulk tins, ideal for grocery retail and bulk kitchens.',
      images: ['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80'],
      mrp: 950,
      wholesalePrice: 700,
      retailerPrice: 780,
      discount: 18,
      gstPercentage: 0,
      moq: 4,
      stock: 90,
      weight: 5,
      unit: 'Box',
      specifications: [{ key: 'Volume', value: '5 Liters' }, { key: 'Type', value: 'Cold Pressed' }]
    });

    localProducts.insert({
      name: 'Herbal Neem Face Wash (Pack of 12)',
      sku: 'FACE-NEEM-003',
      brand: 'Himalaya',
      category: 'cosmetic',
      description: 'Prevent pimples and clear skin blemishes. Purifying neem face wash bulk packs for retail shops.',
      images: ['https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=80'],
      mrp: 1800,
      wholesalePrice: 1200,
      retailerPrice: 1400,
      discount: 30,
      gstPercentage: 0,
      moq: 3,
      stock: 60,
      weight: 2,
      unit: 'Box',
      specifications: [{ key: 'Pack Size', value: '12 Tubes x 150ml' }, { key: 'Skin Type', value: 'All Skins' }]
    });

    localProducts.insert({
      name: 'Deep Nourishing Body Lotion (Pack of 10)',
      sku: 'LOTO-NIV-004',
      brand: 'Nivea',
      category: 'cosmetic',
      description: 'Deep moisture serum body lotion bulk packs. Fast-absorbing hydration for dry skin.',
      images: ['https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&w=400&q=80'],
      mrp: 2500,
      wholesalePrice: 1750,
      retailerPrice: 1950,
      discount: 25,
      gstPercentage: 0,
      moq: 2,
      stock: 50,
      weight: 3,
      unit: 'Box',
      specifications: [{ key: 'Pack Size', value: '10 Bottles x 400ml' }, { key: 'Formulation', value: 'Moisturizing Cream' }]
    });

    localProducts.insert({
      name: 'Wireless Bluetooth Earbuds (Pack of 5)',
      sku: 'ELEC-EAR-005',
      brand: 'Boat India',
      category: 'electronics',
      description: 'True wireless bluetooth earbuds with active noise cancellation. Wholesale pack for electronic shops.',
      images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=400&q=80'],
      mrp: 10000,
      wholesalePrice: 6500,
      retailerPrice: 7500,
      discount: 35,
      gstPercentage: 0,
      moq: 2,
      stock: 40,
      weight: 1,
      unit: 'Box',
      specifications: [{ key: 'Battery Life', value: '30 Hours' }, { key: 'Bluetooth', value: 'v5.2' }]
    });

    localProducts.insert({
      name: 'Fast Smart Charging Adaptor (Pack of 10)',
      sku: 'ELEC-ADP-006',
      brand: 'Mi India',
      category: 'electronics',
      description: '20W dual-port type-C fast charging wall adaptors. Pack of 10 bulk units.',
      images: ['https://images.unsplash.com/photo-1623998021450-85c24c626a5a?auto=format&fit=crop&w=400&q=80'],
      mrp: 8000,
      wholesalePrice: 4800,
      retailerPrice: 5500,
      discount: 40,
      gstPercentage: 0,
      moq: 3,
      stock: 75,
      weight: 1.5,
      unit: 'Box',
      specifications: [{ key: 'Power Output', value: '20W Fast Charge' }, { key: 'Ports', value: 'USB-A & Type-C' }]
    });
  }

  if (localCoupons.getAll().length === 0) {
    localCoupons.insert({
      code: 'WELCOMEB2B',
      discountType: 'flat',
      discountValue: 500,
      minOrderAmount: 5000,
      isActive: true,
      expiresAt: '2030-12-31T23:59:59.000Z'
    });
    localCoupons.insert({
      code: 'BULKDEAL10',
      discountType: 'percentage',
      discountValue: 10,
      minOrderAmount: 20000,
      isActive: true,
      expiresAt: '2030-12-31T23:59:59.000Z'
    });
  }
};

// ==========================================
// 3. UNIFIED ABSTRACT DATA ACCESS LAYER
// ==========================================

export const UserModel = {
  find: async (query: any = {}) => {
    if (useJsonDb) {
      return localUsers.find(item => {
        for (const key in query) {
          if (item[key as keyof IUser] !== query[key]) return false;
        }
        return true;
      });
    }
    return MongooseUser.find(query);
  },
  findOne: async (query: any) => {
    if (useJsonDb) {
      return localUsers.findOne(item => {
        for (const key in query) {
          if (item[key as keyof IUser] !== query[key]) return false;
        }
        return true;
      });
    }
    return MongooseUser.findOne(query);
  },
  findById: async (id: string) => {
    if (useJsonDb) {
      return localUsers.findOne(item => item.id === id);
    }
    return MongooseUser.findById(id);
  },
  create: async (data: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (useJsonDb) {
      return localUsers.insert(data);
    }
    return MongooseUser.create(data);
  },
  findByIdAndUpdate: async (id: string, updates: Partial<IUser>) => {
    if (useJsonDb) {
      return localUsers.update(id, updates);
    }
    return MongooseUser.findByIdAndUpdate(id, updates, { new: true });
  },
  findByIdAndDelete: async (id: string) => {
    if (useJsonDb) {
      return localUsers.delete(id);
    }
    const res = await MongooseUser.findByIdAndDelete(id);
    return !!res;
  }
};

export const CategoryModel = {
  find: async () => {
    if (useJsonDb) {
      seedLocalData();
      return localCategories.getAll();
    }
    return MongooseCategory.find({});
  },
  findOne: async (query: any) => {
    if (useJsonDb) {
      seedLocalData();
      return localCategories.findOne(item => {
        for (const key in query) {
          if (item[key as keyof ICategory] !== query[key]) return false;
        }
        return true;
      });
    }
    return MongooseCategory.findOne(query);
  },
  create: async (data: Omit<ICategory, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (useJsonDb) {
      return localCategories.insert(data);
    }
    return MongooseCategory.create(data);
  },
  findByIdAndDelete: async (id: string) => {
    if (useJsonDb) {
      return localCategories.delete(id);
    }
    await MongooseCategory.findByIdAndDelete(id);
    return true;
  }
};

export const ProductModel = {
  find: async (query: any = {}) => {
    if (useJsonDb) {
      seedLocalData();
      let products = localProducts.getAll();
      
      // Handle search/filters manually if needed
      if (query.category) {
        products = products.filter(p => p.category.toLowerCase() === query.category.toLowerCase());
      }
      if (query.brand) {
        products = products.filter(p => p.brand.toLowerCase() === query.brand.toLowerCase());
      }
      return products;
    }
    return MongooseProduct.find(query);
  },
  findOne: async (query: any) => {
    if (useJsonDb) {
      seedLocalData();
      return localProducts.findOne(item => {
        for (const key in query) {
          if (item[key as keyof IProduct] !== query[key]) return false;
        }
        return true;
      });
    }
    return MongooseProduct.findOne(query);
  },
  findById: async (id: string) => {
    if (useJsonDb) {
      seedLocalData();
      return localProducts.findOne(item => item.id === id);
    }
    return MongooseProduct.findById(id);
  },
  create: async (data: Omit<IProduct, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (useJsonDb) {
      return localProducts.insert(data);
    }
    return MongooseProduct.create(data);
  },
  findByIdAndUpdate: async (id: string, updates: Partial<IProduct>) => {
    if (useJsonDb) {
      return localProducts.update(id, updates);
    }
    return MongooseProduct.findByIdAndUpdate(id, updates, { new: true });
  },
  findByIdAndDelete: async (id: string) => {
    if (useJsonDb) {
      return localProducts.delete(id);
    }
    await MongooseProduct.findByIdAndDelete(id);
    return true;
  }
};

export const OrderModel = {
  find: async (query: any = {}) => {
    if (useJsonDb) {
      return localOrders.find(item => {
        for (const key in query) {
          if (item[key as keyof IOrder] !== query[key]) return false;
        }
        return true;
      });
    }
    return MongooseOrder.find(query);
  },
  findById: async (id: string) => {
    if (useJsonDb) {
      return localOrders.findOne(item => item.id === id);
    }
    return MongooseOrder.findById(id);
  },
  create: async (data: Omit<IOrder, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (useJsonDb) {
      return localOrders.insert(data);
    }
    return MongooseOrder.create(data);
  },
  findByIdAndUpdate: async (id: string, updates: Partial<IOrder>) => {
    if (useJsonDb) {
      return localOrders.update(id, updates);
    }
    return MongooseOrder.findByIdAndUpdate(id, updates, { new: true });
  }
};

export const CouponModel = {
  find: async (query: any = {}) => {
    if (useJsonDb) {
      seedLocalData();
      return localCoupons.find(item => {
        for (const key in query) {
          if (item[key as keyof ICoupon] !== query[key]) return false;
        }
        return true;
      });
    }
    return MongooseCoupon.find(query);
  },
  findOne: async (query: any) => {
    if (useJsonDb) {
      seedLocalData();
      return localCoupons.findOne(item => {
        for (const key in query) {
          if (item[key as keyof ICoupon] !== query[key]) return false;
        }
        return true;
      });
    }
    return MongooseCoupon.findOne(query);
  },
  create: async (data: Omit<ICoupon, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (useJsonDb) {
      return localCoupons.insert(data);
    }
    return MongooseCoupon.create(data);
  },
  findById: async (id: string) => {
    if (useJsonDb) {
      seedLocalData();
      return localCoupons.findOne(item => item.id === id);
    }
    return MongooseCoupon.findById(id);
  },
  findByIdAndUpdate: async (id: string, updates: Partial<ICoupon>) => {
    if (useJsonDb) {
      return localCoupons.update(id, updates);
    }
    return MongooseCoupon.findByIdAndUpdate(id, updates, { new: true });
  },
  findByIdAndDelete: async (id: string) => {
    if (useJsonDb) {
      return localCoupons.delete(id);
    }
    await MongooseCoupon.findByIdAndDelete(id);
    return true;
  }
};

export const TransactionModel = {
  find: async (query: any = {}) => {
    if (useJsonDb) {
      return localTransactions.find(item => {
        for (const key in query) {
          if (item[key as keyof ITransaction] !== query[key]) return false;
        }
        return true;
      });
    }
    return MongooseTransaction.find(query);
  },
  findById: async (id: string) => {
    if (useJsonDb) {
      return localTransactions.findOne(item => item.id === id);
    }
    return MongooseTransaction.findById(id);
  },
  create: async (data: Omit<ITransaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (useJsonDb) {
      return localTransactions.insert(data);
    }
    return MongooseTransaction.create(data);
  },
  findByIdAndUpdate: async (id: string, updates: Partial<ITransaction>) => {
    if (useJsonDb) {
      return localTransactions.update(id, updates);
    }
    return MongooseTransaction.findByIdAndUpdate(id, updates, { new: true });
  }
};

export const AuditLogModel = {
  find: async (query: any = {}) => {
    if (useJsonDb) {
      return localAuditLogs.find(item => {
        for (const key in query) {
          if (item[key as keyof IAuditLog] !== query[key]) return false;
        }
        return true;
      });
    }
    return MongooseAuditLog.find(query);
  },
  create: async (data: Omit<IAuditLog, 'id' | 'createdAt'>) => {
    if (useJsonDb) {
      return localAuditLogs.insert(data);
    }
    return MongooseAuditLog.create(data);
  }
};

export const BlockedIpModel = {
  find: async (query: any = {}) => {
    if (useJsonDb) {
      return localBlockedIps.find(item => {
        for (const key in query) {
          if (item[key as keyof IBlockedIp] !== query[key]) return false;
        }
        return true;
      });
    }
    return MongooseBlockedIp.find(query);
  },
  create: async (data: Omit<IBlockedIp, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (useJsonDb) {
      return localBlockedIps.insert(data);
    }
    return MongooseBlockedIp.create(data);
  },
  findByIdAndDelete: async (id: string) => {
    if (useJsonDb) {
      return localBlockedIps.delete(id);
    }
    const res = await MongooseBlockedIp.findByIdAndDelete(id);
    return !!res;
  },
  findOne: async (query: any) => {
    if (useJsonDb) {
      return localBlockedIps.findOne(item => {
        for (const key in query) {
          if (item[key as keyof IBlockedIp] !== query[key]) return false;
        }
        return true;
      });
    }
    return MongooseBlockedIp.findOne(query);
  }
};
