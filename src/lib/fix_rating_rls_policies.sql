-- Fix for MapMission rating error: Allow mission creators to add ratings
-- This script updates the RLS policies to allow both participants AND mission creators
-- to add photos, reviews, and ratings to accessibility tables

-- Drop existing policies for accessibility_photos
DROP POLICY "Mission participants can add photos" ON accessibility_photos;

-- Drop existing policies for accessibility_reviews  
DROP POLICY "Mission participants can add reviews" ON accessibility_reviews;

-- Drop existing policies for accessibility_ratings
DROP POLICY "Mission participants can add ratings" ON accessibility_ratings;

-- Create updated policy for accessibility_photos
CREATE POLICY "Mission participants can add photos" ON accessibility_photos FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND 
  (
    -- Allow mission participants
    EXISTS (
      SELECT 1 FROM mapmission_participants 
      WHERE mission_id = accessibility_photos.mission_id AND user_id = auth.uid()
    )
    OR
    -- Allow mission creators
    EXISTS (
      SELECT 1 FROM mapmissions 
      WHERE id = accessibility_photos.mission_id AND created_by = auth.uid()
    )
  )
);

-- Create updated policy for accessibility_reviews
CREATE POLICY "Mission participants can add reviews" ON accessibility_reviews FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND 
  (
    -- Allow mission participants
    EXISTS (
      SELECT 1 FROM mapmission_participants 
      WHERE mission_id = accessibility_reviews.mission_id AND user_id = auth.uid()
    )
    OR
    -- Allow mission creators
    EXISTS (
      SELECT 1 FROM mapmissions 
      WHERE id = accessibility_reviews.mission_id AND created_by = auth.uid()
    )
  )
);

-- Create updated policy for accessibility_ratings
CREATE POLICY "Mission participants can add ratings" ON accessibility_ratings FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND 
  (
    -- Allow mission participants
    EXISTS (
      SELECT 1 FROM mapmission_participants 
      WHERE mission_id = accessibility_ratings.mission_id AND user_id = auth.uid()
    )
    OR
    -- Allow mission creators
    EXISTS (
      SELECT 1 FROM mapmissions 
      WHERE id = accessibility_ratings.mission_id AND created_by = auth.uid()
    )
  )
);