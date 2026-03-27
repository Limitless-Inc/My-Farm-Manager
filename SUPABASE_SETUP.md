# Supabase Setup Guide for My-Farm-Manager

This guide helps you create the required database tables in Supabase for the app to work.

## Project Details
- **Supabase URL**: https://znchlwpfpgeatlwanrir.supabase.co
- **Project URL**: https://supabase.com/dashboard/project/znchlwpfpgeatlwanrir

---

## Table 1: products (Market Page)

### SQL Query
Copy and run this in the SQL Editor of your Supabase dashboard:

```sql
-- Create products table with user ownership
CREATE TABLE IF NOT EXISTS products (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  prodName TEXT NOT NULL,
  prodCategory TEXT,
  prodPrice TEXT,
  prodQty TEXT,
  prodLocation TEXT,
  prodContact TEXT,
  prodDesc TEXT,
  image TEXT,
  video TEXT,
  sold BOOLEAN DEFAULT FALSE,
  likes INTEGER DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT,
  created BIGINT NOT NULL
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own products
CREATE POLICY "Users can insert their own products" ON products
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow everyone to view products
CREATE POLICY "Everyone can view products" ON products
  FOR SELECT
  USING (true);

-- Allow users to update their own products
CREATE POLICY "Users can update their own products" ON products
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow users to delete their own products
CREATE POLICY "Users can delete their own products" ON products
  FOR DELETE
  USING (auth.uid() = user_id);
```

### Or Create Manually in UI:
1. Go to **SQL Editor** → click **New Query**
2. Paste the SQL above
3. Click **Run**

---

## Table 2: records (Records Page)

```sql
-- Create records table with user ownership
CREATE TABLE IF NOT EXISTS records (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title TEXT NOT NULL,
  category TEXT,
  amount TEXT,
  "when" TEXT,
  notes TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT,
  created BIGINT NOT NULL
);

-- Enable RLS
ALTER TABLE records ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own records
CREATE POLICY "Users can insert their own records" ON records
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to view only their own records
CREATE POLICY "Users can view their own records" ON records
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to update their own records
CREATE POLICY "Users can update their own records" ON records
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow users to delete their own records
CREATE POLICY "Users can delete their own records" ON records
  FOR DELETE
  USING (auth.uid() = user_id);
```

---

## Table 3: innovations (Innovation Page)

```sql
-- Create innovations table with user ownership
CREATE TABLE IF NOT EXISTS innovations (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  invTitle TEXT NOT NULL,
  invCategory TEXT,
  invDesc TEXT,
  image TEXT,
  video TEXT,
  likes INTEGER DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT,
  created BIGINT NOT NULL
);

-- Enable RLS
ALTER TABLE innovations ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own innovations
CREATE POLICY "Users can insert their own innovations" ON innovations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow everyone to view innovations
CREATE POLICY "Everyone can view innovations" ON innovations
  FOR SELECT
  USING (true);

-- Allow users to update their own innovations
CREATE POLICY "Users can update their own innovations" ON innovations
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow users to delete their own innovations
CREATE POLICY "Users can delete their own innovations" ON innovations
  FOR DELETE
  USING (auth.uid() = user_id);
```

---

## Table 4: news (News Page)

```sql
-- Create news table with user ownership
CREATE TABLE IF NOT EXISTS news (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  newsTitle TEXT NOT NULL,
  newsCategory TEXT,
  newsBody TEXT,
  image TEXT,
  video TEXT,
  pinned BOOLEAN DEFAULT FALSE,
  likes INTEGER DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT,
  created BIGINT NOT NULL
);

-- Enable RLS
ALTER TABLE news ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own news
CREATE POLICY "Users can insert their own news" ON news
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow everyone to view news
CREATE POLICY "Everyone can view news" ON news
  FOR SELECT
  USING (true);

-- Allow users to update their own news (for pinning, etc.)
CREATE POLICY "Users can update their own news" ON news
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow users to delete their own news
CREATE POLICY "Users can delete their own news" ON news
  FOR DELETE
  USING (auth.uid() = user_id);
```

