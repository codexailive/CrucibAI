// Test setup file for vitest
import { beforeAll, afterAll } from 'vitest';

// Setup before all tests
beforeAll(async () => {
  // Initialize test environment
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'file:./test.db';
  
  // Mock environment variables
  process.env.OPENAI_API_KEY = 'test-openai-key';
  process.env.PINECONE_API_KEY = 'test-pinecone-key';
  process.env.STRIPE_SECRET_KEY = 'test-stripe-key';
  process.env.JWT_SECRET = 'test-jwt-secret';
});

// Cleanup after all tests
afterAll(async () => {
  // Cleanup test resources
});
