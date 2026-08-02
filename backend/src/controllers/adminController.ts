import { Response } from 'express';
import { ProductModel, OrderModel, UserModel, AuditLogModel, TransactionModel } from '../models';
import { AuthRequest } from '../middleware/auth';
import { NotificationService } from '../services/notification';

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const orders = await OrderModel.find({});
    const products = await ProductModel.find({});
    const users = await UserModel.find({});

    const today = new Date().toDateString();
    
    // 1. Calculations
    const todayOrders = orders.filter(o => new Date(o.createdAt || '').toDateString() === today);
    const todaySales = todayOrders.reduce((sum, o) => sum + o.amounts.finalTotal, 0);

    const pendingOrders = orders.filter(o => o.orderStatus === 'received').length;
    const revenue = orders.filter(o => o.paymentStatus === 'paid' || o.orderStatus === 'delivered')
                          .reduce((sum, o) => sum + o.amounts.finalTotal, 0);

    const lowStockAlerts = products.filter(p => p.stock <= p.moq).length;
    const newRetailers = users.filter(u => u.role === 'retailer').length;

    // 2. Charts
    // Group by Date for Daily Sales
    const salesGroup: { [date: string]: number } = {};
    orders.forEach(o => {
      const dateStr = new Date(o.createdAt || '').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      salesGroup[dateStr] = (salesGroup[dateStr] || 0) + o.amounts.finalTotal;
    });

    const dailySales = Object.keys(salesGroup).map(date => ({
      date,
      revenue: salesGroup[date]
    })).slice(-7); // last 7 points

    // Best Selling Products
    const prodCounts: { [name: string]: { quantity: number; revenue: number } } = {};
    orders.forEach(o => {
      o.items.forEach((item: any) => {
        if (!prodCounts[item.name]) {
          prodCounts[item.name] = { quantity: 0, revenue: 0 };
        }
        prodCounts[item.name].quantity += item.quantity;
        prodCounts[item.name].revenue += item.subtotal;
      });
    });

    const bestSellers = Object.keys(prodCounts).map(name => ({
      name: name.substring(0, 15) + '...',
      quantity: prodCounts[name].quantity,
      revenue: prodCounts[name].revenue
    })).sort((a, b) => b.quantity - a.quantity).slice(0, 5);

    return res.status(200).json({
      success: true,
      stats: {
        todayOrders: todayOrders.length,
        todaySales,
        pendingOrders,
        revenue,
        lowStockAlerts,
        newRetailers
      },
      charts: {
        dailySales,
        bestSellers
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getKycQueue = async (req: AuthRequest, res: Response) => {
  try {
    const retailers = await UserModel.find({ role: 'retailer', kycStatus: 'pending' });
    return res.status(200).json({ success: true, queue: retailers });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const approveKyc = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, status } = req.body; // status: 'verified' | 'rejected'

    if (!userId || !['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid KYC parameters provided' });
    }

    const retailer = await UserModel.findById(userId);
    if (!retailer) {
      return res.status(404).json({ success: false, message: 'Retailer not found' });
    }

    const updatedUser = await UserModel.findByIdAndUpdate(userId, { kycStatus: status });

    await AuditLogModel.create({
      userId: req.user?.id || 'admin',
      userEmail: req.user?.email || 'admin@b2b.com',
      userRole: req.user?.role || 'admin',
      action: `KYC_${status.toUpperCase()}`,
      details: `KYC ${status} for retailer business ${retailer.kycDetails?.businessName}`
    });

    // Send notifications to retailer
    if (status === 'verified') {
      await NotificationService.sendSMS(retailer.mobile, `Congratulations! Your business KYC verification has been APPROVED. You can now place bulk wholesale orders.`);
      await NotificationService.sendEmail(retailer.email, 'Business KYC Verified - B2B Wholesale Hub', `Hi ${retailer.kycDetails?.ownerName},\n\nWe are pleased to inform you that your business KYC document check was successful. Your account is now fully active.\n\nYou can access bulk offers, volume discount slabs, and COD options.\n\nHappy trading!\nB2B Partner Support Team`);
    } else {
      await NotificationService.sendSMS(retailer.mobile, `Alert: Your KYC verification has been REJECTED. Please re-upload clear business proof on the dashboard.`);
      await NotificationService.sendEmail(retailer.email, 'Business KYC Rejected - B2B Wholesale Hub', `Hi ${retailer.kycDetails?.ownerName},\n\nWe were unable to verify your business credentials with the provided documents. Please ensure your GST/PAN details match your business proof.\n\nKindly log in to re-submit clear documents.\n\nSincerely,\nKYC Verification Dept`);
    }

    return res.status(200).json({ success: true, message: `KYC marked as ${status} successfully.`, user: updatedUser });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const logs = await AuditLogModel.find({});
    // Sort reverse
    logs.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return res.status(200).json({ success: true, logs });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getNotificationLogs = async (req: AuthRequest, res: Response) => {
  try {
    const notificationsPath = '/tmp/notifications.log'; // check if exists
    let logs: string[] = [];
    if (fs.existsSync(notificationsPath)) {
      const data = fs.readFileSync(notificationsPath, 'utf8');
      logs = data.split('\n').filter((line: string) => line.trim() !== '');
    }
    return res.status(200).json({ success: true, logs });
  } catch (error: any) {
    // If not found or empty, just return from inline cache logs
    return res.status(200).json({ success: true, logs: ['[MOCK NOTIF] SMS Log - Ready'] });
  }
};

const fs = require('fs');

// ==========================================
// NEW: WALLET FUND REQUEST APPROVAL QUEUES
// ==========================================

export const getWalletRequests = async (req: AuthRequest, res: Response) => {
  try {
    const transactions = await TransactionModel.find({ paymentGateway: 'upi', status: 'pending' });
    // Sort by newest
    transactions.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return res.status(200).json({ success: true, requests: transactions });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const approveWalletRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const transaction = await TransactionModel.findById(id);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction request not found' });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Transaction has already been processed' });
    }

    // Set success
    await TransactionModel.findByIdAndUpdate(id, { status: 'success' });

    // Update user balance
    const user = await UserModel.findById(transaction.retailerId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Retailer not found' });
    }

    const newBalance = user.walletBalance + transaction.amount;
    await UserModel.findByIdAndUpdate(transaction.retailerId, { walletBalance: newBalance });

    await AuditLogModel.create({
      userId: req.user?.id || 'admin',
      userEmail: req.user?.email || 'admin@b2b.com',
      userRole: req.user?.role || 'admin',
      action: 'WALLET_FUND_APPROVE',
      details: `Approved ₹${transaction.amount.toLocaleString('en-IN')} wallet credit request for retailer ${transaction.businessName || user.email}`
    });

    await NotificationService.sendSMS(user.mobile, `Your wallet deposit of INR ${transaction.amount.toFixed(2)} has been APPROVED by admin. New wallet balance: INR ${newBalance.toFixed(2)}.`);

    return res.status(200).json({ success: true, message: 'Wallet deposit request approved successfully.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const rejectWalletRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const transaction = await TransactionModel.findById(id);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction request not found' });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Transaction has already been processed' });
    }

    // Set failed
    await TransactionModel.findByIdAndUpdate(id, { status: 'failed' });

    const user = await UserModel.findById(transaction.retailerId);
    if (user) {
      await NotificationService.sendSMS(user.mobile, `Your wallet deposit of INR ${transaction.amount.toFixed(2)} has been REJECTED. Please contact Rahul Super Mart support.`);
    }

    await AuditLogModel.create({
      userId: req.user?.id || 'admin',
      userEmail: req.user?.email || 'admin@b2b.com',
      userRole: req.user?.role || 'admin',
      action: 'WALLET_FUND_REJECT',
      details: `Rejected ₹${transaction.amount.toLocaleString('en-IN')} wallet credit request for retailer ${transaction.businessName || transaction.retailerId}`
    });

    return res.status(200).json({ success: true, message: 'Wallet deposit request rejected.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
