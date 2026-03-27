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
  sold BOOLEAN DEFAULT FALSE,
  likes INTEGER DEFAULT 0,
  created BIGINT NOT NULL
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow public access (INSERT, SELECT, UPDATE, DELETE)
CREATE POLICY "Allow all operations" ON products
  FOR ALL
  USING (true);
```

### Or Create Manually in UI:
1. Go to **SQL Editor** → click **New Query**
2. Paste the SQL above
3. Click **Run**

---

## Table 2: records (Records Page)

```sql
CREATE TABLE IF NOT EXISTS records (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title TEXT NOT NULL,
  category TEXT,
  amount TEXT,
  "when" TEXT,
  notes TEXT,
  created BIGINT NOT NULL
);

ALTER TABLE records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations" ON records
  FOR ALL
  USING (true);
```

---

## Table 3: innovations (Innovation Page)

```sql
CREATE TABLE IF NOT EXISTS innovations (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  invTitle TEXT NOT NULL,
  invCategory TEXT,
  invDesc TEXT,
  image TEXT,
  video TEXT,
  likes INTEGER DEFAULT 0,
  created BIGINT NOT NULL
);

ALTER TABLE innovations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations" ON innovations
  FOR ALL
  USING (true);
```

---

## Table 4: news (News Page)

```sql
CREATE TABLE IF NOT EXISTS news (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  newsTitle TEXT NOT NULL,
  newsCategory TEXT,
  newsBody TEXT,
  image TEXT,
  video TEXT,
  pinned BOOLEAN DEFAULT FALSE,
  likes INTEGER DEFAULT 0,
  created BIGINT NOT NULL
);

ALTER TABLE news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations" ON news
  FOR ALL
  USING (true);
```

---

## Quick Setup (All Tables at Once)

Run this SQL in the SQL Editor to create all tables:

```sql
-- Products Table
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
  sold BOOLEAN DEFAULT FALSE,
  likes INTEGER DEFAULT 0,
  created BIGINT NOT NULL
);

-- Records Table
CREATE TABLE IF NOT EXISTS records (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title TEXT NOT NULL,
  category TEXT,
  amount TEXT,
  "when" TEXT,
  notes TEXT,
  created BIGINT NOT NULL
);

-- Innovations Table
CREATE TABLE IF NOT EXISTS innovations (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  invTitle TEXT NOT NULL,
  invCategory TEXT,
  invDesc TEXT,
  image TEXT,
  video TEXT,
  likes INTEGER DEFAULT 0,
  created BIGINT NOT NULL
);

-- News Table
CREATE TABLE IF NOT EXISTS news (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  newsTitle TEXT NOT NULL,
  newsCategory TEXT,
  newsBody TEXT,
  image TEXT,
  video TEXT,
  pinned BOOLEAN DEFAULT FALSE,
  likes INTEGER DEFAULT 0,
  created BIGINT NOT NULL
);

-- Enable RLS and policies for all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE records ENABLE ROW LEVEL SECURITY;
ALTER TABLE innovations ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations" ON products FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON records FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON innovations FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON news FOR ALL USING (true);
```

---

## Setup Instructions

### Step 1: Go to Supabase Dashboard
1. Visit: https://supabase.com/dashboard
2. Click on your project (My-Farm-Manager)

### Step 2: Open SQL Editor
1. In the left sidebar, click **SQL Editor**
2. Click **New Query**

### Step 3: Paste and Run SQL
1. Copy the SQL from "Quick Setup (All Tables at Once)" above
2. Paste it into the query editor
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
