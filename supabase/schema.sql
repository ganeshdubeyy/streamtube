-- Run once in Supabase Dashboard > SQL Editor > New query.
-- This schema stores one private library document per signed-in user.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  updated_at timestamptz not null default now()
);

create table if not exists public.user_library (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.user_library enable row level security;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.user_library to authenticated;

drop policy if exists "Users can read their profile" on public.profiles;
create policy "Users can read their profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Users can create their profile" on public.profiles;
create policy "Users can create their profile"
  on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "Users can update their profile" on public.profiles;
create policy "Users can update their profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "Users can read their library" on public.user_library;
create policy "Users can read their library"
  on public.user_library for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their library" on public.user_library;
create policy "Users can create their library"
  on public.user_library for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their library" on public.user_library;
create policy "Users can update their library"
  on public.user_library for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their library" on public.user_library;
create policy "Users can delete their library"
  on public.user_library for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Create a profile row automatically for every new Auth user.
create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute procedure public.create_profile_for_new_user();

-- Enable live library updates in other signed-in browser sessions.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'user_library'
  ) then
    alter publication supabase_realtime add table public.user_library;
  end if;
end;
$$;
