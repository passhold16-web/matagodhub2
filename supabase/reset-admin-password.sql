-- Reset Admin Password Script
-- Run this in Supabase SQL Editor
-- This will reset the password for santigg89@hotmail.com to: Admin@123456

UPDATE auth.users 
SET 
  encrypted_password = crypt('Admin@123456', gen_salt('bf')),
  password_change_required = true,
  updated_at = now()
WHERE email = 'santigg89@hotmail.com';

-- Verify the update
SELECT id, email, updated_at FROM auth.users WHERE email = 'santigg89@hotmail.com';
