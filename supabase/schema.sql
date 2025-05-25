-- Create tables
CREATE TABLE voids (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  access_code TEXT NOT NULL UNIQUE,
  user_cap INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  is_private BOOLEAN DEFAULT false,
  created_by UUID
);

CREATE TABLE void_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  void_id UUID REFERENCES voids(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  avatar_url TEXT NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  media_uploads JSONB DEFAULT '{"images": 0, "videos": 0}'::jsonb,
  UNIQUE(void_id, nickname)
);

CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  void_id UUID REFERENCES voids(id) ON DELETE CASCADE,
  user_id UUID REFERENCES void_users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('image', 'video')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create indexes
CREATE INDEX idx_voids_access_code ON voids(access_code);
CREATE INDEX idx_messages_void_id ON messages(void_id);
CREATE INDEX idx_messages_expires_at ON messages(expires_at);
CREATE INDEX idx_void_users_void_id ON void_users(void_id);

-- Enable Row Level Security
ALTER TABLE voids ENABLE ROW LEVEL SECURITY;
ALTER TABLE void_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active voids"
  ON voids FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create voids"
  ON voids FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view void users"
  ON void_users FOR SELECT
  USING (true);

CREATE POLICY "Anyone can join voids"
  ON void_users FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view messages"
  ON messages FOR SELECT
  USING (true);

CREATE POLICY "Void users can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM void_users
      WHERE void_users.id = messages.user_id
      AND void_users.void_id = messages.void_id
    )
  );

-- Create function to delete expired messages
CREATE OR REPLACE FUNCTION delete_expired_messages()
RETURNS void AS $$
BEGIN
  DELETE FROM messages
  WHERE expires_at < timezone('utc'::text, now());
END;
$$ LANGUAGE plpgsql;

-- Create a cron job to run the cleanup function every minute
SELECT cron.schedule(
  'delete-expired-messages',
  '* * * * *',
  $$SELECT delete_expired_messages()$$
); 