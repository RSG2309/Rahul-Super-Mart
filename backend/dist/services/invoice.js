"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateInvoicePDF = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const INVOICE_DIR = path_1.default.join(__dirname, '../../.data/invoices');
const generateInvoicePDF = async (order) => {
    if (!fs_1.default.existsSync(INVOICE_DIR)) {
        fs_1.default.mkdirSync(INVOICE_DIR, { recursive: true });
    }
    const filePath = path_1.default.join(INVOICE_DIR, `invoice_${order.id}.pdf`);
    return new Promise((resolve, reject) => {
        const doc = new pdfkit_1.default({ margin: 50 });
        const writeStream = fs_1.default.createWriteStream(filePath);
        doc.pipe(writeStream);
        // Header
        doc.fillColor('#4B5563').fontSize(20).text('INVOICE', { align: 'right' });
        doc.fontSize(14).fillColor('#1F2937').text('Vishal Store', 50, 50);
        doc.fontSize(9).fillColor('#4B5563').text('Vishal Telecom Pvt LTD, Sikta Bazar, W. Champaran Bihar, 845307\nEmail: vishalstoresikta@gmail.com', 50, 70);
        // Invoice details
        doc.fontSize(10).fillColor('#1F2937').text(`Invoice Number: INV-${(order.id || '').toUpperCase()}`, 350, 70);
        doc.text(`Invoice Date: ${new Date(order.createdAt || Date.now()).toLocaleDateString()}`, 350, 85);
        doc.text(`Order Status: ${(order.orderStatus || 'received').toUpperCase()}`, 350, 100);
        doc.text(`Payment Method: ${(order.paymentMethod || 'online').toUpperCase()}`, 350, 115);
        doc.text(`Payment Status: ${(order.paymentStatus || 'pending').toUpperCase()}`, 350, 130);
        doc.moveDown(2);
        // Bill To
        const startY = doc.y;
        doc.fontSize(11).fillColor('#1F2937').text('BILL TO:', 50, startY);
        doc.fontSize(10).fillColor('#4B5563').text(`${order.businessName}\nDelivery Address: ${order.deliveryAddress}\nPin Code: ${order.pincode}`, 50, startY + 15);
        doc.moveDown(4);
        // Draw a horizontal line
        doc.strokeColor('#E5E7EB').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(1);
        // Table Header
        const tableHeaderY = doc.y;
        doc.fontSize(9).fillColor('#1F2937');
        doc.text('Item Description', 50, tableHeaderY);
        doc.text('Price (INR)', 220, tableHeaderY, { width: 60, align: 'right' });
        doc.text('Qty', 290, tableHeaderY, { width: 40, align: 'right' });
        doc.text('Total (INR)', 470, tableHeaderY, { width: 80, align: 'right' });
        doc.moveDown(0.5);
        doc.strokeColor('#F3F4F6').moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);
        // Table Body
        order.items.forEach(item => {
            const itemY = doc.y;
            if (itemY > 700) {
                doc.addPage();
            }
            doc.fontSize(9).fillColor('#4B5563');
            doc.text(item.name, 50, doc.y, { width: 160 });
            doc.text(item.price.toFixed(2), 220, itemY, { width: 60, align: 'right' });
            doc.text(item.quantity.toString(), 290, itemY, { width: 40, align: 'right' });
            doc.text(item.subtotal.toFixed(2), 470, itemY, { width: 80, align: 'right' });
            doc.moveDown(1);
        });
        // Totals Section
        doc.moveDown(1);
        doc.strokeColor('#E5E7EB').moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(1);
        const summaryY = doc.y;
        doc.fontSize(9).fillColor('#4B5563');
        doc.text('Subtotal:', 330, summaryY, { width: 110, align: 'right' });
        doc.text(order.amounts.subtotal.toFixed(2), 470, summaryY, { width: 80, align: 'right' });
        let currentY = summaryY;
        if (order.amounts.codCharge > 0) {
            currentY += 15;
            doc.text('COD Handling Charge:', 330, currentY, { width: 110, align: 'right' });
            doc.text(order.amounts.codCharge.toFixed(2), 470, currentY, { width: 80, align: 'right' });
        }
        if (order.amounts.discount > 0) {
            currentY += 15;
            doc.text(`Discount (Coupon: ${order.couponCode || 'Promo'}):`, 330, currentY, { width: 110, align: 'right' });
            doc.text(`-${order.amounts.discount.toFixed(2)}`, 470, currentY, { width: 80, align: 'right' });
        }
        currentY += 15;
        doc.text('Shipping Charge:', 330, currentY, { width: 110, align: 'right' });
        doc.text(order.amounts.shipping.toFixed(2), 470, currentY, { width: 80, align: 'right' });
        currentY += 20;
        doc.fontSize(11).fillColor('#1F2937');
        doc.text('Grand Total:', 330, currentY, { width: 110, align: 'right' });
        doc.text(`INR ${order.amounts.finalTotal.toFixed(2)}`, 470, currentY, { width: 80, align: 'right' });
        // Terms
        doc.fontSize(8).fillColor('#9CA3AF').text('Terms & Conditions:\n1. Goods once sold will not be returned unless damaged or incorrect.\n2. All disputes are subject to Bengaluru jurisdiction.\n3. This is a computer-generated invoice and requires no physical signature.', 50, 720);
        doc.end();
        writeStream.on('finish', () => resolve(filePath));
        writeStream.on('error', err => reject(err));
    });
};
exports.generateInvoicePDF = generateInvoicePDF;
