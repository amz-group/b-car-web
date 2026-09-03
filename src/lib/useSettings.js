import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { db } from '@/lib/db';

export function useSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const list = await db.SiteSettings.list();
        if (!active) return;
        if (list && list.length > 0) setSettings(list[0]);
        else setSettings(null);
      } catch (e) {
        if (active) setSettings(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  return { settings, loading, setSettings };
}