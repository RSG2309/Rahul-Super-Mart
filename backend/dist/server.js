"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("./config/db");
const routes_1 = __importDefault(require("./routes"));
const models_1 = require("./models");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Security Middlewares
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: false // Allow static files like invoices to be accessed
}));
app.use((0, cors_1.default)({
    origin: '*', // Allow frontend development requests
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json({ limit: '10mb' }));
// Rate Limiter
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs for testing ease
    message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);
// API Routes
app.use('/api', routes_1.default);
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
        const adminExists = await models_1.UserModel.findOne({ email: 'admin@b2b.com' });
        if (!adminExists) {
            const hashedAdminPassword = await bcryptjs_1.default.hash('adminpassword', 10);
            await models_1.UserModel.create({
                mobile: '9999999999',
                email: 'admin@b2b.com',
                password: hashedAdminPassword,
                role: 'admin',
                kycStatus: 'verified',
                kycDetails: {
                    businessName: 'Vishal Store Admin HQ',
                    ownerName: 'System Administrator',
                    businessAddress: 'Sector 4, HSR Layout, Bengaluru',
                },
                walletBalance: 0
            });
            console.log('✅ Default Admin account seeded (admin@b2b.com / adminpassword)');
        }
        // 2. Verified Retailer
        const retailerExists = await models_1.UserModel.findOne({ email: 'retailer@b2b.com' });
        if (!retailerExists) {
            const hashedRetailerPassword = await bcryptjs_1.default.hash('retailerpassword', 10);
            await models_1.UserModel.create({
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
        const pendingExists = await models_1.UserModel.findOne({ email: 'pending@b2b.com' });
        if (!pendingExists) {
            const hashedPendingPassword = await bcryptjs_1.default.hash('retailerpassword', 10);
            await models_1.UserModel.create({
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
    }
    catch (err) {
        console.error('Error seeding default accounts:', err.message);
    }
};
// Start Server
const startServer = async () => {
    await (0, db_1.connectDB)();
    await seedAccounts();
    app.listen(PORT, () => {
        console.log(`🚀 Server successfully launched on port ${PORT}`);
    });
};
startServer();
