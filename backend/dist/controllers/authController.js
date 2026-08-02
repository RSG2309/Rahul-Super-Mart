"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addWalletFunds = exports.resetPassword = exports.forgotPassword = exports.submitKYC = exports.getProfile = exports.verifyOTP = exports.sendOTP = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const models_1 = require("../models");
const notification_1 = require("../services/notification");
const redis_1 = require("../services/redis");
const JWT_SECRET = process.env.JWT_SECRET || 'b2b_super_secret_jwt_key_99';
const register = async (req, res) => {
    try {
        const { mobile, email, password, businessName, ownerName, businessAddress } = req.body;
        if (!mobile || !email || !password || !businessName || !ownerName || !businessAddress) {
            return res.status(400).json({ success: false, message: 'All mandatory contact and shop details are required' });
        }
        // Check if user already exists
        const existingEmail = await models_1.UserModel.findOne({ email });
        const existingMobile = await models_1.UserModel.findOne({ mobile });
        if (existingEmail || existingMobile) {
            return res.status(400).json({ success: false, message: 'Retailer with this email or mobile number already exists' });
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // Create user (KYC Pending)
        const user = await models_1.UserModel.create({
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
        await models_1.AuditLogModel.create({
            userId: user.id,
            userEmail: user.email,
            userRole: 'retailer',
            action: 'REGISTER',
            details: `Retailer registered with KYC pending for ${businessName}`
        });
        // Send Welcome Email & SMS
        await notification_1.NotificationService.sendEmail(email, 'Welcome to Vishal Store!', `Hi ${ownerName},\n\nThank you for registering your shop "${businessName}" with us. Your account KYC is pending verification.\n\nWarm regards,\nVishal Store Team`);
        await notification_1.NotificationService.sendSMS(mobile, `Welcome to Vishal Store! Shop ${businessName} registered successfully. Sourcing will be active once admin verifies your profile.`);
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
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { emailOrMobile, password } = req.body;
        if (!emailOrMobile || !password) {
            return res.status(400).json({ success: false, message: 'Mobile/Email and password are required' });
        }
        // Find user by email or mobile
        let user = await models_1.UserModel.findOne({ email: emailOrMobile });
        if (!user) {
            user = await models_1.UserModel.findOne({ mobile: emailOrMobile });
        }
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        // Verify password
        const isMatch = await bcryptjs_1.default.compare(password, user.password || '');
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        // Generate Token
        const token = jsonwebtoken_1.default.sign({ id: user.id, mobile: user.mobile, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        await models_1.AuditLogModel.create({
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
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.login = login;
const sendOTP = async (req, res) => {
    try {
        const { mobile } = req.body;
        if (!mobile) {
            return res.status(400).json({ success: false, message: 'Mobile number is required' });
        }
        const user = await models_1.UserModel.findOne({ mobile });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Mobile number not registered.' });
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await redis_1.cacheService.set(`otp:${mobile}`, otp, 300);
        await notification_1.NotificationService.sendSMS(mobile, `Your OTP for login is ${otp}. Valid for 5 minutes.`);
        return res.status(200).json({
            success: true,
            message: 'OTP sent successfully',
            devOtp: otp
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.sendOTP = sendOTP;
const verifyOTP = async (req, res) => {
    try {
        const { mobile, otp } = req.body;
        if (!mobile || !otp) {
            return res.status(400).json({ success: false, message: 'Mobile and OTP are required' });
        }
        const cachedOtp = await redis_1.cacheService.get(`otp:${mobile}`);
        if (!cachedOtp || cachedOtp !== otp) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }
        await redis_1.cacheService.del(`otp:${mobile}`);
        const user = await models_1.UserModel.findOne({ mobile });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Profile not found' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, mobile: user.mobile, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
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
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.verifyOTP = verifyOTP;
const getProfile = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const user = await models_1.UserModel.findById(req.user.id);
        if (!user)
            return res.status(404).json({ success: false, message: 'Retailer not found' });
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
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getProfile = getProfile;
const submitKYC = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const { businessName, ownerName, businessAddress, documentUrl } = req.body;
        if (!businessName || !ownerName || !businessAddress) {
            return res.status(400).json({ success: false, message: 'Business name, owner name, and address are mandatory' });
        }
        const updatedUser = await models_1.UserModel.findByIdAndUpdate(req.user.id, {
            kycStatus: 'pending',
            kycDetails: {
                businessName,
                ownerName,
                businessAddress,
                documentUrl: documentUrl || 'https://via.placeholder.com/150'
            }
        });
        return res.status(200).json({
            success: true,
            message: 'Business profile updated successfully.',
            user: updatedUser
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.submitKYC = submitKYC;
// ==========================================
// NEW: FORGOT & RESET PASSWORD CONTROLLERS
// ==========================================
const forgotPassword = async (req, res) => {
    try {
        const { mobile } = req.body;
        if (!mobile)
            return res.status(400).json({ success: false, message: 'Mobile number is required' });
        const user = await models_1.UserModel.findOne({ mobile });
        if (!user)
            return res.status(404).json({ success: false, message: 'No registered account found with this mobile number' });
        // Generate recovery code (6 digits)
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        // Cache for 10 minutes
        await redis_1.cacheService.set(`reset:${mobile}`, resetCode, 600);
        // Simulated SMS logger
        await notification_1.NotificationService.sendSMS(mobile, `Your password recovery reset code is: ${resetCode}. Valid for 10 minutes.`);
        return res.status(200).json({
            success: true,
            message: 'Password reset code has been sent via SMS.',
            devCode: resetCode
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res) => {
    try {
        const { mobile, code, newPassword } = req.body;
        if (!mobile || !code || !newPassword) {
            return res.status(400).json({ success: false, message: 'All parameters (mobile, recovery code, new password) are required.' });
        }
        const cachedCode = await redis_1.cacheService.get(`reset:${mobile}`);
        if (!cachedCode || cachedCode !== code) {
            return res.status(400).json({ success: false, message: 'Invalid or expired recovery code.' });
        }
        await redis_1.cacheService.del(`reset:${mobile}`);
        const user = await models_1.UserModel.findOne({ mobile });
        if (!user)
            return res.status(404).json({ success: false, message: 'User not found.' });
        // Hash and update
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        await models_1.UserModel.findByIdAndUpdate(user.id, { password: hashedPassword });
        await models_1.AuditLogModel.create({
            userId: user.id,
            userEmail: user.email,
            userRole: user.role,
            action: 'PASSWORD_RESET',
            details: 'Successful password reset via mobile verification code'
        });
        await notification_1.NotificationService.sendSMS(mobile, 'Security Alert: Your account password was successfully reset.');
        return res.status(200).json({ success: true, message: 'Your password was reset successfully. Please log in.' });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.resetPassword = resetPassword;
// ==========================================
// NEW: WALLET UPI CREDIT CONTROLLER
// ==========================================
const addWalletFunds = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const { amount, utr } = req.body;
        const fundAmount = Number(amount);
        if (isNaN(fundAmount) || fundAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Please enter a valid amount to load.' });
        }
        const userProfile = await models_1.UserModel.findById(req.user.id);
        if (!userProfile)
            return res.status(404).json({ success: false, message: 'User profile not found.' });
        // Instead of immediately crediting the balance, create a pending UPI Transaction Request
        const transaction = await models_1.TransactionModel.create({
            retailerId: userProfile.id,
            businessName: userProfile.kycDetails?.businessName || userProfile.email,
            amount: fundAmount,
            paymentGateway: 'upi',
            status: 'pending',
            gatewayTransactionId: utr ? `UTR_${utr.trim()}` : `REQ_${Date.now()}`
        });
        await models_1.AuditLogModel.create({
            userId: userProfile.id,
            userEmail: userProfile.email,
            userRole: userProfile.role,
            action: 'WALLET_FUND_REQUEST',
            details: `Created a pending request to load ₹${fundAmount.toLocaleString('en-IN')} to wallet via UPI QR.`
        });
        // Notify simulated SMS
        await notification_1.NotificationService.sendSMS(userProfile.mobile, `Your request to deposit INR ${fundAmount.toFixed(2)} is pending admin approval.`);
        return res.status(200).json({
            success: true,
            message: `Request to load ₹${fundAmount.toLocaleString('en-IN')} submitted. Pending Admin approval.`,
            transaction
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.addWalletFunds = addWalletFunds;
