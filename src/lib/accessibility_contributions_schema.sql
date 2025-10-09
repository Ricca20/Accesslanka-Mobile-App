-- Accessibility Contributions Schema
-- This script creates tables for mission participants to add photos, reviews, and ratings

-- Accessibility Photos table
CREATE TABLE IF NOT EXISTS accessibility_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mission_id UUID REFERENCES mapmissions(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_path TEXT NOT NULL, -- Storage path for easy deletion
  feature_type VARCHAR(50) NOT NULL, -- e.g., 'ramp', 'elevator', 'parking', 'restroom', 'entrance'
  feature_description TEXT,
  location_description TEXT, -- e.g., 'Main entrance', 'Second floor restroom'
  is_helpful BOOLEAN DEFAULT true, -- Whether this photo shows a helpful accessibility feature
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
  overall_rating DECIMAL(2,1) GENERATED ALWAYS AS ((accessibility_rating + availability_rating + condition_rating) / 3.0) STORED,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  
  -- Prevent duplicate ratings for same feature by same user in same mission
  UNIQUE(mission_id, user_id, feature_type)
);

-- Mission Contributions tracking table
CREATE TABLE IF NOT EXISTS mission_contributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mission_id UUID REFERENCES mapmissions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  photos_count INTEGER DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  ratings_count INTEGER DEFAULT 0,
  total_contributions INTEGER GENERATED ALWAYS AS (photos_count + reviews_count + ratings_count) STORED,
  last_contribution_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  
  -- One record per user per mission
  UNIQUE(mission_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE accessibility_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE accessibility_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE accessibility_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_contributions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for accessibility_photos
CREATE POLICY "Anyone can view accessibility photos" ON accessibility_photos FOR SELECT USING (true);
CREATE POLICY "Mission participants can add photos" ON accessibility_photos FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND 
  EXISTS (
    SELECT 1 FROM mapmission_participants 
    WHERE mission_id = accessibility_photos.mission_id AND user_id = auth.uid()
  )
);
CREATE POLICY "Users can update own photos" ON accessibility_photos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own photos" ON accessibility_photos FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for accessibility_reviews
CREATE POLICY "Anyone can view accessibility reviews" ON accessibility_reviews FOR SELECT USING (true);
CREATE POLICY "Mission participants can add reviews" ON accessibility_reviews FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND 
  EXISTS (
    SELECT 1 FROM mapmission_participants 
    WHERE mission_id = accessibility_reviews.mission_id AND user_id = auth.uid()
  )
);
CREATE POLICY "Users can update own reviews" ON accessibility_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON accessibility_reviews FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for accessibility_ratings
CREATE POLICY "Anyone can view accessibility ratings" ON accessibility_ratings FOR SELECT USING (true);
CREATE POLICY "Mission participants can add ratings" ON accessibility_ratings FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND 
  EXISTS (
    SELECT 1 FROM mapmission_participants 
    WHERE mission_id = accessibility_ratings.mission_id AND user_id = auth.uid()
  )
);
CREATE POLICY "Users can update own ratings" ON accessibility_ratings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ratings" ON accessibility_ratings FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for mission_contributions
CREATE POLICY "Anyone can view mission contributions" ON mission_contributions FOR SELECT USING (true);
CREATE POLICY "System can manage contributions" ON mission_contributions FOR ALL USING (true);

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

CREATE INDEX IF NOT EXISTS idx_mission_contributions_mission_id ON mission_contributions(mission_id);
CREATE INDEX IF NOT EXISTS idx_mission_contributions_user_id ON mission_contributions(user_id);

-- Add triggers for updated_at columns
CREATE TRIGGER update_accessibility_reviews_updated_at BEFORE UPDATE ON accessibility_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accessibility_ratings_updated_at BEFORE UPDATE ON accessibility_ratings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mission_contributions_updated_at BEFORE UPDATE ON mission_contributions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update contribution counts
CREATE OR REPLACE FUNCTION update_contribution_counts()
RETURNS TRIGGER AS $$
DECLARE
  m_id UUID;
  u_id UUID;
  photos_cnt INTEGER := 0;
  reviews_cnt INTEGER := 0;
  ratings_cnt INTEGER := 0;
BEGIN
  -- Get mission_id and user_id from the changed record
  IF TG_TABLE_NAME = 'accessibility_photos' THEN
    m_id := COALESCE(NEW.mission_id, OLD.mission_id);
    u_id := COALESCE(NEW.user_id, OLD.user_id);
  ELSIF TG_TABLE_NAME = 'accessibility_reviews' THEN
    m_id := COALESCE(NEW.mission_id, OLD.mission_id);
    u_id := COALESCE(NEW.user_id, OLD.user_id);
  ELSIF TG_TABLE_NAME = 'accessibility_ratings' THEN
    m_id := COALESCE(NEW.mission_id, OLD.mission_id);
    u_id := COALESCE(NEW.user_id, OLD.user_id);
  END IF;

  -- Count current contributions
  SELECT COUNT(*) INTO photos_cnt FROM accessibility_photos WHERE mission_id = m_id AND user_id = u_id;
  SELECT COUNT(*) INTO reviews_cnt FROM accessibility_reviews WHERE mission_id = m_id AND user_id = u_id;
  SELECT COUNT(*) INTO ratings_cnt FROM accessibility_ratings WHERE mission_id = m_id AND user_id = u_id;

  -- Insert or update contribution record
  INSERT INTO mission_contributions (mission_id, user_id, photos_count, reviews_count, ratings_count, last_contribution_at)
  VALUES (m_id, u_id, photos_cnt, reviews_cnt, ratings_cnt, timezone('utc', now()))
  ON CONFLICT (mission_id, user_id) 
  DO UPDATE SET 
    photos_count = photos_cnt,
    reviews_count = reviews_cnt,
    ratings_count = ratings_cnt,
    last_contribution_at = timezone('utc', now()),
    updated_at = timezone('utc', now());

  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Add triggers to update contribution counts
