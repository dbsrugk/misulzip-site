-- 열쇠 합치기: 다른 열쇠(from_token)의 작품과 전시 그림을 지금 열쇠(token)로 옮긴다.
-- Additive only: one new function, no table changes. Needs the owner's approval before running.
create or replace function public.hwasil_merge_keys(code text, token text, from_token text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare o text; f text; room int; moved int := 0; kept int := 0; gmoved int := 0; gleft int := 0;
begin
  perform hwasil._ok(code); o := hwasil._owner(token); f := hwasil._owner(from_token);
  if o = f then return jsonb_build_object('same', true); end if;
  room := greatest(60 - (select count(*) from hwasil.works where owner = o), 0);
  with pick as (
    select w.id from hwasil.works w
    where w.owner = f and not exists (select 1 from hwasil.works x where x.owner = o and x.id = w.id)
    order by w.at desc limit room),
  mv as (update hwasil.works w set owner = o from pick where w.owner = f and w.id = pick.id returning 1)
  select count(*) into moved from mv;
  select count(*) into kept from hwasil.works where owner = f;
  with pick as (
    select id from hwasil.gallery where owner = f order by at desc
    limit greatest(10 - (select count(*) from hwasil.gallery where owner = o), 0)),
  mv as (update hwasil.gallery g set owner = o from pick where g.id = pick.id returning 1)
  select count(*) into gmoved from mv;
  select count(*) into gleft from hwasil.gallery where owner = f;
  return jsonb_build_object('works', moved, 'works_left', kept, 'hung', gmoved, 'hung_left', gleft);
end $$;
revoke all on function public.hwasil_merge_keys(text, text, text) from public;
grant execute on function public.hwasil_merge_keys(text, text, text) to anon, authenticated;
