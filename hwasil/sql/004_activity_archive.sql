-- 004: (1) 활동 기록: 하루 방문자(visits), 전시/내림 같은 일(events). 매일 아침 보고서가 읽는다.
--      (2) 관리자가 내린 작품은 보관(removed)하고, 같은 작품/같은 그림은 다시 걸 수 없게 막는다.
create table if not exists hwasil.events (
  id bigserial primary key, at timestamptz not null default now(), kind text not null, owner text, info jsonb not null default '{}'::jsonb);
create index if not exists events_at on hwasil.events (at desc);
create table if not exists hwasil.visits (
  day date not null, owner text not null, name text,
  first_at timestamptz not null default now(), last_at timestamptz not null default now(),
  pings int not null default 1, sessions int not null default 1, primary key (day, owner));
create table if not exists hwasil.removed (
  id bigserial primary key, at timestamptz not null default now(), owner text not null, gid text not null, work_id text,
  title text, artist text, fp text, doc jsonb not null);
create index if not exists removed_fp on hwasil.removed (fp);
create index if not exists removed_owner_work on hwasil.removed (owner, work_id);
alter table hwasil.events enable row level security;
alter table hwasil.visits enable row level security;
alter table hwasil.removed enable row level security;
revoke all on hwasil.events, hwasil.visits, hwasil.removed from public, anon, authenticated;
revoke all on sequence hwasil.events_id_seq, hwasil.removed_id_seq from public, anon, authenticated;

create or replace function hwasil._fp(strokes jsonb) returns text
language sql immutable set search_path = '' as $$
  select case when strokes is null then null else encode(sha256(convert_to(strokes::text, 'UTF8')), 'hex') end $$;

create or replace function hwasil._banned(o text, d jsonb) returns boolean
language sql stable set search_path = '' as $$
  select exists (select 1 from hwasil.removed r
    where (r.fp is not null and r.fp = hwasil._fp(d->'strokes')) or (r.owner = o and r.work_id is not null and r.work_id = d->>'workId')) $$;

create or replace function hwasil._ev() returns trigger
language plpgsql set search_path = '' as $$
declare who text := coalesce(current_setting('hwasil.by', true), '');
begin
  if tg_table_name = 'gallery' then
    if tg_op = 'INSERT' then
      insert into hwasil.events (kind, owner, info) values ('exhibit_add', new.owner,
        jsonb_build_object('title', new.doc->>'title', 'artist', new.doc->>'artist', 'room', new.doc->>'room', 'slot', new.slot));
    elsif tg_op = 'DELETE' then
      insert into hwasil.events (kind, owner, info) values (case when who = 'admin' then 'exhibit_admin_removed' else 'exhibit_remove' end, old.owner,
        jsonb_build_object('title', old.doc->>'title', 'artist', old.doc->>'artist', 'room', old.doc->>'room'));
    elsif tg_op = 'UPDATE' and new.slot is distinct from old.slot then
      insert into hwasil.events (kind, owner, info) values ('exhibit_move', new.owner,
        jsonb_build_object('title', new.doc->>'title', 'artist', new.doc->>'artist', 'room', new.doc->>'room'));
    end if;
  elsif tg_table_name = 'works' and tg_op = 'INSERT' then
    insert into hwasil.events (kind, owner, info) values ('work_saved', new.owner, jsonb_build_object('title', new.doc->>'title'));
  end if;
  return null;
end $$;
drop trigger if exists gallery_ev on hwasil.gallery;
create trigger gallery_ev after insert or delete or update on hwasil.gallery for each row execute function hwasil._ev();
drop trigger if exists works_ev on hwasil.works;
create trigger works_ev after insert on hwasil.works for each row execute function hwasil._ev();

create or replace function public.hwasil_ping(code text, token text, nm text) returns void
language plpgsql security definer set search_path = '' as $$
declare o text; d date := (now() at time zone 'Asia/Seoul')::date;
begin
  perform hwasil._ok(code); o := hwasil._owner(token);
  insert into hwasil.visits (day, owner, name) values (d, o, left(coalesce(nm, ''), 20))
  on conflict (day, owner) do update set name = excluded.name, pings = hwasil.visits.pings + 1,
    sessions = hwasil.visits.sessions + case when now() - hwasil.visits.last_at > interval '15 minutes' then 1 else 0 end,
    last_at = now();
end $$;

