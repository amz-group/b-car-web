import { supabase } from '@/lib/supabaseClient';

/**
 * Uploads a file to Supabase Storage (public "uploads" bucket).
 * Returns { file_url } — same shape as the old base44.integrations.Core.UploadFile.
 */
export async function uploadFile(file, folder = 'misc') {
  const ext = (file.name || 'file').split('.').pop();
  const safeExt = ext.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'bin';
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`;

  const { error } = await supabase.storage
    .from('uploads')
    .upload(fileName, file, { cacheControl: '3600', upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from('uploads').getPublicUrl(fileName);
  return { file_url: data.publicUrl };
}