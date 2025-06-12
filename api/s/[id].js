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

export async function GET(request, { params }) {
  const { id } = params;

  if (!id) {
    return Response.json({ error: 'Short ID not found' }, { status: 404 });
  }

  try {
    const client = await getRedisClient();
    const originalUrl = await client.get(`short:${id}`);
    
    if (!originalUrl) {
      return Response.json({ error: 'Short URL not found or expired' }, { status: 404 });
    }

    // Optional: Track analytics
    await client.incr(`clicks:${id}`);

    // Redirect to original URL
    return Response.redirect(originalUrl, 302);

  } catch (error) {
    console.error('Error redirecting:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
} 