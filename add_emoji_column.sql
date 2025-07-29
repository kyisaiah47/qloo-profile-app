-- Add emoji column to user_profiles table
-- Migration: add_emoji_column
-- Date: 2025-07-29

ALTER TABLE user_profiles
ADD COLUMN emoji VARCHAR(10);

-- Add a comment to the column
COMMENT ON COLUMN user_profiles.emoji IS 'AI-generated emoji representing the user profile/personality';
