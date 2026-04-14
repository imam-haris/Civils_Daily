-- Run this in your Supabase SQL Editor to enable usage tracking and premium status

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_used_date TEXT DEFAULT (TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD'));

-- Function to increment usage count
CREATE OR REPLACE FUNCTION increment_usage(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET usage_count = usage_count + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