---

## Quick Setup (All Tables at Once)

Run this SQL in the SQL Editor to create all tables:

```sql
-- Products Table with user ownership
CREATE TABLE IF NOT EXISTS products (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  prodName TEXT NOT NULL,
  prodCategory TEXT,
  prodPrice TEXT,
  prodQty TEXT,
  prodLocation TEXT,
  prodContact TEXT,
  prodDesc TEXT,
  image TEXT,
  video TEXT,
  sold BOOLEAN DEFAULT FALSE,
  likes INTEGER DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT,
  created BIGINT NOT NULL
);

-- Records Table with user ownership
CREATE TABLE IF NOT EXISTS records (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title TEXT NOT NULL,
  category TEXT,
  amount TEXT,
  "when" TEXT,
  notes TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT,
  created BIGINT NOT NULL
);

-- Innovations Table with user ownership
CREATE TABLE IF NOT EXISTS innovations (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  invTitle TEXT NOT NULL,
  invCategory TEXT,
  invDesc TEXT,
  image TEXT,
  video TEXT,
  likes INTEGER DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT,
  created BIGINT NOT NULL
);

-- News Table with user ownership
CREATE TABLE IF NOT EXISTS news (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  newsTitle TEXT NOT NULL,
  newsCategory TEXT,
  newsBody TEXT,
  image TEXT,
  video TEXT,
  pinned BOOLEAN DEFAULT FALSE,
  likes INTEGER DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT,
  created BIGINT NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE records ENABLE ROW LEVEL SECURITY;
ALTER TABLE innovations ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;

-- Products policies (public read, user-owned write)
CREATE POLICY "Users can insert their own products" ON products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Everyone can view products" ON products FOR SELECT USING (true);
CREATE POLICY "Users can update their own products" ON products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own products" ON products FOR DELETE USING (auth.uid() = user_id);

-- Records policies (private - only user-owned)
CREATE POLICY "Users can insert their own records" ON records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own records" ON records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own records" ON records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own records" ON records FOR DELETE USING (auth.uid() = user_id);

-- Innovations policies (public read, user-owned write)
CREATE POLICY "Users can insert their own innovations" ON innovations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Everyone can view innovations" ON innovations FOR SELECT USING (true);
CREATE POLICY "Users can update their own innovations" ON innovations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own innovations" ON innovations FOR DELETE USING (auth.uid() = user_id);

-- News policies (public read, user-owned write)
CREATE POLICY "Users can insert their own news" ON news FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Everyone can view news" ON news FOR SELECT USING (true);
CREATE POLICY "Users can update their own news" ON news FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own news" ON news FOR DELETE USING (auth.uid() = user_id);
```

## Migration for Existing Tables

If you already have tables without user ownership, run these ALTER statements:

```sql
-- Add user_id and author_name columns to existing tables
ALTER TABLE products ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS author_name TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS video TEXT;

ALTER TABLE records ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE records ADD COLUMN IF NOT EXISTS author_name TEXT;

ALTER TABLE innovations ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE innovations ADD COLUMN IF NOT EXISTS author_name TEXT;

ALTER TABLE news ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE news ADD COLUMN IF NOT EXISTS author_name TEXT;
ALTER TABLE news ADD COLUMN IF NOT EXISTS image TEXT;

-- Enable RLS (if not already enabled)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE records ENABLE ROW LEVEL SECURITY;
ALTER TABLE innovations ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;

-- Drop old policies and create new ones
DROP POLICY IF EXISTS "Allow all operations" ON products;
DROP POLICY IF EXISTS "Allow all operations" ON records;
DROP POLICY IF EXISTS "Allow all operations" ON innovations;
DROP POLICY IF EXISTS "Allow all operations" ON news;

-- Products policies (public read, user-owned write)
CREATE POLICY "Users can insert their own products" ON products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Everyone can view products" ON products FOR SELECT USING (true);
CREATE POLICY "Users can update their own products" ON products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own products" ON products FOR DELETE USING (auth.uid() = user_id);

-- Records policies (private - only user-owned)
CREATE POLICY "Users can insert their own records" ON records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own records" ON records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own records" ON records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own records" ON records FOR DELETE USING (auth.uid() = user_id);

-- Innovations policies (public read, user-owned write)
CREATE POLICY "Users can insert their own innovations" ON innovations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Everyone can view innovations" ON innovations FOR SELECT USING (true);
CREATE POLICY "Users can update their own innovations" ON innovations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own innovations" ON innovations FOR DELETE USING (auth.uid() = user_id);

-- News policies (public read, user-owned write)
CREATE POLICY "Users can insert their own news" ON news FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Everyone can view news" ON news FOR SELECT USING (true);
CREATE POLICY "Users can update their own news" ON news FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own news" ON news FOR DELETE USING (auth.uid() = user_id);
```

