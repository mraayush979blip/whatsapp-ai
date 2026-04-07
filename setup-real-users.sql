-- Run this file in your Supabase SQL Editor to enable Real Users and Real Statuses

-- 1. Create the `profiles` table
CREATE TABLE public.profiles (
  id uuid references auth.users not null primary key,
  email text not null,
  name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Create the trigger to sync new users to profiles automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Backfill existing users (so the test accounts already created will work immediately!)
INSERT INTO public.profiles (id, email, name, avatar_url)
SELECT id, email, raw_user_meta_data->>'full_name', raw_user_meta_data->>'avatar_url'
FROM auth.users
ON CONFLICT (id) DO NOTHING;


-- 4. Create the `statuses` table
CREATE TABLE public.statuses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  image_url text not null,
  caption text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for statuses
ALTER TABLE public.statuses ENABLE ROW LEVEL SECURITY;

-- Create policies for statuses
CREATE POLICY "Statuses are viewable by everyone." ON public.statuses FOR SELECT USING (true);
CREATE POLICY "Users can insert their own statuses." ON public.statuses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own statuses." ON public.statuses FOR DELETE USING (auth.uid() = user_id);

-- 5. Create Storage Bucket for status images (you can run this SQL or create it in Dashboard manually)
INSERT INTO storage.buckets (id, name, public) VALUES ('status_images', 'status_images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatar images are publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'status_images' );

CREATE POLICY "Anyone can upload an avatar."
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'status_images' );
