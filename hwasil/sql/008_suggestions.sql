-- The suggestion box (건의함): visitors leave a short note; only the admin password (or the owner's direct DB access) can read them.
-- Additive only: one new table and three new functions. Approved by the owner before running.
create table if not exists hwasil.suggestions (
  id     bigint generated always as identity primary key,
  at     timestamptz not null default now(),
  nm     text not null default '',
  body   text not null check (length(body) between 1 and 500),
  done   boolean not null default false,   -- handled by the admin
  mailed boolean not null default false    -- already sent in a summary mail
);
alter table hwasil.suggestions enable row level security;

-- anyone with the site code may leave a note (at most 20 per minute for the whole site)
create or replace function public.hwasil_suggest(code text, nm text, body text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform hwasil._ok(code);
  if body is null or length(btrim(body)) < 1 or length(body) > 500 then raise exception 'invalid_argument'; end if;
  if (select count(*) from hwasil.suggestions s where s.at > now() - interval '1 minute') >= 20 then raise exception 'quota_exceeded'; end if;
  insert into hwasil.suggestions(nm, body) values (left(coalesce(nm, ''), 12), btrim(body));
end $$;

-- admin: read the notes (newest first)
create or replace function public.hwasil_admin_suggestions(code text, pw text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform hwasil._ok(code); perform hwasil._admin(pw);
  return coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'at', s.at, 'nm', s.nm, 'body', s.body, 'done', s.done) order by s.at desc)
                   from (select * from hwasil.suggestions order by at desc limit 100) s), '[]'::jsonb);
end $$;

-- admin: mark a note as handled (or not)
create or replace function public.hwasil_admin_suggestion_done(code text, pw text, sid bigint, flag boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform hwasil._ok(code); perform hwasil._admin(pw);
  update hwasil.suggestions set done = flag where id = sid;
end $$;

grant execute on function public.hwasil_suggest(text, text, text), public.hwasil_admin_suggestions(text, text), public.hwasil_admin_suggestion_done(text, text, bigint, boolean) to anon, authenticated;
