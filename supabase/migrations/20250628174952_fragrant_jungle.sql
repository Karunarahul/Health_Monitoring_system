/*
  # Add Physical Data to User Profiles

  1. New Columns
    - `weight` (integer) - User weight in kg
    - `height` (integer) - User height in cm

  2. Updates
    - Add weight and height columns to profiles table
    - These are optional fields to maintain compatibility
*/

-- Add weight and height columns to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'weight'
  ) THEN
    ALTER TABLE profiles ADD COLUMN weight integer CHECK (weight > 20 AND weight < 500);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'height'
  ) THEN
    ALTER TABLE profiles ADD COLUMN height integer CHECK (height > 50 AND height < 300);
  END IF;
END $$;