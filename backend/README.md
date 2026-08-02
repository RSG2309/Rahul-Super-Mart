# B2B Wholesale Platform - Backend

This is the Express + TypeScript backend server for the B2B Wholesale E-commerce platform.

## Features
- **Authentication**: JWT token verification + simulated Mobile OTP authentication.
- **Database**: MongoDB integration via Mongoose, with automatic JSON-based local database fallback (`.data/` folder) if no connection string is provided.
- **Invoice Engine**: PDF invoice generation based on placed orders, saved locally.
- **Notifications**: Simulated logs for Email, SMS, and WhatsApp alerts visible in console and in the Admin Audit logs.
- **Mock Cache**: Caches product catalog listings using an in-memory key-value service mimicking Redis.
- **Security**: Helmet, CORS, and Express rate limiting enabled.

## Setup & Running

1. Install dependencies:
   ```bash
   npm install
   ```

2. (Optional) Provide a `.env` file in the backend root directory:
   ```env
   PORT=5000
   JWT_SECRET=my_b2b_jwt_secret_key_123
   MONGODB_URI=mongodb+srv://... (if omitted, falls back to local JSON files)
   ```

3. Run in development mode:
   ```bash
   npm run dev
   ```

4. Build and start in production mode:
   ```bash
   npm run build
   npm start
   ```

## Test Scripts

Run verification tests programmatically:
- Auth logic: `npm run test:auth`
- Orders & Pricing tiers: `npm run test:order`
- PDF Invoices: `npm run test:invoice`
