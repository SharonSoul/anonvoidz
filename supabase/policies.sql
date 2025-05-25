-- Enable RLS
ALTER TABLE void_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE voids ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view void users
CREATE POLICY "Allow anyone to view void users"
ON void_users FOR SELECT
TO public
USING (true);

-- Allow anyone to insert into void users
CREATE POLICY "Allow anyone to insert into void users"
ON void_users FOR INSERT
TO public
WITH CHECK (true);

-- Allow users to update their own records
CREATE POLICY "Allow users to update their own records"
ON void_users FOR UPDATE
TO public
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow users to delete their own records
CREATE POLICY "Allow users to delete their own records"
ON void_users FOR DELETE
TO public
USING (auth.uid() = id);

-- Allow void creators to delete their voids and related data
CREATE POLICY "Allow void creators to delete their voids"
ON voids FOR DELETE
TO public
USING (auth.uid() = created_by);

-- Allow void creators to delete messages in their voids
CREATE POLICY "Allow void creators to delete messages in their voids"
ON messages FOR DELETE
TO public
USING (
  EXISTS (
    SELECT 1 FROM voids
    WHERE voids.id = messages.void_id
    AND voids.created_by = auth.uid()
  )
);

-- Allow void creators to delete users in their voids
CREATE POLICY "Allow void creators to delete users in their voids"
ON void_users FOR DELETE
TO public
USING (
  EXISTS (
    SELECT 1 FROM voids
    WHERE voids.id = void_users.void_id
    AND voids.created_by = auth.uid()
  )
); 