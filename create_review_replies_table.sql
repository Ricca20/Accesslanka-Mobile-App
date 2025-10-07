-- Create the review_replies table if it doesn't exist
CREATE TABLE IF NOT EXISTS review_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Enable RLS
ALTER TABLE review_replies ENABLE ROW LEVEL SECURITY;

-- Review replies policies
DROP POLICY IF EXISTS "Anyone can view replies" ON review_replies;
DROP POLICY IF EXISTS "Authenticated users can create replies" ON review_replies;

CREATE POLICY "Anyone can view replies" ON review_replies FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create replies" ON review_replies FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own replies" ON review_replies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own replies" ON review_replies FOR DELETE USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_review_replies_updated_at BEFORE UPDATE ON review_replies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();