-- DRAFT (not applied): persistent reaction counts per frame. Needs the owner's approval before running.
create table if not exists hwasil.reactions (
  slot_id text not null,
  kind    smallint not null check (kind between 0 and 4),
  n       integer not null default 0,
  primary key (slot_id, kind)
);
create or replace function public.hwasil_react(p_slot text, p_kind smallint) returns void
language sql security definer set search_path = hwasil as $$
  insert into hwasil.reactions(slot_id, kind, n) values (left(p_slot, 80), p_kind, 1)
  on conflict (slot_id, kind) do update set n = hwasil.reactions.n + 1;
$$;
create or replace function public.hwasil_reaction_counts(p_slot text) returns table(kind smallint, n integer)
language sql stable security definer set search_path = hwasil as $$
  select kind, n from hwasil.reactions where slot_id = left(p_slot, 80);
$$;
grant execute on function public.hwasil_react(text, smallint), public.hwasil_reaction_counts(text) to anon, authenticated;
