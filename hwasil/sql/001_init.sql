-- 작은 화실: design-part-archive 안에 별도 스키마로 분리. 기존 테이블/권한은 건드리지 않음.
create schema if not exists hwasil;
revoke all on schema hwasil from public, anon, authenticated;

create table hwasil.config (k text primary key, v text not null);
create table hwasil.works (
  owner text not null, id text not null, at bigint not null default 0,
  doc jsonb not null, primary key (owner, id));
create index works_owner_at on hwasil.works (owner, at desc);
create table hwasil.gallery (
  id text primary key, owner text not null, at bigint not null default 0, doc jsonb not null);
create index gallery_at on hwasil.gallery (at desc);
alter table hwasil.config enable row level security;
alter table hwasil.works enable row level security;
alter table hwasil.gallery enable row level security;

create or replace function hwasil._ok(code text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if code is null or not exists (select 1 from hwasil.config
      where k = 'code_hash' and v = encode(sha256(convert_to(lower(trim(code)), 'UTF8')), 'hex')) then
    raise exception 'bad_code';
  end if;
end $$;

create or replace function hwasil._owner(token text) returns text
language plpgsql immutable set search_path = '' as $$
begin
  if token is null or token !~ '^[0-9a-f]{32,64}$' then raise exception 'bad_token'; end if;
  return left(encode(sha256(convert_to(token, 'UTF8')), 'hex'), 16);
end $$;

create or replace function hwasil._doc(d jsonb) returns jsonb
language plpgsql immutable set search_path = '' as $$
begin
  if d is null or jsonb_typeof(d) <> 'object' then raise exception 'invalid_argument'; end if;
  if octet_length(d::text) > 260000 then raise exception 'too_big'; end if;
  return d - 'id';
end $$;

create or replace function public.hwasil_check(code text) returns boolean
language plpgsql security definer set search_path = '' as $$
begin perform hwasil._ok(code); return true;
exception when others then return false; end $$;

create or replace function public.hwasil_works_list(code text, token text, lim int default 30) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare o text;
begin
  perform hwasil._ok(code); o := hwasil._owner(token);
  return coalesce((select jsonb_agg(w.doc || jsonb_build_object('id', w.id) order by w.at desc)
    from (select * from hwasil.works where owner = o order by at desc limit least(greatest(lim,1),60)) w), '[]'::jsonb);
end $$;

create or replace function public.hwasil_work_set(code text, token text, wid text, d jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare o text; dd jsonb;
begin
  perform hwasil._ok(code); o := hwasil._owner(token); dd := hwasil._doc(d);
  if wid !~ '^[A-Za-z0-9_-]{1,40}$' then raise exception 'invalid_argument'; end if;
  if not exists (select 1 from hwasil.works where owner = o and id = wid)
     and (select count(*) from hwasil.works where owner = o) >= 60 then
    raise exception 'quota_exceeded';
  end if;
  insert into hwasil.works (owner, id, at, doc)
    values (o, wid, coalesce((dd->>'at')::bigint, 0), dd)
  on conflict (owner, id) do update set doc = excluded.doc, at = excluded.at;
end $$;

create or replace function public.hwasil_work_patch(code text, token text, wid text, d jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare o text; dd jsonb;
begin
  perform hwasil._ok(code); o := hwasil._owner(token); dd := hwasil._doc(d);
  update hwasil.works set doc = hwasil._doc(doc || dd) where owner = o and id = wid;
end $$;

create or replace function public.hwasil_work_del(code text, token text, wid text) returns void
language plpgsql security definer set search_path = '' as $$
declare o text;
begin
  perform hwasil._ok(code); o := hwasil._owner(token);
  delete from hwasil.works where owner = o and id = wid;
end $$;

create or replace function public.hwasil_gallery_list(code text, lim int default 27) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform hwasil._ok(code);
  return coalesce((select jsonb_agg(g.doc || jsonb_build_object('id', g.id) order by g.at desc)
    from (select * from hwasil.gallery order by at desc limit least(greatest(lim,1),60)) g), '[]'::jsonb);
end $$;

create or replace function public.hwasil_gallery_set(code text, token text, gid text, d jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare o text; dd jsonb;
begin
  perform hwasil._ok(code); o := hwasil._owner(token); dd := hwasil._doc(d);
  if gid !~ ('^' || o || '_[A-Za-z0-9_-]{1,40}$') then raise exception 'invalid_argument'; end if;
  if not exists (select 1 from hwasil.gallery where id = gid)
     and (select count(*) from hwasil.gallery where owner = o) >= 10 then
    raise exception 'quota_exceeded';
  end if;
  insert into hwasil.gallery (id, owner, at, doc)
    values (gid, o, coalesce((dd->>'at')::bigint, 0), dd)
  on conflict (id) do update set doc = excluded.doc, at = excluded.at;
end $$;

create or replace function public.hwasil_gallery_del(code text, token text, gid text) returns void
language plpgsql security definer set search_path = '' as $$
declare o text;
begin
  perform hwasil._ok(code); o := hwasil._owner(token);
  delete from hwasil.gallery where id = gid and owner = o;
end $$;

revoke all on all functions in schema hwasil from public, anon, authenticated;
do $$ declare f text; begin
  for f in select p.oid::regprocedure::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname like 'hwasil\_%' loop
    execute 'revoke all on function ' || f || ' from public';
    execute 'grant execute on function ' || f || ' to anon, authenticated';
  end loop;
end $$;

-- 입장 코드는 저장소에 넣지 않음. SQL Editor에서 따로 한 줄 실행:
-- insert into hwasil.config (k, v) values ('code_hash', encode(sha256(convert_to('여기에코드', 'UTF8')), 'hex'))
--   on conflict (k) do update set v = excluded.v;
