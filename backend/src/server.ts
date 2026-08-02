import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { connectDB } from './config/db';
import router from './routes';
import { UserModel } from './models';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false // Allow static files like invoices to be accessed
}));
app.use(cors({
  origin: '*', // Allow frontend development requests
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs for testing ease
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);

// API Routes
app.use('/api', router);

// Root Hello Page
app.get('/', (req, res) => {
  res.json({
    name: 'B2B Shop Sourcing Hub API',
    version: '1.0.0',
    status: 'operational',
    documentation: '/api/products, /api/auth/login, etc.'
  });
});

// Seed default accounts
const seedAccounts = async () => {
  try {
    // 1. Admin
    const adminExists = await UserModel.findOne({ email: 'admin@b2b.com' });
    if (!adminExists) {
      const hashedAdminPassword = await bcrypt.hash('adminpassword', 10);
      await UserModel.create({
        mobile: '9999999999',
        email: 'admin@b2b.com',
        password: hashedAdminPassword,
        role: 'admin',
        kycStatus: 'verified',
        kycDetails: {
          businessName: 'Rahul Super Mart Admin HQ',
          ownerName: 'System Administrator',
          businessAddress: 'Sector 4, HSR Layout, Bengaluru',
        },
        walletBalance: 0
      });
      console.log('✅ Default Admin account seeded (admin@b2b.com / adminpassword)');
    }

    // 2. Verified Retailer
    const retailerExists = await UserModel.findOne({ email: 'retailer@b2b.com' });
    if (!retailerExists) {
      const hashedRetailerPassword = await bcrypt.hash('retailerpassword', 10);
      await UserModel.create({
        mobile: '9888888888',
        email: 'retailer@b2b.com',
        password: hashedRetailerPassword,
        role: 'retailer',
        kycStatus: 'verified',
        kycDetails: {
          businessName: 'Vikas General Store',
          ownerName: 'Vikas Kumar',
          businessAddress: '5th Main, Koramangala, Bengaluru'
        },
        walletBalance: 50000 // loaded wallet to test checkout!
      });
      console.log('✅ Default Verified Retailer account seeded (retailer@b2b.com / retailerpassword)');
    }

    // 3. Pending Retailer
    const pendingExists = await UserModel.findOne({ email: 'pending@b2b.com' });
    if (!pendingExists) {
      const hashedPendingPassword = await bcrypt.hash('retailerpassword', 10);
      await UserModel.create({
        mobile: '9777777777',
        email: 'pending@b2b.com',
        password: hashedPendingPassword,
        role: 'retailer',
        kycStatus: 'pending',
        kycDetails: {
          businessName: 'Pooja Supermarket',
          ownerName: 'Pooja Sharma',
          businessAddress: 'Sector 1, HSR Layout, Bengaluru'
        },
        walletBalance: 0
      });
      console.log('✅ Default Pending Retailer account seeded (pending@b2b.com / retailerpassword)');
    }

    // 4. Demo Retailer
    const demoExists = await UserModel.findOne({ email: 'demo' });
    if (!demoExists) {
      const hashedDemoPassword = await bcrypt.hash('demo', 10);
      await UserModel.create({
        mobile: 'demo',
        email: 'demo',
        password: hashedDemoPassword,
        role: 'retailer',
        kycStatus: 'verified',
        kycDetails: {
          businessName: 'Demo Retailer Store',
          ownerName: 'Demo User',
          businessAddress: 'Sikta Bazar, West Champaran, Bihar'
        },
        walletBalance: 25000 // loaded wallet to test checkout!
      });
      console.log('✅ Demo Retailer account seeded (demo / demo)');
    }
  } catch (err: any) {
    console.error('Error seeding default accounts:', err.message);
  }
};

// Start Server
const startServer = async () => {
  await connectDB();
  await seedAccounts();
  
  app.listen(PORT, () => {
    console.log(`🚀 Server successfully launched on port ${PORT}`);
  });
};

startServer();
