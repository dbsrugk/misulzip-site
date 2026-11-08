-- Total play time per person, for the all-time ranking. Additive only: one new table and two new functions.
create table if not exists hwasil.playtime (
  owner   text primary key,
  nm      text not null default '',
  secs    bigint not null default 0,
  updated timestamptz not null default now()
);
alter table hwasil.playtime enable row level security;
revoke all on hwasil.playtime from public, anon, authenticated;

-- add seconds played; one call can add at most what really could have passed since the last call (plus a little), never more than 600
create or replace function public.hwasil_play_add(code text, token text, nm text, secs int) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare o text; cur record; add_s int; total bigint;
begin
  perform hwasil._ok(code); o := hwasil._owner(token);
  select * into cur from hwasil.playtime where owner = o;
  if secs is null or secs < 0 then raise exception 'invalid_argument'; end if;
  if cur.owner is null then add_s := least(secs, 120);
  else add_s := least(secs, 600, greatest(0, extract(epoch from (now() - cur.updated))::int + 10)); end if;
  insert into hwasil.playtime(owner, nm, secs) values (o, left(coalesce(nm, ''), 12), add_s)
  on conflict (owner) do update set secs = hwasil.playtime.secs + add_s, nm = case when excluded.nm <> '' then excluded.nm else hwasil.playtime.nm end, updated = now()
  returning hwasil.playtime.secs into total;
  return jsonb_build_object('secs', total);
end $$;

-- the top ten by total time; "me" marks the caller's own row
create or replace function public.hwasil_play_top(code text, token text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare o text;
begin
  perform hwasil._ok(code); o := hwasil._owner(token);
  return coalesce((select jsonb_agg(jsonb_build_object('nm', t.nm, 'secs', t.secs, 'me', t.owner = o) order by t.secs desc)
                   from (select * from hwasil.playtime order by secs desc limit 10) t), '[]'::jsonb);
end $$;

grant execute on function public.hwasil_play_add(text, text, text, int), public.hwasil_play_top(text, text) to anon, authenticated;
