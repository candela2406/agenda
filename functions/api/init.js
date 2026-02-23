export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const year = url.searchParams.get('year') || new Date().getFullYear().toString();
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;

  const [eventsResult, activitiesResult, placedResult, leavesResult, settingsResult] =
    await env.DB.batch([
      env.DB.prepare('SELECT id, date, title, time, location, description FROM events WHERE date BETWEEN ? AND ? ORDER BY date, time').bind(from, to),
      env.DB.prepare('SELECT id, name, color, is_hidden, sort_order FROM activities ORDER BY sort_order, created_at'),
      env.DB.prepare('SELECT id, date, activity_id, title, time, location, description FROM placed_activities WHERE date BETWEEN ? AND ? ORDER BY date').bind(from, to),
      env.DB.prepare('SELECT date, type FROM leaves WHERE date BETWEEN ? AND ? ORDER BY date').bind(from, to),
      env.DB.prepare('SELECT key, value FROM settings'),
    ]);

  const settings = {};
  for (const row of settingsResult.results) {
    settings[row.key] = row.value;
  }

  return Response.json({
    events: eventsResult.results,
    activities: activitiesResult.results.map(a => ({
      id: a.id,
      name: a.name,
      color: a.color,
      isHidden: !!a.is_hidden,
      sortOrder: a.sort_order,
    })),
    placedActivities: placedResult.results.map(p => ({
      id: p.id,
      date: p.date,
      activityId: p.activity_id,
      title: p.title,
      time: p.time,
      location: p.location,
      description: p.description,
    })),
    leaves: leavesResult.results,
    settings,
  });
}
