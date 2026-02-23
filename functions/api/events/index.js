export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  if (!from || !to) {
    return Response.json({ error: 'from and to query params required' }, { status: 400 });
  }

  const { results } = await env.DB.prepare(
    'SELECT id, date, title, time, location, description FROM events WHERE date BETWEEN ? AND ? ORDER BY date, time'
  ).bind(from, to).all();

  return Response.json(results);
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await request.json();

  if (!body.date || !body.title) {
    return Response.json({ error: 'date and title are required' }, { status: 400 });
  }

  const result = await env.DB.prepare(
    'INSERT INTO events (date, title, time, location, description) VALUES (?, ?, ?, ?, ?) RETURNING id, date, title, time, location, description'
  ).bind(body.date, body.title, body.time || null, body.location || null, body.description || null).first();

  return Response.json(result, { status: 201 });
}
