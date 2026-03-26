-- FloodSense India — Supabase Database Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (stores supplemental data — Supabase Auth handles the actual auth)
create table if not exists public.users (
  id            uuid primary key default uuid_generate_v4(),
  email         text unique not null,
  name          text,
  avatar_url    text,
  role          text default 'Citizen',
  state         text,
  onboarding_complete boolean default false,
  created_at    timestamptz default now()
);

-- User districts (pinned districts per user)
create table if not exists public.user_districts (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references public.users(id) on delete cascade,
  district_name   text not null,
  district_state  text not null,
  pinned_order    integer default 0,
  created_at      timestamptz default now(),
  unique(user_id, district_name)
);

-- Alert preferences per user
create table if not exists public.alert_preferences (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references public.users(id) on delete cascade unique,
  email_alerts    boolean default true,
  sms_alerts      boolean default false,
  push_alerts     boolean default true,
  whatsapp_alerts boolean default false,
  threshold       text default 'Medium', -- Low | Medium | High | Critical
  updated_at      timestamptz default now()
);

-- Row Level Security (RLS)
alter table public.users             enable row level security;
alter table public.user_districts    enable row level security;
alter table public.alert_preferences enable row level security;

-- Policies: users can only read/write their own data
create policy "Users can view their own profile"
  on public.users for select using (email = auth.jwt() ->> 'email');

create policy "Users can update their own profile"
  on public.users for update using (email = auth.jwt() ->> 'email');

create policy "Users can insert their own profile"
  on public.users for insert with check (email = auth.jwt() ->> 'email');

create policy "Users can view their districts"
  on public.user_districts for select using (
    user_id = (select id from public.users where email = auth.jwt() ->> 'email')
  );

create policy "Users can manage their districts"
  on public.user_districts for all using (
    user_id = (select id from public.users where email = auth.jwt() ->> 'email')
  );

create policy "Users can manage their preferences"
  on public.alert_preferences for all using (
    user_id = (select id from public.users where email = auth.jwt() ->> 'email')
  );

-- Service role bypass (for Next.js backend)
-- Supabase service role key bypasses RLS by default
