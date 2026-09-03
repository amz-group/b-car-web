import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const OWNER_EMAIL = 'anasmuhsin1998@gmail.com';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { type, car_name, customer_name, customer_phone, rating, comment, dates } = body || {};

    let subject, bodyHtml;

    if (type === 'notify') {
      subject = `🔔 داواکاری نوێ - ئاگادارکردنەوەی بەردەستبوون: ${car_name || 'ئۆتۆمبێل'}`;
      bodyHtml = `<h2>داواکاری ئاگادارکردنەوەی نوێ</h2>
<p><b>ئۆتۆمبێل:</b> ${car_name || '—'}</p>
<p><b>ناوی کڕیار:</b> ${customer_name || '—'}</p>
<p><b>ژمارەی تەلەفۆن:</b> ${customer_phone || '—'}</p>
<p><b>بەرواری داواکراو:</b> ${dates || '—'}</p>
<p>تکایە لە پانێلی ئادمیندا بەدوایدا بگەڕێ.</p>`;
    } else if (type === 'review') {
      const r = Number(rating) || 5;
      subject = `⭐ پێداچوونەوەی نوێ بۆ ${car_name || 'ئۆتۆمبێل'}`;
      bodyHtml = `<h2>پێداچوونەوەی نوێ (پێویستی بە پەسەندکردن هەیە)</h2>
<p><b>ئۆتۆمبێل:</b> ${car_name || '—'}</p>
<p><b>ناوی کڕیار:</b> ${customer_name || '—'}</p>
<p><b>هەڵسەنگاندن:</b> ${'⭐'.repeat(r)} (${r}/5)</p>
<p><b>تێبینی:</b> ${comment || '—'}</p>
<p>تکایە لە پانێلی ئادمیندا پێداچوونەوەکە پەسەند بکە.</p>`;
    } else {
      return Response.json({ error: 'Unknown type' }, { status: 400 });
    }

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: OWNER_EMAIL,
      subject,
      body: bodyHtml
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}