-- 걸기: 관리자가 내린 작품(같은 작품 번호 또는 똑같은 그림)은 다시 걸 수 없다 -> removed_banned
create or replace function public.hwasil_gallery_hang(code text, token text, gid text, sl text, d jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare o text; dd jsonb;
begin
  perform hwasil._ok(code); o := hwasil._owner(token); dd := hwasil._doc(d);
  if gid !~ ('^' || o || '_[A-Za-z0-9_-]{1,40}$') then raise exception 'invalid_argument'; end if;
  if sl is null or sl !~ '^[a-z]{3,8}:-?[0-9]{1,3}(\.[0-9])?(,-?[0-9]{1,3}(\.[0-9])?){2}$' then raise exception 'invalid_argument'; end if;
  if hwasil._banned(o, dd) then raise exception 'removed_banned'; end if;
  if not exists (select 1 from hwasil.gallery where id = gid)
     and (select count(*) from hwasil.gallery where owner = o) >= 10 then
    raise exception 'quota_exceeded';
  end if;
  if exists (select 1 from hwasil.gallery g where g.slot = sl and g.id <> gid) then raise exception 'slot_taken'; end if;
  begin
    insert into hwasil.gallery (id, owner, at, doc, slot)
      values (gid, o, coalesce((dd->>'at')::bigint, 0), dd, sl)
    on conflict (id) do update set doc = excluded.doc, at = excluded.at, slot = excluded.slot;
  exception when unique_violation then
    raise exception 'slot_taken';
  end;
end $$;

create or replace function public.hwasil_gallery_set(code text, token text, gid text, d jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare o text; dd jsonb;
begin
  perform hwasil._ok(code); o := hwasil._owner(token); dd := hwasil._doc(d);
  if gid !~ ('^' || o || '_[A-Za-z0-9_-]{1,40}$') then raise exception 'invalid_argument'; end if;
  if hwasil._banned(o, dd) then raise exception 'removed_banned'; end if;
  if not exists (select 1 from hwasil.gallery where id = gid)
     and (select count(*) from hwasil.gallery where owner = o) >= 10 then
    raise exception 'quota_exceeded';
  end if;
  insert into hwasil.gallery (id, owner, at, doc)
    values (gid, o, coalesce((dd->>'at')::bigint, 0), dd)
  on conflict (id) do update set doc = excluded.doc, at = excluded.at;
end $$;

-- 관리자: 내리면서 보관(removed)에 통째로 남긴다.
create or replace function public.hwasil_admin_del(code text, pw text, gid text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform hwasil._ok(code); perform hwasil._admin(pw);
  if gid is null or gid !~ '^[0-9a-f]{16}_[A-Za-z0-9_-]{1,40}$' then raise exception 'invalid_argument'; end if;
  perform set_config('hwasil.by', 'admin', true);
  with g as (delete from hwasil.gallery where id = gid returning id, owner, doc),
  a as (insert into hwasil.removed (owner, gid, work_id, title, artist, fp, doc)
          select g.owner, g.id, g.doc->>'workId', g.doc->>'title', g.doc->>'artist', hwasil._fp(g.doc->'strokes'), g.doc from g)
  update hwasil.works w set doc = w.doc || jsonb_build_object('exh', false, 'removed', true)
    from g where w.owner = g.owner and w.id = g.doc->>'workId';
end $$;

create or replace function public.hwasil_admin_removed(code text, pw text) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform hwasil._ok(code); perform hwasil._admin(pw);
  return coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'at', (extract(epoch from r.at) * 1000)::bigint,
      'title', r.title, 'artist', r.artist, 'room', r.doc->>'room') order by r.at desc)
    from (select * from hwasil.removed order by at desc limit 100) r), '[]'::jsonb);
end $$;

create or replace function public.hwasil_admin_removed_get(code text, pw text, rid bigint) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform hwasil._ok(code); perform hwasil._admin(pw);
  return (select r.doc || jsonb_build_object('id', 'removed_' || r.id) from hwasil.removed r where r.id = rid);
end $$;

-- 관리자가 다시 허용하면 보관함에서 지워져 그 작품은 다시 걸 수 있다.
create or replace function public.hwasil_admin_unban(code text, pw text, rid bigint) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform hwasil._ok(code); perform hwasil._admin(pw);
  delete from hwasil.removed where id = rid;
end $$;

revoke all on all functions in schema hwasil from public, anon, authenticated;
do $$ declare f text; begin
  for f in select p.oid::regprocedure::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname like 'hwasil\_%' loop
    execute 'revoke all on function ' || f || ' from public';
    execute 'grant execute on function ' || f || ' to anon, authenticated';
  end loop;
end $$;