---

## Testing the Setup

1. **Test Authentication**: Try signing up/logging in
2. **Test Posting**: Create posts in each section
3. **Test Ownership**: Verify you can only delete your own posts
4. **Test Public Access**: Verify others can view public content (market, innovations, news) but not records

---

## Troubleshooting

- **"Permission denied" errors**: Check RLS policies are correctly applied
- **Can't see posts**: For records, only the owner can see them
- **Can't delete posts**: Only the owner can delete their posts
- **Auth errors**: Ensure Supabase auth is properly configured
3. Click **Run** button (bottom right)

### Step 4: Verify Tables
1. Go to **Table Editor** in the left sidebar
2. You should see: `products`, `records`, `innovations`, `news`

---

## Test the Setup

After creating tables, test by:
1. Go to https://limitless-inc.github.io/My-Farm-Manager/market.html
2. Add a product (fill the form and click Submit)
3. The product should appear in the list below
4. Check your Supabase dashboard → Table Editor → products to confirm the data is saved

---

## Troubleshooting

### Products not appearing?
- Check browser console (F12) for errors
- Make sure all tables exist in Supabase
- Verify RLS policies allow access
- Refresh the page

### Error messages?
- "Failed to post" = Database not set up or RLS denied access
- Check Supabase logs for more details

## Database Schema Update for Authentication

After setting up authentication, run this SQL to add user ownership columns:

```sql
-- Add user ownership columns to all tables
ALTER TABLE products ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS author_name TEXT;

ALTER TABLE records ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE records ADD COLUMN IF NOT EXISTS author_name TEXT;

ALTER TABLE innovations ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE innovations ADD COLUMN IF NOT EXISTS author_name TEXT;

ALTER TABLE news ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE news ADD COLUMN IF NOT EXISTS author_name TEXT;

-- Update RLS policies for authenticated access
DROP POLICY IF EXISTS "Allow all operations" ON products;
DROP POLICY IF EXISTS "Allow all operations" ON records;
DROP POLICY IF EXISTS "Allow all operations" ON innovations;
DROP POLICY IF EXISTS "Allow all operations" ON news;

-- Public read access (anyone can view)
CREATE POLICY "Public read access" ON products FOR SELECT USING (true);
CREATE POLICY "Public read access" ON records FOR SELECT USING (true);
CREATE POLICY "Public read access" ON innovations FOR SELECT USING (true);
CREATE POLICY "Public read access" ON news FOR SELECT USING (true);

-- Authenticated users can insert their own content
CREATE POLICY "Users can insert own content" ON products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can insert own content" ON records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can insert own content" ON innovations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can insert own content" ON news FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own content (for likes, sold status, etc.)
CREATE POLICY "Users can update own content" ON products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can update own content" ON records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can update own content" ON innovations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can update own content" ON news FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete only their own content
CREATE POLICY "Users can delete own content" ON products FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own content" ON records FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own content" ON innovations FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own content" ON news FOR DELETE USING (auth.uid() = user_id);

-- Allow likes from authenticated users (special policy for likes)
CREATE POLICY "Authenticated users can like" ON products FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can like" ON innovations FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can like" ON news FOR UPDATE USING (auth.role() = 'authenticated');
```
