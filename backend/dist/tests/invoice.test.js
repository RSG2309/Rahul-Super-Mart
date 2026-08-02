"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const invoice_1 = require("../services/invoice");
const fs_1 = __importDefault(require("fs"));
const runInvoiceTest = async () => {
    console.log('🧪 Starting Tax Invoice PDF Generation Test...');
    const mockOrder = {
        id: `ord_${Math.random().toString(36).substring(2, 10)}`,
        retailerId: 'ret_test_123',
        businessName: 'Radhe Grocery Wholesale Corp',
        deliveryAddress: '23, Commercial Street, Shivaji Nagar, Bengaluru, Karnataka',
        pincode: '560001',
        paymentMethod: 'online',
        paymentStatus: 'paid',
        orderStatus: 'dispatched',
        couponCode: 'WELCOMEB2B',
        amounts: {
            subtotal: 10500,
            gstTotal: 720,
            shipping: 0,
            codCharge: 0,
            discount: 500,
            finalTotal: 10720
        },
        items: [
            {
                productId: 'prod_basmati_123',
                name: 'Fortune Premium Basmati Rice (10kg Bag)',
                sku: 'RICE-BAS-001',
                quantity: 10,
                price: 900,
                gstPercentage: 5,
                gstAmount: 450,
                subtotal: 9450
            },
            {
                productId: 'prod_oil_456',
                name: 'Refined Mustard Oil (1L Bottle)',
                sku: 'OIL-MUST-101',
                quantity: 15,
                price: 100,
                gstPercentage: 18,
                gstAmount: 270,
                subtotal: 1770
            }
        ]
    };
    try {
        console.log(`Generating tax invoice PDF for Order ID: ${mockOrder.id}...`);
        const invoicePath = await (0, invoice_1.generateInvoicePDF)(mockOrder);
        console.log(`Checking if file was created at: ${invoicePath}`);
        if (fs_1.default.existsSync(invoicePath)) {
            const stats = fs_1.default.statSync(invoicePath);
            console.log(`✅ Success! Invoice PDF generated successfully.`);
            console.log(`File size: ${(stats.size / 1024).toFixed(2)} KB`);
            process.exit(0);
        }
        else {
            throw new Error('PDF file was not created on the filesystem.');
        }
    }
    catch (error) {
        console.error('❌ Invoice PDF test failed:', error.message);
        process.exit(1);
    }
};
runInvoiceTest();
