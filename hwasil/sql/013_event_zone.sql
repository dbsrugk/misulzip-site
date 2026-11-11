-- 이벤트존: 별관 서쪽 벽(칸 이름이 'annex:-13.9,' 로 시작)은 사진 전용, 한 사람 1점.
--   · 그 칸에는 이벤트 작품(doc.ev = 1)만, 이벤트 작품은 그 칸에만 걸 수 있다.
--   · 한 사람의 이벤트 작품은 id 가 '<내 키>_ev' 하나뿐 (새로 올리면 앞의 것이 내려간다).
--   · 이벤트 작품은 사진 한 장(strokes = [{k:'img', d:'data:image/jpeg;base64,…'}])만 담는다. 크기는 기존 한도(260000자)를 그대로 쓴다.
--   · 이벤트 작품은 hang 으로만 만들고 바꿀 수 있다(set 으로는 못 건드림).
-- 관리자 내리기(hwasil_admin_del)와 재등록 차단은 기존 그대로 쓴다.
do $$
declare r record; d text; d2 text;
begin
  for r in select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname = 'hwasil_gallery_hang' loop
    d := pg_get_functiondef(r.oid);
    d2 := replace(d, $q$  if hwasil._banned(o, dd) then raise exception 'removed_banned'; end if;$q$,
      $q$  if hwasil._banned(o, dd) then raise exception 'removed_banned'; end if;
  if (sl ~ '^annex:-13\.9,') <> (coalesce(dd->>'ev', '') = '1') then raise exception 'invalid_argument'; end if;
  if sl ~ '^annex:-13\.9,' then
    if gid <> o || '_ev' or jsonb_typeof(dd->'strokes') <> 'array' or jsonb_array_length(dd->'strokes') <> 1
       or coalesce(dd->'strokes'->0->>'k', '') <> 'img' or coalesce(dd->'strokes'->0->>'d', '') !~ '^data:image/(jpeg|png);base64,' then
      raise exception 'invalid_argument';
    end if;
  end if;$q$);
    if d2 = d then raise exception 'hwasil_gallery_hang: pattern not found'; end if;
    execute d2;
  end loop;
  for r in select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname = 'hwasil_gallery_set' loop
    d := pg_get_functiondef(r.oid);
    d2 := replace(d, $q$  if hwasil._banned(o, dd) then raise exception 'removed_banned'; end if;$q$,
      $q$  if hwasil._banned(o, dd) then raise exception 'removed_banned'; end if;
  if coalesce(dd->>'ev', '') = '1' or exists (select 1 from hwasil.gallery g where g.id = gid and coalesce(g.doc->>'ev', '') = '1') then
    raise exception 'invalid_argument';
  end if;$q$);
    if d2 = d then raise exception 'hwasil_gallery_set: pattern not found'; end if;
    execute d2;
  end loop;
end $$;
