"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refundOrder = exports.verifyDeliveryOTP = exports.updateOrderStatus = exports.getOrderById = exports.getOrders = exports.placeOrder = void 0;
const models_1 = require("../models");
const notification_1 = require("../services/notification");
// Configurable Pincodes serviceable for Cash on Delivery (COD)
const COD_SERVICEABLE_PINCODES = ['560001', '560002', '560003', '560034', '560102', '560103', '110001', '110002', '400001', '400002'];
const COD_CHARGE = 150; // Flat COD fee
const COD_LIMIT = 50000; // Maximum amount allowed for COD
const placeOrder = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const { items, deliveryAddress, paymentMethod, couponCode, pincode } = req.body;
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Your shopping cart is empty' });
        }
        if (!deliveryAddress || !pincode) {
            return res.status(400).json({ success: false, message: 'Delivery address and pincode are required' });
        }
        // Find retailer profile
        const retailer = await models_1.UserModel.findById(req.user.id);
        if (!retailer) {
            return res.status(404).json({ success: false, message: 'Retailer profile not found' });
        }
        // Pincode check for COD is disabled (serves all pincodes)
        let subtotal = 0;
        let gstTotal = 0;
        const orderItems = [];
        // Process items and check stock, MOQ, and tier pricing
        for (const item of items) {
            const product = await models_1.ProductModel.findById(item.productId);
            if (!product) {
                return res.status(404).json({ success: false, message: `Product ${item.name || item.productId} not found` });
            }
            // MOQ Validation
            if (item.quantity < product.moq) {
                return res.status(400).json({
                    success: false,
                    message: `Product "${product.name}" has a Minimum Order Quantity (MOQ) of ${product.moq} units. You ordered ${item.quantity}.`
                });
            }
            // Stock check
            if (product.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for "${product.name}". Available stock: ${product.stock} units.`
                });
            }
            // Tier pricing (Wholesale price for bulk order quantity >= 20 units, else retailer price)
            const selectedPrice = item.quantity >= 20 ? product.wholesalePrice : product.retailerPrice;
            const itemGstAmount = 0;
            const itemSubtotal = selectedPrice * item.quantity;
            orderItems.push({
                productId: product.id,
                name: product.name,
                sku: product.sku,
                quantity: item.quantity,
                price: selectedPrice,
                gstPercentage: 0,
                gstAmount: 0,
                subtotal: itemSubtotal
            });
            subtotal += selectedPrice * item.quantity;
            gstTotal += itemGstAmount;
            // Deduct stock
            await models_1.ProductModel.findByIdAndUpdate(product.id, {
                stock: product.stock - item.quantity
            });
        }
        // Coupon verification
        let discount = 0;
        if (couponCode) {
            const coupon = await models_1.CouponModel.findOne({ code: couponCode.toUpperCase(), isActive: true });
            if (coupon) {
                if (coupon.restrictedPaymentMethod && coupon.restrictedPaymentMethod !== 'all' && coupon.restrictedPaymentMethod !== paymentMethod) {
                    const readableMethods = {
                        cod: 'Cash on Delivery (COD)',
                        online: 'Online Payments / QR System',
                        wallet: 'Wallet Balance Ledger'
                    };
                    return res.status(400).json({
                        success: false,
                        message: `Coupon ${coupon.code} is only valid for payment mode: ${readableMethods[coupon.restrictedPaymentMethod] || coupon.restrictedPaymentMethod}`
                    });
                }
                const orderExcludingTax = subtotal;
                if (orderExcludingTax >= coupon.minOrderAmount) {
                    if (coupon.discountType === 'flat') {
                        discount = coupon.discountValue;
                    }
                    else {
                        discount = orderExcludingTax * (coupon.discountValue / 100);
                        if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
                            discount = coupon.maxDiscountAmount;
                        }
                    }
                }
            }
        }
        const codCharge = 0;
        const shipping = 0;
        const finalTotal = subtotal + gstTotal + shipping + codCharge - discount;
        // Calculate Promo Wallet Deduction (Max 5% of finalTotal, not exceeding promoWalletBalance)
        const maxPromoDeduction = finalTotal * 0.05;
        const promoDeduction = Math.min(retailer.promoWalletBalance || 0, maxPromoDeduction);
        const netAmountToPay = finalTotal - promoDeduction;
        if (paymentMethod === 'wallet') {
            if (retailer.walletBalance < netAmountToPay) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient Wallet Balance. You need INR ${netAmountToPay.toLocaleString('en-IN')} but only have INR ${retailer.walletBalance.toLocaleString('en-IN')}. Please load funds first.`
                });
            }
            // Deduct balance from normal and promotional wallets
            await models_1.UserModel.findByIdAndUpdate(retailer.id, {
                walletBalance: retailer.walletBalance - netAmountToPay,
                promoWalletBalance: (retailer.promoWalletBalance || 0) - promoDeduction
            });
            await models_1.AuditLogModel.create({
                userId: retailer.id,
                userEmail: retailer.email,
                userRole: 'retailer',
                action: 'WALLET_PAYMENT',
                details: `Paid ₹${netAmountToPay.toLocaleString('en-IN')} via B2B Wallet and ₹${promoDeduction.toLocaleString('en-IN')} via Promo Wallet for Order.`
            });
        }
        else {
            // Deduct from promotional wallet if used
            if (promoDeduction > 0) {
                await models_1.UserModel.findByIdAndUpdate(retailer.id, {
                    promoWalletBalance: (retailer.promoWalletBalance || 0) - promoDeduction
                });
                await models_1.AuditLogModel.create({
                    userId: retailer.id,
                    userEmail: retailer.email,
                    userRole: 'retailer',
                    action: 'PROMO_WALLET_PAYMENT',
                    details: `Used ₹${promoDeduction.toLocaleString('en-IN')} Promo Wallet deduction for Order.`
                });
            }
        }
        if (paymentMethod === 'cod' && netAmountToPay > COD_LIMIT) {
            return res.status(400).json({
                success: false,
                message: `Cash on Delivery is limited to orders below INR ${COD_LIMIT}. Your order total is INR ${netAmountToPay}. Please use Online Payment.`
            });
        }
        // Generate simulated verification OTP for COD delivery authentication
        const deliveryOtp = Math.floor(100000 + Math.random() * 900000).toString();
        // Create Order
        const order = await models_1.OrderModel.create({
            retailerId: retailer.id,
            businessName: retailer.kycDetails?.businessName || 'B2B Retailer',
            items: orderItems,
            deliveryAddress,
            paymentMethod,
            paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid', // online/wallet assumed paid
            orderStatus: 'received',
            amounts: {
                subtotal,
                gstTotal,
                shipping,
                codCharge,
                discount,
                finalTotal: netAmountToPay,
                promoDeduction
            },
            couponCode: couponCode ? couponCode.toUpperCase() : undefined,
            otpVerification: {
                code: deliveryOtp,
                isVerified: false
            },
            pincode
        });
        // Create Transaction for Net Amount
        const transaction = await models_1.TransactionModel.create({
            orderId: order.id,
            retailerId: retailer.id,
            businessName: retailer.kycDetails?.businessName || retailer.email,
            amount: netAmountToPay,
            paymentGateway: paymentMethod === 'cod' ? 'cod' : (paymentMethod === 'wallet' ? 'wallet' : 'razorpay'),
            status: paymentMethod === 'cod' ? 'pending' : 'success',
            gatewayTransactionId: paymentMethod === 'cod' ? undefined : `txn_${Math.random().toString(36).substring(2, 15)}`
        });
        // Record Promo Transaction Entry if promo was used
        if (promoDeduction > 0) {
            await models_1.TransactionModel.create({
                orderId: order.id,
                retailerId: retailer.id,
                businessName: retailer.kycDetails?.businessName || retailer.email,
                amount: promoDeduction,
                paymentGateway: 'wallet',
                status: 'success',
                gatewayTransactionId: `PROMO_USE_${order.id}`
            });
        }
        await models_1.OrderModel.findByIdAndUpdate(order.id, {
            transactionId: transaction.id
        });
        // Send multi-channel notifications
        const msgBody = `Order CONFIRMED! Order ID: ${order.id}. Total Amount: INR ${finalTotal.toFixed(2)}. ${paymentMethod === 'cod' ? `Please share OTP ${deliveryOtp} with delivery agent upon arrival.` : 'Payment received.'}`;
        await notification_1.NotificationService.sendSMS(retailer.mobile, msgBody);
        await notification_1.NotificationService.sendWhatsApp(retailer.mobile, `Greetings ${retailer.kycDetails?.ownerName},\n\nYour bulk order was placed successfully.\nOrder ID: ${order.id}\nItems: ${orderItems.length}\nTotal: INR ${finalTotal.toFixed(2)}\nThank you for shopping with us!`);
        await notification_1.NotificationService.sendEmail(retailer.email, `Order Confirmation #${order.id}`, `Hi ${retailer.kycDetails?.ownerName},\n\nYour order #${order.id} has been received. Thank you for shopping with us!\n\nWarm regards,\nVishal Store Billing Dept`);
        await models_1.AuditLogModel.create({
            userId: retailer.id,
            userEmail: retailer.email,
            userRole: 'retailer',
            action: 'ORDER_PLACE',
            details: `Placed order ID ${order.id} for INR ${finalTotal.toFixed(2)} via ${paymentMethod}`
        });
        return res.status(201).json({
            success: true,
            message: 'Order placed successfully.',
            order,
            transactionId: transaction.id,
            deliveryOtp: paymentMethod === 'cod' ? deliveryOtp : undefined
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.placeOrder = placeOrder;
const getOrders = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        let query = {};
        // If retailer, fetch only their own orders. If admin/staff, fetch all.
        if (req.user.role === 'retailer') {
            query = { retailerId: req.user.id };
        }
        const orders = await models_1.OrderModel.find(query);
        // Sort manually by creation date in reverse (newest first)
        orders.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        return res.status(200).json({ success: true, orders });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getOrders = getOrders;
const getOrderById = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const order = await models_1.OrderModel.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        // Retailer security check
        if (req.user.role === 'retailer' && order.retailerId !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Access denied to this order details' });
        }
        return res.status(200).json({ success: true, order });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getOrderById = getOrderById;
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const status = req.body.status || req.body.orderStatus; // supports both frontend parameter shapes
        const order = await models_1.OrderModel.findById(id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        const updates = { orderStatus: status };
        if (status === 'delivered') {
            updates.paymentStatus = 'paid';
        }
        const updatedOrder = await models_1.OrderModel.findByIdAndUpdate(id, updates);
        // If marked delivered, update corresponding transaction status to success
        if (status === 'delivered') {
            const { TransactionModel } = require('../models');
            if (order.transactionId) {
                await TransactionModel.findByIdAndUpdate(order.transactionId, { status: 'success' });
            }
            else {
                const tx = await TransactionModel.findOne({ orderId: id });
                if (tx) {
                    await TransactionModel.findByIdAndUpdate(tx.id, { status: 'success' });
                }
            }
        }
        await models_1.AuditLogModel.create({
            userId: req.user?.id || 'admin',
            userEmail: req.user?.email || 'admin@b2b.com',
            userRole: req.user?.role || 'admin',
            action: 'ORDER_STATUS_UPDATE',
            details: `Updated order ${id} status to ${status}`
        });
        // Notify retailer
        const retailer = await models_1.UserModel.findById(order.retailerId);
        if (retailer) {
            await notification_1.NotificationService.sendSMS(retailer.mobile, `Your B2B order #${order.id} has been marked as: ${status.toUpperCase()}.`);
        }
        return res.status(200).json({ success: true, message: 'Order status updated successfully', order: updatedOrder });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateOrderStatus = updateOrderStatus;
const verifyDeliveryOTP = async (req, res) => {
    try {
        const { id } = req.params;
        const { otp } = req.body;
        const order = await models_1.OrderModel.findById(id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        if (order.otpVerification?.code !== otp) {
            return res.status(400).json({ success: false, message: 'Incorrect Delivery OTP verification code' });
        }
        const updatedOrder = await models_1.OrderModel.findByIdAndUpdate(id, {
            'otpVerification.isVerified': true,
            paymentStatus: 'paid',
            orderStatus: 'delivered'
        });
        // Update transaction status to success
        const { TransactionModel } = require('../models');
        if (order.transactionId) {
            await TransactionModel.findByIdAndUpdate(order.transactionId, { status: 'success' });
        }
        else {
            const tx = await TransactionModel.findOne({ orderId: id });
            if (tx) {
                await TransactionModel.findByIdAndUpdate(tx.id, { status: 'success' });
            }
        }
        await models_1.AuditLogModel.create({
            userId: req.user?.id || 'admin',
            userEmail: req.user?.email || 'admin@b2b.com',
            userRole: req.user?.role || 'admin',
            action: 'ORDER_DELIVERY_OTP_VERIFY',
            details: `OTP Verified for COD order ${id}. Status marked Delivered.`
        });
        return res.status(200).json({
            success: true,
            message: 'Delivery OTP verified successfully. Order completed.',
            order: updatedOrder
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.verifyDeliveryOTP = verifyDeliveryOTP;
const refundOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await models_1.OrderModel.findById(id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        if (order.paymentStatus === 'refunded') {
            return res.status(400).json({ success: false, message: 'This order is already refunded' });
        }
        const updatedOrder = await models_1.OrderModel.findByIdAndUpdate(id, {
            paymentStatus: 'refunded',
            orderStatus: 'returned'
        });
        // Credit amount back to wallet
        const retailer = await models_1.UserModel.findById(order.retailerId);
        if (retailer) {
            await models_1.UserModel.findByIdAndUpdate(order.retailerId, {
                walletBalance: retailer.walletBalance + order.amounts.finalTotal
            });
            const { TransactionModel } = require('../models');
            await TransactionModel.create({
                orderId: order.id,
                retailerId: order.retailerId,
                businessName: retailer.kycDetails?.businessName || retailer.email,
                amount: order.amounts.finalTotal,
                paymentGateway: 'wallet',
                status: 'success',
                gatewayTransactionId: `REFUND_${order.id}`
            });
            await notification_1.NotificationService.sendSMS(retailer.mobile, `Refund of INR ${order.amounts.finalTotal.toFixed(2)} for order #${order.id} has been credited to your B2B wallet.`);
        }
        await models_1.AuditLogModel.create({
            userId: req.user?.id || 'admin',
            userEmail: req.user?.email || 'admin@b2b.com',
            userRole: req.user?.role || 'admin',
            action: 'ORDER_REFUND',
            details: `Refunded order ID ${id} of value INR ${order.amounts.finalTotal.toFixed(2)}`
        });
        return res.status(200).json({ success: true, message: 'Order refunded successfully and credited to wallet', order: updatedOrder });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.refundOrder = refundOrder;
