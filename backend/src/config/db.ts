import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export let useJsonDb = false;

export const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.warn('⚠️ MONGODB_URI not provided. Falling back to local JSON database (.data/*.json)');
    useJsonDb = true;
    return;
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB Atlas successfully.');
  } catch (error: any) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    console.warn('⚠️ Falling back to local JSON database (.data/*.json)');
    useJsonDb = true;
  }
};
