-- Andrew's Financial Tracker: one encrypted-in-transit, account-owned plan row.
-- Run this in a new Supabase project's SQL editor.

create table if not exists public.finance_plans (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  version bigint not null default 1 check (version > 0),
  updated_at timestamptz not null default now()
);

alter table public.finance_plans enable row level security;
revoke all on table public.finance_plans from anon, authenticated;
grant select, insert, update, delete on table public.finance_plans to authenticated;

drop policy if exists "Users read only their own financial plan" on public.finance_plans;
create policy "Users read only their own financial plan"
on public.finance_plans for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users create only their own financial plan" on public.finance_plans;
create policy "Users create only their own financial plan"
on public.finance_plans for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users update only their own financial plan" on public.finance_plans;
create policy "Users update only their own financial plan"
on public.finance_plans for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users delete only their own financial plan" on public.finance_plans;
create policy "Users delete only their own financial plan"
on public.finance_plans for delete
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create or replace function public.save_finance_plan(
  p_payload jsonb,
  p_expected_version bigint default 0
)
returns public.finance_plans
language plpgsql
security invoker
set search_path = public
as $$
declare
  saved public.finance_plans;
  current_version bigint;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select version into current_version
  from public.finance_plans
  where user_id = auth.uid()
  for update;

  if not found then
    if p_expected_version <> 0 then
      raise exception 'sync_conflict' using errcode = 'P0001';
    end if;
    insert into public.finance_plans (user_id, payload, version, updated_at)
    values (auth.uid(), p_payload, 1, now())
    returning * into saved;
    return saved;
  end if;

  if current_version <> p_expected_version then
    raise exception 'sync_conflict' using errcode = 'P0001';
  end if;

  update public.finance_plans
  set payload = p_payload,
      version = current_version + 1,
      updated_at = now()
  where user_id = auth.uid()
  returning * into saved;

  return saved;
end;
$$;

revoke all on function public.save_finance_plan(jsonb, bigint) from public, anon;
grant execute on function public.save_finance_plan(jsonb, bigint) to authenticated;

create index if not exists finance_plans_updated_at_idx
on public.finance_plans (updated_at);
