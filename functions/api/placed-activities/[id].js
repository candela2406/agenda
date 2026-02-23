export async function onRequestPut(context) {
  const { request, env, params } = context;
  const id = params.id;
  const body = await request.json();

  const result = await env.DB.prepare(
    'UPDATE placed_activities SET title=?, time=?, location=?, description=?, updated_at=datetime(\'now\') WHERE id=? RETURNING id, date, activity_id, title, time, location, description'
  ).bind(body.title || null, body.time || null, body.location || null, body.description || null, id).first();

  if (!result) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }
  return Response.json({
    id: result.id,
    date: result.date,
    activityId: result.activity_id,
    title: result.title,
    time: result.time,
    location: result.location,
    description: result.description,
  });
}

export async function onRequestDelete(context) {
  const { env, params } = context;
  const id = params.id;

  const { meta } = await env.DB.prepare('DELETE FROM placed_activities WHERE id=?').bind(id).run();
  if (meta.changes === 0) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }
  return Response.json({ ok: true });
}
