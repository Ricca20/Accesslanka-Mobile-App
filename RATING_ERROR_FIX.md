-- INSTRUCTIONS TO FIX MAPMISSION RATING ERROR
-- 
-- The error "Failed to add rating. Please try again" occurs because the RLS policies
-- don't allow mission creators to add ratings (only participants can).
--
-- SOLUTION 1: Apply the updated RLS policies (run this in your Supabase SQL editor)
-- 
-- First, drop the existing restrictive policies:
DROP POLICY "Mission participants can add photos" ON accessibility_photos;
DROP POLICY "Mission participants can add reviews" ON accessibility_reviews;  
DROP POLICY "Mission participants can add ratings" ON accessibility_ratings;

-- Then create the updated policies that allow both participants AND creators:

CREATE POLICY "Mission participants can add photos" ON accessibility_photos FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND 
  (
    EXISTS (
      SELECT 1 FROM mapmission_participants 
      WHERE mission_id = accessibility_photos.mission_id AND user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM mapmissions 
      WHERE id = accessibility_photos.mission_id AND created_by = auth.uid()
    )
  )
);

CREATE POLICY "Mission participants can add reviews" ON accessibility_reviews FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND 
  (
    EXISTS (
      SELECT 1 FROM mapmission_participants 
      WHERE mission_id = accessibility_reviews.mission_id AND user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM mapmissions 
      WHERE id = accessibility_reviews.mission_id AND created_by = auth.uid()
    )
  )
);

CREATE POLICY "Mission participants can add ratings" ON accessibility_ratings FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND 
  (
    EXISTS (
      SELECT 1 FROM mapmission_participants 
      WHERE mission_id = accessibility_ratings.mission_id AND user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM mapmissions 
      WHERE id = accessibility_ratings.mission_id AND created_by = auth.uid()
    )
  )
);

--
-- SOLUTION 2: If you prefer, simply run the updated setup_accessibility_tables.sql
-- which now includes the corrected policies
--
-- WHAT WAS FIXED:
-- 1. Updated createMapMission() to automatically add creator as participant
-- 2. Updated RLS policies to allow both participants AND mission creators
-- 3. This ensures mission creators can add photos, reviews, and ratings
--