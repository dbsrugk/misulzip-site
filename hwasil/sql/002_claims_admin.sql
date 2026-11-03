-- 002: 선착순 액자 자리(slot) + 관리자.
-- 한 액자(slot)는 한 작품만 가질 수 있고(유니크), 먼저 건 사람이 주인이다. 주인만 내리거나 옮긴다.
-- 관리자는 비밀번호(해시는 hwasil.config 의 admin_hash, 저장소에는 넣지 않음)로 어떤 액자든 내릴 수 있다.
alter table hwasil.gallery add column if not exists slot text;
create unique index if not exists gallery_slot_uq on hwasil.gallery (slot) where slot is not null;

create or replace function public.hwasil_gallery_list(code text, lim int default 27) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform hwasil._ok(code);
  return coalesce((select jsonb_agg(g.doc || jsonb_build_object('id', g.id, 'slot', g.slot) order by g.at desc)
    from (select * from hwasil.gallery order by at desc limit least(greatest(lim,1),150)) g), '[]'::jsonb);
end $$;

-- 자리를 정해서 걸기(또는 내 작품을 다른 빈 자리로 옮기기). 이미 다른 사람이 있으면 slot_taken.
create or replace function public.hwasil_gallery_hang(code text, token text, gid text, sl text, d jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare o text; dd jsonb;
begin
  perform hwasil._ok(code); o := hwasil._owner(token); dd := hwasil._doc(d);
  if gid !~ ('^' || o || '_[A-Za-z0-9_-]{1,40}$') then raise exception 'invalid_argument'; end if;
  if sl is null or sl !~ '^[a-z]{3,8}:-?[0-9]{1,3}(\.[0-9])?(,-?[0-9]{1,3}(\.[0-9])?){2}$' then raise exception 'invalid_argument'; end if;
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

create or replace function hwasil._admin(pw text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if pw is null or length(trim(pw)) < 4 or not exists (select 1 from hwasil.config
      where k = 'admin_hash' and v = encode(sha256(convert_to(trim(pw), 'UTF8')), 'hex')) then
    perform pg_sleep(1);
    raise exception 'bad_admin';
  end if;
end $$;

create or replace function public.hwasil_admin_check(code text, pw text) returns boolean
language plpgsql security definer set search_path = '' as $$
begin perform hwasil._ok(code); perform hwasil._admin(pw); return true;
exception when others then return false; end $$;

-- 관리자: 아무 액자나 내린다. 주인의 '내 그림'에는 "관리자가 내렸어요" 표시(removed)가 남는다.
create or replace function public.hwasil_admin_del(code text, pw text, gid text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform hwasil._ok(code); perform hwasil._admin(pw);
  if gid is null or gid !~ '^[0-9a-f]{16}_[A-Za-z0-9_-]{1,40}$' then raise exception 'invalid_argument'; end if;
  with g as (delete from hwasil.gallery where id = gid returning owner, doc)
  update hwasil.works w set doc = w.doc || jsonb_build_object('exh', false, 'removed', true)
    from g where w.owner = g.owner and w.id = g.doc->>'workId';
end $$;

revoke all on all functions in schema hwasil from public, anon, authenticated;
do $$ declare f text; begin
  for f in select p.oid::regprocedure::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname like 'hwasil\_%' loop
    execute 'revoke all on function ' || f || ' from public';
    execute 'grant execute on function ' || f || ' to anon, authenticated';
  end loop;
end $$;

-- 관리자 비밀번호는 SQL Editor(또는 관리자가 직접)에서 따로 한 줄 실행:
-- insert into hwasil.config (k, v) values ('admin_hash', encode(sha256(convert_to('여기에비밀번호', 'UTF8')), 'hex'))
--   on conflict (k) do update set v = excluded.v;
