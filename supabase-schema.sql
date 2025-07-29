-- Supabase Database Schema for Vibe Social Connection App
-- Run these commands in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profiles table
CREATE TABLE user_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    interests JSONB DEFAULT '{}',
    insights JSONB DEFAULT '{}',
    profile_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create user_interests table
CREATE TABLE user_interests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL,
    category TEXT NOT NULL,
    interest_name TEXT NOT NULL,
    entity_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE
);

-- Create user_insights table
CREATE TABLE user_insights (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL,
    category TEXT NOT NULL,
    insight_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    entity_name TEXT NOT NULL,
    popularity_score DECIMAL(10,2) DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_user_interests_user_id ON user_interests(user_id);
CREATE INDEX idx_user_interests_category ON user_interests(category);
CREATE INDEX idx_user_interests_interest_name ON user_interests(interest_name);
CREATE INDEX idx_user_insights_user_id ON user_insights(user_id);
CREATE INDEX idx_user_insights_category ON user_insights(category);
CREATE INDEX idx_user_insights_entity_id ON user_insights(entity_id);

-- Create RLS (Row Level Security) policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_insights ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles
CREATE POLICY "Users can view their own profiles" ON user_profiles
    FOR SELECT USING (true); -- For now, allow all reads (you can restrict this later)

CREATE POLICY "Users can insert their own profiles" ON user_profiles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own profiles" ON user_profiles
    FOR UPDATE USING (true);

-- Policies for user_interests
CREATE POLICY "Users can view all interests" ON user_interests
    FOR SELECT USING (true);

CREATE POLICY "Users can insert interests" ON user_interests
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own interests" ON user_interests
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own interests" ON user_interests
    FOR DELETE USING (true);

-- Policies for user_insights
CREATE POLICY "Users can view all insights" ON user_insights
    FOR SELECT USING (true);

CREATE POLICY "Users can insert insights" ON user_insights
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own insights" ON user_insights
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own insights" ON user_insights
    FOR DELETE USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (optional - for testing)
-- Uncomment the lines below if you want some test data

/*
INSERT INTO user_profiles (user_id, interests, insights, profile_completed) VALUES 
('test_user_1', 
 '{"artist": ["The Beatles", "Queen"], "movie": ["Inception", "The Matrix"]}',
 '{"artist": [{"entity_id": "1", "name": "Led Zeppelin", "popularity": 85}]}',
 true
);

INSERT INTO user_interests (user_id, category, interest_name) VALUES 
('test_user_1', 'artist', 'The Beatles'),
('test_user_1', 'artist', 'Queen'),
('test_user_1', 'movie', 'Inception'),
('test_user_1', 'movie', 'The Matrix');

INSERT INTO user_insights (user_id, category, insight_type, entity_id, entity_name, popularity_score) VALUES 
('test_user_1', 'artist', 'recommendation', '1', 'Led Zeppelin', 85.0),
('test_user_1', 'artist', 'recommendation', '2', 'Pink Floyd', 82.5);
*/
