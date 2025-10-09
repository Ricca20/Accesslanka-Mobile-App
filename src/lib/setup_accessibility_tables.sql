-- Simple Accessibility Contributions Setup
-- Run this SQL in your Supabase dashboard to create the missing tables

-- First ensure the update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add verification fields to businesses table if they don't exist
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS verification_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS verification_source UUID,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

-- Accessibility Photos table
CREATE TABLE IF NOT EXISTS accessibility_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mission_id UUID REFERENCES mapmissions(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_path TEXT NOT NULL,
  feature_type VARCHAR(50) NOT NULL,
  feature_description TEXT,
  location_description TEXT,
  is_helpful BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Accessibility Reviews table
CREATE TABLE IF NOT EXISTS accessibility_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mission_id UUID REFERENCES mapmissions(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  feature_type VARCHAR(50) NOT NULL,
  review_text TEXT NOT NULL,
  difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('easy', 'moderate', 'difficult', 'impossible')),
  helpfulness_rating INTEGER CHECK (helpfulness_rating >= 1 AND helpfulness_rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Accessibility Ratings table
CREATE TABLE IF NOT EXISTS accessibility_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mission_id UUID REFERENCES mapmissions(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  feature_type VARCHAR(50) NOT NULL,
  accessibility_rating INTEGER CHECK (accessibility_rating >= 1 AND accessibility_rating <= 5),
  availability_rating INTEGER CHECK (availability_rating >= 1 AND availability_rating <= 5),
  condition_rating INTEGER CHECK (condition_rating >= 1 AND condition_rating <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  
  -- Prevent duplicate ratings for same feature by same user in same mission
  UNIQUE(mission_id, user_id, feature_type)
);

-- Enable RLS on all tables
ALTER TABLE accessibility_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE accessibility_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE accessibility_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for accessibility_photos
CREATE POLICY "Anyone can view accessibility photos" ON accessibility_photos FOR SELECT USING (true);
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
CREATE POLICY "Users can update own photos" ON accessibility_photos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own photos" ON accessibility_photos FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for accessibility_reviews
CREATE POLICY "Anyone can view accessibility reviews" ON accessibility_reviews FOR SELECT USING (true);
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
CREATE POLICY "Users can update own reviews" ON accessibility_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON accessibility_reviews FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for accessibility_ratings
CREATE POLICY "Anyone can view accessibility ratings" ON accessibility_ratings FOR SELECT USING (true);
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
CREATE POLICY "Users can update own ratings" ON accessibility_ratings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ratings" ON accessibility_ratings FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_accessibility_photos_mission_id ON accessibility_photos(mission_id);
CREATE INDEX IF NOT EXISTS idx_accessibility_photos_business_id ON accessibility_photos(business_id);
CREATE INDEX IF NOT EXISTS idx_accessibility_photos_user_id ON accessibility_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_accessibility_photos_feature_type ON accessibility_photos(feature_type);

CREATE INDEX IF NOT EXISTS idx_accessibility_reviews_mission_id ON accessibility_reviews(mission_id);
CREATE INDEX IF NOT EXISTS idx_accessibility_reviews_business_id ON accessibility_reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_accessibility_reviews_user_id ON accessibility_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_accessibility_reviews_feature_type ON accessibility_reviews(feature_type);

CREATE INDEX IF NOT EXISTS idx_accessibility_ratings_mission_id ON accessibility_ratings(mission_id);
CREATE INDEX IF NOT EXISTS idx_accessibility_ratings_business_id ON accessibility_ratings(business_id);
CREATE INDEX IF NOT EXISTS idx_accessibility_ratings_user_id ON accessibility_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_accessibility_ratings_feature_type ON accessibility_ratings(feature_type);

-- Add triggers for updated_at columns
CREATE TRIGGER update_accessibility_reviews_updated_at BEFORE UPDATE ON accessibility_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accessibility_ratings_updated_at BEFORE UPDATE ON accessibility_ratings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();