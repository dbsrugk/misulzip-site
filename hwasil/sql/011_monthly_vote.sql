-- 011: 이달의 작품 투표. 한 달에 한 사람이 서로 다른 친구 작품에 최대 3표. 내 작품에는 못 눌러요.
-- Additive only: one new table and three new functions. Needs the owner's approval before running (DRAFT, not applied).
create table if not exists hwasil.votes (
  month text not null check (month ~ '^[0-9]{4}-[0-9]{2}$'),
  item  text not null,                      -- a gallery exhibit id: "<owner>_<work id>"
  voter text not null,
  at    timestamptz not null default now(),
  primary key (month, item, voter)
);
create index if not exists votes_month_item on hwasil.votes (month, item);
alter table hwasil.votes enable row level security;
revoke all on hwasil.votes from public, anon, authenticated;

-- toggle my vote for one work this month; returns my votes and the work's count
create or replace function public.hwasil_vote(code text, token text, month text, item text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare o text; mine text[]; n int;
begin
  perform hwasil._ok(code); o := hwasil._owner(token);
  if month is null or month !~ '^[0-9]{4}-[0-9]{2}$' or item is null or length(item) < 3 or length(item) > 60 then raise exception 'invalid_argument'; end if;
  if left(item, 16) = o then raise exception 'own_work'; end if;
  if not exists (select 1 from hwasil.gallery g where g.id = item) then raise exception 'invalid_argument'; end if;
  if exists (select 1 from hwasil.votes v where v.month = hwasil_vote.month and v.item = hwasil_vote.item and v.voter = o) then
    delete from hwasil.votes v where v.month = hwasil_vote.month and v.item = hwasil_vote.item and v.voter = o;
  else
    if (select count(*) from hwasil.votes v where v.month = hwasil_vote.month and v.voter = o) >= 3 then raise exception 'quota_exceeded'; end if;
    insert into hwasil.votes(month, item, voter) values (month, item, o);
  end if;
  select coalesce(array_agg(v.item), '{}') into mine from hwasil.votes v where v.month = hwasil_vote.month and v.voter = o;
  select count(*) into n from hwasil.votes v where v.month = hwasil_vote.month and v.item = hwasil_vote.item;
  return jsonb_build_object('mine', to_jsonb(mine), 'n', n);
end $$;

-- the ten most voted works of a month, with my own votes
create or replace function public.hwasil_vote_top(code text, token text, month text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare o text;
begin
  perform hwasil._ok(code); o := hwasil._owner(token);
  if month is null or month !~ '^[0-9]{4}-[0-9]{2}$' then raise exception 'invalid_argument'; end if;
  return jsonb_build_object(
    'mine', coalesce((select jsonb_agg(v.item) from hwasil.votes v where v.month = hwasil_vote_top.month and v.voter = o), '[]'::jsonb),
    'top', coalesce((select jsonb_agg(jsonb_build_object('id', t.item, 'n', t.n, 'title', g.doc->>'title', 'artist', g.doc->>'artist', 'slot', g.slot) order by t.n desc, t.item)
                     from (select v.item, count(*) n from hwasil.votes v where v.month = hwasil_vote_top.month group by v.item order by count(*) desc, v.item limit 10) t
                     left join hwasil.gallery g on g.id = t.item), '[]'::jsonb));
end $$;

grant execute on function public.hwasil_vote(text, text, text, text), public.hwasil_vote_top(text, text, text) to anon, authenticated;
