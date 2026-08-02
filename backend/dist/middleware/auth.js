"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireKYC = exports.requireRole = exports.authenticateJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const models_1 = require("../models");
const JWT_SECRET = process.env.JWT_SECRET || 'b2b_super_secret_jwt_key_99';
const authenticateJWT = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    let token = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }
    else if (req.query.token) {
        token = req.query.token;
    }
    if (!token) {
        return res.status(401).json({ success: false, message: 'Authorization token missing or malformed' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = await models_1.UserModel.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ success: false, message: 'User associated with token no longer exists' });
        }
        req.user = {
            id: user.id,
            mobile: user.mobile,
            email: user.email,
            role: user.role,
            kycStatus: user.kycStatus
        };
        return next();
    }
    catch (error) {
        return res.status(403).json({ success: false, message: 'Invalid or expired authorization token' });
    }
};
exports.authenticateJWT = authenticateJWT;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Access denied: insufficient permissions' });
        }
        return next();
    };
};
exports.requireRole = requireRole;
const requireKYC = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (req.user.role === 'admin' || req.user.role === 'staff') {
        return next();
    }
    if (req.user.kycStatus !== 'verified') {
        return res.status(403).json({
            success: false,
            message: 'KYC Verification Required. Please update your shop profile and wait for admin approval to place orders.'
        });
    }
    return next();
};
exports.requireKYC = requireKYC;
