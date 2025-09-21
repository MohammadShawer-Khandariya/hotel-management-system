import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Global test setup
let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  // Setup in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri);

  // Setup in-memory Redis (mock for testing)
  process.env.REDIS_URL = 'redis://localhost:6379';
  
  // Mock Redis for tests
  jest.mock('../config/redis', () => ({
    redisClient: {
      setEx: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      keys: jest.fn(),
      connect: jest.fn(),
      quit: jest.fn()
    },
    connectRedis: jest.fn(),
    disconnectRedis: jest.fn(),
    RedisCache: {
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      setPersistent: jest.fn(),
      getKeys: jest.fn(),
      clearAll: jest.fn()
    }
  }));
}, 30000);

afterAll(async () => {
  // Cleanup
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
}, 30000);

afterEach(async () => {
  // Clear all collections after each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});
