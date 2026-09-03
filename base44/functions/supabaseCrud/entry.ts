import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { waitUntil } from 'base44:runtime';
import {
  TABLE_MAP,
  listRows,
  getRow,
  filterRows,
  createRow,
  updateRow,
  deleteRow
} from '../../shared/supabaseClient.ts';

const OWNER_EMAIL = 'anasmuhsin1998@gmail.com';
const ALLOWED_OPS = ['list', 'get', 'filter', 'create', 'update', 'delete'];

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { entity, op } = body;

    if (!entity || !TABLE_MAP[entity]) return Response.json({ error: 'Unknown entity' }, { status: 400 });
    if (!ALLOWED_OPS.includes(op)) return Response.json({ error: 'Unknown op' }, { status: 400 });
    const table = TABLE_MAP[entity];

    if (op === 'list') {
      const { sort, limit } = body;
      const rows = await listRows(base44, table, sort, limit);
      return Response.json(rows);
    }

    if (op === 'get') {
      const { id } = body;
      if (!id) return Response.json({ error: 'id required' }, { status: 400 });
      const row = await getRow(base44, table, id);
      return Response.json(row);
    }

    if (op === 'filter') {
      const { filter, sort, limit } = body;
      const rows = await filterRows(base44, table, filter || {}, sort, limit);
      return Response.json(rows);
    }

    if (op === 'create') {
      const { data } = body;
      if (!data) return Response.json({ error: 'data required' }, { status: 400 });
      const row = await createRow(base44, table, data);

      // Preserve the email notifications that previously fired via Base44
      // entity-trigger workflows (NotifyRequest + Review submissions).
      if (entity === 'NotifyRequest') {
        waitUntil(base44.asServiceRole.integrations.Core.SendEmail({
          to: OWNER_EMAIL,
          subject: `🔔 داواکاری نوێ - ئاگادارکردنەوەی بەردەستبوون: ${data.car_name || 'ئۆتۆمبێل'}`,
          body: `<h2>داواکاری ئاگادارکردنەوەی نوێ</h2>
<p><b>ئۆتۆمبێل:</b> ${data.car_name || '—'}</p>
<p><b>ناوی کڕیار:</b> ${data.customer_name || '—'}</p>
<p><b>ژمارەی تەلەفۆن:</b> ${data.customer_phone || '—'}</p>
<p><b>بەرواری داواکراو:</b> ${data.notify_date || '—'}</p>
<p>تکایە لە پانێلی ئادمیندا بەدوایدا بگەڕێ.</p>`
        }));
      } else if (entity === 'Review') {
        const r = Number(data.rating) || 5;
        waitUntil(base44.asServiceRole.integrations.Core.SendEmail({
          to: OWNER_EMAIL,
          subject: `⭐ پێداچوونەوەی نوێ بۆ ${data.car_name || 'ئۆتۆمبێل'}`,
          body: `<h2>پێداچوونەوەی نوێ (پێویستی بە پەسەندکردن هەیە)</h2>
<p><b>ئۆتۆمبێل:</b> ${data.car_name || '—'}</p>
<p><b>ناوی کڕیار:</b> ${data.customer_name || '—'}</p>
<p><b>هەڵسەنگاندن:</b> ${'⭐'.repeat(r)} (${r}/5)</p>
<p><b>تێبینی:</b> ${data.comment || '—'}</p>
<p>تکایە لە پانێلی ئادمیندا پێداچوونەوەکە پەسەند بکە.</p>`
        }));
      }

      return Response.json(row);
    }

    if (op === 'update') {
      const { id, data } = body;
      if (!id || !data) return Response.json({ error: 'id and data required' }, { status: 400 });
      const row = await updateRow(base44, table, id, data);
      return Response.json(row);
    }

    if (op === 'delete') {
      const { id } = body;
      if (!id) return Response.json({ error: 'id required' }, { status: 400 });
      const res = await deleteRow(base44, table, id);
      return Response.json(res);
    }

    return Response.json({ error: 'Unknown op' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}