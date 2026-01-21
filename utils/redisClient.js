const { createClient } = require('redis');
const dotenv = require('dotenv');

dotenv.config();

// Create a single client instance
// For cloud providers (like Upstash), the URL will start with rediss:// which implies TLS
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const isProduction = process.env.NODE_ENV === 'production';

const clientConfig = {
  url: redisUrl
};

// Add TLS options if using a secure connection (common in cloud)
if (redisUrl.startsWith('rediss://')) {
  clientConfig.socket = {
    tls: true,
    rejectUnauthorized: false // Often needed for some cloud providers
  };
}

const redisClient = createClient(clientConfig);

redisClient.on('error', (err) => {
  // Reduce noise for local development if Redis isn't running
  if (err.code === 'ECONNREFUSED' && !isProduction) {
    // Only log once or sparingly in a real app, but for now just warn
    console.warn('Redis connection refused. Ensure Redis is running locally or REDIS_URL is set.');
  } else {
    console.error('Redis Client Error:', err);
  }
});

redisClient.on('connect', () => {
  console.log(`Connected to Redis at ${redisUrl.includes('localhost') || redisUrl.includes('127.0.0.1') ? 'localhost' : 'cloud instance'}`);
});

// Start the connection process
redisClient.connect().catch((err) => {
  if (err.code !== 'ECONNREFUSED' || isProduction) {
    console.error('Redis initial connection failed:', err);
  }
});

module.exports = redisClient;