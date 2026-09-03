import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const AdminAuthContext = createContext();

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('bcar_admin');
    if (stored) {
      try { setAdmin(JSON.parse(stored)); } catch { localStorage.removeItem('bcar_admin'); }
    }
    setLoading(false);
  }, []);

  async function login(email, password) {
    const res = await base44.functions.invoke('adminAuth', { action: 'login', email, password });
    const data = res.data;
    localStorage.setItem('bcar_admin', JSON.stringify(data));
    setAdmin(data);
    return data;
  }

  async function requestOtp(email) {
    const res = await base44.functions.invoke('adminAuth', { action: 'requestOtp', email });
    return res.data;
  }

  async function resetPassword(email, code, newPassword) {
    const res = await base44.functions.invoke('adminAuth', { action: 'resetPassword', email, code, newPassword });
    return res.data;
  }

  async function createAdmin(email, name, password, role) {
    const res = await base44.functions.invoke('adminAuth', { action: 'createAdmin', email, name, password, role });
    return res.data;
  }

  function logout() {
    localStorage.removeItem('bcar_admin');
    setAdmin(null);
  }

  return (
    <AdminAuthContext.Provider value={{ admin, loading, login, logout, requestOtp, resetPassword, createAdmin, isOwner: admin?.role === 'owner' }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}