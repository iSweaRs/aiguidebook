// __tests__/mongodb.test.ts
import '@testing-library/jest-dom';

describe('MongoDB Connection', () => {
  let originalMongoUri: string | undefined;
  let originalMongoUrl: string | undefined;

  beforeAll(() => {
    // Save both variables
    originalMongoUri = process.env.MONGODB_URI;
    originalMongoUrl = process.env.MONGO_URL;
  });

  afterAll(() => {
    // Restore both variables
    process.env.MONGODB_URI = originalMongoUri;
    process.env.MONGO_URL = originalMongoUrl;
  });

  beforeEach(() => {
    jest.resetModules(); // clears the cache so we can test the environment variable block
    delete (global as any).mongoose;
  });

  it('throws an error if MONGODB_URI is not defined', () => {
    // Delete BOTH to ensure the file throws an error in the test environment
    delete process.env.MONGODB_URI;
    delete process.env.MONGO_URL; 
    
    expect(() => {
      require('../app/lib/db/mongodb');
    }).toThrow('Please define the MONGODB_URI environment variable');
  });

  it('connects to mongoose and caches the connection', async () => {
    // FIX: Because Jest sets NODE_ENV='test', your file reads MONGO_URL. We must set it here!
    process.env.MONGO_URL = 'mongodb://localhost:27017/test';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test'; 
    
    // Mock mongoose connect
    const mockMongoose = { connect: jest.fn().mockResolvedValue('mocked_connection') };
    jest.mock('mongoose', () => mockMongoose);

    const connectDB = require('../app/lib/db/mongodb').default;
    
    const conn1 = await connectDB();
    const conn2 = await connectDB(); // should hit cache

    expect(mockMongoose.connect).toHaveBeenCalledTimes(1); // Ensures singleton
    expect(conn1).toBe('mocked_connection');
    expect(conn2).toBe('mocked_connection');
  });
});