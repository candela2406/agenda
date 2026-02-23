export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  if (!from || !to) {
    return Response.json({ error: 'from and to query params required' }, { status: 400 });
  }

  const { results } = await env.DB.prepare(
    'SELECT date, type FROM leaves WHERE date BETWEEN ? AND ? ORDER BY date'
  ).bind(from, to).all();

  return Response.json(results);
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await request.json();

  if (!body.date || !body.type) {
    return Response.json({ error: 'date and type are required' }, { status: 400 });
  }

  if (!['full', 'morning', 'afternoon'].includes(body.type)) {
    return Response.json({ error: 'type must be full, morning, or afternoon' }, { status: 400 });
  }

  await env.DB.prepare(
    `INSERT INTO leaves (date, type) VALUES (?, ?)
     ON CONFLICT(date) DO UPDATE SET type=excluded.type, updated_at=datetime('now')`
  ).bind(body.date, body.type).run();

  return Response.json({ date: body.date, type: body.type }, { status: 201 });
}
