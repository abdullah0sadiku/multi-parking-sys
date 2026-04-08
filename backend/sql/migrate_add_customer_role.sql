-- Migration: add 'customer' value to users.role enum
-- Run this ONCE against an existing database (not needed for fresh installs).
ALTER TABLE users
  MODIFY COLUMN role ENUM('admin', 'staff', 'customer') NOT NULL DEFAULT 'staff';
