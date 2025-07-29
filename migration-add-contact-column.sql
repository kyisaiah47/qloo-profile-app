-- Migration: Add contact column to user_profiles table
-- Run this SQL command in your Supabase SQL Editor

ALTER TABLE user_profiles 
ADD COLUMN contact TEXT;

-- Add comment to document the column
COMMENT ON COLUMN user_profiles.contact IS 'User contact information (email or phone number)';

-- Note: The contact column is nullable since existing users may not have this information
-- and it's not required to be unique since multiple users could potentially share contact methods
