// Shared Supabase access layer used by backend functions.
// Resolves the connected project ref + service_role key from the Supabase
// Management API, then exposes PostgREST CRUD helpers that mirror the
// Base44 entity SDK call shape (sort prefix "-" = desc, equality filters).

let cachedRef = null;
let cachedServiceKey = null;
let cachedToken = null;

export const TABLE_MAP = {
  Car: 'cars',
  News: 'news',
  Review: 'reviews',
  Rental: 'rentals',
  NotifyRequest: 'notify_requests',
  AdminUser: 'admin_users',
  OtpCode: 'otp_codes',
  SiteSettings: 'site_settings'
};

export async function getConfig(base44) {
  const { accessToken } = await base44.asServiceRole.connectors.getConnection('supabase');
  if (cachedToken === accessToken && cachedRef && cachedServiceKey) {
    return { ref: cachedRef, serviceKey: cachedServiceKey, accessToken };
  }
  // Resolve project ref (first project on the authorized account).
  const projRes = await fetch('https://api.supabase.com/v1/projects', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!projRes.ok) throw new Error('Failed to list Supabase projects: ' + await projRes.text());
  const projects = await projRes.json();
  if (!projects || projects.length === 0) throw new Error('No Supabase project found on this account');
  const ref = projects[0].id;

  // Resolve service_role key for PostgREST data access.
  const keysRes = await fetch(`https://api.supabase.com/v1/projects/${ref}/api-keys`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!keysRes.ok) throw new Error('Failed to fetch Supabase api-keys: ' + await keysRes.text());
  const keys = await keysRes.json();
  const serviceEntry = keys.find((k) => k.name === 'service_role');
  if (!serviceEntry) throw new Error('service_role key not found');
  const serviceKey = serviceEntry.api_key;

  cachedRef = ref;
  cachedServiceKey = serviceKey;
  cachedToken = accessToken;
  return { ref, serviceKey, accessToken };
}

export function restBase(ref) {
  return `https://${ref}.supabase.co/rest/v1`;
}

export function authHeaders(serviceKey) {
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation'
  };
}

function buildOrder(sort) {
  if (!sort) return '';
  if (String(sort).startsWith('-')) return `order=${encodeURIComponent(String(sort).slice(1))}.desc`;
  return `order=${encodeURIComponent(String(sort))}.asc`;
}

export async function listRows(base44, table, sort, limit) {
  const { ref, serviceKey } = await getConfig(base44);
  const order = buildOrder(sort);
  const lim = limit || 200;
  const url = `${restBase(ref)}/${table}?select=*${order ? `&${order}` : ''}&limit=${lim}`;
  const res = await fetch(url, { headers: authHeaders(serviceKey) });
  if (!res.ok) throw new Error(`list ${table} failed: ${await res.text()}`);
  return await res.json();
}

export async function getRow(base44, table, id) {
  const { ref, serviceKey } = await getConfig(base44);
  const url = `${restBase(ref)}/${table}?select=*&id=eq.${encodeURIComponent(id)}&limit=1`;
  const res = await fetch(url, { headers: authHeaders(serviceKey) });
  if (!res.ok) throw new Error(`get ${table} failed: ${await res.text()}`);
  const rows = await res.json();
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

export async function filterRows(base44, table, filters, sort, limit) {
  const { ref, serviceKey } = await getConfig(base44);
  const qs = Object.entries(filters || {})
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=eq.${encodeURIComponent(String(v))}`)
    .join('&');
  const order = buildOrder(sort);
  const lim = limit || 200;
  const url = `${restBase(ref)}/${table}?select=*${qs ? `&${qs}` : ''}${order ? `&${order}` : ''}&limit=${lim}`;
  const res = await fetch(url, { headers: authHeaders(serviceKey) });
  if (!res.ok) throw new Error(`filter ${table} failed: ${await res.text()}`);
  return await res.json();
}

function genId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Coerce empty strings to null so typed columns (date, int, etc.) don't reject
// blank form fields. Frontend forms send "" for unfilled optional inputs.
function sanitize(data) {
  const out = {};
  for (const [k, v] of Object.entries(data || {})) {
    out[k] = v === '' ? null : v;
  }
  return out;
}

export async function createRow(base44, table, data) {
  const { ref, serviceKey } = await getConfig(base44);
  const now = new Date().toISOString();
  const payload = { id: genId(), created_date: now, updated_date: now, ...sanitize(data) };
  const res = await fetch(`${restBase(ref)}/${table}`, {
    method: 'POST',
    headers: authHeaders(serviceKey),
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`create ${table} failed: ${await res.text()}`);
  const rows = await res.json();
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : (rows || null);
}

export async function updateRow(base44, table, id, data) {
  const { ref, serviceKey } = await getConfig(base44);
  const payload = { updated_date: new Date().toISOString(), ...sanitize(data) };
  const res = await fetch(`${restBase(ref)}/${table}?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: authHeaders(serviceKey),
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`update ${table} failed: ${await res.text()}`);
  const rows = await res.json();
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : (rows || null);
}

export async function deleteRow(base44, table, id) {
  const { ref, serviceKey } = await getConfig(base44);
  const res = await fetch(`${restBase(ref)}/${table}?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(serviceKey)
  });
  if (!res.ok) throw new Error(`delete ${table} failed: ${await res.text()}`);
  return { ok: true, id };
}