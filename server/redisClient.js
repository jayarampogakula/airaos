import { createClient } from 'redis';

let client = null;
let isConnected = false;

// In-memory fallback database
const memoryStore = new Map();

const mockClient = {
  connect: async () => {
    console.log('[REDIS MOCK] Initialized in-memory session store.');
    isConnected = false;
    return mockClient;
  },
  get: async (key) => {
    return memoryStore.get(key) || null;
  },
  set: async (key, value, options) => {
    memoryStore.set(key, value);
    if (options && options.EX) {
      setTimeout(() => {
        memoryStore.delete(key);
      }, options.EX * 1000);
    }
    return 'OK';
  },
  del: async (key) => {
    memoryStore.delete(key);
    return 1;
  },
  quit: async () => {
    return 'OK';
  },
  on: (event, handler) => {
    // No-op
  }
};

try {
  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  client = createClient({ url: redisUrl });
  
  client.on('error', (err) => {
    console.warn('[REDIS CLIENT] Connection failed. Falling back to in-memory store.', err.message);
    client = mockClient;
    isConnected = false;
  });

  client.on('connect', () => {
    console.log('[REDIS CLIENT] Connected to Redis server.');
    isConnected = true;
  });
} catch (e) {
  console.warn('[REDIS CLIENT] Failed to instantiate redis client. Using fallback.');
  client = mockClient;
}

export const getRedisClient = async () => {
  if (client === mockClient) return client;
  try {
    if (!client.isOpen) {
      await client.connect();
    }
    return client;
  } catch (err) {
    console.warn('[REDIS CLIENT] Failed to connect to Redis. Using in-memory fallback.');
    client = mockClient;
    return client;
  }
};
