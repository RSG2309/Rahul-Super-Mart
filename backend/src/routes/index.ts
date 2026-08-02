import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { register, login, sendOTP, verifyOTP, getProfile, submitKYC, forgotPassword, resetPassword, addWalletFunds, changePassword } from '../controllers/authController';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct, bulkUpload, bulkExport } from '../controllers/productController';
import { placeOrder, getOrders, getOrderById, updateOrderStatus, verifyDeliveryOTP, refundOrder } from '../controllers/orderController';
import { getDashboardStats, getKycQueue, approveKyc, getAuditLogs, getNotificationLogs, getWalletRequests, approveWalletRequest, rejectWalletRequest } from '../controllers/adminController';
import { authenticateJWT, requireRole, requireKYC } from '../middleware/auth';
import { CategoryModel, CouponModel, OrderModel, UserModel, AuditLogModel, TransactionModel } from '../models';

const router = Router();

// ==========================================
// 1. AUTHENTICATION & KYC ROUTES
// ==========================================
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/send-otp', sendOTP);
router.post('/auth/verify-otp', verifyOTP);
router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/reset-password', resetPassword);
router.post('/auth/wallet/add-funds', authenticateJWT, addWalletFunds);
router.get('/auth/profile', authenticateJWT, getProfile);
router.post('/auth/change-password', authenticateJWT, changePassword);
router.post('/auth/kyc/submit', authenticateJWT, submitKYC);
router.get('/transactions', authenticateJWT, async (req: any, res) => {
  try {
    const transactions = await TransactionModel.find({ retailerId: req.user.id });
    const sortedTransactions = transactions.sort((a: any, b: any) => {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
    return res.status(200).json({ success: true, transactions: sortedTransactions });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 2. PRODUCT CATALOG ROUTES
// ==========================================
router.get('/products', getProducts);
router.get('/products/bulk-export', bulkExport);
router.get('/products/:id', getProductById);
router.post('/products', authenticateJWT, requireRole(['admin', 'staff']), createProduct);
router.put('/products/:id', authenticateJWT, requireRole(['admin', 'staff']), updateProduct);
router.delete('/products/:id', authenticateJWT, requireRole(['admin', 'staff']), deleteProduct);
router.post('/products/bulk-upload', authenticateJWT, requireRole(['admin']), bulkUpload);

// ==========================================
// 3. CATEGORY ROUTES
// ==========================================
router.get('/categories', async (req, res) => {
  try {
    const categories = await CategoryModel.find();
    return res.status(200).json({ success: true, categories });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
router.post('/categories', authenticateJWT, requireRole(['admin']), async (req, res) => {
  try {
    const { name, slug, description, image } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ success: false, message: 'Name and slug are required' });
    }
    const cat = await CategoryModel.create({ name, slug, description, image });
    return res.status(201).json({ success: true, category: cat });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 4. ORDER ROUTES
// ==========================================
router.post('/orders', authenticateJWT, requireKYC, placeOrder);
router.get('/orders', authenticateJWT, getOrders);
router.get('/orders/:id', authenticateJWT, getOrderById);
router.get('/orders/:id/invoice', authenticateJWT, async (req: any, res) => {
  try {
    const order = await OrderModel.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Retailer security check
    if (req.user?.role === 'retailer' && order.retailerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Generate invoice PDF
    const { generateInvoicePDF } = require('../services/invoice');
    const invoicePath = await generateInvoicePDF(order);

    // Send PDF file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice_${order.id}.pdf`);
    return res.sendFile(invoicePath);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
router.put('/orders/:id/status', authenticateJWT, requireRole(['admin', 'staff']), updateOrderStatus);
router.post('/orders/:id/verify-otp', authenticateJWT, verifyDeliveryOTP);
router.post('/orders/:id/verify-delivery', authenticateJWT, verifyDeliveryOTP);
router.post('/orders/:id/refund', authenticateJWT, requireRole(['admin']), refundOrder);

// ==========================================
// 5. COUPON ROUTES
// ==========================================
router.get('/coupons', async (req, res) => {
  try {
    const coupons = await CouponModel.find({ isActive: true });
    return res.status(200).json({ success: true, coupons });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
router.post('/coupons', authenticateJWT, requireRole(['admin']), async (req, res) => {
  try {
    const { code, discountType, discountValue, minOrderAmount, maxDiscountAmount, expiresAt, restrictedPaymentMethod, restrictedCategory, restrictedProductId } = req.body;
    if (!code || !discountType || !discountValue || !expiresAt) {
      return res.status(400).json({ success: false, message: 'Missing discount settings' });
    }
    const coup = await CouponModel.create({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      minOrderAmount: minOrderAmount || 0,
      maxDiscountAmount,
      isActive: true,
      expiresAt,
      restrictedPaymentMethod: restrictedPaymentMethod || 'all',
      restrictedCategory: restrictedCategory || undefined,
      restrictedProductId: restrictedProductId || undefined
    });
    return res.status(201).json({ success: true, coupon: coup });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
router.post('/coupons/validate', authenticateJWT, async (req, res) => {
  try {
    const { code, subtotal, paymentMethod, items } = req.body;
    if (!code || !subtotal) {
      return res.status(400).json({ success: false, message: 'Coupon code and checkout subtotal are required' });
    }
    const coupon = await CouponModel.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid, disabled, or expired coupon code' });
    }

    if (subtotal < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `This coupon requires a minimum purchase value of INR ${coupon.minOrderAmount}`
      });
    }

    // Check expiry date
    if (new Date(coupon.expiresAt) < new Date()) {
      return res.status(400).json({ success: false, message: 'Coupon code has expired' });
    }

    // Check payment method restriction
    if (coupon.restrictedPaymentMethod && coupon.restrictedPaymentMethod !== 'all') {
      if (paymentMethod && paymentMethod !== coupon.restrictedPaymentMethod) {
        const readableMethods: any = {
          cod: 'Cash on Delivery (COD)',
          online: 'Online Payments / QR System',
          wallet: 'Wallet Balance Ledger'
        };
        return res.status(400).json({
          success: false,
          message: `This coupon is only valid for payment mode: ${readableMethods[coupon.restrictedPaymentMethod] || coupon.restrictedPaymentMethod}`
        });
      }
    }

    let targetCategoryExcludingTax = 0;
    let hasCategoryItems = false;

    // Check category restriction
    if (coupon.restrictedCategory) {
      if (!items || !Array.isArray(items)) {
        return res.status(400).json({
          success: false,
          message: `Cart items list is required to validate this category-restricted coupon.`
        });
      }

      for (const item of items) {
        const product = await ProductModel.findById(item.productId);
        if (product && product.category && (
          product.category.toLowerCase() === coupon.restrictedCategory.toLowerCase()
        )) {
          hasCategoryItems = true;
          // Calculate item price excluding tax
          const itemPrice = item.quantity >= 20 ? item.wholesalePrice : item.retailerPrice;
          const itemExcludingTax = (itemPrice * item.quantity) / (1 + (item.gstPercentage || 18) / 100);
          targetCategoryExcludingTax += itemExcludingTax;
        }
      }

      if (!hasCategoryItems) {
        return res.status(400).json({
          success: false,
          message: `This coupon is only valid for items in the "${coupon.restrictedCategory}" category.`
        });
      }
    }

    let targetProductExcludingTax = 0;
    let hasProductItems = false;

    // Check product restriction
    if (coupon.restrictedProductId) {
      if (!items || !Array.isArray(items)) {
        return res.status(400).json({
          success: false,
          message: `Cart items list is required to validate this product-restricted coupon.`
        });
      }

      for (const item of items) {
        if (item.productId === coupon.restrictedProductId) {
          hasProductItems = true;
          // Calculate item price excluding tax
          const itemPrice = item.quantity >= 20 ? item.wholesalePrice : item.retailerPrice;
          const itemExcludingTax = (itemPrice * item.quantity) / (1 + (item.gstPercentage || 18) / 100);
          targetProductExcludingTax += itemExcludingTax;
        }
      }

      if (!hasProductItems) {
        const product = await ProductModel.findById(coupon.restrictedProductId);
        const prodName = product ? product.name : 'restricted product';
        return res.status(400).json({
          success: false,
          message: `This coupon is only valid for product "${prodName}".`
        });
      }
    }

    // Calculate coupon discount amount
    let discountAmount = 0;
    let discountBase = subtotal;
    if (coupon.restrictedCategory) {
      discountBase = targetCategoryExcludingTax;
    } else if (coupon.restrictedProductId) {
      discountBase = targetProductExcludingTax;
    }
    
    if (coupon.discountType === 'flat') {
      discountAmount = Math.min(coupon.discountValue, discountBase);
    } else {
      discountAmount = discountBase * (coupon.discountValue / 100);
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Coupon applied successfully', 
      coupon,
      discountAmount 
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 5B. ADMIN COUPON MANAGEMENT ROUTES
// ==========================================
router.get('/admin/coupons', authenticateJWT, requireRole(['admin']), async (req, res) => {
  try {
    const coupons = await CouponModel.find();
    return res.status(200).json({ success: true, coupons });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/admin/coupons/:id/toggle', authenticateJWT, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await CouponModel.findById(id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    coupon.isActive = !coupon.isActive;
    await coupon.save();
    return res.status(200).json({ success: true, coupon });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/admin/coupons/:id', authenticateJWT, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await CouponModel.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    return res.status(200).json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});


// ==========================================
// 6. ADMIN DASHBOARD & SYSTEM MONITOR ROUTES
// ==========================================
router.get('/admin/stats', authenticateJWT, requireRole(['admin', 'staff']), getDashboardStats);
router.get('/admin/retailers', authenticateJWT, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const retailers = await UserModel.find({ role: 'retailer' });
    return res.status(200).json({ success: true, retailers });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
router.delete('/admin/retailers/:id', authenticateJWT, requireRole(['admin']), async (req: any, res) => {
  try {
    const { id } = req.params;
    if (id === req.user?.id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account.' });
    }
    const deleted = await UserModel.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Retailer not found.' });
    }
    return res.status(200).json({ success: true, message: 'Retailer deleted successfully.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/admin/retailers/:id/block', authenticateJWT, requireRole(['admin']), async (req: any, res) => {
  try {
    const { id } = req.params;
    const { isBlocked } = req.body;

    if (id === req.user?.id) {
      return res.status(400).json({ success: false, message: 'Cannot block your own account.' });
    }

    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Retailer not found.' });
    }

    const updatedUser = await UserModel.findByIdAndUpdate(id, { isBlocked: !!isBlocked });

    // Log this action
    await AuditLogModel.create({
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: isBlocked ? 'BLOCK_RETAILER' : 'UNBLOCK_RETAILER',
      details: `${isBlocked ? 'Blocked' : 'Unblocked'} retailer ID ${id} (Email: ${user.email}).`
    });

    return res.status(200).json({ 
      success: true, 
      message: `Retailer ${isBlocked ? 'blocked' : 'unblocked'} successfully.`, 
      user: updatedUser 
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/admin/retailers/:id/wallet', authenticateJWT, requireRole(['admin']), async (req: any, res) => {
  try {
    const { id } = req.params;
    const { balance, adjustment, promoBalance, promoAdjustment, reason } = req.body;

    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Retailer not found.' });
    }

    // 1. Normal Wallet Adjustment
    let newBalance = user.walletBalance;
    if (balance !== undefined) {
      newBalance = Number(balance);
    } else if (adjustment !== undefined) {
      newBalance += Number(adjustment);
    }

    if (newBalance < 0) {
      return res.status(400).json({ success: false, message: 'Wallet balance cannot be negative.' });
    }

    // 2. Promotional Wallet Adjustment
    let newPromoBalance = user.promoWalletBalance || 0;
    if (promoBalance !== undefined) {
      newPromoBalance = Number(promoBalance);
    } else if (promoAdjustment !== undefined) {
      newPromoBalance += Number(promoAdjustment);
    }

    if (newPromoBalance < 0) {
      return res.status(400).json({ success: false, message: 'Promotional wallet balance cannot be negative.' });
    }

    await UserModel.findByIdAndUpdate(id, { 
      walletBalance: newBalance,
      promoWalletBalance: newPromoBalance
    });

    // Record Normal Transaction Entry if adjusted
    const actualAdjustment = adjustment !== undefined ? Number(adjustment) : (balance !== undefined ? (Number(balance) - user.walletBalance) : 0);
    if (actualAdjustment !== 0) {
      await TransactionModel.create({
        retailerId: id,
        businessName: user.kycDetails?.businessName || user.email,
        amount: actualAdjustment,
        paymentGateway: 'wallet',
        gatewayTransactionId: `ADJUST_${Date.now()}`,
        status: 'success'
      });
    }

    // Record Promo Transaction Entry if adjusted
    const actualPromoAdjustment = promoAdjustment !== undefined ? Number(promoAdjustment) : (promoBalance !== undefined ? (Number(promoBalance) - (user.promoWalletBalance || 0)) : 0);
    if (actualPromoAdjustment !== 0) {
      await TransactionModel.create({
        retailerId: id,
        businessName: user.kycDetails?.businessName || user.email,
        amount: actualPromoAdjustment,
        paymentGateway: 'wallet',
        gatewayTransactionId: `ADJUST_PROMO_${Date.now()}`,
        status: 'success'
      });
    }

    await AuditLogModel.create({
      userId: req.user?.id || 'admin',
      userEmail: req.user?.email || 'admin@b2b.com',
      userRole: 'admin',
      action: 'ADMIN_WALLET_ADJUST',
      details: `Admin updated wallet to ₹${newBalance.toLocaleString('en-IN')} (adj: ₹${actualAdjustment}) and promo wallet to ₹${newPromoBalance.toLocaleString('en-IN')} (adj: ₹${actualPromoAdjustment}) for retailer ${user.kycDetails?.businessName || user.email}. Reason: ${reason || 'Admin adjustment'}`
    });

    return res.status(200).json({ 
      success: true, 
      message: 'Wallet balances adjusted successfully.', 
      newBalance, 
      newPromoBalance 
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
router.get('/admin/kyc-queue', authenticateJWT, requireRole(['admin', 'staff']), getKycQueue);
router.post('/admin/kyc-approve', authenticateJWT, requireRole(['admin']), approveKyc);
router.get('/admin/audit-logs', authenticateJWT, requireRole(['admin']), getAuditLogs);
router.get('/admin/notif-logs', authenticateJWT, requireRole(['admin']), getNotificationLogs);
router.get('/admin/wallet-requests', authenticateJWT, requireRole(['admin', 'staff']), getWalletRequests);
router.post('/admin/wallet-requests/:id/approve', authenticateJWT, requireRole(['admin']), approveWalletRequest);
router.post('/admin/wallet-requests/:id/reject', authenticateJWT, requireRole(['admin']), rejectWalletRequest);

// Serving generated PDFs statically
router.get('/invoices/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.resolve(path.join(__dirname, '../../.data/invoices', filename));
  console.log(`[INVOICE_DEBUG] Serving invoice: ${filename} from resolved path: ${filePath}. Exists: ${fs.existsSync(filePath)}`);
  
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/pdf');
    return res.sendFile(filePath);
  } else {
    return res.status(404).json({ success: false, message: `Invoice PDF file not found at path: ${filePath}` });
  }
});

// Serving uploaded product images statically
router.get('/uploads/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.resolve(path.join(__dirname, '../../.data/uploads', filename));
  if (fs.existsSync(filePath)) {
    const ext = path.extname(filename).toLowerCase();
    if (ext === '.jpg' || ext === '.jpeg') res.setHeader('Content-Type', 'image/jpeg');
    else if (ext === '.png') res.setHeader('Content-Type', 'image/png');
    else if (ext === '.webp') res.setHeader('Content-Type', 'image/webp');
    else res.setHeader('Content-Type', 'image/jpeg');
    return res.sendFile(filePath);
  } else {
    return res.status(404).json({ success: false, message: 'Image file not found' });
  }
});

// POST endpoint for admin to upload base64 images
router.post('/admin/upload', authenticateJWT, requireRole(['admin']), async (req, res) => {
  try {
    const { image, fileName } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, message: 'Image base64 data is required' });
    }
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    
    const ext = fileName ? path.extname(fileName) : '.png';
    const uniqueName = `product_${Date.now()}${ext || '.png'}`;
    const uploadDir = path.resolve(path.join(__dirname, '../../.data/uploads'));
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const filePath = path.join(uploadDir, uniqueName);
    fs.writeFileSync(filePath, buffer);
    
    return res.status(200).json({
      success: true,
      imageUrl: `http://localhost:5000/api/uploads/${uniqueName}`
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
