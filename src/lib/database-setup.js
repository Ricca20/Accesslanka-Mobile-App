// Database utility script to set up required database tables and schema
// Run this script once to update the database schema

import { supabase } from './supabase.js'

const addStatusColumnToBusinesses = async () => {
  try {
    console.log('Checking if status column exists in businesses table...')
    
    // First, let's try to query for status column to see if it exists
    const { data: testData, error: testError } = await supabase
      .from('businesses')
      .select('status')
      .limit(1)
    
    if (testError && testError.code === 'PGRST118') {
      // Column doesn't exist, this is expected
      console.log('Status column does not exist. Please run the SQL manually.')
      console.log('Run this SQL command in your Supabase dashboard:')
      console.log(`
-- Add status column to businesses table
ALTER TABLE businesses 
ADD COLUMN status VARCHAR(20) DEFAULT 'pending' 
CHECK (status IN ('pending', 'approved', 'rejected'));

-- Create index for better performance
CREATE INDEX idx_businesses_status ON businesses(status);

-- Update existing businesses to approved status
UPDATE businesses SET status = 'approved' WHERE status IS NULL;
      `)
      throw new Error('Status column missing - please add manually using SQL above')
    } else if (testError) {
      console.error('Error checking status column:', testError)
      throw testError
    } else {
      console.log('Status column already exists!')
      return true
    }
    
  } catch (error) {
    console.error('Database setup error:', error)
    throw error
  }
}

const createMapMissionTables = async () => {
  try {
    console.log('Checking if MapMissions tables exist...')
    
    // Check if mapmissions table exists
    const { data: testData, error: testError } = await supabase
      .from('mapmissions')
      .select('id')
      .limit(1)
    
    if (testError && testError.code === 'PGRST205') {
      // Table doesn't exist
      console.log('MapMissions tables do not exist. Please run the SQL manually.')
      console.log('Run this SQL command in your Supabase dashboard:')
      console.log(`
-- MapMissions database schema
-- This script creates the necessary tables for the MapMission functionality

-- First, create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- MapMissions table
CREATE TABLE IF NOT EXISTS mapmissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  max_participants INTEGER DEFAULT 5,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  difficulty_level VARCHAR(20) DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  reward_badge VARCHAR(50),
  status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
  created_by UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- MapMission participants table
CREATE TABLE IF NOT EXISTS mapmission_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mission_id UUID REFERENCES mapmissions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  progress DECIMAL(3,2) DEFAULT 0.00,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Prevent duplicate participation
  UNIQUE(mission_id, user_id)
);

-- Enable RLS
ALTER TABLE mapmissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mapmission_participants ENABLE ROW LEVEL SECURITY;

-- MapMissions policies
CREATE POLICY "Anyone can view mapmissions" ON mapmissions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create mapmissions" ON mapmissions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own mapmissions" ON mapmissions FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete own mapmissions" ON mapmissions FOR DELETE USING (auth.uid() = created_by);

-- MapMission participants policies
CREATE POLICY "Anyone can view participants" ON mapmission_participants FOR SELECT USING (true);
CREATE POLICY "Authenticated users can join missions" ON mapmission_participants FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own participation" ON mapmission_participants FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can leave missions" ON mapmission_participants FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mapmissions_business_id ON mapmissions(business_id);
CREATE INDEX IF NOT EXISTS idx_mapmissions_status ON mapmissions(status);
CREATE INDEX IF NOT EXISTS idx_mapmissions_start_date ON mapmissions(start_date);
CREATE INDEX IF NOT EXISTS idx_mapmissions_created_by ON mapmissions(created_by);
CREATE INDEX IF NOT EXISTS idx_mapmission_participants_mission_id ON mapmission_participants(mission_id);
CREATE INDEX IF NOT EXISTS idx_mapmission_participants_user_id ON mapmission_participants(user_id);

-- Add trigger to update updated_at for mapmissions
CREATE TRIGGER update_mapmissions_updated_at BEFORE UPDATE ON mapmissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update mission status based on dates
CREATE OR REPLACE FUNCTION update_mission_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If start date has passed and status is still 'upcoming', change to 'active'
  IF NEW.start_date <= NOW() AND NEW.status = 'upcoming' THEN
    NEW.status = 'active';
  END IF;
  
  -- If end date has passed and status is 'active', change to 'completed'
  IF NEW.end_date <= NOW() AND NEW.status = 'active' THEN
    NEW.status = 'completed';
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to automatically update mission status
CREATE TRIGGER auto_update_mission_status
  BEFORE INSERT OR UPDATE ON mapmissions
  FOR EACH ROW EXECUTE FUNCTION update_mission_status();

-- Function to get mission statistics
CREATE OR REPLACE FUNCTION get_mission_stats(mission_uuid UUID)
RETURNS TABLE(
  total_participants INTEGER,
  active_participants INTEGER,
  completion_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_participants,
    COUNT(CASE WHEN completed_at IS NULL THEN 1 END)::INTEGER as active_participants,
    COALESCE(AVG(progress), 0)::DECIMAL as completion_rate
  FROM mapmission_participants 
  WHERE mission_id = mission_uuid;
END;
$$ language 'plpgsql';
      `)
      throw new Error('MapMissions tables missing - please add manually using SQL above')
    } else if (testError) {
      console.error('Error checking MapMissions tables:', testError)
      throw testError
    } else {
      console.log('MapMissions tables already exist!')
      return true
    }
    
  } catch (error) {
    console.error('MapMissions setup error:', error)
    throw error
  }
}

const setupDatabase = async () => {
  try {
    console.log('Starting database setup...')
    
    await addStatusColumnToBusinesses()
    await createMapMissionTables()
    
    console.log('Database setup completed successfully!')
    return true
  } catch (error) {
    console.error('Database setup failed:', error)
    throw error
  }
}

// Export for use in React Native app
export { addStatusColumnToBusinesses, createMapMissionTables, setupDatabase }

// If running as a script
if (typeof require !== 'undefined' && require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('Script completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Script failed:', error)
      process.exit(1)
    })
}