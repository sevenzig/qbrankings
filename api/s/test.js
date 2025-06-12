export async function GET(request) {
  return Response.json({ 
    message: 'Dynamic route test endpoint is working!',
    url: request.url,
    timestamp: new Date().toISOString()
  });
} 