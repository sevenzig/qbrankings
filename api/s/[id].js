// api/s/[id].js - Redirect handler
import { createClient } from 'redis';

export const config = {
  runtime: 'nodejs18.x',
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

export default async function redirectHandler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(404).json({ error: 'Short ID not found' });
  }

  try {
    const client = await getRedisClient();
    const originalUrl = await client.get(`short:${id}`);
    
    if (!originalUrl) {
      return res.status(404).json({ error: 'Short URL not found or expired' });
    }

    // Optional: Track analytics
    await client.incr(`clicks:${id}`);

    // Redirect to original URL
    return res.redirect(302, originalUrl);

  } catch (error) {
    console.error('Error redirecting:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 