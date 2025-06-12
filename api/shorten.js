import { createClient } from 'redis';

// Configure for Node.js runtime (needed for Redis)
export const runtime = 'nodejs';
export const maxDuration = 30;

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

export async function POST(request) {
  try {
    const { url } = await request.json();
    
    if (!url || !url.startsWith('https://qbrankings.vercel.app/')) {
      return Response.json({ error: 'Invalid URL' }, { status: 400 });
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

    const shortUrl = `https://${request.headers.get('host')}/s/${shortId}`;
    
    return Response.json({ 
      shortUrl, 
      originalUrl: url,
      shortId,
      expiresIn: '30 days'
    });

  } catch (error) {
    console.error('Error creating short URL:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
} 