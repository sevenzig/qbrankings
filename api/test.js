export async function GET(request) {
  return Response.json({ 
    message: 'API is working!', 
    timestamp: new Date().toISOString(),
    host: request.headers.get('host'),
    userAgent: request.headers.get('user-agent')
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    return Response.json({ 
      message: 'POST received successfully', 
      receivedData: body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ 
      error: 'Invalid JSON', 
      details: error.message 
    }, { status: 400 });
  }
} 