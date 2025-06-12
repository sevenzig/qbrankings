// api/shorten.js
import { createClient } from 'redis';

export const config = {
  runtime: 'nodejs18.x', // Use Node.js runtime for Redis client compatibility
};

// Redis client singleton
let redis = null;

async function getRedisClient() {
  if (!redis) {
    redis = createClient({
      url: process.env.REDIS_URL
    });
    
    redis.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });
    
    await redis.connect();
  }
  
  return redis;
}

// Generate a short ID
function generateShortId(length = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.body;
    
    if (!url || !url.startsWith('https://qbrankings.vercel.app/')) {
      return res.status(400).json({ error: 'Invalid URL' });
    }

    const client = await getRedisClient();

    // Generate unique short ID
    let shortId;
    let attempts = 0;
    do {
      shortId = generateShortId();
      attempts++;
      if (attempts > 10) {
        shortId = generateShortId(8); // Use longer ID if too many collisions
        break;
      }
    } while (await client.get(`short:${shortId}`));

    // Store the mapping with 30 days expiration (2592000 seconds)
    await client.setEx(`short:${shortId}`, 2592000, url);

    const shortUrl = `https://${req.headers.host}/s/${shortId}`;
    
    return res.status(200).json({ 
      shortUrl, 
      originalUrl: url,
      shortId,
      expiresIn: '30 days'
    });

  } catch (error) {
    console.error('Error creating short URL:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 