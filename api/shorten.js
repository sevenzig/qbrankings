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
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError);
      return Response.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    
    const { url } = body;
    
    // Debug logging
    console.log('=== URL SHORTENING DEBUG ===');
    console.log('Full request body:', JSON.stringify(body));
    console.log('Received URL:', url);
    console.log('URL type:', typeof url);
    console.log('URL length:', url?.length);
    if (url) {
      console.log('First 100 chars:', url.substring(0, 100));
      console.log('Starts with https://quarterbackranking.com/?', url.startsWith('https://quarterbackranking.com/'));
      console.log('Starts with https://www.quarterbackranking.com/?', url.startsWith('https://www.quarterbackranking.com/'));
    }
    console.log('=== END DEBUG ===');
    
    if (!url || !(url.startsWith('https://quarterbackranking.com/') || url.startsWith('https://www.quarterbackranking.com/'))) {
      console.log('URL validation failed for:', url);
      return Response.json({ error: 'Invalid URL', receivedUrl: url }, { status: 400 });
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

    // Always use www.quarterbackranking.com for short URLs to match where the API is deployed
    const shortUrl = `https://www.quarterbackranking.com/s/${shortId}`;
    
    return Response.json({ 
      shortUrl, 
      originalUrl: url,
      shortId,
      expiresIn: '30 days'
    });

  } catch (error) {
    console.error('Error creating short URL:', error);
    console.error('Error details:', error.message, error.stack);
    return Response.json({ 
      error: 'Internal server error', 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    }, { status: 500 });
  }
} 