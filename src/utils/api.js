const API_BASE = '/api/data';
const TOKEN = import.meta.env.VITE_API_TOKEN;

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TOKEN}`,
};

export async function fetchAllData() {
  if (!TOKEN) return null;
  try {
    const res = await fetch(API_BASE, { headers });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    console.warn('API fetch failed, using localStorage');
    return null;
  }
}

export function pushData(key, value) {
  if (!TOKEN) return;
  fetch(`${API_BASE}/${key}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(value),
  }).catch(err => console.warn(`API push failed for ${key}:`, err));
}
