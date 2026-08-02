import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel, AuditLogModel, TransactionModel } from '../models';
import { NotificationService } from '../services/notification';
import { cacheService } from '../services/redis';
import { AuthRequest } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'b2b_super_secret_jwt_key_99';

export const register = async (req: Request, res: Response) => {
  try {
    const { mobile, email, password, businessName, ownerName, businessAddress } = req.body;

    if (!mobile || !email || !password || !businessName || !ownerName || !businessAddress) {
      return res.status(400).json({ success: false, message: 'All mandatory contact and shop details are required' });
    }

    // Check if user already exists
    const existingEmail = await UserModel.findOne({ email });
    const existingMobile = await UserModel.findOne({ mobile });

    if (existingEmail || existingMobile) {
      return res.status(400).json({ success: false, message: 'Retailer with this email or mobile number already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user (KYC Pending)
    const user = await UserModel.create({
      mobile,
      email,
      password: hashedPassword,
      role: 'retailer',
      kycStatus: 'pending',
      kycDetails: {
        businessName,
        ownerName,
        businessAddress,
        documentUrl: 'https://via.placeholder.com/150'
      },
      walletBalance: 0,
      promoWalletBalance: 0,
      savedAddresses: [businessAddress],
      wishlist: []
    });

    await AuditLogModel.create({
      userId: user.id,
      userEmail: user.email,
      userRole: 'retailer',
      action: 'REGISTER',
      details: `Retailer registered with KYC pending for ${businessName}`
    });

    // Send Welcome Email & SMS
    await NotificationService.sendEmail(email, 'Welcome to Rahul Super Mart!', `Hi ${ownerName},\n\nThank you for registering your shop "${businessName}" with us. Your account KYC is pending verification.\n\nWarm regards,\nRahul Super Mart Team`);
    await NotificationService.sendSMS(mobile, `Welcome to Rahul Super Mart! Shop ${businessName} registered successfully. Sourcing will be active once admin verifies your profile.`);

    return res.status(201).json({
      success: true,
      message: 'Retailer registered successfully. KYC verification is pending.',
      user: {
        id: user.id,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        kycStatus: user.kycStatus,
        kycDetails: user.kycDetails,
        walletBalance: user.walletBalance,
        promoWalletBalance: user.promoWalletBalance || 0
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { emailOrMobile, password } = req.body;

    if (!emailOrMobile || !password) {
      return res.status(400).json({ success: false, message: 'Mobile/Email and password are required' });
    }

    // Find user by email or mobile
    let user = await UserModel.findOne({ email: emailOrMobile });
    if (!user) {
      user = await UserModel.findOne({ mobile: emailOrMobile });
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password || '');
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: 'Your account has been blocked by the admin.' });
    }

    // Generate Token
    const token = jwt.sign(
      { id: user.id, mobile: user.mobile, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    await AuditLogModel.create({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'LOGIN',
      details: 'Successful password authentication'
    });

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        kycStatus: user.kycStatus,
        kycDetails: user.kycDetails,
        walletBalance: user.walletBalance,
        promoWalletBalance: user.promoWalletBalance || 0
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const sendOTP = async (req: Request, res: Response) => {
  try {
    const { mobile } = req.body;
    if (!mobile) {
      return res.status(400).json({ success: false, message: 'Mobile number is required' });
    }

    const user = await UserModel.findOne({ mobile });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Mobile number not registered.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await cacheService.set(`otp:${mobile}`, otp, 300);
    await NotificationService.sendSMS(mobile, `Your OTP for login is ${otp}. Valid for 5 minutes.`);

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      devOtp: otp
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { mobile, otp } = req.body;
    if (!mobile || !otp) {
      return res.status(400).json({ success: false, message: 'Mobile and OTP are required' });
    }

    const cachedOtp = await cacheService.get(`otp:${mobile}`);
    if (!cachedOtp || cachedOtp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    await cacheService.del(`otp:${mobile}`);

    const user = await UserModel.findOne({ mobile });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const token = jwt.sign(
      { id: user.id, mobile: user.mobile, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        kycStatus: user.kycStatus,
        kycDetails: user.kycDetails,
        walletBalance: user.walletBalance
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const user = await UserModel.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'Retailer not found' });

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        kycStatus: user.kycStatus,
        kycDetails: user.kycDetails,
        walletBalance: user.walletBalance,
        promoWalletBalance: user.promoWalletBalance || 0,
        savedAddresses: user.savedAddresses,
        wishlist: user.wishlist
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const submitKYC = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { businessName, ownerName, businessAddress, gstNumber, panNumber } = req.body;

    if (!businessName || !ownerName || !businessAddress) {
      return res.status(400).json({ success: false, message: 'Business name, owner name, and address are mandatory' });
    }

    const updatedUser = await UserModel.findByIdAndUpdate(req.user.id, {
      kycStatus: 'pending',
      kycDetails: {
        businessName,
        ownerName,
        businessAddress,
        gstNumber: gstNumber || '',
        panNumber: panNumber || ''
      }
    }, { new: true });

    return res.status(200).json({
      success: true,
      message: 'Business profile updated successfully.',
      user: updatedUser
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// NEW: FORGOT & RESET PASSWORD CONTROLLERS
// ==========================================

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { mobile } = req.body;
    if (!mobile) return res.status(400).json({ success: false, message: 'Mobile number is required' });

    const user = await UserModel.findOne({ mobile });
    if (!user) return res.status(404).json({ success: false, message: 'No registered account found with this mobile number' });

    // Generate recovery code (6 digits)
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Cache for 10 minutes
    await cacheService.set(`reset:${mobile}`, resetCode, 600);

    // Simulated SMS logger
    await NotificationService.sendSMS(mobile, `Your password recovery reset code is: ${resetCode}. Valid for 10 minutes.`);

    return res.status(200).json({
      success: true,
      message: 'Password reset code has been sent via SMS.',
      devCode: resetCode
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { mobile, code, newPassword } = req.body;
    if (!mobile || !code || !newPassword) {
      return res.status(400).json({ success: false, message: 'All parameters (mobile, recovery code, new password) are required.' });
    }

    const cachedCode = await cacheService.get(`reset:${mobile}`);
    if (!cachedCode || cachedCode !== code) {
      return res.status(400).json({ success: false, message: 'Invalid or expired recovery code.' });
    }

    await cacheService.del(`reset:${mobile}`);

    const user = await UserModel.findOne({ mobile });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    // Hash and update
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await UserModel.findByIdAndUpdate(user.id, { password: hashedPassword });

    await AuditLogModel.create({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'PASSWORD_RESET',
      details: 'Successful password reset via mobile verification code'
    });

    await NotificationService.sendSMS(mobile, 'Security Alert: Your account password was successfully reset.');

    return res.status(200).json({ success: true, message: 'Your password was reset successfully. Please log in.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required.' });
    }

    const user = await UserModel.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    // Compare current password
    const isMatch = await bcrypt.compare(currentPassword, user.password || '');
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password.' });
    }

    // Hash and update
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    await AuditLogModel.create({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'PASSWORD_CHANGE',
      details: 'User successfully changed password via profile page settings'
    });

    if (user.mobile) {
      await NotificationService.sendSMS(user.mobile, 'Rahul Super Mart: Your account password has been changed successfully.');
    }

    return res.status(200).json({ success: true, message: 'Your password has been changed successfully.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// NEW: WALLET UPI CREDIT CONTROLLER
// ==========================================

export const addWalletFunds = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { amount, utr } = req.body;
    const fundAmount = Number(amount);
    
    if (isNaN(fundAmount) || fundAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Please enter a valid amount to load.' });
    }

    const userProfile = await UserModel.findById(req.user.id);
    if (!userProfile) return res.status(404).json({ success: false, message: 'User profile not found.' });

    // Instead of immediately crediting the balance, create a pending UPI Transaction Request
    const transaction = await TransactionModel.create({
      retailerId: userProfile.id,
      businessName: userProfile.kycDetails?.businessName || userProfile.email,
      amount: fundAmount,
      paymentGateway: 'upi',
      status: 'pending',
      gatewayTransactionId: utr ? `UTR_${utr.trim()}` : `REQ_${Date.now()}`
    });

    await AuditLogModel.create({
      userId: userProfile.id,
      userEmail: userProfile.email,
      userRole: userProfile.role,
      action: 'WALLET_FUND_REQUEST',
      details: `Created a pending request to load ₹${fundAmount.toLocaleString('en-IN')} to wallet via UPI QR.`
    });

    // Notify simulated SMS
    await NotificationService.sendSMS(userProfile.mobile, `Your request to deposit INR ${fundAmount.toFixed(2)} is pending admin approval.`);

    return res.status(200).json({
      success: true,
      message: `Request to load ₹${fundAmount.toLocaleString('en-IN')} submitted. Pending Admin approval.`,
      transaction
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
