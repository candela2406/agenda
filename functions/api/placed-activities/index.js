export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  if (!from || !to) {
    return Response.json({ error: 'from and to query params required' }, { status: 400 });
  }

  const { results } = await env.DB.prepare(
    'SELECT id, date, end_date, activity_id, title, time, location, description FROM placed_activities WHERE date BETWEEN ? AND ? OR (end_date IS NOT NULL AND date <= ? AND end_date >= ?) ORDER BY date'
  ).bind(from, to, to, from).all();

  return Response.json(results.map(p => ({
    id: p.id,
    date: p.date,
    endDate: p.end_date,
    activityId: p.activity_id,
    title: p.title,
    time: p.time,
    location: p.location,
    description: p.description,
  })));
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await request.json();

  if (!body.date || !body.activityId) {
    return Response.json({ error: 'date and activityId are required' }, { status: 400 });
  }

  const result = await env.DB.prepare(
    'INSERT INTO placed_activities (date, end_date, activity_id) VALUES (?, ?, ?) RETURNING id, date, end_date, activity_id, title, time, location, description'
  ).bind(body.date, body.endDate || null, body.activityId).first();

  return Response.json({
    id: result.id,
    date: result.date,
    endDate: result.end_date,
    activityId: result.activity_id,
    title: result.title,
    time: result.time,
    location: result.location,
    description: result.description,
  }, { status: 201 });
}
