-- Run once in Supabase Dashboard > SQL Editor > New query.
-- Adds in-app alerts for new uploads from channels followed in StreamTube.

create table if not exists public.app_channel_subscriptions (
  user_id uuid not null references auth.users (id) on delete cascade,
  channel_id text not null,
  channel_title text not null default 'YouTube channel',
  thumbnail text,
  subscribed_at timestamptz not null default now(),
  primary key (user_id, channel_id)
);

create index if not exists app_channel_subscriptions_channel_idx
  on public.app_channel_subscriptions (channel_id);

create table if not exists public.youtube_websub_topics (
  channel_id text primary key,
  topic_url text not null unique,
  verify_token text not null,
  status text not null default 'pending',
  lease_expires_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.app_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  channel_id text not null,
  channel_title text not null,
  video_id text not null,
  video_title text not null,
  published_at timestamptz not null,
  created_at timestamptz not null default now(),
  is_read boolean not null default false,
  unique (user_id, video_id)
);

create index if not exists app_notifications_user_created_idx
  on public.app_notifications (user_id, created_at desc);

alter table public.app_channel_subscriptions enable row level security;
alter table public.youtube_websub_topics enable row level security;
alter table public.app_notifications enable row level security;

-- Only the Edge Functions' service role can maintain subscription routing data.
revoke all on public.app_channel_subscriptions from anon, authenticated;
revoke all on public.youtube_websub_topics from anon, authenticated;
grant all on public.app_channel_subscriptions to service_role;
grant all on public.youtube_websub_topics to service_role;

-- Signed-in users can read their alerts, mark them read, and clear them.
revoke all on public.app_notifications from anon, authenticated;
grant all on public.app_notifications to service_role;
grant select, delete on public.app_notifications to authenticated;
grant update (is_read) on public.app_notifications to authenticated;

drop policy if exists "Users read their own upload alerts" on public.app_notifications;
create policy "Users read their own upload alerts"
  on public.app_notifications for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users mark their own upload alerts read" on public.app_notifications;
create policy "Users mark their own upload alerts read"
  on public.app_notifications for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users clear their own upload alerts" on public.app_notifications;
create policy "Users clear their own upload alerts"
  on public.app_notifications for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Stream new alerts to the signed-in user's open browser session.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'app_notifications'
  ) then
    alter publication supabase_realtime add table public.app_notifications;
  end if;
end;
$$;
