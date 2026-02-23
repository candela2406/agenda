const API_BASE = '/api';
const TOKEN = import.meta.env.VITE_API_TOKEN;

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TOKEN}`,
};

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, { headers, ...options });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || res.statusText);
  }
  return res.json();
}

// Bulk load
export function fetchInit(year) {
  return request(`/init?year=${year}`);
}

// Events
export function createEvent(data) {
  return request('/events', { method: 'POST', body: JSON.stringify(data) });
}

export function updateEvent(id, data) {
  return request(`/events/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteEvent(id) {
  return request(`/events/${id}`, { method: 'DELETE' });
}

// Activities
export function createActivity(data) {
  return request('/activities', { method: 'POST', body: JSON.stringify(data) });
}

export function updateActivity(id, data) {
  return request(`/activities/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteActivity(id) {
  return request(`/activities/${id}`, { method: 'DELETE' });
}

// Placed Activities
export function createPlacedActivity(data) {
  return request('/placed-activities', { method: 'POST', body: JSON.stringify(data) });
}

export function updatePlacedActivity(id, data) {
  return request(`/placed-activities/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deletePlacedActivity(id) {
  return request(`/placed-activities/${id}`, { method: 'DELETE' });
}

// Leaves
export function upsertLeave(date, type) {
  return request('/leaves', { method: 'POST', body: JSON.stringify({ date, type }) });
}

export function deleteLeave(date) {
  return request(`/leaves/${date}`, { method: 'DELETE' });
}

// Settings
export function updateSettings(data) {
  return request('/settings', { method: 'PUT', body: JSON.stringify(data) });
}
