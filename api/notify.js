export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const OWNER_EMAIL = process.env.OWNER_EMAIL || 'anasmuhsin1998@gmail.com';

  // No email service configured — accept silently so the frontend doesn't break
  if (!RESEND_API_KEY) {
    console.log('[notify] No RESEND_API_KEY — skipping email for:', req.body?.type);
    return res.status(200).json({ ok: true, skipped: true });
  }

  try {
    const { type, car_name, customer_name, customer_phone, rating, comment, dates } = req.body || {};

    let subject, html;

    if (type === 'notify') {
      subject = `🔔 داواکاری نوێ - ئاگادارکردنەوەی بەردەستبوون: ${car_name || 'ئۆتۆمبێل'}`;
      html = `<h2>داواکاری ئاگادارکردنەوەی نوێ</h2>
        <p><b>ئۆتۆمبێل:</b> ${car_name || '—'}</p>
        <p><b>ناوی کڕیار:</b> ${customer_name || '—'}</p>
        <p><b>ژمارەی تەلەفۆن:</b> ${customer_phone || '—'}</p>
        <p><b>بەرواری داواکراو:</b> ${dates || '—'}</p>
        <p>تکایە لە پانێلی ئادمیندا بەدوایدا بگەڕێ.</p>`;
    } else if (type === 'review') {
      const r = Number(rating) || 5;
      subject = `⭐ پێداچوونەوەی نوێ بۆ ${car_name || 'ئۆتۆمبێل'}`;
      html = `<h2>پێداچوونەوەی نوێ (پێویستی بە پەسەندکردن هەیە)</h2>
        <p><b>ئۆتۆمبێل:</b> ${car_name || '—'}</p>
        <p><b>ناوی کڕیار:</b> ${customer_name || '—'}</p>
        <p><b>هەڵسەنگاندن:</b> ${'⭐'.repeat(r)} (${r}/5)</p>
        <p><b>تێبینی:</b> ${comment || '—'}</p>
        <p>تکایە لە پانێلی ئادمیندا پێداچوونەوەکە پەسەند بکە.</p>`;
    } else {
      return res.status(400).json({ error: 'Unknown type' });
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'KRD GROUP <noreply@resend.dev>',
        to: OWNER_EMAIL,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[notify] Resend error:', errText);
      // Still return 200 so the frontend doesn't break
      return res.status(200).json({ ok: true, emailError: true });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('[notify] Error:', error);
    return res.status(200).json({ ok: true, error: error.message });
  }
}