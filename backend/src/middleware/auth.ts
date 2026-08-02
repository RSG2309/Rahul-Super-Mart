import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    mobile: string;
    email: string;
    role: 'retailer' | 'admin' | 'staff';
    kycStatus: 'pending' | 'verified' | 'rejected';
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'b2b_super_secret_jwt_key_99';

export const authenticateJWT = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token as string;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authorization token missing or malformed' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      mobile: string;
      email: string;
      role: 'retailer' | 'admin' | 'staff';
    };

    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User associated with token no longer exists' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: 'Your account has been blocked by the admin.' });
    }

    req.user = {
      id: user.id,
      mobile: user.mobile,
      email: user.email,
      role: user.role,
      kycStatus: user.kycStatus
    };

    return next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Invalid or expired authorization token' });
  }
};

export const requireRole = (roles: Array<'retailer' | 'admin' | 'staff'>) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied: insufficient permissions' });
    }

    return next();
  };
};

export const requireKYC = (req: AuthRequest, res: Response, next: NextFunction) => {
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
