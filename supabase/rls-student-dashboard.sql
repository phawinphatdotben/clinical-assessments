-- Run in Supabase → SQL Editor (adjust table/column names if yours differ).
-- Goal: student dashboard can load Student ID from Users, list Assessment rows, and resolve teacher names.

-- ---------------------------------------------------------------------------
-- 1) Users: each signed-in user can read their own profile row (by email in JWT)
--    Needed for getStudentIdForCurrentUser() and login flows.
-- ---------------------------------------------------------------------------
alter table public."Users" enable row level security;

drop policy if exists "Users read own row by email" on public."Users";

create policy "Users read own row by email"
on public."Users"
for select
to authenticated
using (
  lower(trim("Email")) = lower(trim(coalesce((auth.jwt() ->> 'email'), '')))
);

-- Optional: let any signed-in user read approved directory rows (staff/student lookup + teacher names on dashboard).
-- Remove or tighten if you expose too much. Alternative: a SECURITY DEFINER view with only safe columns.
drop policy if exists "Users read approved directory" on public."Users";

create policy "Users read approved directory"
on public."Users"
for select
to authenticated
using ("Status" = 'Approved');

-- ---------------------------------------------------------------------------
-- 2) Assessment: students read rows where Student ID matches their Users row
-- ---------------------------------------------------------------------------
alter table public."Assessment" enable row level security;

drop policy if exists "Student select assessments by student id" on public."Assessment";

create policy "Student select assessments by student id"
on public."Assessment"
for select
to authenticated
using (
  -- Cast to text so trim() works if the column is integer/bigint in Postgres.
  trim(coalesce("Student ID"::text, '')) in (
    select trim(me."Student ID"::text)
    from public."Users" as me
    where lower(trim(me."Email")) = lower(trim(coalesce((auth.jwt() ->> 'email'), '')))
      and me."Student ID" is not null
  )
);

-- Students may update their own assessment rows (e.g. Student Self-Reflection + Status on pending-feedback flow).
drop policy if exists "Student update own assessments" on public."Assessment";

create policy "Student update own assessments"
on public."Assessment"
for update
to authenticated
using (
  trim(coalesce("Student ID"::text, '')) in (
    select trim(me."Student ID"::text)
    from public."Users" as me
    where lower(trim(me."Email")) = lower(trim(coalesce((auth.jwt() ->> 'email'), '')))
      and me."Student ID" is not null
  )
)
with check (
  trim(coalesce("Student ID"::text, '')) in (
    select trim(me."Student ID"::text)
    from public."Users" as me
    where lower(trim(me."Email")) = lower(trim(coalesce((auth.jwt() ->> 'email'), '')))
      and me."Student ID" is not null
  )
);

-- ---------------------------------------------------------------------------
-- Staff / admins: you likely need separate policies for INSERT/UPDATE and for
-- reading all rows. Example for staff reading assessments they created or all:
--
-- drop policy if exists "Staff select assessments" on public."Assessment";
-- create policy "Staff select assessments"
-- on public."Assessment"
-- for select
-- to authenticated
-- using (
--   exists (
--     select 1 from public."Users" u
--     where lower(trim(u."Email")) = lower(trim(coalesce((auth.jwt() ->> 'email'), '')))
--       and u."Role" = 'Staff'
--   )
-- );
--
-- Add policies matching how you store roles (column name may be "Role" or "role").
