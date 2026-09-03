import { supabase } from '@/lib/supabaseClient';

// Frontend data-access layer backed directly by Supabase.
// Mirrors the Base44 entity SDK call shape so pages can use db.Entity.method(...)
// exactly like the previous base44.entities.Entity.method(...) calls.

const TABLE_MAP = {
  Car: 'cars',
  News: 'news',
  Review: 'reviews',
  Rental: 'rentals',
  NotifyRequest: 'notify_requests',
  AdminUser: 'admin_users',
  OtpCode: 'otp_codes',
  SiteSettings: 'site_settings',
};

function sanitize(data) {
  const out = {};
  for (const [k, v] of Object.entries(data || {})) {
    out[k] = v === '' ? null : v;
  }
  return out;
}

function parseSort(sort) {
  if (!sort) return null;
  const s = String(sort);
  if (s.startsWith('-')) return { column: s.slice(1), ascending: false };
  return { column: s, ascending: true };
}

function makeEntity(name) {
  const table = TABLE_MAP[name];
  return {
    list: async (sort, limit) => {
      let q = supabase.from(table).select('*');
      const s = parseSort(sort);
      if (s) q = q.order(s.column, { ascending: s.ascending });
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return data || [];
    },
    get: async (id) => {
      const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
      if (error) throw new Error(error.message);
      return data;
    },
    filter: async (filter, sort, limit) => {
      let q = supabase.from(table).select('*');
      for (const [k, v] of Object.entries(filter || {})) {
        if (v !== undefined && v !== null) q = q.eq(k, v);
      }
      const s = parseSort(sort);
      if (s) q = q.order(s.column, { ascending: s.ascending });
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return data || [];
    },
    create: async (data) => {
      const { data: row, error } = await supabase.from(table).insert(sanitize(data)).select().single();
      if (error) throw new Error(error.message);
      return row;
    },
    update: async (id, data) => {
      const { data: row, error } = await supabase.from(table).update(sanitize(data)).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return row;
    },
    delete: async (id) => {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw new Error(error.message);
      return { ok: true, id };
    },
  };
}

export const db = {
  Car: makeEntity('Car'),
  News: makeEntity('News'),
  Review: makeEntity('Review'),
  Rental: makeEntity('Rental'),
  NotifyRequest: makeEntity('NotifyRequest'),
  AdminUser: makeEntity('AdminUser'),
  OtpCode: makeEntity('OtpCode'),
  SiteSettings: makeEntity('SiteSettings'),
};