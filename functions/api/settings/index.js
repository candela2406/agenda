export async function onRequestGet(context) {
  const { env } = context;

  const { results } = await env.DB.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  for (const row of results) {
    settings[row.key] = row.value;
  }

  return Response.json(settings);
}

export async function onRequestPut(context) {
  const { request, env } = context;
  const body = await request.json();

  const statements = Object.entries(body).map(([key, value]) =>
    env.DB.prepare(
      `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`
    ).bind(key, String(value))
  );

  if (statements.length > 0) {
    await env.DB.batch(statements);
  }

  return Response.json(body);
}
