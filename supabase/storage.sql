-- Enable RLS on all tables
alter table messages enable row level security;
alter table void_users enable row level security;
alter table voids enable row level security;

-- Create admin role if it doesn't exist
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'admin') then
    create role admin;
  end if;
end
$$;

-- Grant necessary permissions to admin role
grant all on messages to admin;
grant all on void_users to admin;
grant all on voids to admin;
grant all on storage.objects to admin;

-- Comment out drop statements to prevent destructive operations
/*
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated users can upload media" on storage.objects;
drop policy if exists "Users can delete their own media" on storage.objects;
drop policy if exists "Admin can delete all media" on storage.objects;
drop policy if exists "Users can update their own media" on storage.objects;
drop policy if exists "Admin can delete all messages" on messages;
drop policy if exists "Admin can delete all users" on void_users;
drop policy if exists "Admin can delete all voids" on voids;
drop policy if exists "Users can insert messages" on messages;
drop policy if exists "Users can read messages" on messages;
*/

-- Create storage bucket for void media if it doesn't exist
insert into storage.buckets (id, name, public)
values ('void-media', 'void-media', true)
on conflict (id) do update
set name = 'void-media',
    public = true;

-- Create policies if they don't exist
do $$
begin
  -- Public Access policy
  if not exists (select 1 from pg_policies where tablename = 'objects' and policyname = 'Public Access') then
    create policy "Public Access"
    on storage.objects for select
    using ( bucket_id = 'void-media' );
  end if;

  -- Authenticated users upload policy
  if not exists (select 1 from pg_policies where tablename = 'objects' and policyname = 'Authenticated users can upload media') then
    create policy "Authenticated users can upload media"
    on storage.objects for insert
    with check (
      bucket_id = 'void-media' AND
      auth.role() = 'authenticated'
    );
  end if;

  -- Users delete own media policy
  if not exists (select 1 from pg_policies where tablename = 'objects' and policyname = 'Users can delete their own media') then
    create policy "Users can delete their own media"
    on storage.objects for delete
    using (
      bucket_id = 'void-media' AND
      auth.role() = 'authenticated'
    );
  end if;

  -- Admin delete all media policy
  if not exists (select 1 from pg_policies where tablename = 'objects' and policyname = 'Admin can delete all media') then
    create policy "Admin can delete all media"
    on storage.objects for delete
    using ( bucket_id = 'void-media' );
  end if;

  -- Users update own media policy
  if not exists (select 1 from pg_policies where tablename = 'objects' and policyname = 'Users can update their own media') then
    create policy "Users can update their own media"
    on storage.objects for update
    using (
      bucket_id = 'void-media' AND
      auth.role() = 'authenticated'
    );
  end if;

  -- Admin delete all messages policy
  if not exists (select 1 from pg_policies where tablename = 'messages' and policyname = 'Admin can delete all messages') then
    create policy "Admin can delete all messages"
    on messages for delete
    using ( true );
  end if;

  -- Admin delete all users policy
  if not exists (select 1 from pg_policies where tablename = 'void_users' and policyname = 'Admin can delete all users') then
    create policy "Admin can delete all users"
    on void_users for delete
    using ( true );
  end if;

  -- Admin delete all voids policy
  if not exists (select 1 from pg_policies where tablename = 'voids' and policyname = 'Admin can delete all voids') then
    create policy "Admin can delete all voids"
    on voids for delete
    using ( true );
  end if;

  -- Users insert messages policy
  if not exists (select 1 from pg_policies where tablename = 'messages' and policyname = 'Users can insert messages') then
    create policy "Users can insert messages"
    on messages for insert
    with check (
      auth.role() = 'authenticated' AND
      user_id = auth.uid()
    );
  end if;

  -- Users read messages policy
  if not exists (select 1 from pg_policies where tablename = 'messages' and policyname = 'Users can read messages') then
    create policy "Users can read messages"
    on messages for select
    using ( true );
  end if;
end $$;

-- Create or replace function for media cleanup
create or replace function cleanup_media_on_message_delete()
returns trigger as $$
begin
  if old.media_url is not null then
    delete from storage.objects
    where bucket_id = 'void-media'
    and name = old.media_url;
  end if;
  return old;
end;
$$ language plpgsql security definer;

-- Create trigger if it doesn't exist
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'cleanup_media_on_message_delete') then
    create trigger cleanup_media_on_message_delete
      after delete on messages
      for each row
      execute function cleanup_media_on_message_delete();
  end if;
end $$;

-- Create or replace function for message insert notification
create or replace function handle_message_insert()
returns trigger as $$
begin
  perform pg_notify('message_insert', json_build_object('event', 'INSERT', 'message_id', NEW.id, 'user_id', NEW.user_id, 'content', NEW.content, 'created_at', NEW.created_at)::text);
  return NEW;
end;
$$ language plpgsql security definer;

-- Create trigger if it doesn't exist
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'message_insert_trigger') then
    create trigger message_insert_trigger
      after insert on messages
      for each row
      execute function handle_message_insert();
  end if;
end $$; 