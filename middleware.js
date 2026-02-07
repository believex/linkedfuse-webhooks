export const config = {
  matcher: '/api/:path*',
}

export function middleware(request) {
  const response = new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return response
  }

  return response
}