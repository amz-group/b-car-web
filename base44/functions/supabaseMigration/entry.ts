import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { getConfig, restBase, authHeaders, TABLE_MAP } from '../../shared/supabaseClient.ts';

const DDL = `
CREATE TABLE IF NOT EXISTS cars (
  id text primary key,
  name text not null,
  brand text not null,
  model text,
  year integer,
  price_per_day double precision not null,
  discount_percentage double precision default 0,
  status text default 'available',
  rented_from date,
  rented_until date,
  category text default 'luxury',
  description_en text,
  description_ku text,
  description_ar text,
  engine text,
  transmission text default 'automatic',
  seats integer default 5,
  images jsonb,
  video_url text,
  featured boolean default false,
  "order" integer default 0,
  created_date timestamptz,
  updated_date timestamptz,
  created_by_id text
);

CREATE TABLE IF NOT EXISTS news (
  id text primary key,
  title_en text not null,
  title_ku text,
  title_ar text,
  content_en text,
  content_ku text,
  content_ar text,
  type text default 'news',
  image_url text,
  active boolean default true,
  pinned boolean default false,
  created_date timestamptz,
  updated_date timestamptz,
  created_by_id text
);

CREATE TABLE IF NOT EXISTS reviews (
  id text primary key,
  car_id text not null,
  car_name text,
  customer_name text not null,
  rating integer default 5,
  comment text not null,
  images jsonb,
  approved boolean default false,
  created_date timestamptz,
  updated_date timestamptz,
  created_by_id text
);

CREATE TABLE IF NOT EXISTS rentals (
  id text primary key,
  car_id text not null,
  car_name text,
  customer_name text not null,
  customer_phone text,
  start_date date not null,
  end_date date not null,
  status text default 'active',
  notes text,
  created_date timestamptz,
  updated_date timestamptz,
  created_by_id text
);

CREATE TABLE IF NOT EXISTS notify_requests (
  id text primary key,
  car_id text not null,
  car_name text,
  customer_name text not null,
  customer_phone text not null,
  notify_date date,
  status text default 'pending',
  created_date timestamptz,
  updated_date timestamptz,
  created_by_id text
);

CREATE TABLE IF NOT EXISTS admin_users (
  id text primary key,
  email text not null,
  name text,
  password text not null,
  role text not null default 'admin',
  active boolean default true,
  created_date timestamptz,
  updated_date timestamptz,
  created_by_id text
);

CREATE TABLE IF NOT EXISTS otp_codes (
  id text primary key,
  email text not null,
  code text not null,
  expires_at text not null,
  used boolean default false,
  created_date timestamptz,
  updated_date timestamptz,
  created_by_id text
);

CREATE TABLE IF NOT EXISTS site_settings (
  id text primary key,
  logo_url text,
  background_url text,
  whatsapp_number text not null default '9647509180156',
  display_phone text default '07509180156',
  location_url text,
  instagram_url text,
  facebook_url text,
  tiktok_url text,
  snapchat_url text,
  telegram_url text,
  site_name_en text default 'KRD GROUP',
  site_name_ku text,
  site_name_ar text,
  tagline_en text,
  tagline_ku text,
  tagline_ar text,
  created_date timestamptz,
  updated_date timestamptz,
  created_by_id text
);
`;

const ENTITIES = [
  { name: 'Car', table: 'cars' },
  { name: 'News', table: 'news' },
  { name: 'Review', table: 'reviews' },
  { name: 'Rental', table: 'rentals' },
  { name: 'NotifyRequest', table: 'notify_requests' },
  { name: 'AdminUser', table: 'admin_users' },
  { name: 'OtpCode', table: 'otp_codes' },
  { name: 'SiteSettings', table: 'site_settings' }
];

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { action } = body;

    if (action === 'createSchema') {
      const { ref, accessToken } = await getConfig(base44);
      const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: DDL })
      });
      if (!res.ok) return Response.json({ error: await res.text() }, { status: 500 });
      return Response.json({ ok: true, message: 'schema created', ref });
    }

    if (action === 'migrate') {
      const { ref, serviceKey } = await getConfig(base44);
      const counts = {};
      for (const { name, table } of ENTITIES) {
        const records = await base44.asServiceRole.entities[name].list('-created_date', 10000);
        const rows = records || [];
        if (rows.length === 0) { counts[table] = 0; continue; }
        const res = await fetch(`${restBase(ref)}/${table}`, {
          method: 'POST',
          headers: { ...authHeaders(serviceKey), Prefer: 'return=mininal' },
          body: JSON.stringify(rows)
        });
        if (!res.ok) {
          counts[table] = `ERROR: ${await res.text()}`;
        } else {
          counts[table] = rows.length;
        }
      }
      return Response.json({ ok: true, counts });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}