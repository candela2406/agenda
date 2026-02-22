const VALID_KEYS = ['events', 'leaves', 'settings', 'activities', 'placed_activities'];

export async function onRequest(context) {
  const { request, env, params } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth check
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (token !== env.AUTH_TOKEN) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
  }

  const db = env.DB;
  const segments = params.catchall || [];

  try {
    if (request.method === 'GET' && segments.length === 0) {
      const { results } = await db.prepare('SELECT key, value FROM kv').all();
      const data = {};
      for (const row of results) {
        data[row.key] = JSON.parse(row.value);
      }
      return Response.json(data, { headers: corsHeaders });
    }

    if (request.method === 'PUT' && segments.length === 1) {
      const key = segments[0];
      if (!VALID_KEYS.includes(key)) {
        return Response.json({ error: 'Invalid key' }, { status: 400, headers: corsHeaders });
      }
      const body = await request.text();
      JSON.parse(body); // validate JSON
      await db.prepare(
        `INSERT INTO kv (key, value, updated_at) VALUES (?, ?, datetime('now'))
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
      ).bind(key, body).run();
      return Response.json({ ok: true }, { headers: corsHeaders });
    }

    return Response.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
