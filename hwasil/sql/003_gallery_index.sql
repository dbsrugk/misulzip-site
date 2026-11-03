-- 003: 전시 목록을 가볍게. index = 그림 선(strokes)을 뺀 요약, get = 한 점의 전체 내용(가까이 갈 때만 받음).
-- (예전 hwasil_gallery_list 는 이미 열려 있는 옛 화면을 위해 그대로 둔다.)
create or replace function public.hwasil_gallery_index(code text, lim int default 150) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform hwasil._ok(code);
  return coalesce((select jsonb_agg((g.doc - 'strokes') || jsonb_build_object('id', g.id, 'slot', g.slot) order by g.at desc)
    from (select * from hwasil.gallery order by at desc limit least(greatest(lim,1),300)) g), '[]'::jsonb);
end $$;

create or replace function public.hwasil_gallery_get(code text, gid text) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform hwasil._ok(code);
  if gid is null or length(gid) > 60 then return null; end if;
  return (select g.doc || jsonb_build_object('id', g.id, 'slot', g.slot) from hwasil.gallery g where g.id = gid);
end $$;

revoke all on all functions in schema hwasil from public, anon, authenticated;
do $$ declare f text; begin
  for f in select p.oid::regprocedure::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname like 'hwasil\_%' loop
    execute 'revoke all on function ' || f || ' from public';
    execute 'grant execute on function ' || f || ' to anon, authenticated';
  end loop;
end $$;
