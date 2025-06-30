create table public.game_logs (
  id          bigint generated always as identity primary key,
  session_id  uuid    not null,
  ts          timestamptz not null default now(),
  event_type  text    not null,
  round       int     null,
  player_id   text    null,
  data        jsonb   not null
);

alter table public.game_logs enable row level security;

create policy "anon_insert_only"
  on public.game_logs
  for insert
  to anon
  with check (true);