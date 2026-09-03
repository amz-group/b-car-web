import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

async function hashPassword(password) {
  const data = new TextEncoder().encode('bcar_salt_' + password);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action } = body;

    if (action === 'login') {
      const { email, password } = body;
      if (!email || !password) return Response.json({ error: 'Email and password required' }, { status: 400 });
      const users = await base44.asServiceRole.entities.AdminUser.filter({ email, active: true });
      if (!users || users.length === 0) return Response.json({ error: 'Invalid credentials' }, { status: 401 });
      const user = users[0];
      const hashed = await hashPassword(password);
      if (user.password !== hashed) return Response.json({ error: 'Invalid credentials' }, { status: 401 });
      return Response.json({ id: user.id, email: user.email, name: user.name, role: user.role });
    }

    if (action === 'requestOtp') {
      const { email } = body;
      if (!email) return Response.json({ error: 'Email required' }, { status: 400 });
      const users = await base44.asServiceRole.entities.AdminUser.filter({ email, active: true });
      if (!users || users.length === 0) return Response.json({ error: 'No admin found for this email' }, { status: 404 });
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      await base44.asServiceRole.entities.OtpCode.create({ email, code, expires_at: expires, used: false });
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        subject: 'B Car Admin — Verification Code',
        body: `Your verification code is: ${code}\n\nThis code expires in 10 minutes. If you did not request a password reset, you can ignore this email.`
      });
      return Response.json({ success: true, message: 'Verification code sent to your email' });
    }

    if (action === 'resetPassword') {
      const { email, code, newPassword } = body;
      if (!email || !code || !newPassword) return Response.json({ error: 'All fields required' }, { status: 400 });
      const codes = await base44.asServiceRole.entities.OtpCode.filter({ email, used: false });
      const valid = codes && codes.find(c => c.code === code && new Date(c.expires_at) > new Date());
      if (!valid) return Response.json({ error: 'Invalid or expired code' }, { status: 400 });
      const users = await base44.asServiceRole.entities.AdminUser.filter({ email, active: true });
      if (!users || users.length === 0) return Response.json({ error: 'Admin not found' }, { status: 404 });
      const hashed = await hashPassword(newPassword);
      await base44.asServiceRole.entities.AdminUser.update(users[0].id, { password: hashed });
      await base44.asServiceRole.entities.OtpCode.update(valid.id, { used: true });
      return Response.json({ success: true });
    }

    if (action === 'createAdmin') {
      const { email, name, password, role } = body;
      if (!email || !password) return Response.json({ error: 'Email and password required' }, { status: 400 });
      const existing = await base44.asServiceRole.entities.AdminUser.filter({ email });
      if (existing && existing.length > 0) return Response.json({ error: 'Admin with this email already exists' }, { status: 409 });
      const hashed = await hashPassword(password);
      const created = await base44.asServiceRole.entities.AdminUser.create({
        email, name: name || 'Admin', password: hashed, role: role || 'admin', active: true
      });
      return Response.json({ id: created.id, email: created.email, name: created.name, role: created.role });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}