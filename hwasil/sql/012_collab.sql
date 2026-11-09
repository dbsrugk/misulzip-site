-- 012: 합작 액자. 한 사람이 합작 방을 만들면 4글자 코드가 생기고, 친구 셋까지 자기 그림 하나씩 칸(2x2)을 채워요.
-- 다 채워지면(또는 만든 사람이 마무리하면) 만든 사람의 화면에서 한 장으로 합쳐 일반 그림처럼 걸 수 있어요.
-- Additive only: one new table and four new functions. Needs the owner's approval before running (DRAFT, not applied).
create table if not exists hwasil.collabs (
  cc      text primary key check (cc ~ '^[A-Z0-9]{4}$'),
  owner   text not null,
  title   text not null default '',
  tiles   jsonb not null default '{}'::jsonb,       -- {"0": {"o": owner, "nm": name, "doc": work}, ...}
  done    boolean not null default false,
  created timestamptz not null default now()
);
alter table hwasil.collabs enable row level security;
revoke all on hwasil.collabs from public, anon, authenticated;

create or replace function public.hwasil_collab_create(code text, token text, title text) returns text
language plpgsql security definer set search_path = '' as $$
declare o text; c text; i int := 0; alpha text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  perform hwasil._ok(code); o := hwasil._owner(token);
  delete from hwasil.collabs where created < now() - interval '14 days';
  if (select count(*) from hwasil.collabs where owner = o and not done) >= 3 then raise exception 'quota_exceeded'; end if;
  if (select count(*) from hwasil.collabs) >= 200 then raise exception 'quota_exceeded'; end if;
  loop
    c := ''; for k in 1..4 loop c := c || substr(alpha, 1 + floor(random() * length(alpha))::int, 1); end loop;
    exit when not exists (select 1 from hwasil.collabs where cc = c);
    i := i + 1; if i > 20 then raise exception 'invalid_argument'; end if;
  end loop;
  insert into hwasil.collabs(cc, owner, title) values (c, o, left(btrim(coalesce(title, '')), 24));
  return c;
end $$;

-- who is in, and (only when full = true) the pictures themselves
create or replace function public.hwasil_collab_get(code text, token text, cc text, with_docs boolean default false) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare o text; r hwasil.collabs; t jsonb := '[]'::jsonb; k int;
begin
  perform hwasil._ok(code); o := hwasil._owner(token);
  select * into r from hwasil.collabs c where c.cc = upper(hwasil_collab_get.cc);
  if r.cc is null then return null; end if;
  for k in 0..3 loop
    if r.tiles ? k::text then
      t := t || jsonb_build_array(jsonb_build_object('nm', r.tiles->k::text->>'nm', 'mine', r.tiles->k::text->>'o' = o)
                                   || case when with_docs and r.owner = o then jsonb_build_object('doc', r.tiles->k::text->'doc') else '{}'::jsonb end);
    else t := t || jsonb_build_array(null); end if;
  end loop;
  return jsonb_build_object('cc', r.cc, 'title', r.title, 'me', r.owner = o, 'done', r.done, 'tiles', t);
end $$;

-- put (or replace) my picture in a tile; one tile per person
create or replace function public.hwasil_collab_put(code text, token text, cc text, slot int, nm text, d jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare o text; r hwasil.collabs; dd jsonb;
begin
  perform hwasil._ok(code); o := hwasil._owner(token); dd := hwasil._doc(d);
  if slot is null or slot < 0 or slot > 3 then raise exception 'invalid_argument'; end if;
  select * into r from hwasil.collabs c where c.cc = upper(hwasil_collab_put.cc) for update;
  if r.cc is null or r.done then raise exception 'invalid_argument'; end if;
  if r.tiles ? slot::text and r.tiles->slot::text->>'o' <> o then raise exception 'slot_taken'; end if;
  update hwasil.collabs set tiles = (select coalesce(jsonb_object_agg(e.key, e.value), '{}'::jsonb) from jsonb_each(r.tiles) e where e.value->>'o' <> o)
         || jsonb_build_object(slot::text, jsonb_build_object('o', o, 'nm', left(coalesce(nm, ''), 12), 'doc', dd))
   where hwasil.collabs.cc = r.cc;
end $$;

-- the maker closes the room after putting the pieces together
create or replace function public.hwasil_collab_done(code text, token text, cc text) returns void
language plpgsql security definer set search_path = '' as $$
declare o text;
begin
  perform hwasil._ok(code); o := hwasil._owner(token);
  update hwasil.collabs c set done = true where c.cc = upper(hwasil_collab_done.cc) and c.owner = o;
end $$;

grant execute on function public.hwasil_collab_create(text, text, text), public.hwasil_collab_get(text, text, text, boolean),
  public.hwasil_collab_put(text, text, text, int, text, jsonb), public.hwasil_collab_done(text, text, text) to anon, authenticated;
