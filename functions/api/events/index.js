export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  if (!from || !to) {
    return Response.json({ error: 'from and to query params required' }, { status: 400 });
  }

  const { results } = await env.DB.prepare(
    'SELECT id, date, end_date, title, time, location, description FROM events WHERE date BETWEEN ? AND ? OR (end_date IS NOT NULL AND date <= ? AND end_date >= ?) ORDER BY date, time'
  ).bind(from, to, to, from).all();

  return Response.json(results.map(e => ({ id: e.id, date: e.date, endDate: e.end_date, title: e.title, time: e.time, location: e.location, description: e.description })));
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await request.json();

  if (!body.date || !body.title) {
    return Response.json({ error: 'date and title are required' }, { status: 400 });
  }

  const result = await env.DB.prepare(
    'INSERT INTO events (date, end_date, title, time, location, description) VALUES (?, ?, ?, ?, ?, ?) RETURNING id, date, end_date, title, time, location, description'
  ).bind(body.date, body.endDate || null, body.title, body.time || null, body.location || null, body.description || null).first();

  return Response.json({ id: result.id, date: result.date, endDate: result.end_date, title: result.title, time: result.time, location: result.location, description: result.description }, { status: 201 });
}
