-- ============================================================
-- KRD GROUP — Supabase RLS Policies
-- Run this in the Supabase SQL Editor after deploying tables.
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notify_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Helper: a user is an active admin if their email exists in admin_users with active=true
-- (Supabase Auth JWT contains the email claim)

-- ============================================================
-- PUBLIC READ (anon + authenticated can SELECT website data)
-- ============================================================
CREATE POLICY "public_read_cars"      ON cars          FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_news"      ON news          FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_reviews"   ON reviews       FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_rentals"   ON rentals       FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_settings"  ON site_settings FOR SELECT TO anon, authenticated USING (true);

-- ============================================================
-- PUBLIC CREATE (anon can submit reviews + notify requests)
-- ============================================================
CREATE POLICY "public_insert_reviews"  ON reviews         FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "public_insert_notify"   ON notify_requests FOR INSERT TO anon WITH CHECK (true);

-- ============================================================
-- ADMIN WRITE (authenticated active admins can INSERT/UPDATE/DELETE)
-- ============================================================
CREATE POLICY "admin_write_cars"     ON cars     FOR ALL TO authenticated
  USING    (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email' AND active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email' AND active = true));

CREATE POLICY "admin_write_news"     ON news     FOR ALL TO authenticated
  USING    (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email' AND active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email' AND active = true));

CREATE POLICY "admin_write_reviews"  ON reviews  FOR ALL TO authenticated
  USING    (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email' AND active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email' AND active = true));

CREATE POLICY "admin_write_rentals"  ON rentals  FOR ALL TO authenticated
  USING    (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email' AND active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email' AND active = true));

CREATE POLICY "admin_write_notify"   ON notify_requests FOR ALL TO authenticated
  USING    (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email' AND active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email' AND active = true));

CREATE POLICY "admin_write_settings" ON site_settings FOR ALL TO authenticated
  USING    (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email' AND active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email' AND active = true));

-- ============================================================
-- ADMIN_USERS TABLE (only authenticated admins can read; only owner can write)
-- ============================================================
CREATE POLICY "admin_read_admin_users" ON admin_users FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.email = auth.jwt() ->> 'email' AND au.active = true));

CREATE POLICY "owner_write_admin_users" ON admin_users FOR ALL TO authenticated
  USING    (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email' AND role = 'owner' AND active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email' AND role = 'owner' AND active = true));

-- ============================================================
-- STORAGE (public "uploads" bucket)
-- Create a bucket named "uploads" in Supabase Storage, then run:
-- ============================================================
-- Allow anyone to upload to the uploads bucket
CREATE POLICY "anyone_upload_uploads" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'uploads');

-- Allow anyone to read from the uploads bucket
CREATE POLICY "anyone_read_uploads" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'uploads');

-- Allow authenticated admins to delete uploads
CREATE POLICY "admin_delete_uploads" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'uploads' AND EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email' AND active = true));