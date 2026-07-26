-- Execute this SQL query in your Supabase SQL Editor (https://supabase.com/dashboard)

CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    country_code TEXT DEFAULT '+91',
    email TEXT,
    password TEXT NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow public read & insert access for website visitors
CREATE POLICY "Allow public insert to users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select from users" ON public.users FOR SELECT USING (true);
