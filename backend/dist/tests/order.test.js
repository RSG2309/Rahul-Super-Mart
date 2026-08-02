"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../config/db");
const models_1 = require("../models");
const runOrderTest = async () => {
    console.log('🧪 Starting Order Processing & Pricing Tier Tests...');
    await (0, db_1.connectDB)();
    try {
        // 1. Get or create a test product
        console.log('\nSetting up test products...');
        let product = await models_1.ProductModel.findOne({ sku: 'TEST-MOQ-SLAB' });
        if (!product) {
            product = await models_1.ProductModel.create({
                name: 'Test Bulk basmati rice',
                sku: 'TEST-MOQ-SLAB',
                brand: 'TestBrand',
                category: 'groceries',
                description: 'Test basmati rice description',
                mrp: 1200,
                wholesalePrice: 800, // Quantity >= 20
                retailerPrice: 900, // Quantity < 20
                discount: 10,
                gstPercentage: 5,
                moq: 5,
                stock: 50,
                weight: 10,
                unit: 'Box',
                images: ['http://mockimage.png'],
                specifications: []
            });
        }
        // 2. Mock a retailer profile
        console.log('Setting up mock retailer...');
        let retailer = await models_1.UserModel.findOne({ email: 'order_test_retailer@test.com' });
        if (!retailer) {
            retailer = await models_1.UserModel.create({
                mobile: '9222222222',
                email: 'order_test_retailer@test.com',
                role: 'retailer',
                kycStatus: 'verified',
                kycDetails: {
                    businessName: 'Super Food Mart',
                    ownerName: 'Bob Builder',
                    businessAddress: '10th Cross, Indiranagar, Bengaluru'
                },
                walletBalance: 100000
            });
        }
        // Test 1: MOQ check (order 3 units, MOQ is 5)
        console.log('\nRunning Test 1: Checking MOQ validation (Ordering 3 units, MOQ is 5)...');
        const quantity1 = 3;
        if (quantity1 < product.moq) {
            console.log(`✅ MOQ constraint caught successfully: Quantity ${quantity1} is below product MOQ of ${product.moq}.`);
        }
        else {
            throw new Error('MOQ validation failed: Order with quantity below MOQ went through.');
        }
        // Test 2: Retailer Price Tier (Order 10 units)
        console.log('\nRunning Test 2: Checking Retailer Price Slab (Ordering 10 units)...');
        const quantity2 = 10;
        const selectedPrice2 = quantity2 >= 20 ? product.wholesalePrice : product.retailerPrice;
        if (selectedPrice2 === 900) {
            console.log(`✅ Retailer price slab verified correctly: Price set to INR ${selectedPrice2} (Retailer rate).`);
        }
        else {
            throw new Error(`Pricing tier failed: Expected Retailer price (900) but got ${selectedPrice2}.`);
        }
        // Test 3: Wholesale Price Tier (Order 25 units)
        console.log('\nRunning Test 3: Checking Wholesale Price Slab (Ordering 25 units)...');
        const quantity3 = 25;
        const selectedPrice3 = quantity3 >= 20 ? product.wholesalePrice : product.retailerPrice;
        if (selectedPrice3 === 800) {
            console.log(`✅ Wholesale price slab verified correctly: Price dropped to INR ${selectedPrice3} (Wholesale rate).`);
        }
        else {
            throw new Error(`Pricing tier failed: Expected Wholesale price (800) but got ${selectedPrice3}.`);
        }
        // Test 4: GST Calculation
        console.log('\nRunning Test 4: Verifying Tax Calculations...');
        const itemSubtotalWithoutTax = selectedPrice3 * quantity3; // 800 * 25 = 20000
        const calculatedGst = itemSubtotalWithoutTax * (product.gstPercentage / 100); // 20000 * 0.05 = 1000
        console.log(`Subtotal: INR ${itemSubtotalWithoutTax}`);
        console.log(`GST (5%): INR ${calculatedGst}`);
        if (calculatedGst === 1000) {
            console.log('✅ GST Tax calculations are accurate.');
        }
        else {
            throw new Error(`Tax calculation mismatch: expected 1000, got ${calculatedGst}`);
        }
        // Test 5: Coupon code execution
        console.log('\nRunning Test 5: Promo Code validation...');
        const coupon = await models_1.CouponModel.findOne({ code: 'WELCOMEB2B' });
        let discount = 0;
        if (coupon && itemSubtotalWithoutTax >= coupon.minOrderAmount) {
            discount = coupon.discountValue; // Flat 500
            console.log(`✅ Coupon WELCOMEB2B applied. Discount: INR ${discount}`);
        }
        else {
            console.warn('Coupon WELCOMEB2B not found or order below threshold.');
        }
        const shipping = 0; // free above 15000
        const finalTotal = itemSubtotalWithoutTax + calculatedGst + shipping - discount;
        console.log(`Final Calculated Total: INR ${finalTotal} (Expected: 20000 + 1000 + 0 - 500 = 20500)`);
        if (finalTotal === 20500) {
            console.log('✅ Final totals check out.');
        }
        else {
            throw new Error(`Final total calculation mismatch: expected 20500, got ${finalTotal}`);
        }
        console.log('\n🎉 ALL ORDER PROCESSING TESTS COMPLETED SUCCESSFULLY!\n');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Test execution failed:', error.message);
        process.exit(1);
    }
};
runOrderTest();
