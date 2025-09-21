import mongoose from 'mongoose';
import logger from '../utils/logger';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-management';

// MongoDB connection options
const mongoOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferCommands: false,
};

// Connect to MongoDB
export const connectMongoDB = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI, mongoOptions);
    logger.info('Connected to MongoDB successfully');
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    throw error;
  }
};

// Disconnect from MongoDB
export const disconnectMongoDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB successfully');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB:', error);
    throw error;
  }
};

// MongoDB connection events
mongoose.connection.on('connected', () => {
  logger.info('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  logger.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  logger.info('Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed due to application termination');
    process.exit(0);
  } catch (error) {
    logger.error('Error during MongoDB shutdown:', error);
    process.exit(1);
  }
});
