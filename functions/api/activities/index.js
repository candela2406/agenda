export async function onRequestGet(context) {
  const { env } = context;

  const { results } = await env.DB.prepare(
    'SELECT id, name, color, is_hidden, sort_order FROM activities ORDER BY sort_order, created_at'
  ).all();

  return Response.json(results.map(a => ({
    id: a.id,
    name: a.name,
    color: a.color,
    isHidden: !!a.is_hidden,
    sortOrder: a.sort_order,
  })));
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await request.json();

  if (!body.name || !body.color) {
    return Response.json({ error: 'name and color are required' }, { status: 400 });
  }

  const id = body.id || Date.now().toString();

  await env.DB.prepare(
    'INSERT OR IGNORE INTO activities (id, name, color, is_hidden, sort_order) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, body.name, body.color, body.isHidden ? 1 : 0, body.sortOrder || 0).run();

  return Response.json({ id, name: body.name, color: body.color, isHidden: !!body.isHidden, sortOrder: body.sortOrder || 0 }, { status: 201 });
}
