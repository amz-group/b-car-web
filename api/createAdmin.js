import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !anonKey || !serviceKey) {
      return res.status(500).json({ error: 'Server not configured (missing Supabase env vars)' });
    }

    const { email, name, password, role } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Verify the caller is an authenticated owner
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await callerClient.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: callerAdmin } = await callerClient
      .from('admin_users')
      .select('role, active')
      .eq('email', user.email)
      .single();

    if (!callerAdmin || callerAdmin.role !== 'owner' || !callerAdmin.active) {
      return res.status(403).json({ error: 'Only the owner can create admins' });
    }

    // Create the Supabase Auth user (requires service role)
    const adminClient = createClient(supabaseUrl, serviceKey);

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      return res.status(400).json({ error: createError.message });
    }

    // Insert the admin profile row
    const { data: adminRecord, error: insertError } = await adminClient
      .from('admin_users')
      .insert({
        email,
        name: name || 'Admin',
        role: role || 'admin',
        active: true,
      })
      .select()
      .single();

    if (insertError) {
      // Clean up the orphaned auth user
      await adminClient.auth.admin.deleteUser(newUser.user.id);
      return res.status(400).json({ error: insertError.message });
    }

    return res.status(200).json(adminRecord);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}