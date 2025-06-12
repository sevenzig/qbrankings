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

export async function GET(request, context) {
  // Debug logging
  console.log('=== REDIRECT DEBUG ===');
  console.log('Request URL:', request.url);
  console.log('Context:', JSON.stringify(context));
  console.log('Context params:', context?.params);
  
  // Extract ID from URL or context
  let id;
  if (context?.params?.id) {
    id = context.params.id;
  } else {
    // Fallback: extract from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    id = pathParts[pathParts.length - 1];
  }
  
  console.log('Extracted ID:', id);
  console.log('=== END REDIRECT DEBUG ===');

  if (!id) {
    return Response.json({ error: 'Short ID not found', debug: { url: request.url, context } }, { status: 404 });
  }

  try {
    const client = await getRedisClient();
    const originalUrl = await client.get(`short:${id}`);
    
    console.log(`Looking for Redis key: short:${id}`);
    console.log(`Found URL: ${originalUrl}`);
    
    if (!originalUrl) {
      return Response.json({ error: 'Short URL not found or expired', shortId: id }, { status: 404 });
    }

    // Optional: Track analytics
    await client.incr(`clicks:${id}`);

    // Redirect to original URL
    console.log(`Redirecting to: ${originalUrl}`);
    return Response.redirect(originalUrl, 302);

  } catch (error) {
    console.error('Error redirecting:', error);
    return Response.json({ 
      error: 'Internal server error', 
      shortId: id,
      details: error.message 
    }, { status: 500 });
  }
} 