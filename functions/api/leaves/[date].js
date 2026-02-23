export async function onRequestDelete(context) {
  const { env, params } = context;
  const date = params.date;

  const { meta } = await env.DB.prepare('DELETE FROM leaves WHERE date=?').bind(date).run();
  if (meta.changes === 0) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }
  return Response.json({ ok: true });
}
