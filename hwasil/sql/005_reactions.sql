-- DRAFT (not applied): persistent reaction counts per artwork (a friend's work id or a masterpiece id).
-- Additive only: one new table and two new functions. Needs the owner's approval before running.
create table if not exists hwasil.reactions (
  item text not null,
  kind smallint not null check (kind between 0 and 4),
  n    integer not null default 0,
  primary key (item, kind)
);
alter table hwasil.reactions enable row level security;

create or replace function public.hwasil_react(code text, item text, kind smallint) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform hwasil._ok(code);
  if item is null or length(item) < 1 or length(item) > 120 or kind < 0 or kind > 4 then raise exception 'invalid_argument'; end if;
  insert into hwasil.reactions(item, kind, n) values (item, kind, 1)
  on conflict (item, kind) do update set n = hwasil.reactions.n + 1;
end $$;

create or replace function public.hwasil_reactions(code text, item text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform hwasil._ok(code);
  return coalesce((select jsonb_object_agg(r.kind::text, r.n) from hwasil.reactions r where r.item = hwasil_reactions.item), '{}'::jsonb);
end $$;

grant execute on function public.hwasil_react(text, text, smallint), public.hwasil_reactions(text, text) to anon, authenticated;
