import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

const AdminAuthContext = createContext();

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && mounted) {
        await loadAdmin(session.user.email);
      }
      if (mounted) setLoading(false);
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await loadAdmin(session.user.email);
      } else if (event === 'SIGNED_OUT') {
        setAdmin(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function loadAdmin(email) {
    const { data } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .eq('active', true)
      .single();
    if (data) {
      setAdmin(data);
    } else {
      await supabase.auth.signOut();
      setAdmin(null);
    }
  }

  async function login(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);

    const { data: adminData } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .eq('active', true)
      .single();

    if (!adminData) {
      await supabase.auth.signOut();
      throw new Error('Not an admin');
    }
    setAdmin(adminData);
    return adminData;
  }

  async function requestOtp(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/admin',
    });
    if (error) throw new Error(error.message);
    return { success: true };
  }

  async function createAdmin(email, name, password, role) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch('/api/createAdmin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ email, name, password, role }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to create admin');
    return data;
  }

  async function logout() {
    await supabase.auth.signOut();
    setAdmin(null);
  }

  return (
    <AdminAuthContext.Provider
      value={{ admin, loading, login, logout, requestOtp, createAdmin, isOwner: admin?.role === 'owner' }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}