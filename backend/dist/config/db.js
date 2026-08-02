"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = exports.useJsonDb = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.useJsonDb = false;
const connectDB = async () => {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        console.warn('⚠️ MONGODB_URI not provided. Falling back to local JSON database (.data/*.json)');
        exports.useJsonDb = true;
        return;
    }
    try {
        await mongoose_1.default.connect(mongoUri);
        console.log('✅ Connected to MongoDB Atlas successfully.');
    }
    catch (error) {
        console.error(`❌ MongoDB connection failed: ${error.message}`);
        console.warn('⚠️ Falling back to local JSON database (.data/*.json)');
        exports.useJsonDb = true;
    }
};
exports.connectDB = connectDB;