CREATE TRIGGER update_photo_contributions 
  AFTER INSERT OR UPDATE OR DELETE ON accessibility_photos
  FOR EACH ROW EXECUTE FUNCTION update_contribution_counts();

CREATE TRIGGER update_review_contributions 
  AFTER INSERT OR UPDATE OR DELETE ON accessibility_reviews
  FOR EACH ROW EXECUTE FUNCTION update_contribution_counts();

CREATE TRIGGER update_rating_contributions 
  AFTER INSERT OR UPDATE OR DELETE ON accessibility_ratings
  FOR EACH ROW EXECUTE FUNCTION update_contribution_counts();

-- Function to get user's mission contribution summary
CREATE OR REPLACE FUNCTION get_user_mission_contributions(mission_uuid UUID, user_uuid UUID)
RETURNS TABLE(
  photos_count INTEGER,
  reviews_count INTEGER,
  ratings_count INTEGER,
  total_contributions INTEGER,
  last_contribution_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(mc.photos_count, 0) as photos_count,
    COALESCE(mc.reviews_count, 0) as reviews_count,
    COALESCE(mc.ratings_count, 0) as ratings_count,
    COALESCE(mc.total_contributions, 0) as total_contributions,
    mc.last_contribution_at
  FROM mission_contributions mc
  WHERE mc.mission_id = mission_uuid AND mc.user_id = user_uuid;
END;
$$ language 'plpgsql';

-- Function to get business accessibility summary from mission contributions
CREATE OR REPLACE FUNCTION get_business_accessibility_summary(business_uuid UUID, mission_uuid UUID DEFAULT NULL)
RETURNS TABLE(
  feature_type TEXT,
  photo_count BIGINT,
  review_count BIGINT,
  rating_count BIGINT,
  avg_accessibility_rating DECIMAL,
  avg_availability_rating DECIMAL,
  avg_condition_rating DECIMAL,
  avg_overall_rating DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(p.feature_type, r.feature_type, rt.feature_type) as feature_type,
    COALESCE(photo_counts.cnt, 0) as photo_count,
    COALESCE(review_counts.cnt, 0) as review_count,
    COALESCE(rating_counts.cnt, 0) as rating_count,
    COALESCE(rating_avgs.avg_accessibility, 0) as avg_accessibility_rating,
    COALESCE(rating_avgs.avg_availability, 0) as avg_availability_rating,
    COALESCE(rating_avgs.avg_condition, 0) as avg_condition_rating,
    COALESCE(rating_avgs.avg_overall, 0) as avg_overall_rating
  FROM (
    SELECT DISTINCT feature_type FROM accessibility_photos 
    WHERE business_id = business_uuid AND (mission_uuid IS NULL OR mission_id = mission_uuid)
    UNION
    SELECT DISTINCT feature_type FROM accessibility_reviews 
    WHERE business_id = business_uuid AND (mission_uuid IS NULL OR mission_id = mission_uuid)
    UNION
    SELECT DISTINCT feature_type FROM accessibility_ratings 
    WHERE business_id = business_uuid AND (mission_uuid IS NULL OR mission_id = mission_uuid)
  ) features
  LEFT JOIN accessibility_photos p ON p.feature_type = features.feature_type AND p.business_id = business_uuid AND (mission_uuid IS NULL OR p.mission_id = mission_uuid)
  LEFT JOIN accessibility_reviews r ON r.feature_type = features.feature_type AND r.business_id = business_uuid AND (mission_uuid IS NULL OR r.mission_id = mission_uuid)
  LEFT JOIN accessibility_ratings rt ON rt.feature_type = features.feature_type AND rt.business_id = business_uuid AND (mission_uuid IS NULL OR rt.mission_id = mission_uuid)
  LEFT JOIN (
    SELECT feature_type, COUNT(*) as cnt FROM accessibility_photos 
    WHERE business_id = business_uuid AND (mission_uuid IS NULL OR mission_id = mission_uuid)
    GROUP BY feature_type
  ) photo_counts ON photo_counts.feature_type = features.feature_type
  LEFT JOIN (
    SELECT feature_type, COUNT(*) as cnt FROM accessibility_reviews 
    WHERE business_id = business_uuid AND (mission_uuid IS NULL OR mission_id = mission_uuid)
    GROUP BY feature_type
  ) review_counts ON review_counts.feature_type = features.feature_type
  LEFT JOIN (
    SELECT feature_type, COUNT(*) as cnt FROM accessibility_ratings 
    WHERE business_id = business_uuid AND (mission_uuid IS NULL OR mission_id = mission_uuid)
    GROUP BY feature_type
  ) rating_counts ON rating_counts.feature_type = features.feature_type
  LEFT JOIN (
    SELECT 
      feature_type, 
      AVG(accessibility_rating) as avg_accessibility,
      AVG(availability_rating) as avg_availability,
      AVG(condition_rating) as avg_condition,
      AVG(overall_rating) as avg_overall
    FROM accessibility_ratings 
    WHERE business_id = business_uuid AND (mission_uuid IS NULL OR mission_id = mission_uuid)
    GROUP BY feature_type
  ) rating_avgs ON rating_avgs.feature_type = features.feature_type
  GROUP BY features.feature_type, photo_counts.cnt, review_counts.cnt, rating_counts.cnt, 
           rating_avgs.avg_accessibility, rating_avgs.avg_availability, rating_avgs.avg_condition, rating_avgs.avg_overall;
END;
$$ language 'plpgsql';