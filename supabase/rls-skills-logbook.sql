-- DOPS logbook skills table policies + helpful constraints
-- Run this in Supabase SQL editor.

-- 1) Ensure table + key column assumptions
-- (skip/adjust if your table already matches)
alter table if exists public.skills
  alter column skill set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.skills'::regclass
      and contype = 'p'
      and conname = 'skills_pkey'
  ) then
    alter table public.skills add constraint skills_pkey primary key (skill);
  end if;
end $$;

-- 2) Enable RLS
alter table public.skills enable row level security;

-- 3) Helpers: admin check uses your Users table
--    Admin = role is Admin and account approved

drop policy if exists "skills read for authenticated users" on public.skills;
create policy "skills read for authenticated users"
on public.skills
for select
to authenticated
using (true);

drop policy if exists "skills write for approved admins" on public.skills;
create policy "skills write for approved admins"
on public.skills
for all
to authenticated
using (
  exists (
    select 1
    from public."Users" as u
    where lower(coalesce(u."Email", '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and lower(coalesce(u."Role", '')) = 'admin'
      and (
        coalesce(u."Is Approved", false) = true
        or lower(coalesce(u."Status", '')) = 'approved'
      )
  )
)
with check (
  exists (
    select 1
    from public."Users" as u
    where lower(coalesce(u."Email", '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and lower(coalesce(u."Role", '')) = 'admin'
      and (
        coalesce(u."Is Approved", false) = true
        or lower(coalesce(u."Status", '')) = 'approved'
      )
  )
);

-- 4) Optional indexes for faster search/order in logbook UI
create index if not exists idx_skills_skill_lower on public.skills (lower(skill));
create index if not exists idx_skills_group on public.skills ("group");

-- 5) Example fetches used by UI
-- List all:
-- select skill, "group", amount_required, enlisted_in_manual_skill
-- from public.skills
-- order by skill asc;
--
-- Search by procedure name:
-- select skill, "group", amount_required
-- from public.skills
-- where skill ilike '%paracentesis%'
-- order by skill asc
-- limit 20;
