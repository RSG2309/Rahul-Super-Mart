<<<<<<< HEAD
# B2B Wholesale Platform - Frontend

This is the Next.js 15 + React 19 + Tailwind CSS frontend application for the B2B Wholesale E-commerce platform.

## Features
- **Modern UI/UX**: Premium aesthetic styling inspired by Stripe/Apple, with CSS glassmorphic cards and dynamic layouts.
- **Context API State**: Global authentication (`AuthContext`) and cart checkout management (`CartContext`) persisted in LocalStorage.
- **MOQ & Slabs**: Checks product MOQ constraint values and applies Tiered Pricing drops (Retailer vs. Wholesale) instantly.
- **Interactive Sandbox Gateways**: Mock interfaces for UPI, Credit Card, and B2B Wallet payments, allowing success/failure overrides.
- **Admin Center**: Track order dispatches, verify delivery OTP codes, and inspect SMS/Email logs inside the browser.

## Setup & Running

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run in development mode:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

3. Build and launch production server:
   ```bash
   npm run build
   npm start
   ```

## Test Accounts
The backend automatically seeds these credentials for quick sandbox evaluation:
1. **Admin**: `admin@b2b.com` / `adminpassword`
2. **Verified Retailer**: `retailer@b2b.com` / `retailerpassword` (Preloaded with ₹50,000 wallet ledger)
3. **Pending Retailer**: `pending@b2b.com` / `retailerpassword`
=======
# Vishal-Store
Ecommerce For Bulk Orders
>>>>>>> 855f3defb13e6d095f3f02582cdd739904a82d74
