import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
        console.warn('[DB] MONGODB_URI not set. Server will start without database connection.');
        return false;
    }

    try {
        await mongoose.connect(mongoUri, { dbName: DB_NAME });
        console.log('[DB] MongoDB connected successfully');
        return true;
    } catch (error) {
        console.error('[DB] MongoDB connection failed:', error.message);
        return false;
    }
};

export default connectDB;
