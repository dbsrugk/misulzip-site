-- Raise the per-person exhibition limit from 10 to 20 (only the constant changes in three functions).
do $$
declare r record; d text;
begin
  for r in select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname in ('hwasil_gallery_hang', 'hwasil_gallery_set', 'hwasil_merge_keys') loop
    d := pg_get_functiondef(r.oid);
    d := replace(d, ') >= 10 then', ') >= 20 then');
    d := replace(d, 'greatest(10 -', 'greatest(20 -');
    execute d;
  end loop;
end $$;
