"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../config/db");
const models_1 = require("../models");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'b2b_super_secret_jwt_key_99';
const runAuthTest = async () => {
    console.log('🧪 Starting Auth & KYC Programmatic Tests...');
    // 1. Initialise db
    await (0, db_1.connectDB)();
    const testEmail = `test_retailer_${Date.now()}@test.com`;
    const testMobile = `911${Math.floor(1000000 + Math.random() * 9000000)}`;
    try {
        // Test 1: Password hashing and creation
        console.log('\nRunning Test 1: User registration & password hashing...');
        const hashedPassword = await bcryptjs_1.default.hash('testpassword123', 10);
        const user = await models_1.UserModel.create({
            mobile: testMobile,
            email: testEmail,
            password: hashedPassword,
            role: 'retailer',
            kycStatus: 'pending',
            kycDetails: {
                businessName: 'Test Wholesale Store',
                ownerName: 'Alice Tester',
                businessAddress: 'Sector 5, Outer Ring Rd, Bengaluru',
                gstNumber: '29AAAAA0000A1Z1'
            },
            walletBalance: 2000
        });
        if (user && user.email === testEmail) {
            console.log('✅ User registered successfully.');
        }
        else {
            throw new Error('User creation failed or returned incorrect data.');
        }
        // Test 2: Authentication password comparison
        console.log('\nRunning Test 2: Credentials check...');
        const fetchedUser = await models_1.UserModel.findOne({ email: testEmail });
        if (!fetchedUser)
            throw new Error('Could not find created user in database.');
        const isMatch = await bcryptjs_1.default.compare('testpassword123', fetchedUser.password || '');
        if (isMatch) {
            console.log('✅ Password match verified.');
        }
        else {
            throw new Error('Password mismatch.');
        }
        // Test 3: JWT token generation and decryption
        console.log('\nRunning Test 3: JWT sign & verify...');
        const token = jsonwebtoken_1.default.sign({ id: fetchedUser.id, mobile: fetchedUser.mobile, email: fetchedUser.email, role: fetchedUser.role }, JWT_SECRET, { expiresIn: '1h' });
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (decoded && decoded.id === fetchedUser.id && decoded.role === 'retailer') {
            console.log('✅ JWT signature and payload values verified.');
        }
        else {
            throw new Error('JWT verification failed or payload mismatch.');
        }
        // Test 4: KYC State Change
        console.log('\nRunning Test 4: KYC Verification flow...');
        const approvedUser = await models_1.UserModel.findByIdAndUpdate(fetchedUser.id, { kycStatus: 'verified' });
        if (approvedUser && approvedUser.kycStatus === 'verified') {
            console.log('✅ KYC Status update verified.');
        }
        else {
            throw new Error('KYC Status update failed.');
        }
        console.log('\n🎉 ALL AUTHENTICATION TESTS COMPLETED SUCCESSFULLY!\n');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Test execution failed:', error.message);
        process.exit(1);
    }
};
runAuthTest();
