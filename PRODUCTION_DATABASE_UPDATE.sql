-- ============================================================
-- PRODUCTION DATABASE UPDATE SCRIPT
-- Purpose: Update admin account email and verification status
-- Date: November 3, 2025
-- ============================================================
-- 
-- INSTRUCTIONS:
-- 1. Access your production database on www.dedw3n.com
-- 2. Run this SQL script to update the admin account
-- 3. Verify the changes with the SELECT query at the end
-- 
-- ============================================================

-- Update admin account with official email and verification status
UPDATE users 
SET 
  email = 'info@dedw3n.com',
  email_verified = true
WHERE 
  id = 1 
  AND role = 'admin';

-- Verify the update was successful
SELECT 
  id, 
  username, 
  email, 
  email_verified, 
  role,
  first_name,
  surname
FROM users 
WHERE id = 1;

-- Expected result:
-- id | username | email            | email_verified | role  | first_name | surname
-- 1  | admin    | info@dedw3n.com  | t              | admin | NULL       | NULL
