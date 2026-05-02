create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null default 'user' check (role in ('admin', 'user')),
  avatar_url text,
  theme_preference text not null default 'ares',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
