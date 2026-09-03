import { base44 } from '@/api/base44Client';

// Frontend data-access layer backed by Supabase (the app's primary database).
// Mirrors the Base44 entity SDK call shape so pages can use db.Entity.method(...)
// exactly like the previous base44.entities.Entity.method(...) calls.
function invoke(entity, op, extra) {
  return base44.functions.invoke('supabaseCrud', { entity, op, ...extra }).then((r) => {
    const data = r?.data;
    if (data && data.error) throw new Error(data.error);
    return data;
  });
}

function makeEntity(name) {
  return {
    list: (sort, limit) => invoke(name, 'list', { sort, limit }),
    get: (id) => invoke(name, 'get', { id }),
    filter: (filter, sort, limit) => invoke(name, 'filter', { filter, sort, limit }),
    create: (data) => invoke(name, 'create', { data }),
    update: (id, data) => invoke(name, 'update', { id, data }),
    delete: (id) => invoke(name, 'delete', { id })
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
  SiteSettings: makeEntity('SiteSettings')
};