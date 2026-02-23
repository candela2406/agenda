const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function onRequest(context) {
  const { request, env, next } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (token !== env.AUTH_TOKEN) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
  }

  await env.DB.prepare('PRAGMA foreign_keys = ON').run();

  const response = await next();
  for (const [key, value] of Object.entries(corsHeaders)) {
    response.headers.set(key, value);
  }
  return response;
}
