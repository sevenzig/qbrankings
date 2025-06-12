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

export async function GET(request, { params = {} } = {}) {
  console.log('=== REDIRECT DEBUG ===');
  console.log('Request URL:', request.url);
  console.log('Params object:', JSON.stringify(params, null, 2));
  
  try {
    // Try to get ID from params first, then fallback to URL parsing
    let id = params.id;
    
    if (!id) {
      // Fallback: Extract ID from URL path
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/').filter(part => part.length > 0);
      console.log('URL path parts:', pathParts);
      
      // Should be ['s', 'shortId'] or ['api', 's', 'shortId']
      id = pathParts[pathParts.length - 1];
    }
    
    console.log('Final extracted ID:', id);
    console.log('=== END REDIRECT DEBUG ===');

    if (!id || id === 's') {
      return Response.json({ 
        error: 'Short ID not found', 
        debug: { 
          url: request.url, 
          paramsId: params.id,
          extractedId: id
        } 
      }, { status: 404 });
    }

    const client = await getRedisClient();
    const originalUrl = await client.get(`short:${id}`);
    
    console.log(`Looking for Redis key: short:${id}`);
    console.log(`Found URL: ${originalUrl}`);
    
    if (!originalUrl) {
      return Response.json({ 
        error: 'Short URL not found or expired', 
        shortId: id,
        redisKey: `short:${id}`
      }, { status: 404 });
    }

    // Optional: Track analytics
    await client.incr(`clicks:${id}`);

    // Redirect to original URL
    console.log(`Redirecting to: ${originalUrl}`);
    return Response.redirect(originalUrl, 302);

  } catch (error) {
    console.error('Error in redirect handler:', error);
    console.error('Error stack:', error.stack);
    return Response.json({ 
      error: 'Internal server error', 
      details: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
} 