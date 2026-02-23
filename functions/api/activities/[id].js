export async function onRequestPut(context) {
  const { request, env, params } = context;
  const id = params.id;
  const body = await request.json();

  const { meta } = await env.DB.prepare(
    'UPDATE activities SET name=?, color=?, is_hidden=?, sort_order=?, updated_at=datetime(\'now\') WHERE id=?'
  ).bind(body.name, body.color, body.isHidden ? 1 : 0, body.sortOrder || 0, id).run();

  if (meta.changes === 0) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }
  return Response.json({ id, name: body.name, color: body.color, isHidden: !!body.isHidden, sortOrder: body.sortOrder || 0 });
}

export async function onRequestDelete(context) {
  const { env, params } = context;
  const id = params.id;

  const { meta } = await env.DB.prepare('DELETE FROM activities WHERE id=?').bind(id).run();
  if (meta.changes === 0) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }
  return Response.json({ ok: true });
}
